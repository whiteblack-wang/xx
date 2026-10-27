'use strict';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const menuButton = $('#menuButton');
const nav = $('#siteNav');
function setMenu(open) {
  menuButton.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
  nav.hidden = !open;
}
menuButton.addEventListener('click', () => setMenu(nav.hidden));
nav.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !nav.hidden) { setMenu(false); menuButton.focus(); }
});
document.addEventListener('click', (event) => { if (!event.target.closest('.topbar')) setMenu(false); });

// Actual locally synthesized rain-like noise; no recording or network service.
let audioContext, audioSource, audioTimer;
let playing = false;
function stopAudio() {
  clearTimeout(audioTimer);
  if (audioSource) { audioSource.stop(); audioSource.disconnect(); audioSource = null; }
  if (audioContext) { audioContext.close(); audioContext = null; }
  playing = false;
  $('#playButton').setAttribute('aria-pressed', 'false');
  $('#playButton .button-icon').textContent = '▶';
  $('#playText').textContent = '播放演示声音';
  $('.sound-orbit').classList.remove('is-playing');
}
$('#playButton').setAttribute('aria-pressed', 'false');
$('#playButton').addEventListener('click', async () => {
  if (playing) { stopAudio(); return; }
  const AudioAPI = window.AudioContext || window.webkitAudioContext;
  if (!AudioAPI) { $('#audioStatus').textContent = '当前浏览器不支持合成声音，请阅读上方虚构故事。'; return; }
  try {
    audioContext = new AudioAPI();
    await audioContext.resume();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 4, audioContext.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    audioSource = audioContext.createBufferSource();
    audioSource.buffer = buffer;
    audioSource.loop = true;
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 1100;
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.13, audioContext.currentTime + 1.5);
    gain.gain.setValueAtTime(0.13, audioContext.currentTime + 45);
    gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 48);
    audioSource.connect(filter).connect(gain).connect(audioContext.destination);
    audioSource.start();
    playing = true;
    $('#playButton').setAttribute('aria-pressed', 'true');
    $('#playButton .button-icon').textContent = '❚❚';
    $('#playText').textContent = '停止合成雨声';
    $('.sound-orbit').classList.add('is-playing');
    audioTimer = setTimeout(stopAudio, 48000);
  } catch (error) {
    stopAudio();
    $('#audioStatus').textContent = '声音暂时无法播放，可继续阅读虚构故事。';
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stopAudio(); });

$$('.choice-chip').forEach(chip => chip.addEventListener('click', () => {
  $$('.choice-chip').forEach(item => { item.classList.remove('active'); item.setAttribute('aria-pressed', 'false'); });
  chip.classList.add('active'); chip.setAttribute('aria-pressed', 'true');
}));
const routes = {
  '慢游': ['檐下慢行', '桥头 → 江岸 → 临水街巷', '在虚构街巷里慢慢走，为光影留一点停顿。'],
  '听故事': ['回声采集', '檐下 → 桥边 → 江岸', '在三个虚构停靠点，想象雨声、脚步与风的对话。'],
  '看建筑': ['屋檐折线', '桥拱 → 瓦檐 → 临水建筑', '观察虚构场景里门、窗与檐口的比例变化。'],
  '拍照': ['留白取景', '桥与倒影 → 临水街巷 → 群檐与山雾', '从一束斜光开始，为每张照片留出呼吸的空白。']
};
$('#generateButton').addEventListener('click', () => {
  const pref = $('.choice-chip.active').dataset.pref;
  const typed = $('#aiInput').value.trim();
  const [title, path, description] = routes[pref];
  const shortWalk = /少走|短|轻松|老人|休息/.test(typed);
  const morning = /清晨|早上|晨/.test(typed);
  const evening = /傍晚|黄昏|夕阳/.test(typed);
  const timing = morning ? '晨光主题 · ' : evening ? '暮色主题 · ' : '';
  const heading = document.createElement('h3');
  heading.textContent = timing + title + (shortWalk ? ' · 轻松版' : '');
  const route = document.createElement('p');
  route.textContent = shortWalk ? '江岸 → 就近休息点（虚构场景）' : path;
  const detail = document.createElement('p');
  detail.textContent = shortWalk ? '缩减停靠点、增加休息。实际可达性与交通信息需出发前核实。' : description;
  const note = document.createElement('small');
  note.textContent = typed ? `你的心愿：${typed}。演示仅识别清晨、傍晚、少走路等关键词。` : '本地预设模板生成 · 没有发送数据或调用 AI 服务';
  const content = document.createElement('div');
  content.append(heading, route, detail, note);
  const tag = document.createElement('span'); tag.className = 'route-tag'; tag.textContent = '虚构演示';
  const result = document.createElement('div'); result.className = 'route-result'; result.append(content, tag);
  $('#aiResult').replaceChildren(result);
});
$('#aiInput').addEventListener('keydown', event => { if (event.key === 'Enter' && !event.isComposing) $('#generateButton').click(); });
$('#routeToggle').addEventListener('click', () => {
  const expanded = $('#greenTips').hidden;
  $('#greenTips').hidden = !expanded;
  $('#routeToggle').setAttribute('aria-expanded', String(expanded));
  $('#routeToggle').textContent = expanded ? '收起低碳旅行建议 ↗' : '展开低碳旅行建议 ↘';
});

// Files stay in browser memory. The same three layouts accept real photos.
const targets = [$('.roof-photo'), $('.corridor-photo'), $('.courtyard-photo')];
const names = ['桥与倒影', '临水街巷', '群檐与山雾'];
const slotLabels = ['换桥景', '换街巷', '换山色'];
const photoUrls = [null, null, null];
const defaultSources = ['assets/tuojiang-bridge.jpg', 'assets/tuojiang-riverside.jpg', 'assets/tuojiang-mist.jpg'];
const upload = $('#photoUpload');
let requestedSlot = null;
function chooseFiles(slot = null) {
  requestedSlot = slot;
  upload.multiple = slot === null;
  upload.value = '';
  upload.click();
}
$('#uploadButton').addEventListener('click', () => chooseFiles());
const slotControls = document.createElement('div');
slotControls.className = 'slot-controls';
names.forEach((name, index) => {
  const button = document.createElement('button'); button.type = 'button'; button.textContent = slotLabels[index];
  button.addEventListener('click', () => chooseFiles(index)); slotControls.append(button);
});
$('.upload-note').before(slotControls);
function loadImage(url) {
  return new Promise((resolve, reject) => { const img = new Image(); img.onload = resolve; img.onerror = reject; img.src = url; });
}
upload.addEventListener('change', async event => {
  const allFiles = [...event.target.files];
  if (!allFiles.length) return;
  const selectedSlot = requestedSlot;
  const files = allFiles.slice(0, selectedSlot === null ? 3 : 1);
  const errors = [];
  $('#uploadStatus').textContent = '正在本机读取图片…';
  $('#uploadButton').disabled = true;
  slotControls.querySelectorAll('button').forEach(button => button.disabled = true);
  for (const [index, file] of files.entries()) {
    const slot = selectedSlot === null ? index : selectedSlot;
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type) || file.size > 15 * 1024 * 1024) {
      errors.push(`${names[slot]}：请选择不超过 15 MB 的 JPG、PNG、WebP 或 GIF`); continue;
    }
    const url = URL.createObjectURL(file);
    try { await loadImage(url); } catch (error) { URL.revokeObjectURL(url); errors.push(`${names[slot]}：图片无法读取`); continue; }
    if (photoUrls[slot]) URL.revokeObjectURL(photoUrls[slot]);
    photoUrls[slot] = url;
    targets[slot].querySelector('img').src = url;
    targets[slot].querySelector('img').alt = `你选入的${names[slot]}图片`;
    targets[slot].classList.add('has-upload');
    targets[slot].setAttribute('aria-label', `放大你选入的${names[slot]}图片`);
  }
  $('#uploadButton').disabled = false;
  slotControls.querySelectorAll('button').forEach(button => button.disabled = false);
  const count = photoUrls.filter(Boolean).length;
  const summary = count ? `已载入 ${count}/3 张照片 · 仅本机预览，刷新后恢复风貌图片` : '未载入新图片，继续展示风貌图片';
  const overflow = allFiles.length > 3 ? '最多读取前三张。' : '';
  $('#uploadStatus').textContent = [summary, overflow, ...errors].filter(Boolean).join('；');
  $('#resetPhotos').hidden = count === 0;
});
$('#resetPhotos').addEventListener('click', () => {
  targets.forEach((target, index) => {
    if (photoUrls[index]) URL.revokeObjectURL(photoUrls[index]);
    photoUrls[index] = null; target.classList.remove('has-upload');
    target.querySelector('img').src = defaultSources[index];
    target.querySelector('img').alt = `${names[index]}风貌图片`;
    target.setAttribute('aria-label', `查看${names[index]}原图`);
  });
  upload.value = ''; $('#resetPhotos').hidden = true;
  $('#uploadStatus').textContent = '已恢复三张风貌图片 · 图片不会上传到服务器';
});

// Show the original landscape images without cropping or color treatment.
const posterDialog = $('#posterDialog');
let activePoster = 0;
function showPoster(index) {
  activePoster = (index + targets.length) % targets.length;
  $('#dialogImage').src = targets[activePoster].querySelector('img').src;
  $('#dialogImage').alt = targets[activePoster].querySelector('img').alt;
  $('#posterDialogTitle').textContent = `${names[activePoster]} / ${photoUrls[activePoster] ? '你的图片' : '风貌图片'}`;
  $('#posterCounter').textContent = `0${activePoster + 1} / 03`;
  if (!posterDialog.open) { posterDialog.showModal(); document.body.classList.add('dialog-open'); }
}
$$('.poster-open').forEach(button => button.addEventListener('click', () => showPoster(Number(button.dataset.poster))));
$('#closePoster').addEventListener('click', () => posterDialog.close());
posterDialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
posterDialog.addEventListener('click', event => { if (event.target === posterDialog) posterDialog.close(); });
$('#previousPoster').addEventListener('click', () => showPoster(activePoster - 1));
$('#nextPoster').addEventListener('click', () => showPoster(activePoster + 1));
posterDialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); showPoster(activePoster - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); showPoster(activePoster + 1); }
});
