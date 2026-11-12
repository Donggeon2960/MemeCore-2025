import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// --- API ---
const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'mq_token';
let onUnauthorized = () => {};

/** 모든 요청에 로그인 토큰을 붙이고, 실패 시 서버 메시지로 Error 를 던진다. */
async function api(path, { body, method = body ? 'POST' : 'GET' } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const isForm = body instanceof FormData;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';
  const res = await fetch(API + path, { method, headers, body: isForm ? body : body && JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) onUnauthorized();
  if (!res.ok) throw new Error([].concat(data.message || `요청 실패 (${res.status})`).join(', '));
  return data;
}
const imgUrl = (path) => API + path;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('ko-KR') : '-');

/** 파일 선택 → [file, previewUrl] (선택 취소 시 둘 다 null) */
function useImagePicker() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  const onChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };
  const reset = () => { setFile(null); setPreview(null); };
  return { file, preview, onChange, reset };
}

// --- 아이콘 컴포넌트 ---
const Icon = ({ children, size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} aria-hidden="true" {...props}>{children}</svg>
);

const Trophy = (props) => <Icon {...props}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></Icon>;
const Flame = (props) => <Icon {...props}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-2.246-3.726-3-3.726a7 7 0 0 1 7-7c0 0-2 2-3 4-1 2-1 4-1 5" /><path d="M5.5 17.5a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0" /></Icon>;
const User = (props) => <Icon {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon>;
const CheckCircle = (props) => <Icon {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></Icon>;
const RefreshCw = (props) => <Icon {...props}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></Icon>;
const LogOut = (props) => <Icon {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></Icon>;
const Menu = (props) => <Icon {...props}><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></Icon>;
const X = (props) => <Icon {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>;
const Image = (props) => <Icon {...props}><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></Icon>;
const Heart = (props) => <Icon {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></Icon>;
const Star = (props) => <Icon {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Icon>;
const Upload = (props) => <Icon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></Icon>;
const Settings = (props) => <Icon {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></Icon>;
const ListIcon = (props) => <Icon {...props}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></Icon>;

function LoadingOverlay({ message }) {
  return (
    <div className="loading-overlay" role="status">
      <div className="spinner"></div>
      <div className="loading-text">{message || "로딩중..."}</div>
    </div>
  );
}

function QuestCard({ quest, onClick }) {
  const cardStyle = quest.isCompleted
    ? { minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'default', opacity: 0.6, border: '1px solid #4ade80' }
    : { minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' };

  return (
    <div className="event-card" style={cardStyle} onClick={!quest.isCompleted ? onClick : undefined}>
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="badge badge-purple">AI Generated</div>
          {quest.isCompleted && <span className="badge" style={{background:'#4ade80', color:'black'}}>✅ 완료됨</span>}
        </div>
        <h4 className="font-bold text-lg mb-2" style={{textDecoration: quest.isCompleted ? 'line-through' : 'none'}}>{quest.title}</h4>
        <p className="text-sub text-sm line-clamp-3">{quest.content}</p>
      </div>
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
        <span className={`font-bold ${quest.isCompleted ? 'text-gray-500' : 'text-green-400'}`}>{quest.rewardPoints} P</span>
        <button className="btn-action text-xs" style={{ background: quest.isCompleted ? '#334155' : 'var(--primary)', cursor: quest.isCompleted ? 'not-allowed' : 'pointer'}} onClick={(e) => { e.stopPropagation(); if(!quest.isCompleted) onClick(); }} disabled={quest.isCompleted}>
          {quest.isCompleted ? "제출 완료" : "도전하기"}
        </button>
      </div>
    </div>
  );
}

function AiQuestSection({ refreshUser }) {
  const [quests, setQuests] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const img = useImagePicker();
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");

  const fetchQuests = useCallback(() => api('/api/my-quests').then(setQuests).catch((e) => alert(e.message)), []);
  useEffect(() => { fetchQuests(); }, [fetchQuests]);

  const handleGenerate = async () => {
    setLoading(true);
    setLoadingMsg("AI가 새로운 퀘스트를 생성 중입니다...");
    try {
      await api('/api/generate-quest', { method: 'POST' });
      await fetchQuests();
      alert("새로운 AI 퀘스트가 생성되었습니다!");
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!img.file || !selectedQuest) return alert("이미지를 선택해주세요.");
    setLoading(true);
    setLoadingMsg("AI가 밈을 분석하고 점수를 매기는 중...");
    const formData = new FormData();
    formData.append('image', img.file);
    formData.append('quest_id', selectedQuest.id);
    try {
      const data = await api('/api/verify-meme', { body: formData });
      if (data.isPass) {
        alert(`🎉 통과! (점수: ${data.score}) +${data.reward}P`);
        refreshUser();
        img.reset();
        setSelectedQuest(null);
        fetchQuests();
      } else alert(`😢 불합격 (점수: ${data.score})\n${data.reason || ''}`);
    } catch(err) { alert(err.message); } finally { setLoading(false); }
  };

  if (selectedQuest) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {loading && <LoadingOverlay message={loadingMsg} />}
        <button onClick={() => setSelectedQuest(null)} className="text-sub mb-4 link-btn">&larr; 목록으로 돌아가기</button>
        <div className="event-card mb-6" style={{ border: '2px solid #9333ea', background: 'rgba(147, 51, 234, 0.1)' }}>
          <div className="badge badge-purple mb-2">🎯 오늘의 미션</div>
          <h2 className="font-bold text-2xl mb-2">{selectedQuest.title}</h2>
          <p className="text-white text-lg mb-4" style={{ lineHeight: '1.6' }}>{selectedQuest.content}</p>
          <div className="flex justify-between items-center pt-4 border-t border-gray-600">
            <span className="text-sub text-sm">성공 시 보상</span>
            <span className="text-green-400 font-bold text-lg">+{selectedQuest.rewardPoints} P</span>
          </div>
        </div>
        <div className="login-box">
          <h4 className="font-bold mb-4 text-center">작품 제출하기</h4>
          {img.preview ? <img src={img.preview} alt="선택한 이미지 미리보기" style={{width:'100%', borderRadius:'8px', marginBottom:'1rem', border:'1px solid #555'}} /> : <div className="text-center p-8 border border-dashed border-gray-500 rounded-lg text-sub mb-4">이미지를 선택하면 미리보기가 표시됩니다.</div>}
          <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" aria-label="밈 이미지 선택" onChange={img.onChange} style={{color:'white', marginBottom:'1rem'}} />
          <button onClick={handleSubmit} disabled={loading} className="login-btn">제출하고 검사받기</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {loading && <LoadingOverlay message={loadingMsg} />}
      <div className="flex justify-between items-center mb-6">
        <h3 className="section-title"><CheckCircle color="#c084fc" /> AI 퀘스트 (주 3회 생성 가능)</h3>
        <button onClick={handleGenerate} disabled={loading} className="login-btn" style={{width:'auto', margin:0, padding:'0.5rem'}}>+ 생성</button>
      </div>
      <div className="events-grid">
        {quests.map(q => <QuestCard key={q.id} quest={q} onClick={() => setSelectedQuest(q)} />)}
        {quests.length === 0 && <div className="text-sub p-8">아직 퀘스트가 없습니다. "+ 생성"을 눌러 시작하세요.</div>}
      </div>
    </div>
  );
}

function SnsQuestSection({ user, refreshUser }) {
  const img = useImagePicker();
  const [snsUrl, setSnsUrl] = useState('');
  const [platform, setPlatform] = useState('YouTube');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!img.file) return alert("스크린샷을 업로드해주세요!");
    if (!snsUrl) return alert("게시물 URL을 입력해주세요!");

    setLoading(true);
    const formData = new FormData();
    formData.append('image', img.file);
    formData.append('platform', platform);
    formData.append('sns_url', snsUrl);

    try {
      const data = await api('/api/submit-social', { body: formData });
      if (data.status === 'success') {
        alert(`🎉 인증 성공! +${data.reward}P\n(${data.bonusDetail || '기본 보상'})`);
        refreshUser();
        img.reset();
        setSnsUrl('');
      } else {
        alert(`😢 인증 실패: ${data.reason}`);
      }
    } catch (err) { alert(`😢 인증 실패: ${err.message}`); } finally { setLoading(false); }
  };

  return (
    <div className="login-box" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {loading && <LoadingOverlay message="AI가 스크린샷 및 데이터를 분석 중입니다..." />}
      <h3 className="font-bold text-xl mb-4">SNS 공유 인증 (AI 자동 검사)</h3>

      {/* 창작 & 리믹스 선택 안내 섹션 */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, background: 'rgba(147, 51, 234, 0.1)', border: '1px solid #9333ea', borderRadius: '1rem', padding: '1.5rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✨</div>
          <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#c084fc' }}>자신만의 밈 만들기</h4>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
            당신의 기발한 아이디어로<br/>오리지널 영상을 만들어<br/>SNS에 올려주세요!
          </p>
        </div>
        <div style={{ flex: 1, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '1rem', padding: '1.5rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🧬</div>
          <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#fbbf24' }}>기존 밈 리믹스</h4>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
            유행하는 밈 소스를<br/>내 스타일로 패러디해서<br/>SNS에 올려주세요!
          </p>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
        <div className="text-sm text-sub mb-2">💡 미션 가이드</div>
        <ol className="text-sm space-y-2 pl-4 text-gray-300">
          <li>위 주제 중 하나를 골라 SNS(유튜브 등)에 업로드하세요.</li>
          <li>게시물 설명란에 <strong>내 고유 코드</strong>를 꼭 적어주세요. (유튜브는 영상 설명란을 자동 확인합니다)</li>
          <li><strong>코드가 보이는 화면을 캡처(스크린샷)</strong>해서 업로드하세요.</li>
          <li>유튜브 조회수 100회 이상이면 보너스, 이후 매일 자정 증가분만큼 추가 보너스가 지급됩니다.</li>
        </ol>
        <div className="mt-4 p-3 bg-black rounded text-center border border-dashed border-gray-500">
          <span className="text-sub text-xs">설명란/스크린샷에 이 글자가 꼭 있어야 해요!</span>
          <div className="font-bold text-accent text-xl mt-1">{user.userCode}</div>
        </div>
      </div>

      <div className="input-group">
        <label className="input-label" htmlFor="sns-url">게시물 링크 (URL)</label>
        <input id="sns-url" type="url" className="login-input" placeholder="https://..." value={snsUrl} onChange={e => setSnsUrl(e.target.value)} />
      </div>

      <div className="input-group">
        <span className="input-label">업로드한 플랫폼</span>
        <div className="flex gap-2 mb-4" role="group" aria-label="플랫폼 선택">
          {['YouTube', 'Instagram', 'TikTok', 'X'].map(p => (
            <button key={p} aria-pressed={platform === p} onClick={() => setPlatform(p)} style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: platform === p ? '2px solid #f59e0b' : '1px solid #334155', background: 'transparent', color: 'white', cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
      </div>

      <div className="input-group">
        <label className="input-label" htmlFor="sns-shot">스크린샷 업로드</label>
        {img.preview && <img src={img.preview} alt="스크린샷 미리보기" style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #555' }} />}
        <input id="sns-shot" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={img.onChange} style={{ color: 'white' }} />
      </div>

      <button onClick={handleSubmit} disabled={loading} className="login-btn" style={{ background: loading ? '#334155' : '#f59e0b', color: 'black' }}>스크린샷 제출하고 300P 받기</button>
    </div>
  );
}

function MainQuestPage({ user, refreshUser }) {
  const [tab, setTab] = useState('ai');
  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '30px', marginBottom: '1.5rem' }}>
        <button onClick={() => setTab('ai')} className="login-btn" style={{ flex: 1, margin: 0, background: tab === 'ai' ? '#9333ea' : '#1e293b', color: 'white' }}>🤖 AI 밈 챌린지</button>
        <button onClick={() => setTab('sns')} className="login-btn" style={{ flex: 1, margin: 0, background: tab === 'sns' ? '#f59e0b' : '#1e293b', color: tab === 'sns' ? 'black' : 'white' }}>📢 SNS 바이럴</button>
      </div>
      {tab === 'ai' ? <AiQuestSection refreshUser={refreshUser} /> : <SnsQuestSection user={user} refreshUser={refreshUser} />}
    </div>
  );
}

function CreateEventForm({ onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', token_icon: '🏆', ends_at: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const handleCreate = async () => {
    if (!form.title || !form.ends_at) return alert('제목과 마감일을 입력해주세요.');
    try {
      await api('/api/events', { body: { ...form, ends_at: new Date(form.ends_at).toISOString() } });
      setForm({ title: '', description: '', token_icon: '🏆', ends_at: '' });
      onCreated();
    } catch (e) { alert(e.message); }
  };
  return (
    <details className="login-box mb-6">
      <summary className="font-bold cursor-pointer">👑 (관리자) 새 이벤트 만들기</summary>
      <div className="mt-4">
        <div className="input-group"><label className="input-label" htmlFor="ev-title">제목</label><input id="ev-title" className="login-input" value={form.title} onChange={set('title')} /></div>
        <div className="input-group"><label className="input-label" htmlFor="ev-desc">설명</label><input id="ev-desc" className="login-input" value={form.description} onChange={set('description')} /></div>
        <div className="flex gap-2">
          <div className="input-group" style={{width: '5rem', flexShrink: 0}}><label className="input-label whitespace-nowrap" htmlFor="ev-icon">아이콘</label><input id="ev-icon" className="login-input" value={form.token_icon} onChange={set('token_icon')} /></div>
          <div className="input-group flex-1" style={{minWidth: 0}}><label className="input-label" htmlFor="ev-end">마감일시</label><input id="ev-end" type="datetime-local" className="login-input" value={form.ends_at} onChange={set('ends_at')} /></div>
        </div>
        <button onClick={handleCreate} className="btn-action">이벤트 생성</button>
      </div>
    </details>
  );
}

function EventQuestPage({ user }) {
  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const fetchEvents = useCallback(() => api('/api/events').then(setEvents).catch((e) => alert(e.message)), []);
  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const selected = events.find((e) => e.id === selectedId);
  if (selected) return <EventDetailView event={selected} user={user} onBack={() => { setSelectedId(null); fetchEvents(); }} onChanged={fetchEvents} />;

  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
      {user.isAdmin && <CreateEventForm onCreated={fetchEvents} />}
      <h3 className="section-title"><CheckCircle color="#4ade80" /> 테마 이벤트</h3>
      <div className="events-grid mt-4">
        {events.map((evt) => (
          <div key={evt.id} className="event-card" onClick={() => setSelectedId(evt.id)} style={{cursor: 'pointer', opacity: evt.isOpen ? 1 : 0.7}}>
            <div className="event-header">
              <div className="flex items-center gap-2">
                <span style={{fontSize: '2rem'}}>{evt.tokenIcon}</span>
                <div><h4 className="font-bold">{evt.title}</h4><span className="badge badge-purple">{evt.tokenSymbol} 보상</span></div>
              </div>
              <span className="badge" style={{ backgroundColor: evt.isOpen ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: evt.isOpen ? '#4ade80' : '#ef4444', border: `1px solid ${evt.isOpen ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`}}>{evt.isOpen ? "진행중" : evt.settledAt ? "정산 완료" : "종료됨"}</span>
            </div>
            <p className="text-sub text-sm mb-4">{evt.description}</p>
            <div className="text-xs text-sub mb-4">📅 ~ {fmtDate(evt.endsAt)} 까지 · 참가작 {evt.entryCount}개</div>
            <button className="btn-action" style={{width:'100%', background: evt.isOpen ? 'var(--primary)' : '#334155'}}>{evt.isOpen ? "참여하기 →" : "결과 보기"}</button>
          </div>
        ))}
        {events.length === 0 && <div className="text-sub p-8">진행 중인 이벤트가 없습니다.</div>}
      </div>
    </div>
  );
}

function EventDetailView({ event, user, onBack, onChanged }) {
  const [entries, setEntries] = useState([]);
  const img = useImagePicker();
  const [loading, setLoading] = useState(false);
  const prizes = event.prizes || [5000, 3000, 1000];

  const fetchEntries = useCallback(() => {
    api(`/api/event-entries?event_id=${event.id}`).then(setEntries).catch((e) => alert(e.message));
  }, [event.id]);
  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleUpload = async () => {
    if (!img.file) return alert("작품을 선택해주세요!");
    setLoading(true);
    const formData = new FormData();
    formData.append('image', img.file);
    formData.append('event_id', event.id);
    try {
      const data = await api('/api/submit-event', { body: formData });
      alert(data.message); img.reset(); fetchEntries(); onChanged();
    } catch (err) { alert("업로드 실패: " + err.message); } finally { setLoading(false); }
  };

  const handleVote = async (id) => {
    try { await api('/api/like-image', { body: { submission_id: id } }); fetchEntries(); }
    catch (err) { alert(err.message); }
  };

  const handleReward = async () => {
    if (!window.confirm("현재 순위로 Top 3 보상을 지급하시겠습니까? (1회만 가능)")) return;
    try {
      const data = await api('/api/reward-event-winners', { body: { event_id: event.id } });
      alert("지급 완료!\n" + data.results.join("\n"));
      fetchEntries(); onChanged();
    } catch (err) { alert(err.message); }
  };

  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
      {loading && <LoadingOverlay message="작품을 제출하는 중입니다..." />}
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-sub link-btn">&larr; 목록으로</button>
        {user.isAdmin && !event.isOpen && !event.settledAt && <button onClick={handleReward} className="btn-action text-xs">👑 랭킹 정산</button>}
      </div>

      <div className="p-6 bg-gray-800 rounded-xl mb-8 text-center" style={{border: event.isOpen ? 'none' : '2px solid #ef4444'}}>
        <span style={{fontSize: '3rem', display:'block', marginBottom:'1rem'}}>{event.tokenIcon}</span>
        <h2 className="text-3xl font-bold mb-2">{event.title}</h2>
        <p className="text-gray-400 mb-4">{event.description}</p>

        <div className="mb-6 p-3 bg-gray-900 rounded-lg inline-block border border-yellow-500/30">
          <div className="text-yellow-400 font-bold text-sm mb-1">🏆 Top 3 보상 안내 (좋아요 순, 동점이면 먼저 출품한 순)</div>
          <div className="text-xs text-gray-300 flex flex-wrap gap-x-4 justify-center"><span className="whitespace-nowrap">🥇 1등: {prizes[0].toLocaleString()} P</span><span className="whitespace-nowrap">🥈 2등: {prizes[1].toLocaleString()} P</span><span className="whitespace-nowrap">🥉 3등: {prizes[2].toLocaleString()} P</span></div>
        </div>

        <div className="mb-6 text-sm font-bold" style={{color: event.isOpen ? '#4ade80' : '#ef4444'}}>{event.isOpen ? `📅 마감일: ${fmtDate(event.endsAt)} 까지` : `🚫 이 이벤트는 종료되었습니다 (${fmtDate(event.endsAt)} 마감)${event.settledAt ? ' · 정산 완료' : ''}`}</div>
        {event.isOpen ? (
          <div className="login-box" style={{maxWidth: '500px', margin: '0 auto'}}>
            <h4 className="font-bold mb-2">내 작품 출품하기 (1인 1작품)</h4>
            {img.preview && <img src={img.preview} alt="출품작 미리보기" style={{width:'100%', height:'200px', objectFit:'cover', borderRadius:'8px', marginBottom:'1rem'}} />}
            <div className="flex gap-2">
              <label className="btn-action flex-1 text-center cursor-pointer" style={{background:'#334155'}}><input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={img.onChange} /><Upload style={{display:'inline', marginRight:'5px'}} /> 이미지 선택</label>
              <button onClick={handleUpload} className="btn-action flex-1">출품하기</button>
            </div>
          </div>
        ) : (<div className="p-4 bg-gray-900 rounded text-sub">참여 기간이 지났습니다. 다른 참가자들의 작품을 감상해주세요!</div>)}
      </div>
      <h3 className="section-title mb-4"><Heart color="#f43f5e" /> 출품작 갤러리 (Top 3는 보상 지급!)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {entries.map((entry, idx) => (
          <div key={entry.id} className="event-card" style={{ padding: 0, overflow: 'hidden', position:'relative' }}>
            {idx < 3 && <div className="absolute top-2 left-2 badge badge-purple">Top {idx+1}</div>}
            <img src={imgUrl(entry.imageUrl)} alt={`${entry.user?.nickname}의 출품작`} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span className="text-sm font-bold">{entry.user?.nickname}</span>
              <button onClick={() => handleVote(entry.id)} disabled={!event.isOpen} aria-label={`좋아요 ${entry.likes}개`} className="btn-action" style={{padding:'5px 12px', minHeight: '32px', fontSize:'12px', background: entry.isLiked ? '#f43f5e' : '#475569'}}>♥ {entry.likes}</button>
            </div>
          </div>
        ))}
        {entries.length === 0 && <div className="text-center text-sub p-8" style={{gridColumn: '1 / -1'}}>아직 출품작이 없습니다.</div>}
      </div>
    </div>
  );
}

function GalleryPage() {
  const [images, setImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [comment, setComment] = useState('');

  const fetchImages = useCallback(() => api('/api/gallery').then(setImages).catch((e) => alert(e.message)), []);
  useEffect(() => { fetchImages(); }, [fetchImages]);
  const selectedImg = images.find((img) => img.id === selectedId);

  const handleLike = async (id, e) => {
    e.stopPropagation();
    try { await api('/api/like-image', { body: { submission_id: id } }); fetchImages(); }
    catch (err) { alert(err.message); }
  };
  const handleComment = async () => {
    if (!comment.trim()) return;
    try { await api('/api/comment', { body: { submission_id: selectedId, content: comment } }); setComment(''); fetchImages(); }
    catch (err) { alert(err.message); }
  };

  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
      <h3 className="section-title"><Image color="#f472b6" /> 전체 밈 갤러리</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {images.map(img => (
          <div key={img.id} className="event-card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setSelectedId(img.id)}>
            <img src={imgUrl(img.imageUrl)} alt={img.quest?.title || '밈'} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '1rem' }}>
              <div className="font-bold text-sm mb-1">{img.quest?.title || "자유 밈"}</div>
              <div className="flex justify-between items-center text-xs text-sub">
                <span>by {img.user?.nickname}</span>
                <button onClick={(e) => handleLike(img.id, e)} aria-label={`좋아요 ${img.likeCount}개`} className="flex items-center gap-1" style={{ background: 'none', border: 'none', cursor: 'pointer', color: img.isLiked ? '#f43f5e' : 'white', minHeight: '32px', minWidth: '40px', justifyContent: 'flex-end' }}>
                  <Heart size={14} fill={img.isLiked ? "currentColor" : "none"} /> {img.likeCount}
                </button>
              </div>
            </div>
          </div>
        ))}
        {images.length === 0 && <div className="text-sub p-8">아직 갤러리에 작품이 없습니다.</div>}
      </div>
      {selectedImg && (
        <div role="dialog" aria-modal="true" style={{position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'}} onClick={() => setSelectedId(null)}>
          <div style={{background: '#1e293b', padding: '1.5rem', borderRadius: '1rem', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
            <img src={imgUrl(selectedImg.imageUrl)} alt={selectedImg.quest?.title || '밈'} style={{width: '100%', borderRadius: '0.5rem'}} />
            <div className="mt-4 font-bold text-lg">{selectedImg.quest?.title}</div>
            <p className="text-sub text-sm mb-4">작성자: {selectedImg.user?.nickname}</p>
            <div className="mb-4 p-4 bg-gray-800 rounded">
              <div className="text-sm font-bold mb-2">댓글 ({selectedImg.comments?.length || 0})</div>
              {selectedImg.comments?.map(c => (<div key={c.id} className="text-xs mb-1"><span className="text-accent">{c.user.nickname}:</span> {c.content}</div>))}
            </div>
            <div className="flex gap-2">
              <input className="login-input" aria-label="댓글 입력" placeholder="댓글 입력..." maxLength={500} value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment()} />
              <button onClick={handleComment} className="btn-action">등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RankingPage({ user }) {
  const [rankings, setRankings] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const load = useCallback(() => {
    api('/api/rankings').then(setRankings).catch((e) => alert(e.message));
    api('/api/my-rank').then(setMyRank).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);
  const handleReset = async () => {
    if (!window.confirm('주간 랭킹을 지금 초기화할까요?')) return;
    try { alert((await api('/api/reset-ranking', { method: 'POST' })).message); load(); } catch (e) { alert(e.message); }
  };
  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="section-title"><Trophy color="#facc15" /> 주간 명예의 전당 (매주 월요일 초기화)</h3>
        {user.isAdmin && <button onClick={handleReset} className="btn-action text-xs" style={{background:'#334155'}}>↻ 랭킹 초기화</button>}
      </div>
      {myRank && <div className="stat-card primary mb-4 flex justify-between items-center"><span>내 순위 <strong className="text-2xl">{myRank.rank}위</strong></span><span className="font-bold text-accent">{myRank.points.toLocaleString()} 점</span></div>}
      <div className="login-box" style={{ padding: '1rem', marginTop: '1rem' }}>
        {rankings.map((ranker, index) => (
          <div key={ranker.userCode} className="flex items-center justify-between" style={{ padding: '1rem', borderBottom: '1px solid #334155' }}>
            <div className="flex items-center gap-4"><span className="font-bold" style={{ fontSize: '1.2rem', color: index < 3 ? '#facc15' : 'white', width: '20px' }}>{index + 1}</span><div><div className="font-bold">{ranker.nickname}</div><div className="text-xs text-sub">{ranker.userCode}</div></div></div>
            <div className="font-bold text-accent whitespace-nowrap">{(ranker.weeklyPoints || 0).toLocaleString()} 점</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExchangePage({ user, refreshUser }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSwap = async () => {
    const n = Number(amount);
    if (!Number.isInteger(n) || n <= 0) return alert("1 이상의 정수를 입력해주세요.");
    if (n > user.points) return alert("보유 포인트가 부족합니다.");
    setLoading(true);
    try {
      const data = await api('/api/swap-to-token', { body: { amount: n } });
      alert(`✅ 성공! ${n} $MQ 전송 (TX: ${data.txHash.slice(0, 10)}...)`);
      setAmount('');
    } catch(err) { alert("❌ " + err.message); } finally { setLoading(false); refreshUser(); }
  };
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {loading && <LoadingOverlay message="블록체인 승인 대기중... (최대 10초)" />}
      <h3 className="section-title"><RefreshCw color="#4ade80" /> 환전소 (1P = 1 $MQ)</h3>
      <div className="stat-card primary" style={{marginBottom:'2rem'}}><div className="text-4xl font-bold">{user.points.toLocaleString()} P</div><div className="text-xs text-sub mt-1">받는 지갑: {user.walletAddress || '없음'}</div></div>
      <div className="login-box">
        <label className="input-label" htmlFor="swap-amount">환전할 포인트</label>
        <input id="swap-amount" type="number" min="1" step="1" max={user.points} className="login-input" value={amount} onChange={e => setAmount(e.target.value)} />
        <button onClick={handleSwap} disabled={loading} className="login-btn mt-4">전송</button>
      </div>
    </div>
  );
}

function ProfilePage({ user, refreshUser }) {
  const [nickname, setNickname] = useState(user.nickname);
  const [wallet, setWallet] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const needsCurrent = !!(wallet || password);
  const handleUpdate = async () => {
    if (needsCurrent && !currentPassword) return alert("지갑/비밀번호 변경 시 현재 비밀번호를 입력해주세요.");
    if (!window.confirm("정말 수정하시겠습니까? (닉네임은 월 1회 제한)")) return;
    try {
      await api('/api/update-profile', { body: { nickname: nickname !== user.nickname ? nickname : undefined, wallet_address: wallet || undefined, password: password || undefined, current_password: currentPassword || undefined } });
      alert("프로필이 업데이트되었습니다!");
      setWallet(''); setPassword(''); setCurrentPassword('');
      refreshUser();
    } catch (err) { alert("오류: " + err.message); }
  };
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h3 className="section-title"><Settings color="#e2e8f0" /> 내 정보 수정</h3>
      <div className="login-box">
        <div className="input-group"><label className="input-label" htmlFor="pf-id">아이디</label><input id="pf-id" type="text" className="login-input" value={user.loginId} readOnly disabled style={{ opacity: 0.7, cursor: 'not-allowed', background: '#334155' }} /></div>
        <div className="input-group"><label className="input-label" htmlFor="pf-cur-wallet">현재 연결된 지갑 주소</label><input id="pf-cur-wallet" type="text" className="login-input" value={user.walletAddress || "등록된 지갑 없음"} readOnly disabled style={{ opacity: 0.7, cursor: 'not-allowed', background: '#334155', fontSize: '0.9rem' }} /></div>
        <hr style={{ borderColor: '#334155', margin: '1.5rem 0' }} />
        <div className="input-group"><label className="input-label" htmlFor="pf-nick">닉네임 변경 (월 1회 가능, 변경 시 고유 코드도 바뀝니다)</label><input id="pf-nick" type="text" maxLength={20} className="login-input" value={nickname} onChange={e => setNickname(e.target.value)} /></div>
        <div className="input-group"><label className="input-label" htmlFor="pf-wallet">지갑 주소 변경 (새로운 주소 입력)</label><input id="pf-wallet" type="text" className="login-input" placeholder="변경할 경우에만 0x... 주소 입력" value={wallet} onChange={e => setWallet(e.target.value)} /></div>
        <div className="input-group"><label className="input-label" htmlFor="pf-pw">새 비밀번호 (8자 이상)</label><input id="pf-pw" type="password" autoComplete="new-password" className="login-input" placeholder="변경할 경우만 입력" value={password} onChange={e => setPassword(e.target.value)} /></div>
        {needsCurrent && <div className="input-group"><label className="input-label" htmlFor="pf-cur-pw">현재 비밀번호 (지갑/비밀번호 변경 시 필수)</label><input id="pf-cur-pw" type="password" autoComplete="current-password" className="login-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></div>}
        <button onClick={handleUpdate} className="login-btn mt-4">저장하기</button>
      </div>
    </div>
  );
}

const LEDGER_LABEL = { AI_QUEST: 'AI 밈 챌린지', SNS: 'SNS 인증', SNS_BONUS: 'SNS 조회수 보너스', EVENT_PRIZE: '이벤트 상금', SWAP: '토큰 환전', SWAP_REFUND: '환전 실패 환불' };
const LEDGER_STATUS = { PENDING: '⏳ 처리중', FAILED: '❌ 실패' };

function PointHistoryPage() {
  const [history, setHistory] = useState(null);
  useEffect(() => { api('/api/point-history').then(setHistory).catch((e) => alert(e.message)); }, []);

  const Card = ({ title, children }) => (
    <div style={{ background: '#1e293b', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #334155' }}>
      <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>{title}</h4>{children}
    </div>
  );

  if (!history) return <div className="text-center p-8">데이터를 불러오는 중...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h3 className="section-title mb-6"><Star color="#fbbf24" /> 포인트 획득 내역</h3>
      <Card title={<><CheckCircle size={20} color="#c084fc"/> AI 밈 챌린지</>}>
        <div className="flex justify-between items-center"><span className="text-sub">지금까지 AI 검사를 통과하여 얻은 총 수익</span><span className="text-2xl font-bold text-accent whitespace-nowrap">{history.aiTotal.toLocaleString()} P</span></div>
      </Card>
      <Card title={<><Flame size={20} color="#f472b6"/> SNS 바이럴 수익</>}>
        {history.snsList.length === 0 ? <div className="text-sub text-sm">내역이 없습니다.</div> : (
          <div className="flex flex-col gap-3">
            {history.snsList.map(item => (
              <div key={item.id} className="p-3 bg-gray-900 rounded flex justify-between items-center">
                <div style={{overflow:'hidden', flex: 1}}>
                  <div className="font-bold text-sm mb-1 text-white">{item.platform} 업로드</div>
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate block hover:underline">{item.url}</a>
                  <div className="text-xs text-sub mt-1">👀 {item.views.toLocaleString()}회 / ♥ {item.likes.toLocaleString()}개</div>
                </div>
                <div className="text-right whitespace-nowrap"><div className="font-bold text-green-400">+{item.earnedPoints.toLocaleString()} P</div><div className="text-xs text-sub" style={{fontSize:'10px'}}>매일 자정 갱신됨</div></div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card title={<><Trophy size={20} color="#4ade80"/> 테마 이벤트 보상</>}>
        {history.eventList.length === 0 ? <div className="text-sub text-sm">참여 내역이 없습니다.</div> : (
          <div className="flex flex-col gap-3">
            {history.eventList.map(item => (
              <div key={item.id} className="flex justify-between items-center p-2 border-b border-gray-700">
                <span className="text-white">{item.title}</span><span className="font-bold text-green-400 whitespace-nowrap">+{item.earnedPoints.toLocaleString()} P</span>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card title={<><ListIcon size={20} color="#94a3b8"/> 전체 포인트 원장 (최근 100건)</>}>
        {history.ledger.length === 0 ? <div className="text-sub text-sm">내역이 없습니다.</div> : (
          <div className="flex flex-col">
            {history.ledger.map(l => (
              <div key={l.id} className="flex justify-between items-center p-2 border-b border-gray-700 text-sm">
                <div>
                  <div className="text-white">{LEDGER_LABEL[l.reason] || l.reason} {LEDGER_STATUS[l.status] && <span className="text-xs text-sub">{LEDGER_STATUS[l.status]}</span>}</div>
                  <div className="text-xs text-sub">{new Date(l.createdAt).toLocaleString('ko-KR')}{l.txHash && ` · TX ${l.txHash.slice(0, 10)}...`}</div>
                </div>
                <span className={`font-bold whitespace-nowrap ${l.amount > 0 ? 'text-green-400' : 'text-gray-400'}`}>{l.amount > 0 ? '+' : ''}{l.amount.toLocaleString()} P</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/** utf-8 문자열 → 0x hex (personal_sign 파라미터) */
const toHex = (s) => '0x' + Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, '0')).join('');

function LoginScreen({ onSession }) {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({ id: '', password: '', nickname: '', walletAddress: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setFormData({ ...formData, [k]: e.target.value });

  const run = async (fn) => {
    setBusy(true);
    try { onSession(await fn()); } catch (err) { alert(err.message); } finally { setBusy(false); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { id, password, nickname, walletAddress } = formData;
    if (!id || !password) return alert("아이디와 비밀번호를 입력해주세요.");
    if (isSignup) {
      if (password.length < 8) return alert("비밀번호는 8자 이상이어야 합니다.");
      if (!nickname) return alert("닉네임을 입력해주세요.");
      if (!walletAddress) return alert("지갑 주소를 입력해주세요.");
    }
    run(() => isSignup
      ? api('/api/register', { body: { login_id: id, password, nickname, wallet_address: walletAddress } })
      : api('/api/login', { body: { login_id: id, password } }));
  };

  const connectWallet = async () => {
    if (!window.ethereum) throw new Error('MetaMask 등 지갑 확장 프로그램이 필요합니다.');
    const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return address;
  };

  // 지갑 서명 로그인 (Sign-In with Ethereum)
  const handleWalletLogin = () => run(async () => {
    const address = await connectWallet();
    const { message } = await api(`/api/auth/nonce?address=${address}`);
    const signature = await window.ethereum.request({ method: 'personal_sign', params: [toHex(message), address] });
    return api('/api/login-wallet', { body: { address, signature } });
  });

  const fillWallet = async () => {
    try { setFormData({ ...formData, walletAddress: await connectWallet() }); } catch (err) { alert(err.message); }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-logo-section"><div className="login-logo-box"><span>M</span></div><h1 className="font-bold" style={{fontSize: '2rem', margin: '0'}}>MemeQuest</h1><p className="text-sub">{isSignup ? "새로운 계정을 생성하세요." : "로그인하여 퀘스트를 시작하세요."}</p></div>
        <form className="login-box" onSubmit={handleSubmit}>
          <div className="input-group"><label className="input-label" htmlFor="lg-id">아이디</label><input id="lg-id" type="text" autoComplete="username" className="login-input" placeholder="ID 입력" value={formData.id} onChange={set('id')} /><p className="text-xs text-gray-500 mt-1">영문/숫자/_ 3~30자</p></div>
          <div className="input-group"><label className="input-label" htmlFor="lg-pw">비밀번호</label><input id="lg-pw" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} className="login-input" placeholder="비밀번호 입력" value={formData.password} onChange={set('password')} />{isSignup && <p className="text-xs text-gray-500 mt-1">8자 이상 입력하세요.</p>}</div>
          {isSignup && (<>
            <div className="input-group"><label className="input-label" htmlFor="lg-nick">닉네임</label><input id="lg-nick" type="text" maxLength={20} className="login-input" placeholder="사용할 닉네임" value={formData.nickname} onChange={set('nickname')} /><p className="text-xs text-gray-500 mt-1">서비스 내에서 보여질 이름입니다.</p></div>
            <div className="input-group"><label className="input-label" htmlFor="lg-wallet">지갑 주소</label>
              <div className="flex gap-2"><input id="lg-wallet" type="text" className="login-input" placeholder="0x..." value={formData.walletAddress} onChange={set('walletAddress')} /><button type="button" onClick={fillWallet} className="btn-action text-xs" style={{whiteSpace:'nowrap'}}>🦊 연결</button></div>
              <p className="text-xs text-gray-500 mt-1">보상($MQ)을 받을 지갑 주소입니다. 이 지갑으로 서명 로그인도 할 수 있습니다.</p></div>
          </>)}
          <button type="submit" disabled={busy} className="login-btn" style={{marginTop: '1rem'}}>{isSignup ? "회원가입 완료" : "로그인"}</button>
          {!isSignup && <button type="button" disabled={busy} onClick={handleWalletLogin} className="login-btn" style={{background:'#f59e0b'}}>🦊 지갑으로 로그인</button>}
          <div className="text-center mt-4 text-sm"><span className="text-sub">{isSignup ? "이미 계정이 있나요?" : "아직 계정이 없나요?"} </span><button type="button" onClick={() => setIsSignup(!isSignup)} className="text-accent font-bold link-btn">{isSignup ? "로그인하기" : "회원가입하기"}</button></div>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ user, changeTab }) {
  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
      <div className="dashboard-grid">
        <div className="stat-card"><div className="text-sub text-sm">이번 주 획득 점수</div><div className="text-3xl font-bold">{user.weeklyPoints.toLocaleString()} 점</div><button onClick={() => changeTab('ranking')} style={{marginTop:'1rem', background:'rgba(255,255,255,0.1)', border:'none', color:'white', padding:'0.5rem', borderRadius:'0.5rem', cursor:'pointer'}}>랭킹 보기</button></div>
        <div className="stat-card primary"><div className="text-sub text-sm">내 포인트</div><div className="text-3xl font-bold">{user.points.toLocaleString()} P</div><button onClick={() => changeTab('exchange')} style={{marginTop:'1rem', background:'rgba(255,255,255,0.1)', border:'none', color:'white', padding:'0.5rem', borderRadius:'0.5rem', cursor:'pointer'}}>환전</button></div>
      </div>
    </div>
  );
}

export default function MemeQuestApp() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(() => !!localStorage.getItem(TOKEN_KEY));
  const [activeTab, setActiveTab] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logout = useCallback(() => { localStorage.removeItem(TOKEN_KEY); setUser(null); setActiveTab('home'); }, []);
  onUnauthorized = logout;
  const refreshUser = useCallback(() => api('/api/me').then(setUser).catch(() => {}), []);
  const onSession = ({ token, user }) => { localStorage.setItem(TOKEN_KEY, token); setUser(user); };

  // 새로고침해도 로그인 유지
  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY)) refreshUser().finally(() => setBooting(false));
  }, [refreshUser]);

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(user.userCode); alert('복사됨'); } catch { alert('복사 실패: 직접 선택해서 복사해주세요.'); }
  };

  if (booting) return <LoadingOverlay message="로그인 정보 확인 중..." />;
  if (!user) return <LoginScreen onSession={onSession} />;

  const go = (tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); };
  return (
    <div className="app-container">
      <div className="mobile-header"><div className="brand-text">MemeQuest</div><button aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{background:'none', border:'none', color:'white'}}>{isMobileMenuOpen ? <X /> : <Menu />}</button></div>
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand"><div className="brand-icon">M</div><span className="brand-text">MemeQuest</span></div>
        <nav className="nav-menu">
          <NavItem icon={<Flame />} label="대시보드" active={activeTab === 'home'} onClick={() => go('home')} />
          <NavItem icon={<Star />} label="메인 퀘스트" active={activeTab === 'main-quest'} onClick={() => go('main-quest')} />
          <NavItem icon={<CheckCircle />} label="이벤트 퀘스트" active={activeTab === 'event-quest'} onClick={() => go('event-quest')} />
          <NavItem icon={<Image />} label="밈 갤러리" active={activeTab === 'gallery'} onClick={() => go('gallery')} />
          <NavItem icon={<Trophy />} label="주간 랭킹" active={activeTab === 'ranking'} onClick={() => go('ranking')} />
          <NavItem icon={<ListIcon />} label="포인트 내역" active={activeTab === 'history'} onClick={() => go('history')} />
          <NavItem icon={<RefreshCw />} label="토큰 교환소" active={activeTab === 'exchange'} onClick={() => go('exchange')} />
          <NavItem icon={<Settings />} label="내 정보 수정" active={activeTab === 'profile'} onClick={() => go('profile')} />
        </nav>
        <div className="user-code-box">
          <div className="text-xs text-sub mb-1">내 고유 식별 코드</div>
          <div className="font-bold text-accent flex justify-between items-center gap-2"><span style={{wordBreak: 'break-all', minWidth: 0, fontSize: '0.9rem'}}>{user.userCode}</span><button onClick={copyCode} className="badge badge-purple" style={{cursor: 'pointer', border: 'none', flexShrink: 0}}>복사</button></div>
        </div>
        <div className="sidebar-footer">
          <div className="flex items-center gap-2">
            <User size={24} color="#94a3b8" />
            <div style={{flex: 1}}><div className="font-bold text-sm">{user.nickname}</div><div className="text-xs text-sub">{user.isAdmin ? '👑 관리자' : `${user.points.toLocaleString()} P 보유`}</div></div>
            <button onClick={logout} className="flex items-center gap-1 text-xs text-sub hover:text-white whitespace-nowrap" style={{background:'none', border:'none', cursor:'pointer', minHeight: '32px'}}><LogOut size={16} /> 로그아웃</button>
          </div>
        </div>
      </aside>
      <main className="main-content">
        {activeTab === 'home' && <Dashboard user={user} changeTab={go} />}
        {activeTab === 'main-quest' && <MainQuestPage user={user} refreshUser={refreshUser} />}
        {activeTab === 'event-quest' && <EventQuestPage user={user} />}
        {activeTab === 'gallery' && <GalleryPage />}
        {activeTab === 'ranking' && <RankingPage user={user} />}
        {activeTab === 'history' && <PointHistoryPage />}
        {activeTab === 'exchange' && <ExchangePage user={user} refreshUser={refreshUser} />}
        {activeTab === 'profile' && <ProfilePage user={user} refreshUser={refreshUser} />}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return <button onClick={onClick} aria-current={active ? 'page' : undefined} className={`nav-item ${active ? 'active' : ''}`}>{React.cloneElement(icon, { size: 20 })}<span className="font-medium">{label}</span></button>;
}
