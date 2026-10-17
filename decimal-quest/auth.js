import { createClient } from '@supabase/supabase-js';
const client = createClient('https://ppnfpncwyaooahbcejuc.supabase.co', 'sb_publishable_KtnA_krNqZpXm_tmElqzXQ_l4__ag37', { auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false } });
const el = id => document.getElementById(id);
let user = null, pending = null, saving = false, generation = 0;
const status = text => { el('auth-status').textContent = text; };
const emailFor = username => `${username.toLowerCase()}@students.decimal-quest.invalid`;
async function history() {
  const current = user?.id, version = generation;
  if (!current) return;
  const { data, error } = await client.from('learning_sessions').select('id,created_at,xp,completed,mistakes,duration_seconds').order('created_at', { ascending: false }).limit(100);
  if (current !== user?.id || version !== generation) return;
  if (error) { status('기록을 불러오지 못했습니다. 잠시 뒤 다시 시도하세요.'); return; }
  el('history-list').replaceChildren();
  el('cloud-summary').textContent = `최근 ${data.length}회 · 최고 ${Math.max(0,...data.map(r => r.xp))} XP`;
  for (const row of data) { const li = document.createElement('li'); li.textContent = `${new Date(row.created_at).toLocaleString('ko-KR')} · ${row.xp} XP · ${row.completed}문제 완료 · 오답 ${row.mistakes}번`; el('history-list').append(li); }
}
el('auth-form').onsubmit = async event => {
  event.preventDefault();
  const username = el('username').value.trim().toLowerCase(), password = el('password').value;
  if (!/^[a-z0-9_]{4,20}$/.test(username)) { status('아이디는 영문 소문자·숫자·밑줄 4~20자로 입력하세요.'); return; }
  if (password.length < 8 || password.length > 72) { status('비밀번호는 8~72자로 입력하세요.'); return; }
  const signup = event.submitter?.id === 'signup';
  el('signin').disabled = el('signup').disabled = true;
  try {
    const credentials = { email: emailFor(username), password };
    const result = signup ? await client.auth.signUp(credentials) : await client.auth.signInWithPassword(credentials);
    if (result.error || !result.data.session) { status(signup ? '가입하지 못했습니다. 다른 아이디로 시도하거나 담당 교사에게 문의하세요.' : '아이디 또는 비밀번호를 확인하세요. 분실했다면 담당 교사에게 문의하세요.'); return; }
    el('password').value = ''; status('로그인했습니다.');
  } catch { status('연결하지 못했습니다. 인터넷 연결을 확인하세요.'); }
  finally { el('signin').disabled = el('signup').disabled = false; }
};
client.auth.onAuthStateChange((_event, session) => {
  generation++; user = session?.user ?? null;
  el('auth-form').hidden = !!user; el('account').hidden = !user; el('play-area').hidden = !user;
  el('account-name').textContent = user ? user.email.split('@')[0] : '';
  if (!user) { pending = null; el('history-list').replaceChildren(); el('cloud-summary').textContent = ''; window.dispatchEvent(new Event('quest-signed-out')); }
  else setTimeout(history, 0);
});
el('logout').onclick = async () => { if (saving) return; const {error} = await client.auth.signOut(); if(error) status('로그아웃하지 못했습니다. 다시 시도하세요.'); else status('로그아웃했습니다. 공용 기기에서는 탭도 닫아주세요.'); };
async function save() {
  if (!pending || !user || saving) return;
  saving = true; el('retry-save').hidden = true; el('logout').disabled = true; el('again').disabled = true;
  el('save-status').textContent = '학습 기록을 저장하고 있어요…';
  try {
    const { error } = await client.from('learning_sessions').insert(pending);
    if (error && error.code !== '23505') throw error;
    pending = null; el('save-status').textContent = '학습 기록을 계정에 저장했어요.'; await history();
  } catch { el('save-status').textContent = '저장하지 못했어요. 연결을 확인한 뒤 다시 저장해 주세요.'; el('retry-save').hidden = false; }
  finally { saving = false; el('logout').disabled = false; el('again').disabled = !!pending; }
}
window.addEventListener('quest-finished', event => { if (!user) return; pending = { id: crypto.randomUUID(), user_id: user.id, ...event.detail }; save(); });
el('retry-save').onclick = save;
window.addEventListener('beforeunload', event => { if (pending) { event.preventDefault(); event.returnValue = ''; } });
