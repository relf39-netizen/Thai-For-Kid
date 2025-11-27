import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { UserProfile, TOPICS, Question, Exam } from './types';
import { generateQuestions } from './services/geminiService';
import { apiGetExams, apiSaveScore } from './services/sheetApi';
import GameScreen from './components/GameScreen';
import TeacherDashboard from './components/TeacherDashboard';
import LoginScreen from './components/LoginScreen';
import { GraduationCap, Play, Star, User, Book, LogOut, ChevronRight } from 'lucide-react';

interface HomeScreenProps {
  user: UserProfile;
  onStartGame: (topicId: string, customQuestions?: Question[], examId?: string) => Promise<void>;
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
        setSavedExams(exams.sort((a, b) => b.createdAt - a.createdAt));
    };
    loadExams();
  }, []);

  const handleTopicClick = async (topicId: string) => {
    setLoadingTopic(topicId);
    await onStartGame(topicId); // Regular Practice
    setLoadingTopic(null);
  };

  const handleExamClick = async (exam: Exam) => {
    setLoadingTopic(exam.id);
    await onStartGame(exam.title, exam.questions, exam.id); // Homework/Skill Practice Assignment
    setLoadingTopic(null);
  }

  return (
    <div className="pb-24 font-sarabun bg-slate-50 min-h-screen">
      {/* Thai-Style Header / Hero Section */}
      <div className="bg-gradient-to-b from-amber-400 via-amber-300 to-yellow-100 pt-8 pb-12 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
        
        {/* Decorative Patterns (CSS) */}
        <div className="absolute top-0 left-0 w-full h-4 bg-[url('https://www.transparenttextures.com/patterns/gold-scale.png')] opacity-20"></div>
        <div className="absolute -right-10 top-0 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 top-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-2xl"></div>

        <div className="flex items-center justify-between mb-4 relative z-20">
            <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-4xl shadow-md border-4 border-white/50 overflow-hidden transform hover:scale-105 transition-transform">
                    {user.avatar || (user.role === 'teacher' ? '👩‍🏫' : '👦')}
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-amber-900 drop-shadow-sm">สวัสดีจ้ะ! <span className="block text-2xl md:text-3xl text-blue-900">{user.name}</span></h1>
                    <p className="opacity-80 text-sm text-amber-800 font-semibold">{user.role === 'teacher' ? 'คุณครูคนเก่ง' : `นักเรียนคนเก่ง (Level ${user.level})`}</p>
                </div>
            </div>
            
            <button 
                onClick={onLogout} 
                className="bg-white/40 hover:bg-white hover:text-red-500 text-amber-900 border border-white/40 backdrop-blur-sm p-3 rounded-full transition-all shadow-sm active:scale-95" 
                title="ออกจากระบบ"
                type="button"
            >
                <LogOut size={20} />
            </button>
        </div>

        {/* XP Bar (Only for students) */}
        {user.role === 'student' && (
            <div className="bg-white/40 p-1.5 rounded-full relative z-20 backdrop-blur-sm border border-white/40 shadow-sm">
                <div className="flex justify-between text-xs font-bold text-amber-900 mb-1 px-2">
                    <span>XP: {user.xp}</span>
                    <span>เป้าหมาย: {user.xpToNextLevel}</span>
                </div>
                <div className="bg-white/50 rounded-full h-3 overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${(user.xp / user.xpToNextLevel) * 100}%` }}
                    />
                </div>
            </div>
        )}
      </div>

      {/* Decorative Thai Kids Illustration Placeholder */}
      <div className="-mt-8 px-6 relative z-30 mb-6">
          <div className="bg-white rounded-2xl shadow-xl p-4 flex items-center gap-4 border border-yellow-100 transform -rotate-1 hover:rotate-0 transition-transform">
             <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center text-2xl">📚</div>
             <div>
                 <h3 className="font-bold text-blue-900">พร้อมเรียนรู้หรือยัง?</h3>
                 <p className="text-xs text-gray-500">วันนี้เรามาเก็บดาวให้ครบกันเถอะ!</p>
             </div>
             <ChevronRight className="ml-auto text-gray-300" />
          </div>
      </div>

      {/* Teacher Assigned Exams */}
      {savedExams.length > 0 && (
        <div className="px-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
             <div className="bg-red-100 p-1.5 rounded-lg text-red-500"><Book size={18} className="fill-current" /></div>
             แบบฝึกทักษะจากครู
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
            {savedExams.map((exam) => (
              <button
                key={exam.id}
                onClick={() => handleExamClick(exam)}
                disabled={loadingTopic !== null}
                className="min-w-[180px] bg-white p-4 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-300 active:scale-95 transition-all text-left flex flex-col justify-between h-36 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-3 py-1 rounded-bl-xl font-bold shadow-sm">การบ้าน</div>
                <div className="absolute bottom-0 right-0 w-16 h-16 bg-blue-50 rounded-tl-full opacity-50 translate-x-4 translate-y-4"></div>
                
                <div className="mt-2">
                  <div className="bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 mb-3 shadow-sm group-hover:scale-110 transition-transform">
                    <Star size={20} className="fill-current" />
                  </div>
                  <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight text-sm mb-1">{exam.title}</h3>
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  {exam.questions.length} ข้อ
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Generated Topics Grid */}
      <div className="px-6 pb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <div className="bg-green-100 p-1.5 rounded-lg text-green-600"><Play size={18} className="fill-current" /></div>
          ฝึกฝนทั่วไป (AI)
        </h2>
        
        <div className="grid grid-cols-1 gap-3">
          {TOPICS.map((topic, index) => (
            <button
              key={topic.id}
              onClick={() => handleTopicClick(topic.name)}
              disabled={loadingTopic !== null}
              className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 hover:border-amber-300 active:scale-95 transition-all flex items-center gap-4 group relative overflow-hidden"
            >
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-inner group-hover:rotate-6 transition-transform
                ${index % 2 === 0 ? 'bg-orange-50' : 'bg-green-50'}
              `}>
                {loadingTopic === topic.name ? <span className="animate-spin text-xl">⏳</span> : topic.icon}
              </div>
              <div className="text-left flex-1 relative z-10">
                <h3 className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{topic.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">สร้างโจทย์ใหม่ 5 ข้อ</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-full text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Play size={16} className="fill-current ml-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Teacher Link (Only visible if role is teacher) */}
      {user.role === 'teacher' && (
        <div className="text-center mt-4 mb-8">
            <button 
            onClick={() => navigate('/teacher')}
            className="w-[90%] mx-auto bg-slate-800 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
            >
            <Book size={18} /> เข้าสู่ระบบจัดการครู
            </button>
        </div>
      )}
    </div>
  );
};

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/game') return null;
  if (location.pathname.startsWith('/teacher')) return null;

  const isActive = (path: string) => location.pathname === path ? 'text-blue-600 scale-110' : 'text-gray-300';

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-8 py-3 flex justify-between items-center pb-6 rounded-t-[30px] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-40 max-w-md mx-auto right-0 font-sarabun">
      <button onClick={() => navigate('/')} className={`flex flex-col items-center gap-1 transition-all ${isActive('/')}`}>
        <div className={`p-2 rounded-xl ${location.pathname === '/' ? 'bg-blue-50' : ''}`}>
             <Play size={24} strokeWidth={2.5} className={location.pathname === '/' ? 'fill-blue-600' : ''} />
        </div>
        <span className="text-[10px] font-bold">เล่นเกม</span>
      </button>
      <button className={`flex flex-col items-center gap-1 transition-all text-gray-300 cursor-not-allowed`}>
        <div className="p-2">
            <Star size={24} strokeWidth={2.5} />
        </div>
        <span className="text-[10px] font-bold">อันดับ</span>
      </button>
      <button className={`flex flex-col items-center gap-1 transition-all text-gray-300 cursor-not-allowed`}>
        <div className="p-2">
            <User size={24} strokeWidth={2.5} />
        </div>
        <span className="text-[10px] font-bold">ฉัน</span>
      </button>
    </div>
  );
}

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [showGame, setShowGame] = useState(false);
  const [currentTopicName, setCurrentTopicName] = useState('');
  const [currentExamId, setCurrentExamId] = useState<string | undefined>(undefined);

  const handleLogin = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    setGameQuestions([]);
    setShowGame(false);
  };

  const startGame = async (topicName: string, customQuestions?: Question[], examId?: string) => {
    setCurrentTopicName(topicName);
    setCurrentExamId(examId);

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
        // Construct detailed log string
        // If it's an exam (homework/skill practice), prefix with "Homework:" otherwise "Practice:"
        const prefix = currentExamId ? "Homework" : "Practice";
        const details = `${prefix}: ${currentTopicName}`;

        await apiSaveScore(user.username, score, details);
        
        setUser(prev => prev ? ({
            ...prev,
            xp: prev.xp + score,
            streak: prev.streak + 1
        }) : null);
    }
    setShowGame(false);
    setCurrentExamId(undefined);
  };

  const MainLayout = () => {
    const location = useLocation();
    const isTeacherMode = location.pathname.startsWith('/teacher');
    
    // Redirect if not teacher
    if (isTeacherMode && user?.role !== 'teacher') {
        // Simple redirect protection
        // In real app use useEffect to navigate away
    }

    const containerClasses = isTeacherMode 
      ? "min-h-screen bg-slate-50 font-sarabun w-full mx-auto" 
      : "min-h-screen bg-slate-50 font-sarabun max-w-md mx-auto shadow-2xl overflow-hidden relative";

    if (showGame && user) {
      return (
        <div className="min-h-screen bg-slate-50 font-sarabun max-w-md mx-auto shadow-2xl overflow-hidden relative">
            <GameScreen 
            questions={gameQuestions} 
            onComplete={handleGameComplete} 
            onExit={() => setShowGame(false)} 
            />
        </div>
      );
    }

    return (
      <div className={containerClasses}>
        <Routes>
          <Route path="/" element={<HomeScreen user={user!} onStartGame={startGame} onLogout={handleLogout} />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
        </Routes>
        <Navigation />
      </div>
    );
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <MainLayout />
    </HashRouter>
  );
};

export default App;