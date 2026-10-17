const $ = s => document.querySelector(s);
const modal = $('#modal'), content = $('#modal-content');
const titles = {choice:'이 말이 맞을까?',spacing:'한 칸의 차이',ox:'맞춤법 OX',speed:'30초 우리말 질주',daily:'오늘의 도전'};
let saved;
try { saved = JSON.parse(localStorage.getItem('malgeul-v1')); } catch {}
let records = Array.isArray(saved?.records) ? saved.records.filter(r => r && typeof r.type === 'string' && Number.isSafeInteger(r.total) && r.total >= 0 && Number.isSafeInteger(r.score) && r.score >= 0 && r.score <= r.total && typeof r.date === 'string' && Number.isFinite(Date.parse(r.date))).slice(0,100) : [];
const knownQuestions = Object.values(QUESTIONS).flat();
let mistakes = Array.isArray(saved?.mistakes) ? knownQuestions.filter(q => saved.mistakes.some(m => m && m.q === q.q)) : [];
let game, timer, previousFocus;
function persist(){try{localStorage.setItem('malgeul-v1',JSON.stringify({records,mistakes}));}catch{}}
function shuffle(items){return [...items].sort(()=>Math.random()-.5);}
function open(label){clearInterval(timer);previousFocus=document.activeElement;$('#modal-label').textContent=label;if(!modal.open)modal.showModal();}
function stop(){clearInterval(timer);}
modal.addEventListener('close',()=>{stop();previousFocus?.focus();});
$('#close-modal').onclick=()=>modal.close();
function start(type, reviewQuestions){
  open(titles[type] || '오답 다시 풀기');
  const pool = type === 'speed' ? shuffle([...QUESTIONS.choice,...QUESTIONS.spacing]) : type === 'daily' ? [QUESTIONS.choice[4]] : reviewQuestions || shuffle(QUESTIONS[type]).slice(0,5);
  game={type,pool,index:0,score:0,answered:false,finished:false,deadline:Date.now()+30000};
  renderQuestion();
  if(type==='speed')timer=setInterval(()=>{const remaining=Math.max(0,Math.ceil((game.deadline-Date.now())/1000));const el=$('#time-left');if(el)el.textContent=remaining+'초';if(remaining===0)finish();},150);
}
function renderQuestion(){
  game.answered=false;
  const q=game.pool[game.index % game.pool.length];
  content.innerHTML=`<div class="progress"><div style="width:${game.type==='speed'?100:game.index/game.pool.length*100}%"></div></div><div class="quiz-meta"><span>${game.type==='speed'?game.index+1:game.index+1+' / '+game.pool.length} 번째 문제</span><span id="time-left">${game.type==='speed'?Math.max(0,Math.ceil((game.deadline-Date.now())/1000))+'초':game.score+'개 정답'}</span></div><h2>${titles[game.type] || '다시 만나니 반가운 문제'}</h2><div class="question"></div><div class="answers"></div><div id="answer-feedback" aria-live="polite"></div>`;
  $('.question').textContent=q.q;
  q.a.forEach((a,i)=>{const btn=document.createElement('button');btn.className='answer';btn.textContent=a;btn.onclick=()=>answer(i);$('.answers').append(btn);});
}
function answer(index){
  if(game.answered||game.finished)return;
  if(game.type==='speed'&&Date.now()>=game.deadline){finish();return;}
  game.answered=true;const q=game.pool[game.index % game.pool.length];const correct=index===q.correct;
  if(correct){game.score++;mistakes=mistakes.filter(m=>m.q!==q.q);}else if(!mistakes.some(m=>m.q===q.q)){mistakes.push(q);}
  persist();
  document.querySelectorAll('.answer').forEach((b,i)=>{b.disabled=true;if(i===q.correct)b.classList.add('correct');else if(i===index)b.classList.add('wrong');});
  const feedback=$('#answer-feedback');feedback.innerHTML='<div class="feedback"><strong></strong><br><span></span></div><button class="primary next"></button>';
  feedback.querySelector('strong').textContent=correct?'정답이에요!':'괜찮아요, 이제 기억하면 돼요.';feedback.querySelector('span').textContent=q.why;
  const next=feedback.querySelector('button');next.textContent=game.type!=='speed'&&game.index+1===game.pool.length?'결과 보기 ↗':'다음 문제 →';
  next.onclick=()=>{game.index++;if(game.type!=='speed'&&game.index>=game.pool.length)finish();else renderQuestion();};next.focus();
}
function finish(){
  if(game.finished)return;game.finished=true;stop();
  const total=game.type==='speed'?game.index+(game.answered?1:0):game.pool.length;
  records.unshift({type:game.type,score:game.score,total,date:new Date().toISOString()});records=records.slice(0,100);persist();
  content.innerHTML=`<h2>오늘도 우리말과 한 뼘 더 가까이.</h2><div class="result-number">${game.score}<small> / ${total} 정답</small></div><p class="empty">${game.score===total&&total>0?'모두 맞혔어요. 멋진 우리말 감각이에요!':'헷갈렸던 표현은 오답 노트에서 다시 만나요.'}</p><button class="primary next" id="again">한 판 더 ↗</button><button class="text-action" id="result-review">오답 노트 보기</button>`;
  $('#again').onclick=()=>game.type==='review'?showReview():start(game.type);$('#result-review').onclick=showReview;
}
function showReview(){
  open('나만의 오답 노트');content.innerHTML='<h2>틀렸던 말도, 내 말이 되도록.</h2>';
  if(!mistakes.length){content.innerHTML+='<p class="empty">아직 모인 오답이 없어요.<br>게임을 즐기면 헷갈린 표현이 여기에 모여요.</p><button class="primary next" id="review-play">게임 시작하기 ↗</button>';$('#review-play').onclick=()=>start('choice');return;}
  mistakes.forEach(q=>{const row=document.createElement('div');row.className='record';const title=document.createElement('strong');title.textContent=q.q+' → '+q.a[q.correct];const p=document.createElement('p');p.textContent=q.why;row.append(title,p);content.append(row);});
  const play=document.createElement('button');play.className='primary next';play.textContent='오답 다시 풀기 ↗';play.onclick=()=>start('review',[...mistakes]);content.append(play);
}
function showStats(){
  open('나의 기록');const total=records.reduce((n,r)=>n+r.total,0),correct=records.reduce((n,r)=>n+r.score,0);
  content.innerHTML=`<h2>차곡차곡 쌓인 우리말 감각.</h2><div class="result-number">${records.length}<small> 판 플레이</small></div><p>누적 ${total}문제 · 정답률 ${total?Math.round(correct/total*100):0}% · 오답 ${mistakes.length}개</p>`;
  if(!records.length)content.innerHTML+='<p class="empty">첫 게임을 시작하고 나만의 기록을 만들어 보세요.</p>';
  records.slice(0,8).forEach(r=>{const row=document.createElement('div');row.className='record';row.textContent=`${titles[r.type] || '오답 복습'} · ${r.score}/${r.total} 정답 · ${new Date(r.date).toLocaleDateString('ko-KR')}`;content.append(row);});
}
document.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>start(b.dataset.game));
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-filter]').forEach(t=>t.classList.toggle('selected',t===b));document.querySelectorAll('[data-category]').forEach(c=>c.hidden=b.dataset.filter!=='all'&&c.dataset.category!==b.dataset.filter);});
$('#quick-start').onclick=()=>start('choice');['#daily-top','#daily-start'].forEach(s=>$(s).onclick=()=>start('daily'));['#review-nav','#review-bottom'].forEach(s=>$(s).onclick=showReview);$('#stats-nav').onclick=showStats;
