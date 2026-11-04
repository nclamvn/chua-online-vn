import { readJsonObject } from '../../lib/request-json';

const upstream = new URL('https://hien-an-r4.nclamvn.chatgpt.site');
const presenceActions = new Set(['join', 'leave', 'greet', 'greetings', 'observe', 'rooms', 'stream', 'sync']);
const offeringActions = new Set(['create', 'list', 'cancel']);
const cacheControl = 'private, no-store, no-transform';

function reply(status: number, error: string) {
  return Response.json({ error }, { status, headers: { 'Cache-Control': cacheControl } });
}

const handler = {
  async fetch(request: Request) {
    const url = new URL(request.url);
    const match = /^\/api\/(presence|offerings)\/([a-z]+)\/?$/.exec(url.pathname);
    if (!match) return reply(404, 'Không có thao tác này.');

    const [, service, action] = match;
    const actions = service === 'presence' ? presenceActions : offeringActions;
    if (!actions.has(action)) return reply(404, 'Không có thao tác này.');

    const method = service === 'presence' && action === 'rooms' ? 'GET' : 'POST';
    if (request.method !== method) return reply(405, 'Phương thức không hợp lệ.');

    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) return reply(403, 'Nguồn yêu cầu không hợp lệ.');

    const headers = new Headers();
    let body: string | undefined;
    if (method === 'POST') {
      const input = await readJsonObject(request);
      if (!input.ok) {
        return reply(input.status, input.status === 413 ? 'Yêu cầu quá lớn.' : 'JSON không hợp lệ.');
      }
      body = JSON.stringify(input.body);
      headers.set('Content-Type', 'application/json');
      headers.set('Origin', upstream.origin);
    }

    try {
      const response = await fetch(new URL(url.pathname, upstream), {
        method,
        body,
        headers,
        redirect: 'manual',
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(action === 'stream' ? 65000 : 7500)]),
      });
      const contentType = response.headers.get('content-type') ?? '';
      if (!/^(application\/json|text\/event-stream)(;|$)/i.test(contentType)) {
        await response.body?.cancel();
        return reply(502, 'Máy chủ Hiên An chưa sẵn sàng.');
      }
      return new Response(response.body, {
        status: response.status,
        headers: { 'Content-Type': contentType, 'Cache-Control': cacheControl },
      });
    } catch {
      return reply(502, 'Kết nối tới máy chủ Hiên An đang gián đoạn.');
    }
  },
};

export default handler;
