
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOPICS, Exam, UserProfile, ActivityLog, Question, GameType } from '../types';
import { generateQuestions } from '../services/geminiService';
import { apiSaveExam, apiGetExams, apiGetStudents, apiSaveStudent, apiDeleteStudent, apiGetActivityLogs, apiDeleteExam, apiChangePassword } from '../services/sheetApi';
import { BookOpen, RefreshCw, Save, Library, Plus, Trash2, FileText, ZoomIn, ZoomOut, Home, Monitor, Users, UserPlus, Edit, Printer, X, PieChart, TrendingUp, AlertCircle, Award, CheckSquare, Square, PlusCircle, ArrowLeft, Search, Lock, Settings, ChevronRight, Key, ExternalLink, Eye, EyeOff, Check } from 'lucide-react';

const AVATAR_OPTIONS = ['👦', '👧', '🤓', '😎', '🦁', '🐰', '🐸', '🐼', '🦄', '🐱', '🐶', '🦊'];

type DashboardSection = 'menu' | 'create' | 'library' | 'students' | 'stats';

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<DashboardSection>('menu');
  
  // Settings & Password & API Key
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false); // Toggle password visibility

  // Exam State
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [examTitle, setExamTitle] = useState('');
  const [savedExams, setSavedExams] = useState<Exam[]>([]);
  const [viewingExam, setViewingExam] = useState<Exam | null>(null);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  
  // Exam Deletion State
  const [showDeleteExamModal, setShowDeleteExamModal] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingExam, setIsDeletingExam] = useState(false);

  // Question Editor State
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Student State
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSavingStudent, setIsSavingStudent] = useState(false); 
  const [isDeletingStudent, setIsDeletingStudent] = useState<string | null>(null); 

  // Analytics State
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({ username: '', name: '', avatar: '👦' });
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardStudent, setCardStudent] = useState<UserProfile | null>(null);
  
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    loadLibrary();
    // Load existing API Key if saved
    const savedKey = localStorage.getItem('THAIQUEST_GEMINI_KEY');
    if (savedKey) setCustomApiKey(savedKey);
  }, []);

  useEffect(() => {
    if (activeSection === 'students' || activeSection === 'library' || activeSection === 'stats') {
      loadStudents();
      loadStats();
    }
  }, [activeSection]);

  const loadLibrary = async () => {
    const exams = await apiGetExams();
    setSavedExams(exams.sort((a, b) => b.createdAt - a.createdAt));
  };

  const loadStudents = async () => {
    setIsLoadingStudents(true);
    const data = await apiGetStudents();
    setStudents(data);
    setIsLoadingStudents(false);
  };

  const loadStats = async () => {
    setLoadingStats(true);
    const logs = await apiGetActivityLogs();
    const studentData = await apiGetStudents();
    setActivityLogs(logs);
    setStudents(studentData);
    setLoadingStats(false);
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword.length < 4) {
        alert("รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร");
        return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        alert("รหัสผ่านยืนยันไม่ตรงกัน");
        return;
    }

    setIsChangingPassword(true);
    const result = await apiChangePassword('teacher', passwordForm.newPassword);
    setIsChangingPassword(false);

    if (result.success) {
        alert("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
        setPasswordForm({ newPassword: '', confirmPassword: '' });
    } else {
        alert("เกิดข้อผิดพลาด: " + result.message);
    }
  };

  const handleSaveApiKey = () => {
    if (customApiKey.trim().length > 0 && !customApiKey.startsWith('AIza')) {
        if(!window.confirm("API Key ดูเหมือนจะไม่ถูกต้อง (ควรขึ้นต้นด้วย AIza) คุณแน่ใจหรือไม่?")) {
            return;
        }
    }
    localStorage.setItem('THAIQUEST_GEMINI_KEY', customApiKey.trim());
    alert("บันทึก API Key เรียบร้อยแล้ว ระบบจะใช้ Key นี้ในการสร้างโจทย์");
    setShowSettingsModal(false);
  };

  // ... (Existing Analytics Helper Functions) ...
  const getStudentDetailedStats = () => {
    const stats: Record<string, { name: string, totalAttempts: number, maxScore: number, minScore: number, totalScore: number }> = {};
    students.forEach(s => { stats[s.username] = { name: s.name, totalAttempts: 0, maxScore: 0, minScore: 0, totalScore: 0 }; });
    activityLogs.forEach(log => {
        if (!stats[log.username]) stats[log.username] = { name: log.username, totalAttempts: 0, maxScore: 0, minScore: 1000, totalScore: 0 };
        const s = stats[log.username];
        s.totalAttempts += 1;
        s.totalScore += log.score;
        s.maxScore = Math.max(s.maxScore, log.score);
        s.minScore = s.totalAttempts === 1 ? log.score : Math.min(s.minScore, log.score);
    });
    return Object.values(stats).map(s => ({ ...s, avg: s.totalAttempts > 0 ? Math.round(s.totalScore / s.totalAttempts) : 0 })).sort((a, b) => b.avg - a.avg);
  };

  const getExamScores = (examTitle: string) => {
    const examLogs = activityLogs.filter(log => log.details.includes(examTitle));
    const studentScores: Record<string, { score: number }> = {};
    examLogs.forEach(log => { if (!studentScores[log.username] || log.score > studentScores[log.username].score) studentScores[log.username] = { score: log.score }; });
    return students.map(s => ({ ...s, hasTaken: !!studentScores[s.username], score: studentScores[s.username]?.score || 0 })).sort((a, b) => (b.hasTaken ? 1 : 0) - (a.hasTaken ? 1 : 0));
  };

  // ... (Existing Exam & Question Logic) ...
  const resetCreateForm = () => {
    setGeneratedContent([]);
    setExamTitle('');
    setEditingExamId(null);
    setSelectedQuestionIds(new Set());
    setIsGenerating(false);
    setSelectedTopic(TOPICS[0]);
  };

  const handleEditExam = (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation();
    const topic = TOPICS.find(t => t.id === exam.topicId) || TOPICS[0];
    setSelectedTopic(topic);
    setGeneratedContent(exam.questions);
    setSelectedQuestionIds(new Set(exam.questions.map(q => q.id)));
    setExamTitle(exam.title);
    setEditingExamId(exam.id);
    setActiveSection('create');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
        const questions = await generateQuestions(selectedTopic.name, 5);
        
        // Check if fallback questions were returned (ID usually starts with 'f')
        if (questions.length > 0 && questions[0].id.startsWith('f')) {
            alert("⚠️ แจ้งเตือน: ระบบ AI ไม่สามารถสร้างโจทย์ได้ในขณะนี้\n\n1. ตรวจสอบว่าใส่ API Key ในเมนูตั้งค่า (Settings) หรือยัง\n2. API Key ของคุณอาจหมดโควต้า\n\nระบบแสดง 'โจทย์สำรอง' แทนเพื่อให้ทดสอบได้");
        }

        setGeneratedContent(questions);
        const allIds = new Set(questions.map(q => q.id));
        setSelectedQuestionIds(allIds);
        if (!editingExamId) {
            setExamTitle(`แบบฝึกทักษะ: ${selectedTopic.name} (${new Date().toLocaleDateString('th-TH')})`);
        }
    } catch (e) {
        console.error("Critical error in handleGenerate", e);
        alert("เกิดข้อผิดพลาดในการสร้างโจทย์ กรุณาลองใหม่");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleGenerateMore = async () => {
    setIsGenerating(true);
    const newQuestions = await generateQuestions(selectedTopic.name, 5);
    
    if (newQuestions.length > 0 && newQuestions[0].id.startsWith('f')) {
        alert("⚠️ แจ้งเตือน: ระบบ AI ขัดข้อง (โจทย์สำรอง)");
    }

    setGeneratedContent(prev => {
        const combined = [...prev, ...newQuestions];
        newQuestions.forEach(q => setSelectedQuestionIds(ids => new Set(ids).add(q.id)));
        return combined;
    });
    setIsGenerating(false);
  };

  const toggleQuestionSelection = (id: string) => {
    const newSet = new Set(selectedQuestionIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedQuestionIds(newSet);
  };

  const handleAddNewQuestion = () => {
    const newQ: Question = { id: `manual-${Date.now()}`, type: GameType.MULTIPLE_CHOICE, prompt: "โจทย์คำถามใหม่...", choices: ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"], correctAnswer: "ตัวเลือก 1", explanation: "คำอธิบายเฉลย" };
    setGeneratedContent([...generatedContent, newQ]);
    setSelectedQuestionIds(prev => new Set(prev).add(newQ.id));
    openEditor(newQ);
  };

  const openEditor = (q: Question) => { setEditingQuestion({...q}); setShowEditModal(true); };
  const saveEditedQuestion = () => { if (!editingQuestion) return; setGeneratedContent(prev => prev.map(q => q.id === editingQuestion.id ? editingQuestion : q)); setShowEditModal(false); setEditingQuestion(null); };

  const handleSaveExam = async () => {
    if (!examTitle.trim()) { alert("กรุณาตั้งชื่อชุดแบบฝึกทักษะ"); return; }
    const finalQuestions = generatedContent.filter(q => selectedQuestionIds.has(q.id));
    if (finalQuestions.length === 0) { alert("กรุณาเลือกข้อสอบอย่างน้อย 1 ข้อ"); return; }
    
    // Logic for ID and CreatedAt
    const examId = editingExamId || `exam-${Date.now()}`;
    const createdAt = editingExamId 
        ? (savedExams.find(e => e.id === editingExamId)?.createdAt || Date.now()) 
        : Date.now();

    const newExam: Exam = { 
        id: examId, 
        title: examTitle, 
        topicId: selectedTopic.id, 
        questions: finalQuestions, 
        createdAt: createdAt
    };

    // If Editing, delete old first (simulating update)
    if (editingExamId) {
        const deleteSuccess = await apiDeleteExam(editingExamId);
        if (!deleteSuccess) {
            alert("เกิดข้อผิดพลาด: ไม่สามารถลบข้อมูลเดิมเพื่ออัปเดตได้ (Database Error)");
            return;
        }
    }

    const success = await apiSaveExam(newExam);
    if (success) {
        alert(editingExamId ? "✅ อัปเดตข้อมูลเรียบร้อยแล้ว!" : "✅ บันทึกแบบฝึกทักษะเรียบร้อยแล้ว!");
        resetCreateForm();
        loadLibrary(); 
        setActiveSection('library');
    } else {
        alert("บันทึกไม่สำเร็จ");
    }
  };

  const initiateDeleteExam = (exam: Exam, e: React.MouseEvent) => { e.stopPropagation(); setExamToDelete(exam); setDeletePassword(''); setShowDeleteExamModal(true); };
  const confirmDeleteExam = async () => {
      if (!examToDelete) return;
      if (deletePassword !== '1234') { alert('รหัสผ่านไม่ถูกต้อง'); return; }
      setIsDeletingExam(true);
      const success = await apiDeleteExam(examToDelete.id);
      setIsDeletingExam(false);
      if (success) { setSavedExams(prev => prev.filter(e => e.id !== examToDelete.id)); setShowDeleteExamModal(false); setExamToDelete(null); } else alert('ลบไม่สำเร็จ');
  };

  // ... (Student Logic) ...
  const generateStudentId = () => { const id = Math.floor(10000 + Math.random() * 90000).toString(); setStudentForm(prev => ({ ...prev, username: id })); };
  const handleEditStudent = (student: UserProfile) => { setStudentForm({ username: student.username, name: student.name, avatar: student.avatar || '👦' }); setShowStudentModal(true); };
  const handleDeleteStudent = async (username: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าจะลบนักเรียนรหัส ${username}?`)) {
        setIsDeletingStudent(username);
        try { const result = await apiDeleteStudent(username); if (result.success) { setStudents(prev => prev.filter(s => s.username !== username)); loadStudents(); } } catch (e) { alert('Error'); } finally { setIsDeletingStudent(null); }
    }
  };
  const handleSaveStudent = async () => {
    if (!studentForm.name || !studentForm.username || studentForm.username.length !== 5) { alert('ข้อมูลไม่ถูกต้อง'); return; }
    setIsSavingStudent(true);
    try { const success = await apiSaveStudent(studentForm); if (success) { setShowStudentModal(false); setStudentForm({ username: '', name: '', avatar: '👦' }); loadStudents(); } } catch (e) { alert('Error'); } finally { setIsSavingStudent(false); }
  };
  
  const handlePrintCard = () => {
    const printContent = document.getElementById('printable-card');
    if (printContent) { const win = window.open('', '', 'height=500,width=500'); if (win) { win.document.write('<html><head><title>Card</title><link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;800&display=swap" rel="stylesheet"><script src="https://cdn.tailwindcss.com"></script></head><body>' + printContent.innerHTML + '</body></html>'); win.document.close(); win.print(); } }
  };

  const adjustZoom = (delta: number) => setZoomLevel(prev => parseFloat(Math.min(Math.max(prev + delta, 0.7), 1.5).toFixed(1)));

  // =================================================================================
  // MAIN RENDER
  // =================================================================================
  return (
    <div className="min-h-screen flex flex-col font-sarabun bg-slate-50 transition-all origin-top-center" style={{ zoom: zoomLevel } as any}>
        
        {/* Navbar - Centered Content */}
        <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                     <button onClick={() => navigate('/')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <Home size={20} />
                     </button>
                     <h1 className="text-xl font-bold text-gray-800">ระบบคุณครู <span className="text-blue-600 font-extrabold text-sm ml-2 bg-blue-50 px-2 py-1 rounded-md tracking-wider">THAI FOR KID</span></h1>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button onClick={() => adjustZoom(-0.1)} className="p-2 hover:bg-white rounded-md transition-all"><ZoomOut size={16} /></button>
                        <span className="text-xs font-bold text-gray-500 w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={() => adjustZoom(0.1)} className="p-2 hover:bg-white rounded-md transition-all"><ZoomIn size={16} /></button>
                    </div>
                    <button 
                        onClick={() => setShowSettingsModal(true)}
                        className="p-3 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-blue-600 hover:border-blue-400 shadow-sm transition-all relative group"
                        title="ตั้งค่า"
                    >
                        <Settings size={20} />
                        {!customApiKey && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                    </button>
                </div>
            </div>
        </div>

        {/* Content Area - Centered */}
        <div className="flex-1 w-full flex justify-center bg-slate-50">
            <div className="w-full max-w-7xl p-4 md:p-8">
            
            {/* Header / Breadcrumb */}
            {activeSection !== 'menu' && (
                <button 
                    onClick={() => { setActiveSection('menu'); setViewingExam(null); resetCreateForm(); }} 
                    className="mb-6 flex items-center gap-2 text-gray-700 hover:text-blue-600 font-bold transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-300 w-fit"
                >
                    <ArrowLeft size={20} /> กลับสู่เมนูหลัก (Main Menu)
                </button>
            )}

            {/* 1. MENU SECTION (Landing Page) */}
            {activeSection === 'menu' && (
                <div className="animate-scale-up">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">ยินดีต้อนรับคุณครู 👋</h2>
                        <p className="text-gray-500">เลือกเมนูเพื่อจัดการการเรียนการสอน</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <button 
                            onClick={() => { resetCreateForm(); setActiveSection('create'); }}
                            className="bg-white p-8 rounded-[30px] shadow-sm border-2 border-transparent hover:border-blue-500 hover:shadow-xl transition-all group text-left flex flex-col justify-between h-64 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                            <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 mb-4 z-10 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Plus size={32} />
                            </div>
                            <div className="z-10">
                                <h3 className="text-xl font-bold text-gray-800 mb-1">สร้างแบบฝึก</h3>
                                <p className="text-sm text-gray-500">Create New Exam</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => setActiveSection('library')}
                            className="bg-white p-8 rounded-[30px] shadow-sm border-2 border-transparent hover:border-green-500 hover:shadow-xl transition-all group text-left flex flex-col justify-between h-64 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-[100px] -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                            <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center text-green-600 mb-4 z-10 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                <Library size={32} />
                            </div>
                            <div className="z-10">
                                <h3 className="text-xl font-bold text-gray-800 mb-1">คลังแบบฝึก</h3>
                                <p className="text-sm text-gray-500">Exam Library</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => setActiveSection('students')}
                            className="bg-white p-8 rounded-[30px] shadow-sm border-2 border-transparent hover:border-orange-500 hover:shadow-xl transition-all group text-left flex flex-col justify-between h-64 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[100px] -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                            <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center text-orange-600 mb-4 z-10 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <Users size={32} />
                            </div>
                            <div className="z-10">
                                <h3 className="text-xl font-bold text-gray-800 mb-1">ข้อมูลนักเรียน</h3>
                                <p className="text-sm text-gray-500">Student List</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => setActiveSection('stats')}
                            className="bg-white p-8 rounded-[30px] shadow-sm border-2 border-transparent hover:border-purple-500 hover:shadow-xl transition-all group text-left flex flex-col justify-between h-64 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[100px] -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                            <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center text-purple-600 mb-4 z-10 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <TrendingUp size={32} />
                            </div>
                            <div className="z-10">
                                <h3 className="text-xl font-bold text-gray-800 mb-1">สถิติ & รายงาน</h3>
                                <p className="text-sm text-gray-500">Analytics</p>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* 2. CREATE / EDIT SECTION */}
            {activeSection === 'create' && (
                <div className="animate-fade-in">
                     <div className="mb-6 pb-4 border-b">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            {editingExamId ? <Edit className="text-orange-500" /> : <Plus className="text-blue-600" />} 
                            {editingExamId ? 'แก้ไขแบบฝึกทักษะ (Edit Exam)' : 'สร้างแบบฝึกทักษะใหม่ (AI)'}
                        </h2>
                     </div>
                     <div className="grid md:grid-cols-12 gap-8">
                        {/* Logic from previous create tab */}
                        <div className="md:col-span-4 space-y-6">
                            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-lg mb-4 text-gray-800">1. เลือกหัวข้อ (Topic)</h3>
                                <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto">
                                    {TOPICS.map(topic => (
                                    <button key={topic.id} onClick={() => setSelectedTopic(topic)} className={`p-4 rounded-xl text-left transition-all flex items-center gap-3 ${selectedTopic.id === topic.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'}`}>
                                        <span className="text-2xl">{topic.icon}</span>
                                        <span className="font-bold">{topic.name}</span>
                                    </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all disabled:opacity-70 flex justify-center items-center gap-2">
                                {isGenerating ? <><RefreshCw className="animate-spin" /> กำลังสร้าง...</> : <><RefreshCw /> สร้างโจทย์ด้วย AI</>}
                            </button>
                            {generatedContent.length > 0 && (
                                <button onClick={handleGenerateMore} disabled={isGenerating} className="w-full py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all disabled:opacity-70 flex justify-center items-center gap-2">
                                    {isGenerating ? <span className="animate-spin">⏳</span> : <PlusCircle />} สร้างเพิ่ม
                                </button>
                            )}
                        </div>

                        <div className="md:col-span-8 bg-gray-50 p-6 rounded-3xl border border-gray-200 shadow-inner h-fit min-h-[600px] flex flex-col">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-gray-800">2. ตรวจสอบและแก้ไข (Questions)</h3>
                                {generatedContent.length > 0 && <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">เลือก {Array.from(selectedQuestionIds).length} / {generatedContent.length} ข้อ</span>}
                             </div>
                             <div className="space-y-4 flex-1 overflow-y-auto pr-2 mb-4 max-h-[500px]">
                                {generatedContent.length === 0 ? (
                                    <div className="text-center text-gray-500 py-20 border-2 border-dashed border-gray-300 rounded-2xl bg-white flex flex-col items-center">
                                        <BookOpen size={40} className="mb-2 opacity-50 text-gray-400" />
                                        <p className="font-bold">เลือกหัวข้อแล้วกดปุ่มสร้างเพื่อเริ่ม</p>
                                    </div>
                                ) : (
                                    generatedContent.map((q, idx) => (
                                        <div key={q.id} className={`p-5 rounded-2xl border-2 transition-all ${selectedQuestionIds.has(q.id) ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-100' : 'bg-white border-gray-300 opacity-60'}`}>
                                            <div className="flex gap-4">
                                                <button onClick={() => toggleQuestionSelection(q.id)} className="mt-1">
                                                    {selectedQuestionIds.has(q.id) ? <CheckSquare className="text-blue-600 w-8 h-8 fill-blue-50" /> : <Square className="text-gray-400 w-8 h-8" />}
                                                </button>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start gap-4 mb-3">
                                                        <p className="font-bold text-lg text-gray-900 leading-snug">{idx + 1}. {q.prompt}</p>
                                                        <button 
                                                            onClick={() => openEditor(q)} 
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 font-bold text-sm transition-colors whitespace-nowrap shadow-sm border border-amber-200"
                                                        >
                                                            <Edit size={16} /> แก้ไข
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                                        {q.choices?.map((c, i) => (
                                                            <div key={i} className={`text-sm px-3 py-2 rounded-lg border font-medium ${c === q.correctAnswer ? 'bg-green-100 border-green-500 text-green-900 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                                                {c} {c === q.correctAnswer && <Check size={14} className="inline ml-1 text-green-600"/>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2">
                                                        <span className="text-lg">💡</span>
                                                        <p className="text-sm text-blue-900 font-medium">{q.explanation}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                             </div>
                             <div className="pt-4 border-t border-gray-200 space-y-4">
                                <button onClick={handleAddNewQuestion} className="w-full py-3 border-2 border-dashed border-gray-400 text-gray-600 rounded-xl hover:bg-white hover:border-gray-500 flex justify-center items-center gap-2 font-bold transition-all"><PlusCircle size={20} /> เพิ่มโจทย์เอง (Add Question)</button>
                                {generatedContent.length > 0 && (
                                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 flex flex-col gap-3 shadow-sm">
                                        <div className="flex-1">
                                            <label className="block text-sm font-bold text-blue-900 mb-1 ml-1">ตั้งชื่อชุดแบบฝึกทักษะ</label>
                                            <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} className="w-full p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800" placeholder="เช่น แบบฝึกบทที่ 1 เรื่อง..." />
                                        </div>
                                        <div className="flex gap-3 mt-2">
                                            {editingExamId && (
                                                <button onClick={() => { resetCreateForm(); setActiveSection('library'); }} className="flex-1 h-12 px-6 bg-white border border-gray-300 text-gray-600 rounded-xl font-bold hover:bg-gray-100">
                                                    ยกเลิก
                                                </button>
                                            )}
                                            <button onClick={handleSaveExam} className={`flex-1 h-12 px-6 ${editingExamId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'} text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-colors`}>
                                                <Save size={20} /> {editingExamId ? 'บันทึกการแก้ไข' : 'บันทึกเข้าระบบ'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                     </div>
                </div>
            )}

            {/* 3. LIBRARY SECTION */}
            {activeSection === 'library' && (
                <div className="animate-fade-in">
                     <div className="mb-6 pb-4 border-b">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Library className="text-green-600" /> คลังแบบฝึกทักษะ
                        </h2>
                     </div>
                     
                     {viewingExam ? (
                        // Detail View Code
                        <div className="animate-scale-up">
                            <button onClick={() => setViewingExam(null)} className="mb-4 text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1"><ArrowLeft size={16}/> ย้อนกลับ</button>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">{viewingExam.title}</h2>
                                <p className="text-gray-500">สร้างเมื่อ {new Date(viewingExam.createdAt).toLocaleDateString('th-TH')} • {viewingExam.questions.length} ข้อ</p>
                            </div>
                            <div className="grid lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-4">
                                    {viewingExam.questions.map((q, idx) => (
                                        <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200">
                                            <p className="font-bold text-gray-800 mb-2">{idx+1}. {q.prompt}</p>
                                            <div className="flex flex-wrap gap-2">{q.choices?.map((c,i) => <span key={i} className={`px-3 py-1 rounded-lg text-sm border ${c===q.correctAnswer ? 'bg-green-100 border-green-200 text-green-900 font-bold' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>{c}</span>)}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white p-5 rounded-3xl border border-gray-200 h-fit">
                                    <h3 className="font-bold mb-4 flex items-center gap-2"><Award className="text-yellow-500"/> คะแนนนักเรียน</h3>
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                        {getExamScores(viewingExam.title).map(s => (
                                            <div key={s.username} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-2"><span className="text-xl">{s.avatar}</span> <div className="leading-tight"><p className="font-bold text-sm">{s.name}</p><p className="text-[10px] text-gray-400">{s.hasTaken ? 'ส่งแล้ว' : 'ยังไม่ทำ'}</p></div></div>
                                                <span className={`font-bold ${s.hasTaken ? (s.score < viewingExam.questions.length*5 ? 'text-red-500' : 'text-green-600') : 'text-gray-300'}`}>{s.hasTaken ? s.score : '-'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                     ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedExams.map(exam => (
                                <div key={exam.id} onClick={() => setViewingExam(exam)} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between h-48 relative">
                                    <div>
                                        <div className="flex justify-between mb-3"><div className="bg-blue-50 text-blue-600 p-2 rounded-xl"><FileText size={20} /></div><span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-1 rounded-lg">{new Date(exam.createdAt).toLocaleDateString('th-TH')}</span></div>
                                        <h3 className="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600">{exam.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{exam.questions.length} ข้อคำถาม</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 gap-2">
                                        <span className="text-xs font-bold text-blue-600 flex items-center gap-1 flex-1">ดูรายละเอียด <ChevronRight size={14}/></span>
                                        <div className="flex gap-2">
                                            <button onClick={(e) => handleEditExam(exam, e)} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors font-bold text-xs flex items-center gap-1" title="แก้ไข">
                                                <Edit size={14}/> แก้ไข
                                            </button>
                                            <button onClick={(e) => initiateDeleteExam(exam, e)} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg transition-colors font-bold text-xs flex items-center gap-1" title="ลบ">
                                                <Trash2 size={14}/> ลบ
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     )}
                </div>
            )}

            {/* 4. STUDENTS & 5. STATS */}
            {(activeSection === 'students' || activeSection === 'stats') && (
                <div className="animate-fade-in">
                    <div className="mb-6 pb-4 border-b flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            {activeSection === 'students' ? <><Users className="text-orange-600" /> ข้อมูลนักเรียน</> : <><TrendingUp className="text-purple-600" /> สถิติภาพรวม</>}
                        </h2>
                        {activeSection === 'students' && <button onClick={() => { setStudentForm({ username: '', name: '', avatar: '👦' }); generateStudentId(); setShowStudentModal(true); }} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-green-700 flex items-center gap-2"><UserPlus size={18}/> เพิ่มนักเรียน</button>}
                    </div>
                    
                    {activeSection === 'students' ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="p-4 font-bold text-gray-600">นร.</th><th className="p-4 font-bold text-gray-600">รหัส</th><th className="p-4 font-bold text-gray-600">ชื่อ</th><th className="p-4 font-bold text-gray-600">XP</th><th className="p-4 font-bold text-gray-600 text-right">Action</th></tr></thead>
                                <tbody className="divide-y divide-gray-50">{students.map(s => (<tr key={s.username} className="hover:bg-blue-50"><td className="p-4 text-2xl">{s.avatar}</td><td className="p-4 font-mono font-bold text-blue-600">{s.username}</td><td className="p-4 font-bold text-gray-700">{s.name}</td><td className="p-4 text-gray-600 font-medium">{s.xp}</td><td className="p-4 flex justify-end gap-2"><button onClick={() => {setCardStudent(s); setShowCardModal(true)}} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Printer size={16}/></button><button onClick={() => handleEditStudent(s)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit size={16}/></button><button onClick={() => handleDeleteStudent(s.username)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={16}/></button></td></tr>))}</tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200"><p className="text-gray-500 text-xs uppercase font-bold">Total Attempts</p><p className="text-3xl font-bold text-blue-600">{activityLogs.length}</p></div>
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200"><p className="text-gray-500 text-xs uppercase font-bold">Students</p><p className="text-3xl font-bold text-orange-600">{students.length}</p></div>
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200"><p className="text-gray-500 text-xs uppercase font-bold">Avg Score</p><p className="text-3xl font-bold text-green-600">{activityLogs.length > 0 ? Math.round(activityLogs.reduce((a, b) => a + b.score, 0) / activityLogs.length) : 0}</p></div>
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200"><p className="text-gray-500 text-xs uppercase font-bold">Exams</p><p className="text-3xl font-bold text-purple-600">{savedExams.length}</p></div>
                            </div>
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">ผลการเรียนรายบุคคล</div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="text-xs uppercase text-gray-400"><tr><th className="p-4">Name</th><th className="p-4 text-center">Attempts</th><th className="p-4 text-center">Max</th><th className="p-4 text-center">Avg</th><th className="p-4">Status</th></tr></thead>
                                        <tbody className="divide-y divide-gray-50">{getStudentDetailedStats().map((s,i) => (<tr key={i} className="hover:bg-gray-50"><td className="p-4 font-bold text-gray-700">{s.name}</td><td className="p-4 text-center">{s.totalAttempts}</td><td className="p-4 text-center text-green-600">{s.maxScore}</td><td className="p-4 text-center font-bold text-blue-600">{s.avg}</td><td className="p-4">{s.avg >= 50 ? <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">ผ่าน</span> : <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded">ปรับปรุง</span>}</td></tr>))}</tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            </div>
        </div>

        {/* ======================= SETTINGS MODAL ======================= */}
        {showSettingsModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative animate-scale-up max-h-[90vh] overflow-y-auto">
                    <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
                    <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2"><Settings className="text-gray-600" /> ตั้งค่าระบบ</h3>
                    <div className="mb-8 p-5 bg-blue-50 rounded-2xl border border-blue-100">
                         <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2 text-sm uppercase"><Key size={14} /> Gemini API Key</h4>
                         <div className="mb-4">
                            <p className="text-xs text-blue-600 mb-1 font-bold">1. ขอรับ API Key (ฟรี)</p>
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"><ExternalLink size={14} /> ไปที่ Google AI Studio</a>
                         </div>
                         <div>
                            <p className="text-xs text-blue-600 mb-1 font-bold">2. นำ Key มาวางที่นี่</p>
                            <div className="relative">
                                <input type={showApiKey ? "text" : "password"} value={customApiKey} onChange={(e) => setCustomApiKey(e.target.value)} className="w-full p-2 pr-10 border border-blue-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-400 outline-none" placeholder="วาง AIzaSy... ที่นี่" />
                                <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600">{showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                            </div>
                         </div>
                         <button onClick={handleSaveApiKey} className="mt-3 text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-bold w-full hover:bg-blue-700 transition-colors shadow-sm">บันทึก API Key</button>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                         <h4 className="font-bold text-gray-700 text-sm uppercase flex items-center gap-2"><Lock size={14} /> เปลี่ยนรหัสผ่านครู</h4>
                        <div><input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all text-sm" placeholder="รหัสผ่านใหม่" /></div>
                        <div><input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all text-sm" placeholder="ยืนยันรหัสผ่านใหม่" /></div>
                        <button onClick={handleChangePassword} disabled={isChangingPassword} className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold shadow-lg hover:bg-black mt-2 transition-all text-sm">{isChangingPassword ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}</button>
                    </div>
                </div>
            </div>
        )}

        {/* ======================= DELETE MODAL ======================= */}
        {showDeleteExamModal && examToDelete && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] backdrop-blur-sm p-4"><div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-scale-up"><button onClick={() => setShowDeleteExamModal(false)} className="absolute top-4 right-4 text-gray-400"><X /></button><div className="text-center mb-6"><div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} className="text-red-500" /></div><h3 className="text-xl font-bold text-gray-800">ลบแบบฝึกทักษะ?</h3><p className="text-gray-500 mt-2">"{examToDelete.title}"</p></div><input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl mb-4 text-center font-bold text-gray-800" placeholder="รหัสยืนยัน (1234)" /><div className="flex gap-3"><button onClick={() => setShowDeleteExamModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200">ยกเลิก</button><button onClick={confirmDeleteExam} disabled={isDeletingExam} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600">{isDeletingExam ? '...' : 'ลบ'}</button></div></div></div>
        )}
        
        {/* ======================= EDIT QUESTION MODAL (High Contrast Update) ======================= */}
        {showEditModal && editingQuestion && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl animate-fade-in relative border-4 border-white">
                    <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X /></button>
                    
                    <h3 className="font-bold text-xl mb-4 text-gray-900 border-b pb-2 flex items-center gap-2">
                        <Edit className="text-blue-600"/> แก้ไขโจทย์ (Edit Question)
                    </h3>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-1">โจทย์คำถาม</label>
                        <input 
                            type="text" 
                            value={editingQuestion.prompt} 
                            onChange={(e) => setEditingQuestion({...editingQuestion, prompt: e.target.value})} 
                            className="w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800 bg-white" 
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {editingQuestion.choices?.map((c, i) => (
                            <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <label className="block text-xs font-bold text-gray-500 mb-1">ตัวเลือกที่ {i+1}</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={c} 
                                        onChange={(e) => {
                                            const nc=[...(editingQuestion.choices||[])]; 
                                            nc[i]=e.target.value; 
                                            // update correct answer if text changes
                                            const newCorrect = editingQuestion.correctAnswer===c ? e.target.value : editingQuestion.correctAnswer;
                                            setEditingQuestion({...editingQuestion, choices: nc, correctAnswer: newCorrect})
                                        }} 
                                        className={`w-full p-2 border-2 rounded-lg font-medium text-gray-800 outline-none focus:border-blue-400 ${editingQuestion.correctAnswer===c ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'}`} 
                                    />
                                    <button 
                                        onClick={() => setEditingQuestion({...editingQuestion, correctAnswer: c})} 
                                        className={`p-2 rounded-lg transition-all ${editingQuestion.correctAnswer===c ? 'bg-green-500 text-white shadow-md' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                                        title="ตั้งเป็นคำตอบที่ถูก"
                                    >
                                        <Check size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mb-6">
                         <label className="block text-sm font-bold text-gray-700 mb-1">คำอธิบายเฉลย (Explanation)</label>
                        <textarea 
                            value={editingQuestion.explanation} 
                            onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})} 
                            className="w-full p-3 border-2 border-gray-300 rounded-xl h-20 outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white" 
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button onClick={() => setShowEditModal(false)} className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl transition-colors">ยกเลิก</button>
                        <button onClick={saveEditedQuestion} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"><Save size={18}/> บันทึกการแก้ไข</button>
                    </div>
                </div>
            </div>
        )}

        {/* Print Modal */}
        {showCardModal && cardStudent && (
             <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4"><div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden"><div className="p-4 border-b flex justify-between"><h3 className="font-bold">พิมพ์บัตร</h3><button onClick={() => setShowCardModal(false)}><X/></button></div><div className="p-8 bg-gray-100 flex justify-center"><div id="printable-card" className="w-[350px] h-[220px] bg-white rounded-2xl shadow-xl border border-gray-300 overflow-hidden relative flex flex-col items-center justify-center text-center p-4"><div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"></div><div className="bg-blue-50 w-20 h-20 flex items-center justify-center rounded-full mb-2 border-4 border-blue-100 text-5xl">{cardStudent.avatar || '👦'}</div><h2 className="text-xl font-bold text-gray-800 mb-1">บัตรประจำตัวนักเรียน</h2><div className="w-full bg-slate-50 py-2 px-3 border border-dashed border-gray-300 rounded-lg mb-2"><p className="text-2xl font-mono font-black text-slate-800 tracking-[0.2em]">{cardStudent.username}</p></div><p className="font-bold text-lg text-blue-700 truncate w-full px-2">{cardStudent.name}</p></div></div><div className="p-4 border-t flex justify-end"><button onClick={handlePrintCard} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">พิมพ์</button></div></div></div>
        )}
    </div>
  );
};

export default TeacherDashboard;
