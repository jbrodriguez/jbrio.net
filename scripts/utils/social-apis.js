import { BskyAgent } from '@atproto/api';
import axios from 'axios';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';

export class BskyApi {
  constructor(identifier, password) {
    this.agent = new BskyAgent({
      service: 'https://bsky.social'
    });
    this.identifier = identifier;
    this.password = password;
    this.authenticated = false;
  }

  async authenticate() {
    if (this.authenticated) return;

    try {
      await this.agent.login({
        identifier: this.identifier,
        password: this.password
      });
      this.authenticated = true;
    } catch (error) {
      throw new Error(`BlueSky authentication failed: ${error.message}`);
    }
  }

  async fetchUrlMetadata(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BlueskyBot/1.0; +https://bsky.app)',
        },
        timeout: 10000,
      });

      const html = response.data;

      // Extract Open Graph metadata
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) ||
                        html.match(/<title>([^<]+)<\/title>/i);
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i) ||
                       html.match(/<meta name="description" content="([^"]+)"/i);
      const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);

      const title = titleMatch ? titleMatch[1] : '';
      const description = descMatch ? descMatch[1] : '';
      const imageUrl = imageMatch ? imageMatch[1] : '';

      return { title, description, imageUrl };
    } catch (error) {
      console.warn(`Failed to fetch metadata for ${url}:`, error.message);
      return null;
    }
  }

  async uploadImageFromUrl(imageUrl) {
    try {
      // Fetch the image
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BlueskyBot/1.0; +https://bsky.app)',
        },
        timeout: 10000,
      });

      const imageBuffer = Buffer.from(response.data);

      // Upload to Bluesky
      const uploadResponse = await this.agent.uploadBlob(imageBuffer, {
        encoding: response.headers['content-type'] || 'image/jpeg',
      });

      return uploadResponse.data.blob;
    } catch (error) {
      console.warn(`Failed to upload image from ${imageUrl}:`, error.message);
      return null;
    }
  }

  async post(text) {
    await this.authenticate();

    try {
      // Detect URLs in the text for facets (clickable links) and embeds (cards)
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = [...text.matchAll(urlRegex)];

      const facets = [];
      let embedUrl = null;

      // Create facets for each URL to make them clickable
      for (const match of urls) {
        const url = match[0];
        const start = match.index;
        const end = start + url.length;

        // Store first URL for embed card
        if (!embedUrl) {
          embedUrl = url;
        }

        facets.push({
          index: {
            byteStart: new TextEncoder().encode(text.slice(0, start)).length,
            byteEnd: new TextEncoder().encode(text.slice(0, end)).length,
          },
          features: [
            {
              $type: 'app.bsky.richtext.facet#link',
              uri: url,
            },
          ],
        });
      }

      const postData = {
        text: text,
        createdAt: new Date().toISOString(),
      };

      // Add facets if we found URLs
      if (facets.length > 0) {
        postData.facets = facets;
      }

      // Add embed card for the first URL
      if (embedUrl) {
        try {
          // Fetch link metadata
          const metadata = await this.fetchUrlMetadata(embedUrl);

          if (metadata && metadata.title) {
            const external = {
              uri: embedUrl,
              title: metadata.title,
              description: metadata.description || '',
            };

            // Upload the thumbnail image if available
            if (metadata.imageUrl) {
              const blob = await this.uploadImageFromUrl(metadata.imageUrl);
              if (blob) {
                external.thumb = blob;
              }
            }

            postData.embed = {
              $type: 'app.bsky.embed.external',
              external: external,
            };
          }
        } catch (embedError) {
          // If embed fetch fails, still post without the card
          console.warn(`Failed to create embed for ${embedUrl}:`, embedError.message);
        }
      }

      const response = await this.agent.post(postData);
      return response;
    } catch (error) {
      throw new Error(`BlueSky post failed: ${error.message}`);
    }
  }
}

export class MastodonApi {
  constructor(instanceUrl, accessToken) {
    this.instanceUrl = instanceUrl.replace(/\/$/, ''); // Remove trailing slash
    this.accessToken = accessToken;
  }

  async post(status) {
    try {
      const response = await axios.post(
        `${this.instanceUrl}/api/v1/statuses`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      throw new Error(`Mastodon post failed: ${errorMsg}`);
    }
  }
}

export class TwitterApi {
  constructor({ apiKey, apiSecret, accessToken, accessSecret }) {
    this.oauth = OAuth({
      consumer: { key: apiKey, secret: apiSecret },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64');
      },
    });

    this.token = {
      key: accessToken,
      secret: accessSecret,
    };
  }

  async post(text) {
    const requestData = {
      url: 'https://api.twitter.com/2/tweets',
      method: 'POST',
    };

    const authHeader = this.oauth.toHeader(
      this.oauth.authorize(requestData, this.token)
    );

    try {
      const response = await axios.post(
        requestData.url,
        { text },
        {
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.detail ||
                      error.response?.data?.title ||
                      error.message;
      throw new Error(`Twitter post failed: ${errorMsg}`);
    }
  }
}
