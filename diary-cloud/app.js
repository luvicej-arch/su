import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, inMemoryPersistence, setPersistence, signInWithPopup, onAuthStateChanged, signOut, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, collection, doc, query, orderBy, limit, startAfter, getDocsFromServer, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, connectFirestoreEmulator } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
if (__DIARY_EMULATORS__) { connectAuthEmulator(auth,'http://127.0.0.1:19482');connectFirestoreEmulator(db,'127.0.0.1',19481); }
const persistenceReady=setPersistence(auth,inMemoryPersistence);
const $=id=>document.getElementById(id),fields=['date','title','body','mood'];
let user=null,entries=[],current=null,dirty=false,busy=false,loading=false,last=null,generation=0;
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const status=message=>{$('status').textContent=message;};
const authStatus=message=>{$('auth-status').textContent=message;};
const dateString=value=>value?.toDate().toISOString().slice(0,10)||today();
function render(){
  const needle=$('search').value.trim().toLowerCase();$('count').textContent=entries.length;$('entries').replaceChildren();
  for(const entry of entries.filter(e=>(e.title+' '+e.body).toLowerCase().includes(needle))){
    const button=document.createElement('button');button.type='button';button.className='entry'+(entry.id===current?' active':'');
    const title=document.createElement('strong'),date=document.createElement('small');title.textContent=entry.title;date.textContent=`${entry.mood} ${dateString(entry.date)}`;button.append(title,date);
    button.onclick=()=>{if(!busy&&leave())open(entry);};$('entries').append(button);
  }
  if(!$('entries').children.length){const text=document.createElement('p');text.className='empty';text.textContent=needle?'불러온 일기 중 검색한 기록이 없어요.':'아직 기록이 없어요. 첫 이야기를 남겨보세요.';$('entries').append(text);}
}
function leave(){return !dirty||confirm('저장하지 않은 내용이 있습니다. 변경 내용을 버릴까요?');}
function open(entry){current=entry?.id||null;for(const field of fields)$(field).value=field==='date'?dateString(entry?.date):entry?.[field]??(field==='mood'?'😊':'');dirty=false;$('delete').hidden=!current;$('mode').textContent=current?'기억을 다시 펼쳐요':'새로운 이야기';$('letters').textContent=$('body').value.length+'자';status('');render();}
function lock(value){busy=value;for(const id of [...fields,'new','save','delete','logout','refresh'])$(id).disabled=value||!user;}
async function load(more=false){
  if(!user||loading)return;const uid=user.uid,version=generation;loading=true;$('load-more').disabled=true;
  try{const clauses=[orderBy('date','desc'),limit(200)];if(more&&last)clauses.push(startAfter(last));const snapshot=await getDocsFromServer(query(collection(db,'users',uid,'entries'),...clauses));if(version!==generation||uid!==user?.uid)return;
    const page=snapshot.docs.map(item=>({id:item.id,...item.data()}));entries=more?[...entries,...page]:page;last=snapshot.docs.at(-1)||last;$('load-more').hidden=snapshot.size<200;render();authStatus('');
  }catch{if(version===generation)authStatus('기록을 불러오지 못했습니다. 연결을 확인한 뒤 목록 새로고침을 눌러주세요.');}
  finally{if(version===generation){loading=false;$('load-more').disabled=false;}}
}
$('login').onclick=async()=>{$('login').disabled=true;authStatus('');try{await persistenceReady;const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await signInWithPopup(auth,provider);}catch(error){authStatus(error.code==='auth/popup-blocked'?'로그인 팝업을 허용한 뒤 다시 눌러주세요.':'구글 로그인하지 못했습니다. 다시 눌러주세요.');}finally{$('login').disabled=false;}};
$('logout').onclick=async()=>{if(busy||!leave())return;try{await signOut(auth);}catch{authStatus('로그아웃하지 못했습니다. 다시 시도해주세요.');}};
onAuthStateChanged(auth,next=>{
  generation++;user=next;entries=[];current=null;last=null;loading=false;dirty=false;$('search').value='';open(null);
  $('workspace').hidden=!user;$('login').hidden=!!user;$('account').hidden=!user;$('account-name').textContent=user?.displayName||user?.email||'';lock(false);
  if(user)load();else authStatus('구글 계정으로 로그인하면 나만의 일기를 불러옵니다. 공용 기기에서는 사용 후 로그아웃하세요.');
});
$('new').onclick=()=>{if(!busy&&leave())open(null);};$('search').oninput=render;
$('refresh').onclick=()=>load();$('load-more').onclick=()=>load(true);
for(const field of fields)$(field).addEventListener('input',()=>{dirty=true;$('letters').textContent=$('body').value.length+'자';status('아직 저장하지 않은 내용입니다.');});
$('editor').onsubmit=async event=>{
  event.preventDefault();if(busy||!user)return;const uid=user.uid,version=generation,raw=$('date').value,parsed=new Date(raw+'T00:00:00Z');
  if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==raw||raw<'1900-01-01'||raw>'2100-12-31'){status('올바른 날짜를 입력하세요.');return;}
  const title=$('title').value.trim(),body=$('body').value.trim();if(!title||!body){status('제목과 내용을 입력하세요.');return;}
  if(!navigator.onLine){status('오프라인에서는 저장할 수 없습니다. 연결 후 다시 저장해주세요.');return;}
  lock(true);let pendingTimer;const isNew=!current,id=current||crypto.randomUUID();
  try{const data={title,body,mood:$('mood').value,date:Timestamp.fromDate(parsed),updatedAt:serverTimestamp()};const ref=doc(db,'users',uid,'entries',id);const write=isNew?setDoc(ref,{...data,createdAt:serverTimestamp()}):updateDoc(ref,data);
    pendingTimer=setTimeout(()=>status('저장 확인을 기다리고 있습니다. 연결을 유지하고 이 화면에서 기다려주세요.'),10000);await write;if(version!==generation)return;
    current=id;dirty=false;$('delete').hidden=false;$('mode').textContent='기억을 다시 펼쳐요';status('저장했습니다. 내 계정의 Firebase에 보관됩니다.');await load();
  }catch{if(version===generation)status('저장하지 못했습니다. 연결과 입력을 확인하고 다시 저장해주세요.');}
  finally{clearTimeout(pendingTimer);if(version===generation)lock(false);}
};
$('delete').onclick=async()=>{if(!user||!current||busy||!confirm('이 일기를 삭제할까요? 삭제한 기록은 되돌릴 수 없습니다.'))return;const uid=user.uid,version=generation;lock(true);try{await deleteDoc(doc(db,'users',uid,'entries',current));if(version!==generation)return;open(null);status('일기를 삭제했습니다.');await load();}catch{status('삭제하지 못했습니다. 연결을 확인한 뒤 다시 시도해주세요.');}finally{if(version===generation)lock(false);}};
window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue='';}});
open(null);lock(false);
