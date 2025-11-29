import React, { useState, useEffect } from 'react';
import { apiLogin } from '../services/sheetApi';
import { UserProfile } from '../types';
import { User, Delete, ChevronLeft, KeyRound } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'student' | 'teacher'>('student');
  const [studentId, setStudentId] = useState('');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'student' && studentId.length === 5) {
        handleStudentLogin(studentId);
    }
  }, [studentId]);

  const handleStudentLogin = async (id: string) => {
    setLoading(true);
    setError('');
    const result = await apiLogin(id, id);
    setLoading(false);

    if (result.success && result.user) {
        onLogin(result.user);
    } else {
        setError('รหัสไม่ถูกต้อง');
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
      if (result.user.role !== 'teacher') setError('ไม่ใช่บัญชีครู'); else onLogin(result.user);
    } else {
      setError(result.message || 'ข้อมูลไม่ถูกต้อง');
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

  if (mode === 'student') {
    return (
        <div className="min-h-full w-full bg-gradient-to-b from-sky-100 via-white to-pink-50 flex flex-col items-center justify-center p-4 font-sarabun relative">
            <div className="w-full max-w-sm bg-white/90 backdrop-blur-sm rounded-[32px] shadow-2xl p-6 relative z-10 border-4 border-white">
                <div className="text-center mb-5">
                    <div className="relative mx-auto w-16 h-16 mb-2 group">
                        <div className="bg-white w-full h-full rounded-full flex items-center justify-center border-4 border-yellow-300 shadow-md relative z-10 overflow-hidden ring-4 ring-white">
                            <span className="text-3xl">🧒</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">ThaiQuest</h1>
                    <p className="text-slate-500 font-bold text-xs bg-white/60 inline-block px-2 py-0.5 rounded-full border border-slate-100">เข้าสู่ระบบนักเรียน</p>
                </div>

                <div className="flex justify-center gap-2 mb-5">
                    {[0, 1, 2, 3, 4].map((i) => {
                        const digit = studentId[i];
                        const isFilled = digit !== undefined;
                        const isActive = i === studentId.length;
                        return (
                            <div key={i} className={`w-10 h-12 rounded-xl flex items-center justify-center text-2xl font-black transition-all duration-300 shadow-sm ${isFilled ? 'bg-indigo-500 border-2 border-indigo-600 text-white' : isActive ? 'bg-white border-2 border-indigo-400 ring-2 ring-indigo-50' : 'bg-white border-2 border-slate-200 text-slate-300'}`}>
                                {isFilled ? '•' : ''}
                            </div>
                        );
                    })}
                </div>

                <div className="h-6 mb-2 flex items-center justify-center text-xs">
                    {error && <div className="text-red-500 font-bold animate-shake flex items-center gap-1">{error}</div>}
                    {loading && <div className="text-indigo-600 font-bold animate-pulse flex items-center gap-1">กำลังตรวจสอบ...</div>}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5 px-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button key={num} onClick={() => handleKeypadPress(num.toString())} className="h-12 w-full rounded-2xl bg-white border-b-[3px] border-slate-200 active:border-b-0 active:translate-y-0.5 text-xl font-black text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm flex items-center justify-center">
                            {num}
                        </button>
                    ))}
                    <div /> 
                    <button onClick={() => handleKeypadPress('0')} className="h-12 w-full rounded-2xl bg-white border-b-[3px] border-slate-200 active:border-b-0 active:translate-y-0.5 text-xl font-black text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm flex items-center justify-center">0</button>
                    <button onClick={handleBackspace} className="h-12 w-full rounded-2xl bg-red-50 border-b-[3px] border-red-200 active:border-b-0 active:translate-y-0.5 text-red-500 hover:bg-red-100 transition-all shadow-sm flex items-center justify-center"><Delete size={18} /></button>
                </div>

                <div className="text-center border-t border-slate-100 pt-3">
                    <button onClick={() => setMode('teacher')} className="text-xs text-slate-400 hover:text-indigo-600 font-bold transition-colors flex items-center justify-center gap-1 mx-auto"><User size={14} /> สำหรับคุณครู</button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-slate-100 flex flex-col items-center justify-center p-4 font-sarabun relative">
      <div className="w-full max-w-sm bg-white rounded-[32px] shadow-xl p-8 border border-slate-100 relative z-10">
        <div className="text-center mb-6">
            <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-600 border border-slate-200"><User size={32} /></div>
            <h1 className="text-xl font-black text-slate-800">ระบบคุณครู</h1>
        </div>
        <form onSubmit={handleTeacherLogin} className="space-y-3">
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">Username</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none text-sm font-bold text-slate-700 bg-slate-50" placeholder="teacher" /></div>
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none text-sm font-bold text-slate-700 bg-slate-50" placeholder="••••••" /></div>
            {error && <div className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-70 text-sm">{loading ? '...' : 'เข้าสู่ระบบ'}</button>
        </form>
        <div className="text-center mt-4 pt-3 border-t border-slate-100"><button onClick={() => { setMode('student'); setError(''); }} className="text-xs text-indigo-600 font-bold hover:underline flex items-center justify-center gap-1 mx-auto"><ChevronLeft size={14} /> กลับไปหน้าจอนักเรียน</button></div>
      </div>
    </div>
  );
};

export default LoginScreen;