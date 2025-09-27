# Social Media Auto-Posting Setup

This guide will help you configure automatic social media posting for your blog articles.

## Required GitHub Secrets

You need to add these secrets to your GitHub repository settings:

### BlueSky Configuration
1. Go to BlueSky Settings → App Passwords
2. Create a new app password
3. Add these secrets to GitHub:
   - `BLUESKY_IDENTIFIER`: Your BlueSky handle (e.g., `yourname.bsky.social`)
   - `BLUESKY_PASSWORD`: The app password you created

### Mastodon Configuration
1. Go to your Mastodon instance → Preferences → Development
2. Create a new application with `write:statuses` scope
3. Add these secrets to GitHub:
   - `MASTODON_INSTANCE_URL`: Your Mastodon server URL (e.g., `https://mastodon.social`)
   - `MASTODON_ACCESS_TOKEN`: The access token from your application

### X.com (Twitter) Configuration
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app or use existing one
3. Generate API keys and access tokens
4. Add these secrets to GitHub:
   - `TWITTER_API_KEY`: Your API Key
   - `TWITTER_API_SECRET`: Your API Secret Key
   - `TWITTER_ACCESS_TOKEN`: Your Access Token
   - `TWITTER_ACCESS_SECRET`: Your Access Token Secret

## How to Add GitHub Secrets

1. Go to your repository on GitHub
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with the exact name and value

## How It Works

The system automatically:

1. **Detects Changes**: Monitors pushes to main branch for changes in `src/data/posts/**/*.md`
2. **Parses Content**: Extracts the `description` field from frontmatter as post content
3. **Formats Posts**: Creates platform-appropriate posts with:
   - Description text
   - Article URL
   - Relevant hashtags (respecting character limits)
4. **Posts Automatically**: Shares to all configured platforms

## Post Format Example

For a post with:
```yaml
description: 'in memory of claudia cardinale'
tags: ['notes', 'maps', 'ux-ui', 'security']
```

The generated posts will be:
- **BlueSky/Mastodon**: "in memory of claudia cardinale\n\nhttps://jbrio.net/posts/202539 #notes #maps #ux-ui #security"
- **X.com**: "in memory of claudia cardinale\n\nhttps://jbrio.net/posts/202539 #notes #maps #ux-ui" (truncated to fit 280 chars)

## Requirements

- Posts must have `status: published` in frontmatter
- Posts must have a `description` field
- Only new/updated posts trigger posting

## Testing

After setup, create a test post and push to main branch. Check the GitHub Actions tab to see if the workflow runs successfully.

## Troubleshooting

If posting fails:
1. Check GitHub Actions logs for error details
2. Verify all secrets are correctly set
3. Ensure API credentials have proper permissions
4. Check rate limits on each platform