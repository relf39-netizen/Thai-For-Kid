import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { UserProfile, TOPICS, Question, Exam, ActivityLog } from './types';
import { generateQuestions } from './services/geminiService';
import { apiGetExams, apiSaveScore, apiGetActivityLogs } from './services/sheetApi';
import GameScreen from './components/GameScreen';
import TeacherDashboard from './components/TeacherDashboard';
import LoginScreen from './components/LoginScreen';
import { GraduationCap, Play, Star, User, Book, LogOut, ChevronRight, Trophy, BarChart2 } from 'lucide-react';

interface HomeScreenProps {
  user: UserProfile;
  onStartGame: (topicId: string, customQuestions?: Question[], examId?: string) => Promise<void>;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  logs: ActivityLog[];
}

const HomeScreen: React.FC<HomeScreenProps> = ({ user, onStartGame, onLogout, activeTab, setActiveTab, logs }) => {
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

  const handleTopicClick = async (topicName: string) => {
    setLoadingTopic(topicName);
    
    // 1. Try to find questions in local database (savedExams)
    const topicObj = TOPICS.find(t => t.name === topicName);
    let dbQuestions: Question[] = [];

    if (topicObj && savedExams.length > 0) {
        // Filter exams matching this topic
        const matchingExams = savedExams.filter(e => e.topicId === topicObj.id);
        
        // Flatten all questions from these exams into one pool
        matchingExams.forEach(exam => {
            if (exam.questions && Array.isArray(exam.questions)) {
                dbQuestions.push(...exam.questions);
            }
        });
    }

    if (dbQuestions.length > 0) {
        // 2. If found, shuffle and take 5 (Random Selection)
        const shuffled = dbQuestions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5);
        console.log(`Using ${selected.length} questions from database for topic: ${topicName}`);
        
        // Start game with DB questions
        await onStartGame(topicName, selected);
    } else {
        // 3. If not found, use AI (fallback)
        console.log(`No questions in database for ${topicName}, falling back to AI.`);
        await onStartGame(topicName);
    }

    setLoadingTopic(null);
  };

  const handleExamClick = async (exam: Exam) => {
    setLoadingTopic(exam.id);
    await onStartGame(exam.title, exam.questions, exam.id); // Homework/Skill Practice Assignment
    setLoadingTopic(null);
  }

  // Filter out exams that are already completed by this user
  // We check if there's a log with "Homework: [ExamTitle]"
  const availableExams = savedExams.filter(exam => {
     const isCompleted = logs.some(log => 
        log.username === user.username && 
        (log.details === `Homework: ${exam.title}`)
     );
     return !isCompleted;
  });

  // Calculate Stats for Profile
  const myHomeworkLogs = logs.filter(l => l.username === user.username && l.details.startsWith("Homework:"));
  const myPracticeLogs = logs.filter(l => l.username === user.username && l.details.startsWith("Practice:"));

  // =========================================================================================
  // VIEW: PROFILE (ME)
  // =========================================================================================
  if (activeTab === 'profile') {
      return (
        <div className="pb-24 font-sarabun">
            <div className="bg-blue-600 text-white p-6 rounded-b-[40px] shadow-lg mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><User size={150} /></div>
                <div className="flex flex-col items-center relative z-10 pt-4">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-6xl shadow-xl border-4 border-blue-200 mb-3">
                        {user.avatar || '👦'}
                    </div>
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <p className="opacity-80">รหัส: {user.username}</p>
                </div>
            </div>

            <div className="px-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                        <div className="bg-yellow-100 p-2 rounded-full text-yellow-600 mb-2"><Trophy size={24} /></div>
                        <h3 className="text-2xl font-bold text-gray-800">{user.xp}</h3>
                        <p className="text-xs text-gray-500">คะแนนรวม XP</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                        <div className="bg-orange-100 p-2 rounded-full text-orange-600 mb-2"><Star size={24} /></div>
                        <h3 className="text-2xl font-bold text-gray-800">{user.streak}</h3>
                        <p className="text-xs text-gray-500">ไฟต่อเนื่อง</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 font-bold text-gray-700 flex items-center gap-2">
                        <Book size={18} /> ผลการเรียน (My Stats)
                    </div>
                    <div className="p-4 space-y-4">
                         <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">แบบฝึกทักษะจากครู</span>
                                <span className="font-bold text-blue-600">{myHomeworkLogs.length} ครั้ง</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: '100%' }}></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 text-right">คะแนนล่าสุด: {myHomeworkLogs[myHomeworkLogs.length-1]?.score || 0}</p>
                         </div>
                         
                         <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">ฝึกฝนเองกับ AI</span>
                                <span className="font-bold text-green-600">{myPracticeLogs.length} ครั้ง</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 text-right">คะแนนล่าสุด: {myPracticeLogs[myPracticeLogs.length-1]?.score || 0}</p>
                         </div>
                    </div>
                </div>

                <button 
                    onClick={onLogout} 
                    className="w-full py-3 bg-red-50 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2 border border-red-100 hover:bg-red-100 transition-colors"
                >
                    <LogOut size={18} /> ออกจากระบบ
                </button>
            </div>
        </div>
      );
  }

  // =========================================================================================
  // VIEW: HOME
  // =========================================================================================
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
      {availableExams.length > 0 && (
        <div className="px-6 mb-6 animate-fade-in">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
             <div className="bg-red-100 p-1.5 rounded-lg text-red-500"><Book size={18} className="fill-current" /></div>
             แบบฝึกทักษะจากครู (ยังไม่ทำ)
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
            {availableExams.map((exam) => (
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

      {/* Topics Grid (Pooled from DB) */}
      <div className="px-6 pb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <div className="bg-green-100 p-1.5 rounded-lg text-green-600"><Play size={18} className="fill-current" /></div>
          ฝึกฝนทั่วไป (Practice)
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
                <p className="text-xs text-gray-400 mt-0.5">สุ่มแบบฝึกหัด • 5 ข้อ</p>
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

interface NavigationProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/game') return null;
  if (location.pathname.startsWith('/teacher')) return null;

  const getTabClass = (tabName: string) => activeTab === tabName ? 'text-blue-600 scale-110' : 'text-gray-300';

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-8 py-3 flex justify-between items-center pb-6 rounded-t-[30px] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-40 max-w-md mx-auto right-0 font-sarabun border-x border-gray-200">
      <button onClick={() => { setActiveTab('home'); navigate('/'); }} className={`flex flex-col items-center gap-1 transition-all ${getTabClass('home')}`}>
        <div className={`p-2 rounded-xl ${activeTab === 'home' ? 'bg-blue-50' : ''}`}>
             <Play size={24} strokeWidth={2.5} className={activeTab === 'home' ? 'fill-blue-600' : ''} />
        </div>
        <span className="text-[10px] font-bold">เล่นเกม</span>
      </button>
      <button className={`flex flex-col items-center gap-1 transition-all text-gray-300 cursor-not-allowed`}>
        <div className="p-2">
            <Star size={24} strokeWidth={2.5} />
        </div>
        <span className="text-[10px] font-bold">อันดับ</span>
      </button>
      <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all ${getTabClass('profile')}`}>
        <div className={`p-2 rounded-xl ${activeTab === 'profile' ? 'bg-blue-50' : ''}`}>
            <User size={24} strokeWidth={2.5} className={activeTab === 'profile' ? 'fill-blue-600' : ''} />
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
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('home');
  // Activity Logs for User
  const [userLogs, setUserLogs] = useState<ActivityLog[]>([]);

  // Fetch logs when user logs in or game finishes to keep state fresh
  const refreshLogs = async () => {
    if (!user) return;
    const logs = await apiGetActivityLogs();
    setUserLogs(logs);
  };

  useEffect(() => {
    if (user) refreshLogs();
  }, [user]);

  const handleLogin = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    setActiveTab('home');
  };

  const handleLogout = () => {
    setUser(null);
    setGameQuestions([]);
    setShowGame(false);
    setUserLogs([]);
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
        
        // Refresh logs to hide the completed exam immediately if it was homework
        setTimeout(refreshLogs, 1000);
    }
    setShowGame(false);
    setCurrentExamId(undefined);
  };
  
  // Define standardized container for Mobile View (Login & Student)
  const mobileContainerClass = "min-h-screen bg-slate-50 font-sarabun max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-200";

  if (!user) {
    return (
        <div className={mobileContainerClass}>
            <LoginScreen onLogin={handleLogin} />
        </div>
    );
  }

  const MainLayout = () => {
    const location = useLocation();
    const isTeacherMode = location.pathname.startsWith('/teacher');
    
    // Redirect if not teacher
    if (isTeacherMode && user?.role !== 'teacher') {
        // Simple redirect protection
    }

    const containerClasses = isTeacherMode 
      ? "min-h-screen bg-slate-50 font-sarabun w-full mx-auto" 
      : mobileContainerClass;

    if (showGame && user) {
      return (
        <div className={mobileContainerClass}>
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
          <Route path="/" element={
            <HomeScreen 
                user={user!} 
                onStartGame={startGame} 
                onLogout={handleLogout} 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                logs={userLogs}
            />
          } />
          <Route path="/teacher" element={<TeacherDashboard />} />
        </Routes>
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  };

  return (
    <HashRouter>
      <MainLayout />
    </HashRouter>
  );
};

export default App;