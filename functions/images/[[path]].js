/**
 * Meneruskan permintaan /images/* ke R2 bucket `videos`.
 *
 * Kenapa ada: host `cdn.statelinemedia.world` tidak bisa di-resolve (NXDOMAIN)
 * sehingga semua gambar situs mati. Dengan function ini, gambar dilayani dari
 * apex `statelinemedia.world` yang masih hidup.
 *
 * Binding yang dipakai: R2_VIDEOS -> bucket `videos`
 */
export async function onRequestGet(context) {
  const { params, env, request } = context;

  // params.path bisa array ([[path]]) atau string
  let key = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  key = 'images/' + key;

  try {
    const obj = await env.R2_VIDEOS.get(key);
    if (!obj) {
      return new Response('Not found: ' + key, {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
      });
    }

    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set('etag', obj.httpEtag);
    headers.set('cache-control', 'public, max-age=31536000, immutable');
    headers.set('access-control-allow-origin', '*');

    // dukung If-None-Match (304) supaya cache browser efisien
    const inm = request.headers.get('if-none-match');
    if (inm && (inm === obj.httpEtag || inm === headers.get('etag'))) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(obj.body, { headers });
  } catch (err) {
    return new Response('R2 error: ' + (err && err.message ? err.message : 'unknown'), {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
}

// HEAD juga dilayani supaya crawler/cek tautan tidak gagal
export async function onRequestHead(context) {
  const res = await onRequestGet(context);
  return new Response(null, { status: res.status, headers: res.headers });
}
