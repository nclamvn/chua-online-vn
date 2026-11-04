type JsonObject = Record<string, unknown>;
type JsonResult = { ok: true; body: JsonObject } | { ok: false; status: 400 | 413 };

export function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function readJsonObject(request: Request, limit = 2048): Promise<JsonResult> {
  if (Number(request.headers.get('content-length')) > limit) return { ok: false, status: 413 };

  const reader = request.body?.getReader();
  if (!reader) return { ok: false, status: 400 };
  const decoder = new TextDecoder();
  let bytes = 0;
  let raw = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) {
        await reader.cancel().catch(() => {});
        return { ok: false, status: 413 };
      }
      raw += decoder.decode(value, { stream: true });
    }
    const body: unknown = JSON.parse(raw + decoder.decode());
    return isJsonObject(body) ? { ok: true, body } : { ok: false, status: 400 };
  } catch {
    return { ok: false, status: 400 };
  } finally {
    reader.releaseLock();
  }
}
