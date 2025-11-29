import React, { useState, useEffect } from 'react';
import { apiLogin } from '../services/sheetApi';
import { UserProfile } from '../types';
import { User, Delete, ChevronLeft, Star, KeyRound } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'student' | 'teacher'>('student');
  const [studentId, setStudentId] = useState('');
  
  // Teacher Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto submit student login when 5 digits are entered
    if (mode === 'student' && studentId.length === 5) {
        handleStudentLogin(studentId);
    }
  }, [studentId]);

  const handleStudentLogin = async (id: string) => {
    setLoading(true);
    setError('');
    // For student login, we use ID as both username and password (or handle it in backend)
    const result = await apiLogin(id, id);
    setLoading(false);

    if (result.success && result.user) {
        onLogin(result.user);
    } else {
        setError('รหัสนักเรียนไม่ถูกต้อง');
        setStudentId('');
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await apiLogin(username, password);
    setLoading(false);

    if (result.success && result.user) {
      if (result.user.role !== 'teacher') {
          setError('บัญชีนี้ไม่ใช่บัญชีคุณครู');
      } else {
          onLogin(result.user);
      }
    } else {
      setError(result.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleKeypadPress = (num: string) => {
    if (studentId.length < 5) {
        setStudentId(prev => prev + num);
        setError('');
    }
  };

  const handleBackspace = () => {
    setStudentId(prev => prev.slice(0, -1));
    setError('');
  };

  // --------------------------------------------------------------------------
  // RENDER: STUDENT LOGIN (KEYPAD)
  // --------------------------------------------------------------------------
  if (mode === 'student') {
    return (
        <div className="min-h-full w-full bg-gradient-to-b from-sky-50 via-white to-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sarabun animate-fade-in">
            {/* Background Decor - Thai Pattern abstract */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                 <div className="absolute -top-10 -left-10 w-48 h-48 bg-yellow-200/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                 <div className="absolute top-10 -right-10 w-56 h-56 bg-blue-200/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            </div>

            <div className="w-full relative z-10">
                <div className="text-center mb-8">
                    <div className="relative mx-auto w-24 h-24 mb-4">
                        <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
                        <div className="bg-white w-full h-full rounded-full flex items-center justify-center border-4 border-yellow-400 shadow-lg relative z-10 overflow-hidden transform hover:rotate-3 transition-transform">
                             <span className="text-5xl">🧒</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm z-20">
                            <Star size={14} className="fill-current" />
                        </div>
                    </div>
                    
                    <h1 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">ThaiQuest P.2</h1>
                    <p className="text-slate-500 font-medium text-sm">ยินดีต้อนรับคนเก่ง!</p>
                </div>

                {/* Display Dots */}
                <div className="flex justify-center gap-3 mb-8 h-14 items-center bg-white rounded-2xl border border-slate-200 shadow-sm mx-4">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className={`
                            w-3 h-3 rounded-full transition-all duration-300
                            ${i < studentId.length ? 'bg-blue-500 scale-125' : 'bg-slate-200'}
                        `}/>
                    ))}
                </div>

                {/* Status Messages */}
                <div className="h-8 mb-4 flex items-center justify-center">
                    {error && (
                        <div className="text-red-500 text-center font-bold animate-shake bg-red-50 px-3 py-1 rounded-full text-xs border border-red-100 flex items-center gap-1">
                            <KeyRound size={12}/> {error}
                        </div>
                    )}
                    {loading && (
                        <div className="text-blue-600 text-center font-bold animate-pulse text-sm">
                            กำลังตรวจสอบ...
                        </div>
                    )}
                </div>

                {/* Numeric Keypad */}
                <div className="grid grid-cols-3 gap-3 px-2 mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleKeypadPress(num.toString())}
                            className="h-16 w-full rounded-2xl bg-white border-b-[3px] border-slate-200 active:border-b-0 active:translate-y-[3px] active:bg-slate-50 text-2xl font-black text-slate-700 hover:text-blue-600 transition-all shadow-sm flex items-center justify-center"
                        >
                            {num}
                        </button>
                    ))}
                    <div /> 
                    <button
                        onClick={() => handleKeypadPress('0')}
                        className="h-16 w-full rounded-2xl bg-white border-b-[3px] border-slate-200 active:border-b-0 active:translate-y-[3px] active:bg-slate-50 text-2xl font-black text-slate-700 hover:text-blue-600 transition-all shadow-sm flex items-center justify-center"
                    >
                        0
                    </button>
                    <button
                        onClick={handleBackspace}
                        className="h-16 w-full rounded-2xl bg-red-50 border-b-[3px] border-red-200 active:border-b-0 active:translate-y-[3px] active:bg-red-100 text-red-400 hover:text-red-600 transition-all shadow-sm flex items-center justify-center"
                    >
                        <Delete size={24} />
                    </button>
                </div>

                <div className="text-center">
                    <button 
                        onClick={() => setMode('teacher')}
                        className="text-xs text-slate-400 hover:text-blue-600 font-bold transition-colors flex items-center justify-center gap-1 mx-auto py-2 px-4 rounded-lg hover:bg-slate-50"
                    >
                        <User size={14} /> สำหรับคุณครู (Teacher)
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: TEACHER LOGIN
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-full w-full bg-slate-50 flex flex-col items-center justify-center p-6 font-sarabun animate-fade-in">
      <div className="w-full relative">
        <div className="text-center mb-8">
            <div className="bg-white w-16 h-16 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-4 text-slate-700">
                <User size={32} />
            </div>
            <h1 className="text-xl font-black text-slate-800">
                ระบบคุณครู
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-medium uppercase tracking-wide">Teacher Access</p>
        </div>

        <form onSubmit={handleTeacherLogin} className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Username</label>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-slate-50 text-slate-800 font-bold placeholder-slate-300"
                placeholder="teacher"
                />
            </div>

            <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Password</label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-slate-50 text-slate-800 font-bold placeholder-slate-300"
                placeholder="••••••"
                />
            </div>

            {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs text-center font-bold border border-red-100 flex items-center justify-center gap-2">
                ⚠️ {error}
            </div>
            )}

            <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-70 text-sm mt-2"
            >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
        </form>

        <div className="text-center mt-6">
            <button 
                onClick={() => {
                    setMode('student');
                    setError('');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center justify-center gap-1 mx-auto hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
            >
                <ChevronLeft size={14} /> กลับไปหน้าจอนักเรียน
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;