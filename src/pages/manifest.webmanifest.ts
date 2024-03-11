import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import favicon from '~/assets/favicons/favicon.png';

const faviconPngSizes = [192, 512];

export const GET: APIRoute = async () => {
  const icons = await Promise.all(
    faviconPngSizes.map(async (size) => {
      const image = await getImage({
        src: favicon,
        width: size,
        height: size,
        format: 'png',
      });
      return {
        src: image.src,
        type: `image/${image.options.format}`,
        sizes: `${image.options.width}x${image.options.height}`,
      };
    })
  );

  // manifest.webmanifest
  // {
  //     "icons": [
  //       { "src": "/icon-192.png", "type": "image/png", "sizes": "192x192" },
  //       { "src": "/icon-512.png", "type": "image/png", "sizes": "512x512" }
  //     ]
  //   }

  const manifest = {
    icons,
  };

  return new Response(JSON.stringify(manifest));
};
