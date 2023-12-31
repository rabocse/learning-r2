/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */


// Check requests for a pre-shared secret.  // This is not needed since R2 has no egress fee. Also it complicates the solution.
const hasValidHeader = (request, env) => {
	return request.headers.get('X-Custom-Auth-Key') === env.AUTH_KEY_SECRET;
  };

  function authorizeRequest(request, env, key) {
	switch (request.method) {
	  case 'GET':
		return hasValidHeader(request, env);
	  default:
		return false;
	}
  }


export default {
	async fetch(request, env) {
	  const url = new URL(request.url);
	  const key = url.pathname.slice(1);
  
	// If the "X-Custom-Auth-Key" Header is not present or valid, a "Forbidden" will be observed.
	  if (!authorizeRequest(request, env, key)) {
		return new Response('Forbidden', { status: 403 });
	  }

	// If the "X-Custom-Auth-Key" Header was present, then we evaluate the HTTP method.
	// Kept only the GET for simplicity and as per requirement, but It might be useful in the future.
	  switch (request.method) {
	
		case 'GET':
		  const object = await env.MY_COUNTRY_FLAGS_BUCKET.get(key);
  
		  if (object === null) {
			return new Response('Object Not Found', { status: 404 });
		  }
  
		  const headers = new Headers();
		  object.writeHttpMetadata(headers);
		  headers.set('etag', object.httpEtag);
  
		  return new Response(object.body, {
			headers,
		  });
  
		default:
		  return new Response('Method Not Allowed', {
			status: 405,
			headers: {
			  Allow: 'PUT, GET, DELETE',  
			},
		  });
	  }
	},
  };