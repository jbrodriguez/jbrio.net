import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { BskyApi } from './utils/social-apis.js';
import { MastodonApi } from './utils/social-apis.js';
import { TwitterApi } from './utils/social-apis.js';

const SITE_URL = process.env.SITE_URL || 'https://jbrio.net';
const DEPLOYMENT_DELAY_MS = parseInt(process.env.DEPLOYMENT_DELAY_MS || '120000', 10);

function parseMarkdownFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (!frontmatterMatch) {
      console.log(`No frontmatter found in ${filePath}`);
      return null;
    }

    const frontmatter = yaml.load(frontmatterMatch[1]);
    return frontmatter;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }
}

function extractPostSlug(filePath) {
  // Extract post ID from path like "src/data/posts/202539/index.md"
  const parts = filePath.split('/');
  const postDir = parts[parts.length - 2];
  return postDir;
}

function formatPostContent(frontmatter, postUrl, platform) {
  const description = frontmatter.description || frontmatter.title;
  const tags = frontmatter.tags || [];

  // Platform-specific character limits
  const limits = {
    bluesky: 300,
    mastodon: 500,
    twitter: 280,
  };

  const limit = limits[platform];

  // Select tags that fit within limit
  let selectedTags = [];
  let baseContent = `${description}\n\n${postUrl}`;
  let remainingChars = limit - baseContent.length - 1; // Extra space for blank line

  for (const tag of tags) {
    const tagText = ` #${tag}`;
    if (remainingChars >= tagText.length) {
      selectedTags.push(tag);
      remainingChars -= tagText.length;
    } else {
      break;
    }
  }

  const hashTags = selectedTags.length > 0 ? selectedTags.map((t) => `#${t}`).join(' ') : '';
  const finalContent = hashTags ? `${description}\n\n${hashTags}\n\n${postUrl}` : `${description}\n\n${postUrl}`;

  // Truncate if still too long
  if (finalContent.length > limit) {
    const truncated = description.slice(0, limit - postUrl.length - 5) + '...';
    return `${truncated}\n\n${postUrl}`;
  }

  return finalContent;
}

async function postToSocialMedia(frontmatter, postUrl) {
  const results = {
    bluesky: { success: false, error: null },
    mastodon: { success: false, error: null },
    twitter: { success: false, error: null },
  };

  // BlueSky
  if (process.env.BLUESKY_IDENTIFIER && process.env.BLUESKY_PASSWORD) {
    try {
      const content = formatPostContent(frontmatter, postUrl, 'bluesky');
      console.log('Posting to BlueSky:', content);

      const bsky = new BskyApi(process.env.BLUESKY_IDENTIFIER, process.env.BLUESKY_PASSWORD);
      await bsky.post(content);
      results.bluesky.success = true;
      console.log('✅ BlueSky post successful');
    } catch (error) {
      results.bluesky.error = error.message;
      console.error('❌ BlueSky post failed:', error.message);
    }
  }

  // Mastodon
  if (process.env.MASTODON_ACCESS_TOKEN && process.env.MASTODON_INSTANCE_URL) {
    try {
      const content = formatPostContent(frontmatter, postUrl, 'mastodon');
      console.log('Posting to Mastodon:', content);

      const mastodon = new MastodonApi(process.env.MASTODON_INSTANCE_URL, process.env.MASTODON_ACCESS_TOKEN);
      await mastodon.post(content);
      results.mastodon.success = true;
      console.log('✅ Mastodon post successful');
    } catch (error) {
      results.mastodon.error = error.message;
      console.error('❌ Mastodon post failed:', error.message);
    }
  }

  // Twitter
  if (
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_SECRET &&
    process.env.TWITTER_ACCESS_TOKEN &&
    process.env.TWITTER_ACCESS_SECRET
  ) {
    try {
      const content = formatPostContent(frontmatter, postUrl, 'twitter');
      console.log('Posting to Twitter:', content);

      const twitter = new TwitterApi({
        apiKey: process.env.TWITTER_API_KEY,
        apiSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
      });
      await twitter.post(content);
      results.twitter.success = true;
      console.log('✅ Twitter post successful');
    } catch (error) {
      results.twitter.error = error.message;
      console.error('❌ Twitter post failed:', error.message);
    }
  }

  return results;
}

async function waitForDeployment(delayMs) {
  if (delayMs > 0) {
    console.log(`\n⏳ Waiting ${delayMs / 1000} seconds for deployment to complete...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    console.log('✅ Deployment wait completed\n');
  }
}

async function main() {
  const newFiles = process.argv[2];

  if (!newFiles) {
    console.log('No new files provided');
    return;
  }

  const files = newFiles.split('\n').filter((f) => f.trim());
  console.log('Processing new files:', files);

  // Wait for deployment to complete before posting
  await waitForDeployment(DEPLOYMENT_DELAY_MS);

  for (const filePath of files) {
    if (!filePath.endsWith('.md') || !filePath.includes('/posts/')) {
      console.log(`Skipping non-post file: ${filePath}`);
      continue;
    }

    const frontmatter = parseMarkdownFrontmatter(filePath);
    if (!frontmatter) {
      console.log(`Skipping file with no frontmatter: ${filePath}`);
      continue;
    }

    // Only post published articles
    if (frontmatter.status !== 'published') {
      console.log(`Skipping unpublished post: ${filePath} (status: ${frontmatter.status})`);
      continue;
    }

    // Skip if no description
    if (!frontmatter.description) {
      console.log(`Skipping post with no description: ${filePath}`);
      continue;
    }

    const postSlug = extractPostSlug(filePath);
    const postUrl = `${SITE_URL}/posts/${postSlug}/`;

    console.log(`\n📝 Processing post: ${frontmatter.title}`);
    console.log(`   Description: ${frontmatter.description}`);
    console.log(`   URL: ${postUrl}`);
    console.log(`   Tags: ${frontmatter.tags?.join(', ') || 'none'}`);

    const results = await postToSocialMedia(frontmatter, postUrl);

    // Summary
    const successes = Object.values(results).filter((r) => r.success).length;
    const total = Object.keys(results).length;
    console.log(`\n📊 Summary: ${successes}/${total} platforms posted successfully`);

    // Report any failures
    for (const [platform, result] of Object.entries(results)) {
      if (!result.success && result.error) {
        console.error(`   ${platform}: ${result.error}`);
      }
    }
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
