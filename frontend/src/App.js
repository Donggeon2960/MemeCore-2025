import React, { useState, useEffect } from 'react';
import './App.css';

// --- 아이콘 컴포넌트 ---
const Icon = ({ children, size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} {...props}>{children}</svg>
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

const MAIN_COIN = { symbol: "$MQ", name: "밈퀘스트 코인", price: 1540, change: "+5.4%" };
const WEEKLY_EVENTS = [
  { 
    id: 101, theme: "슬픈 개구리 (페페)", tokenSymbol: "PEPE", tokenIcon: "🐸", tokenPrice: 65, description: "가장 슬픈 개구리 밈을 만들어주세요! 웃픈 사연 대환영!", endDate: "2025-12-31", 
  },
  { 
    id: 102, theme: "도지 투 더 문", tokenSymbol: "DOGE", tokenIcon: "🐕", tokenPrice: 98, description: "도지코인 화성 갈끄니까~ 관련 밈이나 영상을 올려주세요.", endDate: "2024-12-01", 
  }
];

function LoadingOverlay({ message }) {
  return (
    <div className="loading-overlay">
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

function AiQuestSection({ user, onUpdateUser }) {
  const [quests, setQuests] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");

  const fetchQuests = () => { fetch(`http://localhost:3000/api/my-quests?login_id=${user.username}`).then(res => res.json()).then(setQuests); };
  useEffect(() => { fetchQuests(); }, [user.username]);

  const handleGenerate = async () => {
    setLoading(true);
    setLoadingMsg("AI가 새로운 퀘스트를 생성 중입니다...");
    try {
      const res = await fetch('http://localhost:3000/api/generate-quest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login_id: user.username })
      });
      if (!res.ok) throw new Error();
      await fetchQuests();
      alert("새로운 AI 퀘스트가 생성되었습니다!");
    } catch (err) { alert("생성 실패"); } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!file || !selectedQuest) return alert("파일 선택 필요");
    setLoading(true);
    setLoadingMsg("AI가 밈을 분석하고 점수를 매기는 중...");
    const formData = new FormData();
    formData.append('image', file);
    formData.append('login_id', user.username);
    formData.append('quest_id', selectedQuest.id);
    try {
      const res = await fetch('http://localhost:3000/api/verify-meme', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.isPass) {
        alert(`🎉 통과! +${selectedQuest.rewardPoints}P`);
        onUpdateUser({ ...user, wallet: { ...user.wallet, mq: user.wallet.mq + selectedQuest.rewardPoints } });
        setSelectedQuest(null);
      } else alert(`😢 불합격 (점수: ${data.score})`);
    } catch(err) { alert("오류"); } finally { setLoading(false); }
  };

  if (selectedQuest) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {loading && <LoadingOverlay message={loadingMsg} />}
        <button onClick={() => setSelectedQuest(null)} className="text-sub mb-4">&larr; 목록으로 돌아가기</button>
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
          {preview ? <img src={preview} alt="" style={{width:'100%', borderRadius:'8px', marginBottom:'1rem', border:'1px solid #555'}} /> : <div className="text-center p-8 border border-dashed border-gray-500 rounded-lg text-sub mb-4">이미지를 선택하면 미리보기가 표시됩니다.</div>}
          <input type="file" accept="image/*" onChange={e => {setFile(e.target.files[0]); setPreview(URL.createObjectURL(e.target.files[0]))}} style={{color:'white', marginBottom:'1rem'}} />
          <button onClick={handleSubmit} disabled={loading} className="login-btn">제출하고 검사받기</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {loading && <LoadingOverlay message={loadingMsg} />}
      <div className="flex justify-between items-center mb-6">
        <h3 className="section-title"><CheckCircle color="#c084fc" /> AI 퀘스트</h3>
        <button onClick={handleGenerate} disabled={loading} className="login-btn" style={{width:'auto', margin:0, padding:'0.5rem'}}>+ 생성</button>
      </div>
      <div className="events-grid">
        {quests.map(q => <QuestCard key={q.id} quest={q} onClick={() => setSelectedQuest(q)} />)}
      </div>
    </div>
  );
}

// App.js 내부 SnsQuestSection

function SnsQuestSection({ user, onUpdateUser }) {
  const [file, setFile] = useState(null);
  const [snsUrl, setSnsUrl] = useState('');
  const [preview, setPreview] = useState(null);
  const [platform, setPlatform] = useState('YouTube');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) return alert("스크린샷을 업로드해주세요!");
    if (!snsUrl) return alert("게시물 URL을 입력해주세요!");

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('login_id', user.username);
    formData.append('platform', platform);
    formData.append('sns_url', snsUrl);

    try {
      const res = await fetch('http://localhost:3000/api/submit-social', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.status === 'success') {
        alert(`🎉 인증 성공! +${data.reward}P\n(${data.bonusDetail || '기본 보상'})`);
        onUpdateUser({ ...user, wallet: { ...user.wallet, mq: user.wallet.mq + data.reward } });
        setFile(null);
        setPreview(null);
        setSnsUrl('');
      } else {
        alert(`😢 인증 실패: ${data.reason || data.message}`);
      }
    } catch (err) { alert("서버 오류"); } finally { setLoading(false); }
  };

  return (
    <div className="login-box" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {loading && <LoadingOverlay message="AI가 스크린샷 및 데이터를 분석 중입니다..." />}
      <h3 className="font-bold text-xl mb-4">SNS 공유 인증 (AI 자동 검사)</h3>
      
      {/* [NEW] 창작 & 리믹스 선택 안내 섹션 */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* 옵션 1: 창작 */}
        <div style={{ flex: 1, background: 'rgba(147, 51, 234, 0.1)', border: '1px solid #9333ea', borderRadius: '1rem', padding: '1.5rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✨</div>
          <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#c084fc' }}>자신만의 밈 만들기</h4>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
            당신의 기발한 아이디어로<br/>오리지널 영상을 만들어<br/>SNS에 올려주세요!
          </p>
        </div>

        {/* 옵션 2: 리믹스 */}
        <div style={{ flex: 1, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '1rem', padding: '1.5rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🧬</div>
          <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#fbbf24' }}>기존 밈 리믹스</h4>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
            유행하는 밈 소스를<br/>내 스타일로 패러디해서<br/>SNS에 올려주세요!
          </p>
        </div>
      </div>

      {/* 미션 가이드 (기존 유지) */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
        <div className="text-sm text-sub mb-2">💡 미션 가이드</div>
        <ol className="text-sm space-y-2 pl-4 text-gray-300">
          <li>위 주제 중 하나를 골라 SNS(유튜브 등)에 업로드하세요.</li>
          <li>설명란에 <strong>내 고유 코드</strong>를 꼭 적어주세요.</li>
          <li><strong>코드가 보이는 화면을 캡처(스크린샷)</strong>해서 업로드하세요.</li>
        </ol>
        <div className="mt-4 p-3 bg-black rounded text-center border border-dashed border-gray-500">
          <span className="text-sub text-xs">스크린샷에 이 글자가 꼭 있어야 해요!</span>
          <div className="font-bold text-accent text-xl mt-1">{user.code}</div>
        </div>
      </div>

      {/* 입력 폼 (기존 유지) */}
      <div className="input-group">
        <label className="input-label">게시물 링크 (URL)</label>
        <input type="text" className="login-input" placeholder="https://..." value={snsUrl} onChange={e => setSnsUrl(e.target.value)} />
      </div>

      <div className="input-group">
        <label className="input-label">업로드한 플랫폼</label>
        <div className="flex gap-2 mb-4">
          {['YouTube', 'Instagram', 'TikTok', 'X'].map(p => (
            <button key={p} onClick={() => setPlatform(p)} style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: platform === p ? '2px solid #f59e0b' : '1px solid #334155', background: 'transparent', color: 'white', cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">스크린샷 업로드</label>
        {preview && <img src={preview} alt="Preview" style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #555' }} />}
        <input type="file" accept="image/*" onChange={(e) => {setFile(e.target.files[0]); setPreview(URL.createObjectURL(e.target.files[0]))}} style={{ color: 'white' }} />
      </div>

      <button onClick={handleSubmit} disabled={loading} className="login-btn" style={{ background: loading ? '#334155' : '#f59e0b', color: 'black' }}>스크린샷 제출하고 300P 받기</button>
    </div>
  );
}

function MainQuestPage({ user, onUpdateUser }) {
  const [tab, setTab] = useState('ai');
  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '30px', marginBottom: '1.5rem' }}>
        <button onClick={() => setTab('ai')} className="login-btn" style={{ flex: 1, margin: 0, background: tab === 'ai' ? '#9333ea' : '#1e293b', color: 'white' }}>🤖 AI 밈 챌린지</button>
        <button onClick={() => setTab('sns')} className="login-btn" style={{ flex: 1, margin: 0, background: tab === 'sns' ? '#f59e0b' : '#1e293b', color: tab === 'sns' ? 'black' : 'white' }}>📢 SNS 바이럴</button>
      </div>
      {tab === 'ai' ? <AiQuestSection user={user} onUpdateUser={onUpdateUser} /> : <SnsQuestSection user={user} onUpdateUser={onUpdateUser} />}
    </div>
  );
}

function EventQuestPage({ user }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (!selectedEvent) {
    return (
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <h3 className="section-title"><CheckCircle color="#4ade80" /> 진행 중인 테마 이벤트</h3>
        <div className="events-grid mt-4">
          {WEEKLY_EVENTS.map((evt) => {
            const isExpired = new Date() > new Date(evt.endDate);
            return (
              <div key={evt.id} className="event-card" onClick={() => setSelectedEvent(evt)} style={{cursor: 'pointer', opacity: isExpired ? 0.7 : 1}}>
                <div className="event-header">
                  <div className="flex items-center gap-2">
                    <span style={{fontSize: '2rem'}}>{evt.tokenIcon}</span>
                    <div><h4 className="font-bold">{evt.theme}</h4><span className="badge badge-purple">{evt.tokenSymbol} 보상</span></div>
                  </div>
                  <span className="badge" style={{ backgroundColor: isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(74, 222, 128, 0.1)', color: isExpired ? '#ef4444' : '#4ade80', border: `1px solid ${isExpired ? 'rgba(239, 68, 68, 0.2)' : 'rgba(74, 222, 128, 0.2)'}`}}>{isExpired ? "종료됨" : "진행중"}</span>
                </div>
                <p className="text-sub text-sm mb-4">{evt.description}</p>
                <div className="text-xs text-sub mb-4">📅 ~ {evt.endDate} 까지</div>
                <button className="btn-action" style={{width:'100%', background: isExpired ? '#334155' : 'var(--primary)'}}>{isExpired ? "결과 보기" : "참여하기 →"}</button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return <EventDetailView event={selectedEvent} user={user} onBack={() => setSelectedEvent(null)} />;
}

function EventDetailView({ event, user, onBack }) {
  const [entries, setEntries] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const isExpired = new Date() > new Date(event.endDate);

  const fetchEntries = () => {
    fetch(`http://localhost:3000/api/event-entries?event_id=${event.id}`)
      .then(res => res.json()).then(setEntries).catch(console.error);
  };
  useEffect(() => { fetchEntries(); }, [event.id]);

  const handleUpload = async () => {
    if (!file) return alert("작품을 선택해주세요!");
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('login_id', user.username);
    formData.append('event_id', event.id);

    try {
      const res = await fetch('http://localhost:3000/api/submit-event', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.status === 'success') {
        alert(data.message); setFile(null); setPreview(null); fetchEntries(); 
      } else alert("업로드 실패: " + data.message);
    } catch (err) { alert("오류 발생"); } finally { setLoading(false); }
  };

  const handleVote = async (id) => {
    await fetch('http://localhost:3000/api/like-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login_id: user.username, submission_id: id }) });
    fetchEntries();
  };

  // [NEW] 랭킹 정산 버튼 핸들러
  const handleReward = async () => {
    if (!window.confirm("현재 순위로 Top 3 보상을 지급하시겠습니까?")) return;
    try {
      const res = await fetch('http://localhost:3000/api/reward-event-winners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_id: event.id }) });
      const data = await res.json();
      alert("지급 완료!\n" + data.results.join("\n"));
      fetchEntries();
    } catch (err) { alert("오류 발생"); }
  };

  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
      {loading && <LoadingOverlay message="작품을 제출하는 중입니다..." />}
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-sub">&larr; 목록으로</button>
        <button onClick={handleReward} style={{opacity: 0.2, fontSize: '0.8rem', cursor:'pointer', background:'none', border:'none', color:'white'}}>👑 랭킹 정산</button>
      </div>
      
      <div className="p-6 bg-gray-800 rounded-xl mb-8 text-center" style={{border: isExpired ? '2px solid #ef4444' : 'none'}}>
        <span style={{fontSize: '3rem', display:'block', marginBottom:'1rem'}}>{event.tokenIcon}</span>
        <h2 className="text-3xl font-bold mb-2">{event.theme} 챌린지</h2>
        <p className="text-gray-400 mb-4">{event.description}</p>
        
        <div className="mb-6 p-3 bg-gray-900 rounded-lg inline-block border border-yellow-500/30">
          <div className="text-yellow-400 font-bold text-sm mb-1">🏆 Top 3 보상 안내</div>
          <div className="text-xs text-gray-300 flex gap-4"><span>🥇 1등: 5,000 P</span><span>🥈 2등: 3,000 P</span><span>🥉 3등: 1,000 P</span></div>
        </div>

        <div className="mb-6 text-sm font-bold" style={{color: isExpired ? '#ef4444' : '#4ade80'}}>{isExpired ? `🚫 이 이벤트는 종료되었습니다 (${event.endDate} 마감)` : `📅 마감일: ${event.endDate} 까지`}</div>
        {!isExpired ? (
          <div className="login-box" style={{maxWidth: '500px', margin: '0 auto'}}>
            <h4 className="font-bold mb-2">내 작품 출품하기</h4>
            {preview && <img src={preview} alt="" style={{width:'100%', height:'200px', objectFit:'cover', borderRadius:'8px', marginBottom:'1rem'}} />}
            <div className="flex gap-2">
              <label className="btn-action flex-1 text-center cursor-pointer" style={{background:'#334155'}}><input type="file" hidden onChange={e => {setFile(e.target.files[0]); setPreview(URL.createObjectURL(e.target.files[0]))}} /><Upload style={{display:'inline', marginRight:'5px'}} /> 이미지 선택</label>
              <button onClick={handleUpload} className="btn-action flex-1">출품하기</button>
            </div>
          </div>
        ) : (<div className="p-4 bg-gray-900 rounded text-sub">아쉽지만 참여 기간이 지났습니다. 다른 참가자들의 작품을 감상하고 투표해주세요!</div>)}
      </div>
      <h3 className="section-title mb-4"><Heart color="#f43f5e" /> 출품작 갤러리 (Top 3는 보상 지급!)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {entries.map((entry, idx) => (
          <div key={entry.id} className="event-card" style={{ padding: 0, overflow: 'hidden', position:'relative' }}>
            {idx < 3 && <div className="absolute top-2 left-2 badge badge-purple">Top {idx+1}</div>}
            <img src={`http://localhost:3000${entry.imageUrl}`} alt="" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span className="text-sm font-bold">{entry.user?.nickname}</span>
              <button onClick={() => handleVote(entry.id)} className="btn-action" style={{padding:'5px 10px', fontSize:'12px', background: '#f43f5e'}}>♥ {entry.likes}</button>
            </div>
          </div>
        ))}
        {entries.length === 0 && <div className="text-center text-sub p-8" style={{gridColumn: '1 / -1'}}>아직 출품작이 없습니다.</div>}
      </div>
    </div>
  );
}

function GalleryPage({ user }) {
  const [images, setImages] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);
  const [comment, setComment] = useState('');

  const fetchImages = () => {
    return fetch(`http://localhost:3000/api/gallery?login_id=${user?.username || ''}`)
      .then(res => res.json()).then(data => { setImages(data); return data; });
  };
  useEffect(() => { fetchImages(); }, [user]);
  useEffect(() => {
    if (selectedImg) { const updated = images.find(img => img.id === selectedImg.id); if (updated) setSelectedImg(updated); }
  }, [images]);

  const handleLike = async (id, e) => {
    e.stopPropagation(); if (!user) return alert("로그인이 필요합니다.");
    await fetch('http://localhost:3000/api/like-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login_id: user.username, submission_id: id }) });
    fetchImages(); 
  };
  const handleComment = async () => {
    if (!comment) return; if (!user) return alert("로그인이 필요합니다.");
    await fetch('http://localhost:3000/api/comment', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ login_id: user.username, submission_id: selectedImg.id, content: comment }) });
    setComment(''); fetchImages();
  };

  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
      <h3 className="section-title"><Image color="#f472b6" /> 전체 밈 갤러리</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {images.map(img => (
          <div key={img.id} className="event-card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setSelectedImg(img)}>
            <img src={`http://localhost:3000${img.imageUrl}`} alt="" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '1rem' }}>
              <div className="font-bold text-sm mb-1">{img.quest?.title || "자유 밈"}</div>
              <div className="flex justify-between items-center text-xs text-sub">
                <span>by {img.user?.nickname}</span>
                <button onClick={(e) => handleLike(img.id, e)} className="flex items-center gap-1" style={{ background: 'none', border: 'none', cursor: 'pointer', color: img.isLiked ? '#f43f5e' : 'white' }}>
                  <Heart size={14} fill={img.isLiked ? "currentColor" : "none"} /> {img.likeCount}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selectedImg && (
        <div style={{position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'}} onClick={() => setSelectedImg(null)}>
          <div style={{background: '#1e293b', padding: '1.5rem', borderRadius: '1rem', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
            <img src={`http://localhost:3000${selectedImg.imageUrl}`} alt="" style={{width: '100%', borderRadius: '0.5rem'}} />
            <div className="mt-4 font-bold text-lg">{selectedImg.quest?.title}</div>
            <p className="text-sub text-sm mb-4">작성자: {selectedImg.user?.nickname}</p>
            <div className="mb-4 p-4 bg-gray-800 rounded">
              <div className="text-sm font-bold mb-2">댓글 ({selectedImg.comments?.length || 0})</div>
              {selectedImg.comments && selectedImg.comments.map(c => (<div key={c.id} className="text-xs mb-1"><span className="text-accent">{c.user.nickname}:</span> {c.content}</div>))}
            </div>
            <div className="flex gap-2">
              <input className="login-input" placeholder="댓글 입력..." value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment()} onClick={e => e.stopPropagation()} />
              <button onClick={handleComment} className="btn-action">등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RankingPage() {
  const [rankings, setRankings] = useState([]);
  useEffect(() => { fetch('http://localhost:3000/api/rankings').then(res => res.json()).then(setRankings); }, []);
  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="section-title"><Trophy color="#facc15" /> 주간 명예의 전당 (매주 월요일 초기화)</h3>
        <button onClick={() => fetch('http://localhost:3000/api/reset-ranking', { method: 'POST' }).then(() => alert('리셋됨'))} style={{opacity: 0.1, cursor:'default'}}>↻</button>
      </div>
      <div className="login-box" style={{ padding: '1rem', marginTop: '1rem' }}>
        {rankings.map((ranker, index) => (
          <div key={index} className="flex items-center justify-between" style={{ padding: '1rem', borderBottom: '1px solid #334155' }}>
            <div className="flex items-center gap-4"><span className="font-bold" style={{ fontSize: '1.2rem', color: index < 3 ? '#facc15' : 'white', width: '20px' }}>{index + 1}</span><div><div className="font-bold">{ranker.nickname}</div><div className="text-xs text-sub">{ranker.userCode}</div></div></div>
            <div className="font-bold text-accent">{ranker.weeklyPoints ? ranker.weeklyPoints.toLocaleString() : 0} 점</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExchangePage({ user, onUpdateUser }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSwap = async () => {
    if (!amount) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/swap-to-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login_id: user.username, amount: Number(amount) }) });
      const data = await res.json();
      if (data.status === 'success') {
        alert(`✅ 성공! (TX: ${data.txHash.slice(0, 10)}...)`);
        onUpdateUser({ ...user, wallet: { ...user.wallet, mq: data.remainingPoints } });
        setAmount('');
      } else alert("❌ 실패: " + data.message);
    } catch(err) { alert("❌ 오류"); } finally { setLoading(false); }
  };
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {loading && <LoadingOverlay message="블록체인 승인 대기중... (최대 10초)" />}
      <h3 className="section-title"><RefreshCw color="#4ade80" /> 환전소</h3>
      <div className="stat-card primary" style={{marginBottom:'2rem'}}><div className="text-4xl font-bold">{user.wallet.mq.toLocaleString()} P</div></div>
      <div className="login-box"><input type="number" className="login-input" value={amount} onChange={e => setAmount(e.target.value)} /><button onClick={handleSwap} className="login-btn mt-4">전송</button></div>
    </div>
  );
}

function ProfilePage({ user, onUpdateUser }) {
  const [nickname, setNickname] = useState(user.nickname);
  const [wallet, setWallet] = useState('');
  const [password, setPassword] = useState('');
  const handleUpdate = async () => {
    if (!window.confirm("정말 수정하시겠습니까? (닉네임은 월 1회 제한)")) return;
    try {
      const res = await fetch('http://localhost:3000/api/update-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login_id: user.username, nickname: nickname !== user.nickname ? nickname : undefined, wallet_address: wallet || undefined, password: password || undefined }) });
      const data = await res.json();
      if (!res.ok) { alert("오류: " + data.message); } else { alert("프로필이 업데이트되었습니다!"); onUpdateUser({ ...user, nickname: nickname, walletAddress: wallet || user.walletAddress }); setWallet(''); setPassword(''); }
    } catch (err) { alert("서버 오류"); }
  };
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h3 className="section-title"><Settings color="#e2e8f0" /> 내 정보 수정</h3>
      <div className="login-box">
        <div className="input-group"><label className="input-label">아이디</label><input type="text" className="login-input" value={user.username} readOnly disabled style={{ opacity: 0.7, cursor: 'not-allowed', background: '#334155' }} /></div>
        <div className="input-group"><label className="input-label">현재 연결된 지갑 주소</label><input type="text" className="login-input" value={user.walletAddress || "등록된 지갑 없음"} readOnly disabled style={{ opacity: 0.7, cursor: 'not-allowed', background: '#334155', fontSize: '0.9rem' }} /></div>
        <hr style={{ borderColor: '#334155', margin: '1.5rem 0' }} />
        <div className="input-group"><label className="input-label">닉네임 변경 (월 1회 가능)</label><input type="text" className="login-input" value={nickname} onChange={e => setNickname(e.target.value)} /></div>
        <div className="input-group"><label className="input-label">지갑 주소 변경 (새로운 주소 입력)</label><input type="text" className="login-input" placeholder="변경할 경우에만 0x... 주소 입력" value={wallet} onChange={e => setWallet(e.target.value)} /></div>
        <div className="input-group"><label className="input-label">새 비밀번호</label><input type="password" className="login-input" placeholder="변경할 경우만 입력" value={password} onChange={e => setPassword(e.target.value)} /></div>
        <button onClick={handleUpdate} className="login-btn mt-4">저장하기</button>
      </div>
    </div>
  );
}

function PointHistoryPage({ user }) {
  const [history, setHistory] = useState({ aiTotal: 0, snsList: [], eventList: [] });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`http://localhost:3000/api/point-history?login_id=${user.username}`).then(res => res.json()).then(data => { setHistory(data); setLoading(false); });
  }, [user]);

  const Card = ({ title, children }) => (
    <div style={{ background: '#1e293b', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #334155' }}>
      <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>{title}</h4>{children}
    </div>
  );

  if (loading) return <div className="text-center p-8">데이터를 불러오는 중...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h3 className="section-title mb-6"><Star color="#fbbf24" /> 포인트 획득 내역</h3>
      <Card title={<><CheckCircle size={20} color="#c084fc"/> AI 밈 챌린지</>}>
        <div className="flex justify-between items-center"><span className="text-sub">지금까지 AI 검사를 통과하여 얻은 총 수익</span><span className="text-2xl font-bold text-accent">{history.aiTotal.toLocaleString()} P</span></div>
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
                <div className="text-right"><div className="font-bold text-green-400">+{item.earnedPoints.toLocaleString()} P</div><div className="text-xs text-sub" style={{fontSize:'10px'}}>매일 자정 갱신됨</div></div>
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
                <span className="text-white">{item.title}</span><span className="font-bold text-green-400">+{item.earnedPoints.toLocaleString()} P</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({ id: '', password: '', nickname: '', walletAddress: '' });
  const handleSubmit = () => {
    const { id, password, nickname, walletAddress } = formData;
    if (!id || !password) return alert("아이디와 비밀번호를 입력해주세요.");
    if (isSignup) { if (!nickname) return alert("닉네임을 입력해주세요."); if (!walletAddress) return alert("지갑 주소를 입력해주세요."); }
    onLogin(isSignup ? 'register' : 'login', id, password, nickname, walletAddress);
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-logo-section"><div className="login-logo-box"><span>M</span></div><h2 className="font-bold" style={{fontSize: '2rem', margin: '0'}}>MemeQuest</h2><p className="text-sub">{isSignup ? "새로운 계정을 생성하세요." : "로그인하여 퀘스트를 시작하세요."}</p></div>
        <div className="login-box">
          <div className="input-group"><label className="input-label">아이디</label><input type="text" className="login-input" placeholder="ID 입력" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} /><p className="text-xs text-gray-500 mt-1">로그인에 사용할 영문 ID를 입력하세요.</p></div>
          <div className="input-group"><label className="input-label">비밀번호</label><input type="password" className="login-input" placeholder="비밀번호 입력" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /><p className="text-xs text-gray-500 mt-1">안전한 비밀번호를 입력하세요.</p></div>
          {isSignup && (<><div className="input-group"><label className="input-label">닉네임</label><input type="text" className="login-input" placeholder="사용할 닉네임" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} /><p className="text-xs text-gray-500 mt-1">서비스 내에서 보여질 이름입니다.</p></div><div className="input-group"><label className="input-label">지갑 주소</label><input type="text" className="login-input" placeholder="0x..." value={formData.walletAddress} onChange={e => setFormData({...formData, walletAddress: e.target.value})} /><p className="text-xs text-gray-500 mt-1">보상을 받을 이더리움 계열 지갑 주소를 입력하세요.</p></div></>)}
          <button onClick={handleSubmit} className="login-btn" style={{marginTop: '1rem'}}>{isSignup ? "회원가입 완료" : "로그인"}</button>
          <div className="text-center mt-4 text-sm"><span className="text-sub">{isSignup ? "이미 계정이 있나요?" : "아직 계정이 없나요?"} </span><button onClick={() => setIsSignup(!isSignup)} className="text-accent font-bold" style={{background:'none', border:'none', cursor:'pointer'}}>{isSignup ? "로그인하기" : "회원가입하기"}</button></div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, changeTab }) {
  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
      <div className="dashboard-grid">
        <div className="stat-card"><div className="text-sub text-sm">코인 가격</div><div className="text-3xl font-bold">1,540 KRW</div></div>
        <div className="stat-card primary"><div className="text-sub text-sm">내 포인트</div><div className="text-3xl font-bold">{user.wallet.mq.toLocaleString()} P</div><button onClick={() => changeTab('exchange')} style={{marginTop:'1rem', background:'rgba(255,255,255,0.1)', border:'none', color:'white', padding:'0.5rem', borderRadius:'0.5rem'}}>환전</button></div>
      </div>
    </div>
  );
}

export default function MemeQuestApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAuth = async (mode, id, password, nickname, walletAddress) => {
    try {
      const endpoint = mode === 'register' ? '/api/register' : '/api/login';
      const body = mode === 'register' ? { login_id: id, password, nickname, wallet_address: walletAddress } : { login_id: id, password };
      const res = await fetch(`http://localhost:3000${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const errorData = await res.json(); alert(errorData.message || "실패했습니다."); return; }
      const data = await res.json();
      if (data.id) { setUser({ username: data.loginId, nickname: data.nickname, code: data.userCode, walletAddress: data.walletAddress, wallet: { mq: data.points, pepe: 0, doge: 0 } }); }
    } catch (err) { alert("서버 연결 실패: " + err); }
  };

  if (!user) return <LoginScreen onLogin={handleAuth} />;

  return (
    <div className="app-container">
      <div className="mobile-header"><div className="brand-text">MemeQuest</div><button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{background:'none', border:'none', color:'white'}}>{isMobileMenuOpen ? <X /> : <Menu />}</button></div>
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand"><div className="brand-icon">M</div><span className="brand-text">MemeQuest</span></div>
        <nav className="nav-menu">
          <NavItem icon={<Flame />} label="대시보드" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={<Star />} label="메인 퀘스트" active={activeTab === 'main-quest'} onClick={() => setActiveTab('main-quest')} />
          <NavItem icon={<CheckCircle />} label="이벤트 퀘스트" active={activeTab === 'event-quest'} onClick={() => setActiveTab('event-quest')} />
          <NavItem icon={<Image />} label="밈 갤러리" active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} />
          <NavItem icon={<Trophy />} label="주간 랭킹" active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} />
          <NavItem icon={<ListIcon />} label="포인트 내역" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <NavItem icon={<RefreshCw />} label="토큰 교환소" active={activeTab === 'exchange'} onClick={() => setActiveTab('exchange')} />
          <NavItem icon={<Settings />} label="내 정보 수정" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </nav>
        <div className="user-code-box">
          <div className="text-xs text-sub mb-1">내 고유 식별 코드</div>
          <div className="font-bold text-accent flex justify-between items-center">{user.code}<button onClick={() => alert('복사됨')} className="badge badge-purple" style={{cursor: 'pointer'}}>복사</button></div>
        </div>
        <div className="sidebar-footer">
          <div className="flex items-center gap-2">
            <User size={24} color="#94a3b8" />
            <div style={{flex: 1}}><div className="font-bold text-sm">{user.nickname}</div><div className="text-xs text-sub">레벨 3 밈 마스터</div></div>
            <button onClick={() => setUser(null)} className="flex items-center gap-1 text-xs text-sub hover:text-white" style={{background:'none', border:'none', cursor:'pointer'}}><LogOut size={16} /> 로그아웃</button>
          </div>
        </div>
      </aside>
      <main className="main-content">
        {activeTab === 'home' && <Dashboard user={user} changeTab={setActiveTab} />}
        {activeTab === 'main-quest' && <MainQuestPage user={user} onUpdateUser={setUser} />}
        {activeTab === 'event-quest' && <EventQuestPage user={user} />}
        {activeTab === 'gallery' && <GalleryPage user={user} />}
        {activeTab === 'ranking' && <RankingPage />}
        {activeTab === 'history' && <PointHistoryPage user={user} />}
        {activeTab === 'exchange' && <ExchangePage user={user} onUpdateUser={setUser} />}
        {activeTab === 'profile' && <ProfilePage user={user} onUpdateUser={setUser} />}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return <button onClick={onClick} className={`nav-item ${active ? 'active' : ''}`}>{React.cloneElement(icon, { size: 20 })}<span className="font-medium">{label}</span></button>;
}