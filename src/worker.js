export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Try to serve the static asset
    try {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) {
        return asset;
      }
    } catch (error) {
      console.error('Asset fetch error:', error);
    }
    
    // If no asset found and it's not an API route, serve index.html for SPA routing
    if (!url.pathname.startsWith('/api/') && !url.pathname.includes('.')) {
      try {
        const indexRequest = new Request(new URL('/index.html', url.origin));
        const indexAsset = await env.ASSETS.fetch(indexRequest);
        if (indexAsset.status !== 404) {
          return new Response(indexAsset.body, {
            status: 200,
            headers: {
              ...Object.fromEntries(indexAsset.headers),
              'Content-Type': 'text/html',
            },
          });
        }
      } catch (error) {
        console.error('Index.html fetch error:', error);
      }
    }
    
    // Return 404 for everything else
    return new Response('Not Found', { status: 404 });
  },
};