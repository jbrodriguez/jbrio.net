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

  async post(text) {
    await this.authenticate();

    try {
      const response = await this.agent.post({
        text: text,
        createdAt: new Date().toISOString()
      });
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
