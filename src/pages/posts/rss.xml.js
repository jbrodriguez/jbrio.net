import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { SITE_TITLE, SITE_URL } from '~/consts';

const parser = new MarkdownIt();

export async function GET(context) {
  const posts = (await getCollection('posts')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    // `<title>` field in output xml
    title: SITE_TITLE,
    // `<description>` field in output xml
    description: `Recent content in Posts on ${SITE_TITLE}`,
    // Pull in your project "site" from the endpoint context
    // https://docs.astro.build/en/reference/api-reference/#contextsite
    site: context.site,
    // Array of `<item>`s in output xml
    // See "Generating items" section for examples using content collections and glob imports
    items: posts.map((post) => ({
      title: post.data.title,
      link: `${SITE_URL}/posts/${post.slug}`,
      pubDate: `${post.data.date.toUTCString()}`,
      description: `${post.data.description}`,
      // content: `<![CDATA[${sanitizeHtml(parser.render(post.body))}]]>`,
      content: sanitizeHtml(parser.render(post.body)),
    })),
    // (optional) inject custom xml
    customData: `<language>en-us</language>`,
  });
}
