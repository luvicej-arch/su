'use strict';
(() => {
  const el = id => document.getElementById(id);
  const stage = el('timer-stage'), display = el('time-display'), status = el('status');
  const minutes = el('minutes'), seconds = el('seconds'), inputs = el('time-inputs');
  const sound = el('sound'), error = el('input-error'), notice = el('system-notice');
  let configuredSeconds = 300, remainingMs = 300000, state = 'idle', deadline = null;
  let interval = null, audio = null, playing = [], audioGeneration = 0;

  function announce(message) { notice.textContent = message; notice.hidden = false; }
  function clearError() {
    error.hidden = true; error.textContent = '';
    minutes.removeAttribute('aria-invalid'); seconds.removeAttribute('aria-invalid');
  }
  function readInput(showError = true) {
    const raw = [minutes.value, seconds.value];
    const valid = raw.every(value => /^\d+$/.test(value));
    const m = Number(raw[0]), s = Number(raw[1]);
    if (!valid || !Number.isInteger(m) || !Number.isInteger(s) || m > 99 || s > 59 || m * 60 + s < 1) {
      if (showError) {
        error.textContent = '분은 0~99, 초는 0~59의 정수로 입력해 주세요. 전체 시간은 1초 이상이어야 해요.';
        error.hidden = false;
        minutes.setAttribute('aria-invalid', 'true'); seconds.setAttribute('aria-invalid', 'true');
      }
      return null;
    }
    clearError(); return m * 60 + s;
  }
  function render() {
    const total = Math.max(0, Math.ceil(remainingMs / 1000));
    display.textContent = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    display.setAttribute('aria-label', `남은 시간 ${Math.floor(total / 60)}분 ${total % 60}초`);
    stage.dataset.state = state;
    inputs.disabled = state === 'running' || state === 'paused';
    const message = ({idle:'시간을 정하고 시작해 주세요.', running:'활동 중이에요.', paused:'잠시 멈췄어요.', finished:'시간 끝!'})[state];
    if (status.textContent !== message) status.textContent = message;
    el('action-label').textContent = ({idle:'시작하기', running:'일시정지', paused:'이어서 시작', finished:'다시 시작'})[state];
    el('action-icon').textContent = state === 'running' ? 'Ⅱ' : '▶';
    el('progress').style.transform = `scaleX(${Math.min(1, remainingMs / (configuredSeconds * 1000))})`;
  }
  function stopInterval() { if (interval !== null) clearInterval(interval); interval = null; }
  function stopSound() {
    audioGeneration++;
    for (const oscillator of playing) { try { oscillator.stop(); } catch {} }
    playing = [];
  }
  async function prepareAudio() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('unsupported');
      if (!audio || audio.state === 'closed') audio = new Audio();
      if (audio.state === 'suspended') await audio.resume();
      if (audio.state !== 'running') throw new Error('blocked');
      return true;
    } catch { announce('알림음을 재생할 수 없어요. 시간이 끝나면 화면으로 알려드릴게요.'); return false; }
  }
  async function ring() {
    const generation = audioGeneration;
    if (!await prepareAudio() || generation !== audioGeneration || !sound.checked || state !== 'finished') return;
    try {
      for (let i = 0; i < 3; i++) {
        const oscillator = audio.createOscillator(), gain = audio.createGain();
        const start = audio.currentTime + i * .38;
        oscillator.type = 'sine'; oscillator.frequency.value = i === 2 ? 880 : 660;
        gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.18, start + .02); gain.gain.exponentialRampToValueAtTime(.001, start + .3);
        oscillator.connect(gain); gain.connect(audio.destination);
        oscillator.start(start); oscillator.stop(start + .32); playing.push(oscillator);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); playing = playing.filter(item => item !== oscillator); };
      }
    } catch { announce('알림음을 재생할 수 없어요. 화면의 종료 안내를 확인해 주세요.'); }
  }
  function update() {
    if (state !== 'running') return;
    remainingMs = Math.max(0, deadline - performance.now());
    if (remainingMs === 0) {
      state = 'finished'; deadline = null; stopInterval(); render();
      if (sound.checked) void ring();
      return;
    }
    render();
  }
  function begin() {
    stopSound();
    if (sound.checked) void prepareAudio();
    deadline = performance.now() + remainingMs; state = 'running';
    stopInterval(); interval = setInterval(update, 100); render();
  }
  el('timer-form').addEventListener('submit', event => {
    event.preventDefault();
    if (state === 'running') {
      update();
      if (state === 'finished') return;
      stopInterval(); deadline = null; state = 'paused'; render(); return;
    }
    if (state === 'paused') { begin(); return; }
    const total = readInput();
    if (total === null) { minutes.focus(); return; }
    configuredSeconds = total; remainingMs = total * 1000; begin();
  });
  for (const input of [minutes, seconds]) input.addEventListener('input', () => {
    if (state === 'running' || state === 'paused') return;
    const total = readInput();
    if (total !== null) { stopSound(); configuredSeconds = total; remainingMs = total * 1000; state = 'idle'; render(); }
  });
  el('reset').addEventListener('click', () => {
    stopInterval(); stopSound(); state = 'idle'; deadline = null; remainingMs = configuredSeconds * 1000;
    minutes.value = Math.floor(configuredSeconds / 60); seconds.value = configuredSeconds % 60;
    clearError(); notice.hidden = true; render();
  });
  sound.addEventListener('change', () => {
    el('sound-state').textContent = sound.checked ? '켜짐' : '꺼짐';
    if (sound.checked) void prepareAudio(); else stopSound();
  });
  el('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (stage.requestFullscreen) await stage.requestFullscreen();
      else throw new Error('unsupported');
    } catch { announce('이 브라우저에서는 전체화면을 열 수 없어요. 일반 화면에서 계속 사용할 수 있어요.'); }
  });
  document.addEventListener('fullscreenchange', () => {
    const active = document.fullscreenElement === stage;
    el('fullscreen-label').textContent = active ? '전체화면 나가기' : '전체화면';
    el('fullscreen').setAttribute('aria-pressed', String(active));
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
  window.addEventListener('pagehide', () => { stopInterval(); stopSound(); if (audio) void audio.close().catch(() => {}); });
  // 뒤로 가기의 페이지 캐시에서도 새 진입은 기본값으로 시작합니다.
  window.addEventListener('pageshow', event => { if (event.persisted) window.location.reload(); });
  render();
})();
