const hour = 3600000;
const day = 24 * hour;
const sessionLength = 5 * 60000;

export function chantSession(now) {
 const localDay = Math.floor((now + 7 * hour) / day) * day - 7 * hour;
 const morning = localDay + 5 * hour;
 const evening = localDay + 18 * hour;
 const start = now < morning ? morning : now < evening ? morning : evening;
 const active = now >= start && now < start + sessionLength;
 const next = now < morning ? morning : now < evening ? evening : morning + day;
 return {active, start, next, offset: active ? (now - start) / 1000 : 0};
}
