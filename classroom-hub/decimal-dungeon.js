'use strict';
const $ = id => document.getElementById(id);
const key = 'classroom-decimal-best-v1';
let hero = '🧙', questions = [], index = 0, hearts = 5, xp = 0, mistakes = 0, locked = false, best = 0;
try { const value = Number(localStorage.getItem(key)); best = Number.isFinite(value) && value >= 0 && value <= 100 ? value : 0; } catch {}
const decimal = n => (n / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
function showBest() { $('best').textContent = `나의 최고 기록 · ${best} / 100 XP`; }
showBest();
document.querySelectorAll('[data-hero]').forEach(button => button.addEventListener('click', () => {
  hero = button.dataset.hero;
  document.querySelectorAll('[data-hero]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
}));
function start() {
  index = 0; hearts = 5; xp = 0; mistakes = 0;
  questions = Array.from({length:10}, (_, i) => {
    let a = 1 + Math.floor(Math.random()*299), b = 1 + Math.floor(Math.random()*199);
    const subtract = i % 2 === 1;
    if (subtract && a < b) [a,b] = [b,a];
    return {a,b,subtract,answer:subtract ? a-b : a+b};
  });
  $('setup').hidden = true; $('result').hidden = true; $('game').hidden = false; $('hero').textContent = hero; render();
}
function render() {
  locked = false;
  const q = questions[index];
  $('progress').textContent = `몬스터 ${index+1} / 10`;
  $('hearts').textContent = '♥'.repeat(hearts) + '♡'.repeat(5-hearts);
  $('hearts').setAttribute('aria-label', `남은 체력 ${hearts}개`);
  $('level').textContent = `Lv ${1+Math.floor(xp/30)} · ${xp} XP`;
  $('monster').textContent = ['👾','🍄','🐲','👻','🦇'][index%5];
  $('mission').textContent = q.subtract ? '소수 뺄셈' : '소수 덧셈';
  $('question').textContent = `${decimal(q.a)} ${q.subtract?'−':'+'} ${decimal(q.b)} = ?`;
  $('answer').value = ''; $('answer').disabled = false; $('submit').disabled = false;
  $('hint').hidden = true; $('feedback').textContent = ''; $('next').hidden = true; $('answer').focus();
}
function finish() {
  $('game').hidden = true; $('result').hidden = false;
  $('result-title').textContent = index === 10 ? '숲속 탐험 성공!' : '잠깐 쉬어 가요!';
  $('result-copy').textContent = `몬스터 ${index}마리 격파 · ${xp} XP · 오답 ${mistakes}번. ${index===10?'소수 실력이 한 뼘 자랐어요.':'힌트를 보며 다시 도전해 보세요.'}`;
  best = Math.max(best,xp); try { localStorage.setItem(key,String(best)); } catch {}
  showBest(); $('again').focus();
}
$('answer-form').addEventListener('submit', event => {
  event.preventDefault(); if (locked) return;
  const raw = $('answer').value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) { $('feedback').textContent = '0 이상의 소수를 소수 둘째 자리까지 입력해 주세요. 예: 0.25'; return; }
  const q = questions[index];
  if (Math.round(Number(raw)*100) === q.answer) {
    locked = true; xp += 10; $('feedback').textContent = '정답! 몬스터를 물리쳤어요. +10 XP';
    $('answer').disabled = true; $('submit').disabled = true; $('next').hidden = false;
    $('monster').classList.remove('hit'); void $('monster').offsetWidth; $('monster').classList.add('hit');
    $('next').textContent = index === 9 ? '탐험 결과 보기 →' : '다음 몬스터 →'; $('next').focus();
    $('level').textContent = `Lv ${1+Math.floor(xp/30)} · ${xp} XP`;
  } else {
    hearts--; mistakes++; $('hearts').textContent = '♥'.repeat(hearts)+'♡'.repeat(5-hearts); $('hearts').setAttribute('aria-label',`남은 체력 ${hearts}개`);
    if (!hearts) { finish(); return; }
    $('feedback').textContent = '아쉬워요! 소수점의 위치를 확인하고 다시 풀어 보세요. 하트 −1'; $('answer').select();
  }
});
$('hint-button').addEventListener('click', () => {
  const q = questions[index]; $('hint').hidden = false;
  $('hint').textContent = `소수점끼리 맞추고 빈 자리는 0으로 채워요. ${ (q.a/100).toFixed(2)} ${q.subtract?'−':'+'} ${(q.b/100).toFixed(2)}처럼 써 보세요. 100배 하면 ${q.a} ${q.subtract?'−':'+'} ${q.b}의 정수 계산이 돼요. 계산한 뒤 100으로 나누세요.`;
});
$('next').addEventListener('click', () => { if (!locked) return; index++; index === 10 ? finish() : render(); });
$('start').addEventListener('click',start); $('again').addEventListener('click',start);
$('restart').addEventListener('click', () => { $('game').hidden = true; $('setup').hidden = false; $('start').focus(); });
