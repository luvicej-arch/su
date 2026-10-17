'use strict';
const $ = id => document.getElementById(id);
let entries = [], current = null, dirty = false, busy = false;
const fields = ['date','title','body','mood'];
function today(){ const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function status(message){ $('status').textContent = message; }
async function api(path='', options={}){ const r = await fetch('/api/diary'+path, options); const data = await r.json(); if(!r.ok) throw new Error(data.error || '요청에 실패했습니다.'); return data; }
function render(){ const q = $('search').value.trim().toLowerCase(); $('count').textContent = entries.length; $('entries').replaceChildren(); const filtered = entries.filter(e=>(e.title+' '+e.body).toLowerCase().includes(q)); for(const e of filtered){ const b=document.createElement('button'); b.type='button'; b.className='entry'+(current===e.id?' active':''); const t=document.createElement('strong'), s=document.createElement('small'); t.textContent=e.title; s.textContent=`${e.mood}  ${e.date}`; b.append(t,s); b.onclick=()=>{if(!busy && leave()) open(e);}; $('entries').append(b); } if(!filtered.length){const p=document.createElement('p');p.className='empty';p.textContent=q?'검색한 기록이 없어요.':'아직 기록이 없어요.\n오늘의 첫 이야기를 남겨보세요.';$('entries').append(p);} }
function leave(){return !dirty || confirm('저장하지 않은 내용이 있습니다. 변경 내용을 버릴까요?');}
function open(e){current=e?.id || null;for(const f of fields) $(f).value=e?.[f] ?? ({date:today(),mood:'😊'}[f] || '');dirty=false;$('delete').hidden=!current;$('mode').textContent=current?'기억을 다시 펼쳐요':'새로운 이야기';$('letters').textContent=$('body').value.length+'자';status('');render();}
function lock(value){busy=value;for(const f of [...fields,'new','save','delete']) $(f).disabled=value;}
$('new').onclick=()=>{if(leave())open(null);}; $('search').oninput=render;
for(const f of fields) $(f).addEventListener('input',()=>{dirty=true;$('letters').textContent=$('body').value.length+'자';status('아직 저장하지 않은 내용입니다.');});
$('editor').onsubmit=async event=>{event.preventDefault();if(busy)return;lock(true);try{const payload=Object.fromEntries(fields.map(f=>[f,$(f).value])); const e=await api(current?'/'+current:'',{method:current?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});entries=entries.filter(x=>x.id!==e.id);entries.push(e);entries.sort((a,b)=>b.date.localeCompare(a.date)||b.updated.localeCompare(a.updated));open(e);status('저장했습니다. 내 컴퓨터의 데이터베이스에 보관됩니다.');}catch(e){status('저장 실패: '+e.message);}finally{lock(false);}};
$('delete').onclick=async()=>{if(!current||busy||!confirm('이 일기를 삭제할까요? 삭제한 기록은 되돌릴 수 없습니다.'))return;lock(true);try{await api('/'+current,{method:'DELETE'});entries=entries.filter(e=>e.id!==current);open(null);status('일기를 삭제했습니다.');}catch(e){status('삭제 실패: '+e.message);}finally{lock(false);}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
open(null);api().then(data=>{entries=data;render();}).catch(()=>{status('기록을 불러오지 못했습니다. node server.cjs로 로컬 서버를 실행하고 접속해주세요.');});
