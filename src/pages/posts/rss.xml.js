import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { SITE_TITLE, SITE_URL } from '~/consts';

const parser = new MarkdownIt();

export async function GET(context) {
  const posts = (await getCollection('posts')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: SITE_TITLE,
    description: `Recent content in Posts on ${SITE_TITLE}`,

    site: context.site + '/posts',

    items: posts.map((post) => {
      // <img src="https://jbrio.net/_astro/202446-feature.BwehCxkn_24KVkT.webp" alt="202446 feature image" width="1312" height="512" loading="lazy" decoding="async">
      const img = post.data.cover
        ? `<img src="${SITE_URL}${post.data.cover.src}" alt="${post.data.title} feature image" width="${post.data.cover.width}" height="${post.data.cover.height} loading="lazy" decoding="async" />`
        : '';
      const content =
        sanitizeHtml(img, { allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']) }) +
        sanitizeHtml(parser.render(post.body), { allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']) });

      return {
        title: post.data.title,
        link: `${SITE_URL}/posts/${post.id}/`,
        pubDate: `${post.data.date.toUTCString()}`,
        description: `${post.data.description}`,
        //   customData: `<media:content
        //     type="image/${post.data.cover?.format == 'jpg' ? 'jpeg' : 'png'}"
        //     width="${post.data.cover?.width}"
        //     height="${post.data.cover?.height}"
        //     medium="image"
        //     url="${context.site + post.data.cover?.src}" />
        // `,
        content,
      };
    }),
    customData: `<language>en-us</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
  });
}
