import React, { useState, useEffect } from 'react';
import { apiLogin } from '../services/sheetApi';
import { UserProfile } from '../types';
import { User, Delete, ChevronLeft, Star } from 'lucide-react';

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
        setError('รหัสนักเรียนไม่ถูกต้อง ลองใหม่อีกครั้งนะ');
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
        <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sarabun">
            {/* Background Decor - Thai Pattern abstract */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                 <div className="absolute -top-20 -left-20 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                 <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                 <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full max-w-sm bg-white/80 backdrop-blur-md rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-6 border-4 border-white relative z-10">
                
                <div className="text-center mb-6">
                    <div className="relative mx-auto w-28 h-28 mb-4">
                        <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
                        <div className="bg-white w-full h-full rounded-full flex items-center justify-center border-4 border-yellow-400 shadow-lg relative z-10 overflow-hidden">
                             {/* Placeholder for Thai Cartoon */}
                             <span className="text-6xl">🧒</span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full border-2 border-white shadow-sm z-20">
                            <Star size={16} className="fill-current" />
                        </div>
                    </div>
                    
                    <h1 className="text-3xl font-bold text-blue-900 mb-1 drop-shadow-sm">ThaiQuest P.2</h1>
                    <p className="text-blue-600 font-medium">เกมภาษาไทยแสนสนุก</p>
                </div>

                {/* Display Dots */}
                <div className="flex justify-center gap-3 mb-8 h-16 items-center bg-blue-50/80 rounded-2xl border-2 border-blue-100 mx-4 shadow-inner">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className={`
                            w-4 h-4 rounded-full transition-all duration-300
                            ${i < studentId.length ? 'bg-yellow-400 scale-125 shadow-sm' : 'bg-gray-200'}
                        `}/>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="text-red-500 text-center font-bold mb-4 animate-shake bg-red-50 p-2 rounded-lg text-sm border border-red-100">
                        {error}
                    </div>
                )}
                {loading && (
                    <div className="text-blue-600 text-center font-bold mb-4 animate-pulse flex justify-center items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                        กำลังตรวจสอบ...
                    </div>
                )}

                {/* Numeric Keypad */}
                <div className="grid grid-cols-3 gap-4 mb-6 px-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleKeypadPress(num.toString())}
                            className="h-16 w-16 mx-auto rounded-2xl bg-white border-b-4 border-blue-200 active:border-b-0 active:translate-y-1 shadow-lg text-2xl font-bold text-blue-800 hover:bg-blue-50 transition-all flex items-center justify-center transform hover:scale-105"
                        >
                            {num}
                        </button>
                    ))}
                    {/* Empty Space */}
                    <div /> 
                    <button
                        onClick={() => handleKeypadPress('0')}
                        className="h-16 w-16 mx-auto rounded-2xl bg-white border-b-4 border-blue-200 active:border-b-0 active:translate-y-1 shadow-lg text-2xl font-bold text-blue-800 hover:bg-blue-50 transition-all flex items-center justify-center transform hover:scale-105"
                    >
                        0
                    </button>
                    <button
                        onClick={handleBackspace}
                        className="h-16 w-16 mx-auto rounded-2xl bg-red-50 border-b-4 border-red-200 active:border-b-0 active:translate-y-1 shadow-lg text-red-500 hover:bg-red-100 transition-all flex items-center justify-center transform hover:scale-105"
                    >
                        <Delete size={24} />
                    </button>
                </div>

                <div className="text-center mt-4 pt-4 border-t border-gray-100">
                    <button 
                        onClick={() => setMode('teacher')}
                        className="text-sm text-gray-400 hover:text-blue-600 font-medium transition-colors flex items-center justify-center gap-1 mx-auto"
                    >
                        <User size={14} /> สำหรับคุณครู (Teacher Login)
                    </button>
                </div>
            </div>
            
            <div className="mt-4 text-center text-xs text-gray-400 font-medium">
                © ThaiQuest P.2 - สื่อการเรียนรู้สำหรับเด็กไทย
            </div>
        </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: TEACHER LOGIN
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sarabun">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative border border-gray-200">
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        <div className="p-8">
            <div className="text-center mb-8">
              <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                 <User size={40} />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">
                 ระบบจัดการคุณครู
              </h1>
              <p className="text-gray-500 text-sm mt-1">Teacher Management System</p>
            </div>

            <form onSubmit={handleTeacherLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อผู้ใช้ (Username)</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="กรอกชื่อผู้ใช้"
                  />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">รหัสผ่าน (Password)</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="กรอกรหัสผ่าน"
                  />
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center font-medium border border-red-100 flex items-center justify-center gap-2">
                   ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-70"
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>

            <div className="text-center mt-8 pt-6 border-t border-gray-100">
                <button 
                    onClick={() => {
                        setMode('student');
                        setError('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-bold flex items-center justify-center gap-1 mx-auto hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                >
                    <ChevronLeft size={16} /> กลับไปหน้าจอนักเรียน
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;