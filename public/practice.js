import {chantSession} from './practice-audio.js';

const defaults = {ambientEnabled:true, effectsEnabled:true, backgroundAudio:false, chantVolume:.65, effectsVolume:1};
export const practiceDefaults = Object.freeze(defaults);

export function createPractice({state, panel, isActive, toast, setSound, getAudio, getTime, tapMoktak}) {
 const $ = id => document.getElementById(id);
 let mode = 'off', source, gain, bufferRequest, sourceKey, requestId = 0, woodTimer, chantTimer, woodGeneration = 0;
 let status = '';
 const permitted = () => state.entered && state.sound && (!document.hidden || state.backgroundAudio);
 const formatter = new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'Asia/Ho_Chi_Minh'});
 const label = () => {
  const button = $('chant-open');
  button.dataset.mode = mode;
  button.setAttribute('aria-pressed',String(mode !== 'off'));
  const session = chantSession(getTime());
  const detail = status || (button.dataset.playing === 'private' ? 'Đang nghe riêng.'
   : button.dataset.playing === 'shared' ? 'Đang nghe cùng giờ chung.'
   : mode !== 'off' && !state.sound ? 'Âm thanh đang tắt.'
   : mode === 'private' || (mode === 'shared' && session.active) ? 'Đang chuẩn bị âm thanh…'
   : 'Phiên tiếp theo lúc ' + formatter.format(session.next) + ' giờ Việt Nam.');
  if ($('chant-status') && $('chant-status').textContent !== detail) $('chant-status').textContent = detail;
  if ($('chant-private')) $('chant-private').textContent = mode === 'private' ? 'Dừng nghe riêng' : 'Nghe riêng ngay';
  if ($('chant-shared')) $('chant-shared').textContent = mode === 'shared' ? 'Rời chế độ giờ chung' : 'Theo giờ chung';
 };
 function stopSource() {
  requestId++;
  if (source) {source.stop();source.disconnect();source = undefined}
  sourceKey = undefined;
  delete $('chant-open').dataset.playing;
 }
 async function sync() {
  label();
  const {audio, master} = getAudio();
  const session = chantSession(getTime());
  if (mode === 'private' && session.active) {mode = 'shared';label()}
  const key = permitted() && audio?.state === 'running'
   ? (mode === 'private' ? 'private' : mode === 'shared' && session.active ? session.start : null) : null;
  if (!key) {if (sourceKey !== undefined) stopSource();return}
  if (sourceKey === key) return;
  stopSource();
  sourceKey = key;
  const id = requestId;
  try {
   bufferRequest ||= fetch('./assets/chant.m4a').then(r => {
    if (!r.ok) throw new Error('chant asset');
    return r.arrayBuffer();
   }).then(bytes => audio.decodeAudioData(bytes));
   const buffer = await bufferRequest;
   if (id !== requestId) return;
   const current = chantSession(getTime());
   if (!permitted() || (mode === 'shared' && (!current.active || current.start !== key))) {stopSource();return}
   if (!gain) {gain = audio.createGain();gain.connect(master)}
   gain.gain.value = state.chantVolume;
   source = audio.createBufferSource();
   source.buffer = buffer;
   source.loop = true;
   source.connect(gain);
   source.start(0, mode === 'shared' ? current.offset % buffer.duration : 0);
   $('chant-open').dataset.playing = String(mode);
   status = '';
  } catch {
   bufferRequest = undefined;
   if (id !== requestId) return;
   mode = 'off';
   stopSource();
   clearInterval(chantTimer);
   status = 'Chưa tải được bản thu. Bạn có thể bấm nghe lại.';
   toast(status);
  }
  label();
 }
 async function selectMode(next) {
  stopSource();
  status = '';
  mode = mode === next ? 'off' : next;
  clearInterval(chantTimer);
  if (mode !== 'off') {
   const id = requestId;
   status = 'Đang chuẩn bị âm thanh…';
   label();
   if (!state.sound) await setSound(true, false);
   if (id !== requestId) return;
   status = '';
   if (!state.sound) mode = 'off';
   if (mode !== 'off') chantTimer = setInterval(sync, 400);
  }
  sync();
 }
 function renderWood() {
  $('moktak-open').setAttribute('aria-pressed',String(Boolean(woodTimer)));
  if ($('moktak-auto')) $('moktak-auto').textContent = woodTimer ? 'Dừng nhịp tự động' : 'Gõ tự động';
  if ($('moktak-status')) $('moktak-status').textContent = woodTimer ? 'Một nhịp mỗi giây.' : 'Bạn có thể gõ theo nhịp riêng.';
 }
 function stopWood() {
  woodGeneration++;
  clearInterval(woodTimer);
  woodTimer = undefined;
  renderWood();
 }
 async function playWood(auto) {
  if (auto && woodTimer) {stopWood();return}
  const generation = ++woodGeneration;
  if (!state.sound) await setSound(true, false);
  if (generation !== woodGeneration || !state.entered) return;
  if (!auto) {tapMoktak();return}
  if (!state.sound) return;
  const beat = () => {if (permitted()) tapMoktak()};
  beat();
  woodTimer = setInterval(beat, 1000);
  renderWood();
 }
 function chantOptions() {
  return '<p>Trích đoạn tụng do Kim Yong-bae ghi âm tại một chùa Hàn Quốc. Phiên chung kéo dài 5 phút lúc 05:00 và 18:00 giờ Việt Nam. Khi tới giờ chung, người đang nghe riêng sẽ chuyển vào cùng nhịp. <a href="credits.html#chant-credit" target="_blank" rel="noopener">Nguồn bản thu ↗</a></p><output id="chant-status" aria-live="polite"></output><div class="service-actions"><button id="chant-private" class="primary">Nghe riêng ngay</button><button id="chant-shared" class="secondary">Theo giờ chung</button></div>';
 }
 function bindChant() {
  $('chant-private').onclick = () => selectMode('private');
  $('chant-shared').onclick = () => selectMode('shared');
  label();
 }
 $('chant-open').onclick = () => {
  panel('Nghe tụng','volume',chantOptions(),'chant');
  if (isActive('chant')) bindChant();
 };
 $('moktak-open').onclick = () => {
  panel('Gõ mõ','wood','<p>Một nhịp để theo hơi thở. Bạn có thể đóng bảng và tiếp tục nghe nhịp tự động.</p><output id="moktak-status" aria-live="polite"></output><div class="service-actions"><button class="primary" id="moktak-tap">Gõ một tiếng</button><button class="secondary" id="moktak-auto">Gõ tự động</button></div>','moktak');
  if (!isActive('moktak')) return;
  $('moktak-tap').onclick = () => playWood(false);
  $('moktak-auto').onclick = () => playWood(true);
  renderWood();
 };
 return {chantOptions, bindChant, sync, updateVolume() {
  if (gain) gain.gain.setTargetAtTime(state.chantVolume, getAudio().audio.currentTime,.1);
 }, stop() {
  mode = 'off';
  status = '';
  clearInterval(chantTimer);
  stopSource();
  stopWood();
  label();
 }};
}
