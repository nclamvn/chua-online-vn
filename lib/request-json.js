/** @typedef {Record<string, unknown>} JsonObject */
/** @typedef {{ok:true, body:JsonObject}|{ok:false, status:400|413}} JsonResult */

/** @param {unknown} value @returns {value is JsonObject} */
export function isJsonObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** @param {Request} request @param {number} [limit] @returns {Promise<JsonResult>} */
export async function readJsonObject(request, limit = 2048) {
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
    const body = JSON.parse(raw + decoder.decode());
    return isJsonObject(body) ? { ok: true, body } : { ok: false, status: 400 };
  } catch {
    return { ok: false, status: 400 };
  } finally {
    reader.releaseLock();
  }
}
