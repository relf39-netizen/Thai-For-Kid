import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { UserProfile, TOPICS, Question, Exam } from './types';
import { generateQuestions } from './services/geminiService';
import { apiGetExams, apiSaveScore } from './services/sheetApi';
import GameScreen from './components/GameScreen';
import TeacherDashboard from './components/TeacherDashboard';
import LoginScreen from './components/LoginScreen';
import { GraduationCap, Play, Star, Settings, User, Book, LogOut, ChevronRight, Sparkles } from 'lucide-react';

interface HomeScreenProps {
  user: UserProfile;
  onStartGame: (topicId: string, customQuestions?: Question[]) => Promise<void>;
  onLogout: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ user, onStartGame, onLogout }) => {
  const navigate = useNavigate();
  const [loadingTopic, setLoadingTopic] = useState<string | null>(null);
  const [savedExams, setSavedExams] = useState<Exam[]>([]);

  useEffect(() => {
    const loadExams = async () => {
        const exams = await apiGetExams();
        const activeExams = exams.filter(e => !e.title.startsWith('[DRAFT] ')).sort((a, b) => b.createdAt - a.createdAt);
        setSavedExams(activeExams);
    };
    loadExams();
  }, []);

  const handleTopicClick = async (topicId: string) => {
    setLoadingTopic(topicId);
    await onStartGame(topicId);
    setLoadingTopic(null);
  };

  const handleExamClick = async (exam: Exam) => {
    setLoadingTopic(exam.id);
    await onStartGame(exam.title, exam.questions);
    setLoadingTopic(null);
  }

  return (
    <div className="pb-24 animate-fade-in w-full max-w-xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white p-6 rounded-b-[40px] shadow-lg relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none transform rotate-12"><GraduationCap size={180} /></div>
        <div className="flex items-center justify-between mb-4 relative z-20">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-4xl shadow-lg border-4 border-sky-200 overflow-hidden">
                    {user.avatar || (user.role === 'teacher' ? '👩‍🏫' : '👦')}
                </div>
                <div>
                    <h1 className="text-2xl font-black drop-shadow-md tracking-tight">{user.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 shadow-sm">{user.role === 'teacher' ? 'Teacher' : `Level ${user.level}`}</span>
                    </div>
                </div>
            </div>
            <button onClick={onLogout} className="bg-white/20 hover:bg-red-500 hover:text-white border border-white/30 backdrop-blur-md p-2 rounded-xl transition-all shadow-lg active:scale-90" title="ออก"><LogOut size={20} /></button>
        </div>

        {user.role === 'student' && (
            <div className="relative z-20 bg-black/20 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="flex justify-between text-xs font-bold opacity-90 mb-1.5 uppercase"><span>Progress</span><span>{user.xp} / {user.xpToNextLevel} XP</span></div>
                <div className="bg-white/20 rounded-full h-2.5 overflow-hidden shadow-inner"><div className="bg-gradient-to-r from-yellow-300 to-amber-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,191,36,0.6)]" style={{ width: `${Math.min((user.xp / user.xpToNextLevel) * 100, 100)}%` }}></div></div>
            </div>
        )}
      </div>

      {savedExams.length > 0 && (
        <div className="px-6 mb-8 animate-slide-up">
          <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm"><Book size={16} className="fill-current" /></div>
             <span>การบ้านของฉัน</span>
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4 px-1 no-scrollbar snap-x">
            {savedExams.map((exam) => (
              <button key={exam.id} onClick={() => handleExamClick(exam)} disabled={loadingTopic !== null} className="snap-start min-w-[180px] bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 active:scale-95 transition-all text-left flex flex-col justify-between h-40 group hover:border-indigo-300">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition-transform"><Star size={18} className="fill-current" /></div>
                <div><h3 className="font-bold text-slate-800 line-clamp-2 leading-tight text-sm group-hover:text-indigo-600 mb-2">{exam.title}</h3><span className="text-xs text-slate-500 font-bold bg-slate-50 px-2 py-1 rounded-md">{exam.questions.length} ข้อ</span></div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-6 animate-slide-up">
        <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shadow-sm"><Sparkles size={16} className="fill-current" /></div>
          <span>ฝึกฝนทั่วไป</span>
        </h2>
        
        <div className="grid grid-cols-1 gap-3">
          {TOPICS.map((topic, index) => (
            <button key={topic.id} onClick={() => handleTopicClick(topic.name)} disabled={loadingTopic !== null} className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 active:scale-[0.98] transition-all flex items-center gap-4 hover:shadow-md hover:border-sky-200 group h-24">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm border-2 border-white group-hover:scale-105 transition-transform z-10 ${index % 2 === 0 ? 'bg-orange-50' : 'bg-emerald-50'}`}>{loadingTopic === topic.name ? <span className="animate-spin text-lg">⏳</span> : topic.icon}</div>
              <div className="text-left flex-1 z-10"><h3 className="font-bold text-base text-slate-800 group-hover:text-sky-600 transition-colors">{topic.name}</h3><p className="text-xs text-slate-400 font-medium">AI สร้างโจทย์</p></div>
              <div className="bg-slate-50 p-2 rounded-full text-slate-300 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-sm z-10"><Play size={16} className="fill-current ml-0.5" /></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname === '/game' || location.pathname.startsWith('/teacher')) return null;
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-full bg-white/95 backdrop-blur-md border-t border-slate-100 px-6 py-4 flex justify-around items-center z-40">
      <button onClick={() => navigate('/')} className={`transition-all duration-300 p-2 rounded-full flex flex-col items-center gap-1 ${isActive('/') ? 'text-sky-600' : 'text-slate-300'}`}>
        <Play size={24} strokeWidth={3} className={isActive('/') ? 'fill-sky-600' : 'fill-transparent'} />
        <span className="text-[10px] font-black uppercase tracking-wider">Play</span>
      </button>
      <button className="text-slate-300 p-2 flex flex-col items-center gap-1 cursor-not-allowed">
        <Star size={24} strokeWidth={3} />
        <span className="text-[10px] font-black uppercase tracking-wider">Rank</span>
      </button>
      <button className="text-slate-300 p-2 flex flex-col items-center gap-1 cursor-not-allowed">
        <User size={24} strokeWidth={3} />
        <span className="text-[10px] font-black uppercase tracking-wider">Me</span>
      </button>
    </div>
  );
}

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [showGame, setShowGame] = useState(false);
  const [currentTopicName, setCurrentTopicName] = useState('');

  const handleLogin = (loggedInUser: UserProfile) => { setUser(loggedInUser); };
  const handleLogout = () => { setUser(null); setGameQuestions([]); setShowGame(false); };
  const startGame = async (topicName: string, customQuestions?: Question[]) => {
    setCurrentTopicName(topicName);
    if (customQuestions) { setGameQuestions(customQuestions); } else { const questions = await generateQuestions(topicName, 5); setGameQuestions(questions); }
    setShowGame(true);
  };
  const handleGameComplete = async (score: number) => { if (user) { await apiSaveScore(user.username, score, `Completed: ${currentTopicName}`); setUser(prev => prev ? ({ ...prev, xp: prev.xp + score, streak: prev.streak + 1 }) : null); } setShowGame(false); };

  // Teacher Dashboard View (Full Screen)
  if (user?.role === 'teacher') {
      return (
        <HashRouter>
            <div className="min-h-screen bg-slate-50 font-sarabun w-full flex flex-col items-center">
                <TeacherDashboard />
            </div>
        </HashRouter>
      );
  }

  // Student App View (Mobile Simulator on Desktop)
  return (
    <HashRouter>
      <div className="min-h-screen w-full bg-slate-100 font-sarabun overflow-hidden relative flex flex-col items-center justify-center md:py-8">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-200/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-pink-200/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        </div>

        {/* Floating App Container */}
        <div className="w-full h-full md:w-[420px] md:h-[85vh] md:max-h-[900px] bg-white shadow-2xl overflow-hidden relative flex flex-col z-10 md:rounded-[40px] md:border-[8px] md:border-white ring-1 ring-black/5 transition-all duration-300">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative w-full bg-slate-50 scroll-smooth flex flex-col">
                {!user ? (
                    <LoginScreen onLogin={handleLogin} />
                ) : showGame ? (
                    <GameScreen questions={gameQuestions} onComplete={handleGameComplete} onExit={() => setShowGame(false)} />
                ) : (
                    <HomeScreen user={user} onStartGame={startGame} onLogout={handleLogout} />
                )}
            </div>
            
            {/* Bottom Navigation */}
            {user && !showGame && <Navigation />}
        </div>
      </div>
    </HashRouter>
  );
};

export default App;