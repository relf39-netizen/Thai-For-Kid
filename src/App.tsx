import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { UserProfile, TOPICS, Question, Exam } from './types';
import { generateQuestions } from './services/geminiService';
import { apiGetExams, apiSaveScore } from './services/sheetApi';
import GameScreen from './components/GameScreen';
import TeacherDashboard from './components/TeacherDashboard';
import LoginScreen from './components/LoginScreen';
import { GraduationCap, Play, Star, Settings, User, Book, LogOut } from 'lucide-react';

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
    // Load exams from API
    const loadExams = async () => {
        const exams = await apiGetExams();
        // Filter out drafts and sort by date
        const activeExams = exams
            .filter(e => !e.title.startsWith('[DRAFT] '))
            .sort((a, b) => b.createdAt - a.createdAt);
            
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
    <div className="pb-28 animate-fade-in">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white p-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none transform rotate-12">
          <GraduationCap size={180} />
        </div>
        
        <div className="flex items-center justify-between mb-6 relative z-50">
            <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-4xl shadow-md border-4 border-blue-200 overflow-hidden transform hover:scale-105 transition-transform">
                {user.avatar || (user.role === 'teacher' ? '👩‍🏫' : '👦')}
            </div>
            <div>
                <h1 className="text-xl md:text-2xl font-bold drop-shadow-sm">{user.name}</h1>
                <p className="opacity-90 text-sm font-medium bg-white/20 px-2 py-0.5 rounded-lg inline-block mt-1 backdrop-blur-sm">
                    {user.role === 'teacher' ? 'คุณครู (Teacher)' : `Level ${user.level}`}
                </p>
            </div>
            </div>
            
            <button 
                onClick={onLogout} 
                className="bg-white/20 hover:bg-red-500 hover:text-white border border-white/30 backdrop-blur-md px-4 py-2 rounded-full transition-all flex items-center gap-2 shadow-lg cursor-pointer active:scale-95 z-50 group" 
                title="ออกจากระบบ"
                type="button"
            >
                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold text-sm">ออก</span>
            </button>
        </div>

        {/* XP Bar (Only for students) */}
        {user.role === 'student' && (
            <>
            <div className="bg-black/20 rounded-full h-4 mb-2 overflow-hidden backdrop-blur-sm relative z-10 border border-white/10">
            <div 
                className="bg-gradient-to-r from-yellow-300 to-yellow-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                style={{ width: `${Math.min((user.xp / user.xpToNextLevel) * 100, 100)}%` }}
            />
            </div>
            <div className="flex justify-between text-xs font-bold opacity-90 relative z-10 tracking-wide">
            <span>XP: {user.xp}</span>
            <span>GOAL: {user.xpToNextLevel}</span>
            </div>
            </>
        )}
      </div>

      {/* Teacher Assigned Exams */}
      {savedExams.length > 0 && (
        <div className="p-6 pb-0 animate-slide-up">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
             <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Book size={18} className="fill-current" /></div>
             แบบฝึกหัดจากคุณครู
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x">
            {savedExams.map((exam) => (
              <button
                key={exam.id}
                onClick={() => handleExamClick(exam)}
                disabled={loadingTopic !== null}
                className="snap-start min-w-[160px] bg-white p-4 rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-all text-left flex flex-col justify-between h-36 hover:border-blue-400 hover:shadow-md group"
              >
                <div>
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-10 h-10 rounded-xl flex items-center justify-center text-blue-700 mb-3 shadow-inner group-hover:scale-110 transition-transform">
                    <Star size={20} className="fill-current" />
                  </div>
                  <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight text-sm">{exam.title}</h3>
                </div>
                <div className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md w-fit">
                  {exam.questions.length} ข้อ
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Generated Topics Grid */}
      <div className="p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-lg text-green-600"><Play size={18} className="fill-current" /></div>
          ฝึกฝนทั่วไป (Practice)
        </h2>
        
        <div className="grid grid-cols-1 gap-3">
          {TOPICS.map((topic, index) => (
            <button
              key={topic.id}
              onClick={() => handleTopicClick(topic.name)}
              disabled={loadingTopic !== null}
              className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all flex items-center gap-4 hover:shadow-md hover:border-blue-200 group"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border-2 border-white group-hover:scale-110 transition-transform
                ${index % 2 === 0 ? 'bg-gradient-to-br from-orange-100 to-orange-200' : 'bg-gradient-to-br from-green-100 to-green-200'}
              `}>
                {loadingTopic === topic.name ? <span className="animate-spin text-xl">⏳</span> : topic.icon}
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-base text-gray-800 group-hover:text-blue-600 transition-colors">{topic.name}</h3>
                <p className="text-xs text-gray-400 mt-1">AI สร้างโจทย์ใหม่ • 5 ข้อ</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-full text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                <Play size={20} className="fill-current ml-0.5" />
              </div>
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

  if (location.pathname === '/game') return null;
  if (location.pathname.startsWith('/teacher')) return null;

  const isActive = (path: string) => location.pathname === path ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600';

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center pb-8 z-40 rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
      <button onClick={() => navigate('/')} className={`flex flex-col items-center gap-1.5 transition-all ${isActive('/')}`}>
        <Play size={24} strokeWidth={2.5} className={location.pathname === '/' ? 'fill-blue-100' : ''} />
        <span className="text-[10px] font-bold">เล่นเกม</span>
      </button>
      <button className={`flex flex-col items-center gap-1.5 transition-all text-gray-300 cursor-not-allowed`}>
        <Star size={24} strokeWidth={2.5} />
        <span className="text-[10px] font-bold">อันดับ</span>
      </button>
      <button className={`flex flex-col items-center gap-1.5 transition-all text-gray-300 cursor-not-allowed`}>
        <User size={24} strokeWidth={2.5} />
        <span className="text-[10px] font-bold">ข้อมูลฉัน</span>
      </button>
    </div>
  );
}

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [showGame, setShowGame] = useState(false);
  const [currentTopicName, setCurrentTopicName] = useState('');

  const handleLogin = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    setGameQuestions([]);
    setShowGame(false);
  };

  const startGame = async (topicName: string, customQuestions?: Question[]) => {
    setCurrentTopicName(topicName);
    if (customQuestions) {
      setGameQuestions(customQuestions);
    } else {
      const questions = await generateQuestions(topicName, 5);
      setGameQuestions(questions);
    }
    setShowGame(true);
  };

  const handleGameComplete = async (score: number) => {
    if (user) {
        // Save score to Sheet API
        await apiSaveScore(user.username, score, `Completed: ${currentTopicName}`);
        
        setUser(prev => prev ? ({
            ...prev,
            xp: prev.xp + score,
            streak: prev.streak + 1
        }) : null);
    }
    setShowGame(false);
  };

  // If teacher is logged in, show full screen dashboard
  const isTeacherSession = user?.role === 'teacher';

  if (isTeacherSession) {
      return (
        <HashRouter>
            <div className="min-h-screen bg-gray-50 font-sans w-full mx-auto animate-fade-in">
                <TeacherDashboard />
            </div>
        </HashRouter>
      );
  }

  // Student App / Login Layout (Phone Frame)
  return (
    <HashRouter>
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f4f8] font-sarabun md:p-6 transition-colors bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        
        {/* Mobile Device Frame */}
        <div className="w-full max-w-[400px] h-[100dvh] md:h-[800px] md:max-h-[90vh] bg-white md:rounded-[45px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden relative border-0 md:border-[10px] md:border-white ring-1 ring-black/5 flex flex-col transition-all duration-300">
            
            {/* Screen Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative w-full bg-slate-50 scroll-smooth">
                {!user ? (
                    <LoginScreen onLogin={handleLogin} />
                ) : showGame ? (
                    <GameScreen 
                        questions={gameQuestions} 
                        onComplete={handleGameComplete} 
                        onExit={() => setShowGame(false)} 
                    />
                ) : (
                    <>
                        <Routes>
                            <Route path="/" element={<HomeScreen user={user} onStartGame={startGame} onLogout={handleLogout} />} />
                        </Routes>
                        <div className="h-24"></div> {/* Spacer for Nav */}
                    </>
                )}
            </div>

            {/* Navigation Bar (Only for logged in students, not in game) */}
            {user && !showGame && (
                 <Navigation />
            )}
        </div>
      </div>
    </HashRouter>
  );
};

export default App;