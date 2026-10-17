'use strict';
const list = document.querySelector('#app-list');
const apps = (window.classroomApps || []).filter(app => typeof app.path === 'string' && /^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.html$/.test(app.path));
document.querySelector('#tool-count').textContent = `${apps.length}개의 도구`;
if (!apps.length) list.textContent = '준비된 도구가 없습니다.';
for (const app of apps) {
  const card = document.createElement('a');
  card.className = 'app-card'; card.href = app.path;
  const preview = document.createElement('div'); preview.className = 'app-preview'; preview.setAttribute('aria-hidden', 'true');
  const clock = document.createElement('div'); clock.className = 'clock-art';
  if (app.id === 'diary') {
    clock.className = 'document-art'; clock.innerHTML = '📖<small>나의 일기장</small>';
  } else if (app.id === 'decimal-dungeon') {
    clock.className = 'document-art'; clock.innerHTML = '🧙<small>소수 탐험대</small>';
  } else if (app.id === 'pdf-count') {
    clock.className = 'document-art'; clock.innerHTML = 'Aa<small>PDF</small>';
  } else clock.innerHTML = '<span class="clock-hand"></span><span class="clock-dot"></span>';
  preview.append(clock);
  const content = document.createElement('div'); content.className = 'app-card-content';
  const heading = document.createElement('h3'); heading.textContent = app.name;
  const description = document.createElement('p'); description.textContent = app.description;
  const action = document.createElement('span'); action.className = 'card-action'; action.textContent = '도구 열기 ↗';
  content.append(heading, description, action); card.append(preview, content); list.append(card);
}
