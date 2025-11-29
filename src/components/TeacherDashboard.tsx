import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOPICS, Exam, UserProfile, ActivityLog, Question, GameType } from '../types';
import { generateQuestions } from '../services/geminiService';
import { apiSaveExam, apiGetExams, apiGetStudents, apiSaveStudent, apiDeleteStudent, apiGetActivityLogs, apiDeleteExam, apiChangePassword } from '../services/sheetApi';
import { BookOpen, RefreshCw, Save, Library, Plus, Trash2, FileText, Home, Users, UserPlus, Edit, Printer, X, PieChart, TrendingUp, AlertCircle, Award, CheckSquare, Square, PlusCircle, ArrowLeft, Search, Lock, Settings, ChevronRight, Key, ExternalLink, Eye, EyeOff, Check, PenTool, Sparkles, BarChart3, FileDown, Send, ArrowUpCircle, ArrowDownCircle, Clock, List } from 'lucide-react';

const AVATAR_OPTIONS = ['👦', '👧', '🤓', '😎', '🦁', '🐰', '🐸', '🐼', '🦄', '🐱', '🐶', '🦊'];

type DashboardSection = 'menu' | 'create' | 'library' | 'students' | 'stats';
type CreationMode = 'select' | 'ai' | 'manual';

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<DashboardSection>('menu');
  
  // Settings & Password & API Key
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Exam Creation State
  const [creationMode, setCreationMode] = useState<CreationMode>('select');
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [examTitle, setExamTitle] = useState('');
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Library State
  const [savedExams, setSavedExams] = useState<Exam[]>([]);
  const [viewingExam, setViewingExam] = useState<Exam | null>(null);
  
  // Exam Deletion State
  const [showDeleteExamModal, setShowDeleteExamModal] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingExam, setIsDeletingExam] = useState(false);

  // Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportExam, setReportExam] = useState<Exam | null>(null);

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

  // UI State
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({ username: '', name: '', avatar: '👦' });
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardStudent, setCardStudent] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadLibrary();
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
        if(!window.confirm("API Key ดูเหมือนจะไม่ถูกต้อง (ควรขึ้นต้นด้วย AIza) คุณแน่ใจหรือไม่?")) return;
    }
    localStorage.setItem('THAIQUEST_GEMINI_KEY', customApiKey.trim());
    alert("บันทึก API Key เรียบร้อยแล้ว ระบบจะใช้ Key นี้ในการสร้างโจทย์");
    setShowSettingsModal(false);
  };

  // --- ANALYTICS HELPERS ---
  const getDetailedStudentStats = () => {
    return students.map(student => {
        const studentLogs = activityLogs.filter(log => log.username === student.username);
        const scores = studentLogs.map(l => l.score);
        
        const attempts = scores.length;
        const totalScore = scores.reduce((a,b) => a+b, 0);
        const avg = attempts > 0 ? Math.round(totalScore / attempts) : 0;
        
        const maxScore = attempts > 0 ? Math.max(...scores) : 0;
        const minScore = attempts > 0 ? Math.min(...scores) : 0;
        
        const lastActive = studentLogs.length > 0 
            ? new Date(studentLogs[studentLogs.length-1].timestamp).toLocaleDateString('th-TH')
            : '-';

        return {
            ...student,
            attempts,
            avg,
            maxScore,
            minScore,
            lastActive
        };
    }).sort((a,b) => b.avg - a.avg);
  };

  // --- REPORT LOGIC ---
  const openExamReport = (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation();
    setReportExam(exam);
    setShowReportModal(true);
    // Ensure stats are fresh
    loadStats();
  };

  const getExamReportData = () => {
    if (!reportExam) return [];
    const cleanTitle = reportExam.title.replace('[DRAFT] ', '');
    return students.map(student => {
        const attempts = activityLogs.filter(log => 
            log.username === student.username && 
            (log.details.includes(reportExam.id) || log.details.includes(cleanTitle))
        );
        const bestScore = attempts.reduce((max, log) => Math.max(max, log.score), 0);
        const hasPlayed = attempts.length > 0;
        return {
            student,
            hasPlayed,
            score: bestScore,
            attempts: attempts.length,
            lastPlayed: attempts.length > 0 ? new Date(attempts[attempts.length-1].timestamp).toLocaleDateString('th-TH') : '-'
        };
    });
  };

  // --- EXAM CREATION ---
  const resetCreateForm = () => {
    setGeneratedContent([]);
    setExamTitle('');
    setEditingExamId(null);
    setSelectedQuestionIds(new Set());
    setIsGenerating(false);
    setSelectedTopic(TOPICS[0]);
    setCreationMode('select');
  };

  const handleEditExam = (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation();
    const topic = TOPICS.find(t => t.id === exam.topicId) || TOPICS[0];
    setSelectedTopic(topic);
    setGeneratedContent(exam.questions);
    setSelectedQuestionIds(new Set(exam.questions.map(q => q.id)));
    
    // Remove DRAFT tag when editing so user doesn't see it in input
    const cleanTitle = exam.title.replace('[DRAFT] ', '');
    setExamTitle(cleanTitle);
    
    setEditingExamId(exam.id);
    setActiveSection('create');
    setCreationMode('manual'); // Treat editing as manual mode interface
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
        const questions = await generateQuestions(selectedTopic.name, 5);
        if (questions.length > 0 && questions[0].id.startsWith('f')) {
            alert("⚠️ แจ้งเตือน: ระบบ AI ไม่สามารถสร้างโจทย์ได้ในขณะนี้ (ใช้โจทย์สำรอง)");
        }
        setGeneratedContent(questions);
        const allIds = new Set(questions.map(q => q.id));
        setSelectedQuestionIds(allIds);
        if (!editingExamId) {
            setExamTitle(`แบบฝึกทักษะ: ${selectedTopic.name} (${new Date().toLocaleDateString('th-TH')})`);
        }
    } catch (e) {
        alert("เกิดข้อผิดพลาดในการสร้างโจทย์");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleGenerateMore = async () => {
    setIsGenerating(true);
    const newQuestions = await generateQuestions(selectedTopic.name, 5);
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
    setGeneratedContent(prev => [...prev, newQ]);
    setSelectedQuestionIds(prev => new Set(prev).add(newQ.id));
    openEditor(newQ);
  };

  const openEditor = (q: Question) => { setEditingQuestion({...q}); setShowEditModal(true); };
  const saveEditedQuestion = () => { if (!editingQuestion) return; setGeneratedContent(prev => prev.map(q => q.id === editingQuestion.id ? editingQuestion : q)); setShowEditModal(false); setEditingQuestion(null); };

  const handleSaveExam = async (mode: 'assign' | 'draft') => {
    if (!examTitle.trim()) { alert("กรุณาตั้งชื่อชุดแบบฝึกทักษะ"); return; }
    const finalQuestions = generatedContent.filter(q => selectedQuestionIds.has(q.id));
    if (finalQuestions.length === 0) { alert("กรุณาเลือกข้อสอบอย่างน้อย 1 ข้อ"); return; }
    
    const examId = editingExamId || `exam-${Date.now()}`;
    const createdAt = editingExamId ? (savedExams.find(e => e.id === editingExamId)?.createdAt || Date.now()) : Date.now();
    let finalTitle = examTitle;
    if (mode === 'draft') {
        if (!finalTitle.startsWith('[DRAFT] ')) finalTitle = `[DRAFT] ${finalTitle}`;
    } else {
        finalTitle = finalTitle.replace('[DRAFT] ', '');
    }

    const newExam: Exam = { id: examId, title: finalTitle, topicId: selectedTopic.id, questions: finalQuestions, createdAt: createdAt };

    if (editingExamId) {
        const deleteSuccess = await apiDeleteExam(editingExamId);
        if (!deleteSuccess) { alert("เกิดข้อผิดพลาด: ไม่สามารถอัปเดตข้อมูลได้"); return; }
    }

    const success = await apiSaveExam(newExam);
    if (success) {
        const msg = mode === 'assign' ? "✅ บันทึกและมอบหมายการบ้านเรียบร้อยแล้ว!" : "✅ บันทึกลงคลังข้อสอบเรียบร้อยแล้ว (นักเรียนจะยังไม่เห็น)";
        alert(msg);
        resetCreateForm();
        loadLibrary(); 
        setActiveSection('library');
    } else {
        alert("บันทึกไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ");
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

  const generateStudentId = () => { 
    let maxId = 10000;
    students.forEach(s => { const num = parseInt(s.username); if (!isNaN(num) && num > maxId && num < 99999) maxId = num; });
    setStudentForm(prev => ({ ...prev, username: (maxId + 1).toString() })); 
  };
  
  const handleEditStudent = (student: UserProfile) => { setStudentForm({ username: student.username, name: student.name, avatar: student.avatar || '👦' }); setShowStudentModal(true); };
  const handleDeleteStudent = async (username: string) => { if (window.confirm(`คุณแน่ใจหรือไม่ว่าจะลบนักเรียนรหัส ${username}?`)) { setIsDeletingStudent(username); try { const result = await apiDeleteStudent(username); if (result.success) { setStudents(prev => prev.filter(s => s.username !== username)); loadStudents(); } } catch (e) { alert('Error'); } finally { setIsDeletingStudent(null); } } };
  const handleSaveStudent = async () => { if (!studentForm.name || !studentForm.username || studentForm.username.length !== 5) { alert('ข้อมูลไม่ถูกต้อง'); return; } setIsSavingStudent(true); try { const result = await apiSaveStudent(studentForm); if (result.success) { setShowStudentModal(false); setStudentForm({ username: '', name: '', avatar: '👦' }); alert("✅ บันทึกข้อมูลนักเรียนเรียบร้อยแล้ว"); loadStudents(); } else { alert(`❌ บันทึกไม่สำเร็จ! ${result.message}`); } } catch (e) { alert('เกิดข้อผิดพลาด'); } finally { setIsSavingStudent(false); } };
  const handlePrintCard = () => { const printContent = document.getElementById('printable-card'); if (printContent) { const win = window.open('', '', 'height=500,width=500'); if (win) { win.document.write('<html><head><title>Card</title><link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;800&display=swap" rel="stylesheet"><script src="https://cdn.tailwindcss.com"></script></head><body>' + printContent.innerHTML + '</body></html>'); win.document.close(); win.print(); } } };

  return (
    <div className="min-h-screen flex flex-col font-sarabun bg-slate-50 transition-all w-full mx-auto">
        {/* Navbar */}
        <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                     <button onClick={() => navigate('/')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><Home size={18} /></button>
                     <h1 className="text-lg font-bold text-gray-800">ระบบคุณครู</h1>
                </div>
                <button onClick={() => setShowSettingsModal(true)} className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-blue-600 hover:border-blue-400 shadow-sm relative"><Settings size={18} />{!customApiKey && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}</button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full flex justify-center bg-slate-50">
            <div className="w-full max-w-6xl p-4 md:p-6">
            
            {activeSection !== 'menu' && (
                <button onClick={() => { setActiveSection('menu'); setViewingExam(null); resetCreateForm(); }} className="mb-6 flex items-center gap-2 text-gray-600 hover:text-blue-600 font-bold text-sm transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 w-fit">
                    <ArrowLeft size={16} /> กลับเมนูหลัก
                </button>
            )}

            {/* 1. MENU */}
            {activeSection === 'menu' && (
                <div className="animate-scale-up py-6">
                    <div className="text-center mb-8">
                        <div className="bg-white p-3 rounded-full w-20 h-20 mx-auto mb-3 shadow-sm border border-slate-100 flex items-center justify-center text-3xl">👋</div>
                        <h2 className="text-2xl font-black text-gray-800 mb-2">ยินดีต้อนรับคุณครู</h2>
                        <p className="text-gray-500 text-sm">เลือกเมนูเพื่อจัดการการเรียนการสอน</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button onClick={() => { resetCreateForm(); setActiveSection('create'); }} className="bg-blue-50 p-6 rounded-3xl border-4 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all group text-left flex flex-col h-48 relative overflow-hidden">
                            <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 mb-3 shadow-sm border border-blue-100"><Plus size={28} /></div>
                            <h3 className="text-lg font-black text-blue-900 leading-tight mb-1">สร้าง<br/>แบบฝึก</h3>
                            <p className="text-blue-600/70 text-xs font-bold mt-auto">Create</p>
                        </button>

                        <button onClick={() => setActiveSection('library')} className="bg-green-50 p-6 rounded-3xl border-4 border-green-200 hover:border-green-400 hover:shadow-lg transition-all group text-left flex flex-col h-48 relative overflow-hidden">
                            <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center text-green-600 mb-3 shadow-sm border border-green-100"><Library size={28} /></div>
                            <h3 className="text-lg font-black text-green-900 leading-tight mb-1">คลัง<br/>แบบฝึก</h3>
                            <p className="text-green-600/70 text-xs font-bold mt-auto">Library</p>
                        </button>

                        <button onClick={() => setActiveSection('students')} className="bg-orange-50 p-6 rounded-3xl border-4 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all group text-left flex flex-col h-48 relative overflow-hidden">
                            <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center text-orange-600 mb-3 shadow-sm border border-orange-100"><Users size={28} /></div>
                            <h3 className="text-lg font-black text-orange-900 leading-tight mb-1">ข้อมูล<br/>นักเรียน</h3>
                            <p className="text-orange-600/70 text-xs font-bold mt-auto">Students</p>
                        </button>

                        <button onClick={() => setActiveSection('stats')} className="bg-purple-50 p-6 rounded-3xl border-4 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all group text-left flex flex-col h-48 relative overflow-hidden">
                            <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center text-purple-600 mb-3 shadow-sm border border-purple-100"><TrendingUp size={28} /></div>
                            <h3 className="text-lg font-black text-purple-900 leading-tight mb-1">สถิติ<br/>ภาพรวม</h3>
                            <p className="text-purple-600/70 text-xs font-bold mt-auto">Stats</p>
                        </button>
                    </div>
                </div>
            )}

            {/* 2. CREATE / EDIT */}
            {activeSection === 'create' && (
                <div className="animate-fade-in">
                     <div className="mb-4 pb-3 border-b border-gray-200">
                        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                            {editingExamId ? <Edit className="text-orange-500" size={24} /> : <Plus className="text-blue-600" size={24} />} 
                            {editingExamId ? 'แก้ไขแบบฝึกทักษะ' : 'สร้างแบบฝึกใหม่'}
                        </h2>
                     </div>

                     {creationMode === 'select' && !editingExamId ? (
                        <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
                            <button onClick={() => setCreationMode('ai')} className="bg-white border-4 border-blue-100 p-8 rounded-3xl hover:border-blue-400 hover:shadow-xl transition-all text-center group">
                                <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 group-hover:scale-110 transition-transform"><Sparkles size={32} /></div>
                                <h3 className="text-xl font-black text-gray-800 mb-1">สร้างด้วย AI</h3>
                                <p className="text-gray-500 text-sm">ให้ระบบช่วยคิดโจทย์</p>
                            </button>

                            <button onClick={() => setCreationMode('manual')} className="bg-white border-4 border-orange-100 p-8 rounded-3xl hover:border-orange-400 hover:shadow-xl transition-all text-center group">
                                <div className="bg-orange-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-600 group-hover:scale-110 transition-transform"><PenTool size={32} /></div>
                                <h3 className="text-xl font-black text-gray-800 mb-1">สร้างเอง</h3>
                                <p className="text-gray-500 text-sm">พิมพ์โจทย์ด้วยตัวเอง</p>
                            </button>
                        </div>
                     ) : (
                        <div className="grid md:grid-cols-12 gap-6">
                            <div className="md:col-span-4 space-y-4">
                                <div className="bg-white p-5 rounded-3xl border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-sm text-gray-800">เลือกหัวข้อ (Topic)</h3>
                                        {!editingExamId && <button onClick={() => setCreationMode('select')} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100">เปลี่ยน</button>}
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
                                        {TOPICS.map(topic => (
                                        <button key={topic.id} onClick={() => setSelectedTopic(topic)} className={`p-3 rounded-xl text-left transition-all flex items-center gap-3 ${selectedTopic.id === topic.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 hover:bg-white text-gray-700 border border-transparent hover:border-gray-200'}`}>
                                            <span className={`text-xl ${selectedTopic.id === topic.id ? 'opacity-100' : 'opacity-80'}`}>{topic.icon}</span>
                                            <span className="font-bold text-sm">{topic.name}</span>
                                        </button>
                                        ))}
                                    </div>
                                </div>
                                {creationMode === 'ai' && (
                                    <>
                                        <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex justify-center items-center gap-2 disabled:opacity-70">
                                            {isGenerating ? <><RefreshCw className="animate-spin" size={16}/> กำลังสร้าง...</> : <><Sparkles size={16}/> สร้างโจทย์ด้วย AI</>}
                                        </button>
                                        {generatedContent.length > 0 && (
                                            <button onClick={handleGenerateMore} disabled={isGenerating} className="w-full py-3 bg-white border border-blue-200 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all flex justify-center items-center gap-2">
                                                {isGenerating ? "..." : <><PlusCircle size={16}/> สร้างเพิ่ม</>}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="md:col-span-8 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col min-h-[500px]">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-base text-gray-800">รายการโจทย์</h3>
                                    {generatedContent.length > 0 && <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold">{Array.from(selectedQuestionIds).length} / {generatedContent.length} ข้อ</span>}
                                </div>
                                
                                <div className="space-y-3 flex-1 overflow-y-auto pr-2 mb-4 max-h-[400px]">
                                    {generatedContent.length === 0 ? (
                                        <div className="text-center text-gray-400 py-20 border-2 border-dashed border-gray-100 rounded-2xl bg-slate-50">
                                            <p className="font-bold text-sm">{creationMode === 'ai' ? 'กดปุ่มสร้างเพื่อเริ่ม' : 'กดปุ่ม "เพิ่มโจทย์เอง"'}</p>
                                        </div>
                                    ) : (
                                        generatedContent.map((q, idx) => (
                                            <div key={q.id} className={`p-4 rounded-2xl border transition-all ${selectedQuestionIds.has(q.id) ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50 border-transparent opacity-70'}`}>
                                                <div className="flex gap-3">
                                                    <button onClick={() => toggleQuestionSelection(q.id)} className="mt-0.5">
                                                        {selectedQuestionIds.has(q.id) ? <CheckSquare className="text-blue-600 w-5 h-5" /> : <Square className="text-gray-300 w-5 h-5" />}
                                                    </button>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start gap-2 mb-2">
                                                            <p className="font-bold text-sm text-gray-800">{idx + 1}. {q.prompt}</p>
                                                            <button onClick={() => openEditor(q)} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-xs font-bold whitespace-nowrap"><Edit size={12} /> แก้ไข</button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {q.choices?.map((c, i) => (
                                                                <div key={i} className={`text-xs px-3 py-2 rounded-lg border font-medium flex justify-between ${c === q.correctAnswer ? 'bg-green-50 border-green-300 text-green-800' : 'bg-white border-gray-100 text-gray-500'}`}>
                                                                    <span>{c}</span>{c === q.correctAnswer && <Check size={14} className="text-green-600"/>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                
                                <div className="pt-4 border-t border-gray-100 space-y-3">
                                    <button onClick={handleAddNewQuestion} className="w-full py-3 border border-dashed border-slate-300 text-slate-500 rounded-xl hover:bg-slate-50 font-bold text-sm flex justify-center items-center gap-2"><PlusCircle size={16} /> เพิ่มโจทย์เอง</button>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl focus:border-blue-400 outline-none font-bold text-gray-800 text-sm mb-3" placeholder="ตั้งชื่อแบบฝึกทักษะ..." />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSaveExam('draft')} className="flex-1 py-3 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl font-bold text-sm flex justify-center items-center gap-2"><FileDown size={18} /> บันทึกร่าง</button>
                                            <button onClick={() => handleSaveExam('assign')} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black flex justify-center items-center gap-2 shadow-md"><Send size={18} /> มอบหมาย</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                     )}
                </div>
            )}

            {/* 3. LIBRARY */}
            {activeSection === 'library' && (
                <div className="animate-fade-in">
                     <div className="mb-6 pb-3 border-b border-gray-200">
                        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                            <Library className="text-green-600" size={24} /> คลังแบบฝึก
                        </h2>
                     </div>
                     
                     {viewingExam ? (
                        <div className="animate-scale-up">
                            <button onClick={() => setViewingExam(null)} className="mb-4 text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-gray-200 w-fit"><ArrowLeft size={14}/> ย้อนกลับ</button>
                            <div className="bg-white p-6 rounded-3xl border border-gray-200 mb-6">
                                <h2 className="text-xl font-black text-gray-800 mb-2">{viewingExam.title}</h2>
                                <div className="flex gap-4 text-xs font-bold text-gray-500">
                                    <span className="flex items-center gap-1"><Clock size={14} /> {new Date(viewingExam.createdAt).toLocaleDateString('th-TH')}</span>
                                    <span className="flex items-center gap-1"><List size={14} /> {viewingExam.questions.length} ข้อ</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {viewingExam.questions.map((q, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                        <p className="font-bold text-sm text-gray-800 mb-2">{idx+1}. {q.prompt}</p>
                                        <div className="flex flex-wrap gap-2">{q.choices?.map((c,i) => <span key={i} className={`px-3 py-1 rounded-lg text-xs font-medium border ${c===q.correctAnswer ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>{c}</span>)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                     ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {savedExams.map(exam => (
                                <div key={exam.id} className="bg-white p-5 rounded-3xl border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all flex flex-col justify-between h-56 relative overflow-hidden group">
                                    {exam.title.startsWith('[DRAFT]') && <div className="absolute top-0 right-0 bg-slate-100 text-slate-400 text-[10px] font-black tracking-wider px-2 py-1 rounded-bl-xl">DRAFT</div>}
                                    <div onClick={() => setViewingExam(exam)} className="cursor-pointer">
                                        <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3"><FileText size={20} /></div>
                                        <h3 className="font-bold text-base text-gray-900 line-clamp-2 leading-snug mb-1">{exam.title.replace('[DRAFT] ', '')}</h3>
                                        <p className="text-xs text-gray-400 font-medium">{exam.questions.length} ข้อ • {new Date(exam.createdAt).toLocaleDateString('th-TH')}</p>
                                    </div>
                                    <div className="flex gap-2 mt-auto pt-3 border-t border-gray-50">
                                        <button onClick={(e) => openExamReport(exam, e)} className="flex-1 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold flex justify-center items-center gap-1"><BarChart3 size={14}/> คะแนน</button>
                                        <button onClick={(e) => handleEditExam(exam, e)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit size={16}/></button>
                                        <button onClick={(e) => initiateDeleteExam(exam, e)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                     )}
                </div>
            )}

            {/* 4. STUDENTS */}
            {activeSection === 'students' && (
                <div className="animate-fade-in">
                    <div className="mb-6 pb-3 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2"><Users className="text-orange-600" size={24} /> ข้อมูลนักเรียน</h2>
                        <button onClick={() => { setStudentForm({ username: '', name: '', avatar: '👦' }); generateStudentId(); setShowStudentModal(true); }} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-black flex items-center gap-2"><UserPlus size={16}/> เพิ่มนักเรียน</button>
                    </div>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-gray-100 text-xs uppercase font-black text-slate-400"><tr><th className="p-4 pl-6">รูป</th><th className="p-4">รหัส</th><th className="p-4">ชื่อ-นามสกุล</th><th className="p-4">XP</th><th className="p-4 pr-6 text-right">จัดการ</th></tr></thead>
                            <tbody className="divide-y divide-gray-50 text-sm">{students.map(s => (<tr key={s.username} className="hover:bg-blue-50"><td className="p-4 pl-6 text-2xl">{s.avatar}</td><td className="p-4 font-mono font-bold text-blue-600">{s.username}</td><td className="p-4 font-bold text-gray-700">{s.name}</td><td className="p-4 text-gray-500 font-bold">{s.xp}</td><td className="p-4 pr-6 flex justify-end gap-2"><button onClick={() => handleEditStudent(s)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit size={16}/></button><button onClick={() => handleDeleteStudent(s.username)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button></td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 5. STATS */}
            {activeSection === 'stats' && (
                <div className="animate-fade-in space-y-6">
                    <div className="flex justify-between items-center mb-2 pb-3 border-b border-gray-200">
                        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2"><TrendingUp className="text-purple-600" size={24} /> สถิติภาพรวม</h2>
                        <button onClick={loadStats} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><RefreshCw size={16} className={loadingStats ? "animate-spin" : ""} /></button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm"><p className="text-slate-400 text-[10px] uppercase font-black mb-1">Students</p><p className="text-2xl font-black text-orange-500">{students.length}</p></div>
                        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm"><p className="text-slate-400 text-[10px] uppercase font-black mb-1">Attempts</p><p className="text-2xl font-black text-purple-600">{activityLogs.length}</p></div>
                        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm"><p className="text-slate-400 text-[10px] uppercase font-black mb-1">Avg Score</p><p className="text-2xl font-black text-green-500">{activityLogs.length > 0 ? Math.round(activityLogs.reduce((a, b) => a + b.score, 0) / activityLogs.length) : 0}</p></div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-slate-50/50 border-b border-gray-100"><h3 className="font-bold text-sm text-gray-800">ความก้าวหน้ารายบุคคล</h3></div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-gray-100">
                                    <tr><th className="p-4 pl-6">นักเรียน</th><th className="p-4 text-center">ครั้ง</th><th className="p-4 text-center">Avg</th><th className="p-4 text-right pr-6">ล่าสุด</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-xs">
                                    {getDetailedStudentStats().map(s => (
                                        <tr key={s.username} className="hover:bg-blue-50">
                                            <td className="p-4 pl-6 font-bold text-gray-700 flex items-center gap-2"><span className="text-lg">{s.avatar}</span> {s.name}</td>
                                            <td className="p-4 text-center font-bold text-slate-500">{s.attempts}</td>
                                            <td className="p-4 text-center font-black text-blue-600">{s.avg}</td>
                                            <td className="p-4 text-right text-slate-400 font-bold pr-6">{s.lastActive}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            </div>
        </div>

        {/* --- MODALS --- */}
        {showReportModal && reportExam && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] backdrop-blur-sm p-4">
                <div className="bg-white rounded-[32px] p-6 w-full max-w-lg shadow-2xl relative animate-scale-up max-h-[80vh] flex flex-col">
                    <button onClick={() => setShowReportModal(false)} className="absolute top-5 right-5 text-gray-300 hover:text-gray-600"><X size={20} /></button>
                    <h3 className="text-lg font-black text-gray-800 mb-4 border-b border-gray-100 pb-2">ผลคะแนน: <span className="text-blue-600">{reportExam.title.replace('[DRAFT] ', '')}</span></h3>
                    <div className="overflow-y-auto flex-1 bg-slate-50 rounded-2xl border border-gray-200">
                        <table className="w-full text-left text-sm">
                            <thead className="text-slate-400 text-[10px] uppercase font-black bg-slate-100 border-b border-slate-200 sticky top-0"><tr><th className="p-3 pl-4">นักเรียน</th><th className="p-3 text-center">สถานะ</th><th className="p-3 text-center">คะแนน</th></tr></thead>
                            <tbody className="divide-y divide-gray-100 bg-white">{getExamReportData().map((item, idx) => (<tr key={idx}><td className="p-3 pl-4 font-bold text-gray-700 flex gap-2"><span className="text-lg">{item.student.avatar}</span> {item.student.name}</td><td className="p-3 text-center">{item.hasPlayed ? <span className="text-green-600 font-bold text-xs">ส่งแล้ว</span> : <span className="text-red-300 font-bold text-xs">ยัง</span>}</td><td className="p-3 text-center font-black text-blue-600">{item.hasPlayed ? item.score : '-'}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {showSettingsModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
                <div className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl relative animate-scale-up">
                    <button onClick={() => setShowSettingsModal(false)} className="absolute top-5 right-5 text-gray-300 hover:text-gray-600"><X size={20} /></button>
                    <h3 className="text-lg font-black mb-6 text-gray-800 flex items-center gap-2"><Settings size={20} /> ตั้งค่าระบบ</h3>
                    <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                         <h4 className="font-black text-blue-900 mb-2 text-xs uppercase">API Key</h4>
                         <div className="relative"><input type={showApiKey ? "text" : "password"} value={customApiKey} onChange={(e) => setCustomApiKey(e.target.value)} className="w-full p-2 pr-8 border border-blue-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-100 outline-none font-mono" placeholder="AIza..." /><button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-2 top-1.5 text-gray-400">{showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}</button></div>
                         <button onClick={handleSaveApiKey} className="mt-2 text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-bold w-full hover:bg-blue-700">บันทึก Key</button>
                    </div>
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                        <h4 className="font-black text-slate-400 text-xs uppercase">เปลี่ยนรหัสผ่านครู</h4>
                        <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold" placeholder="รหัสใหม่" />
                        <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold" placeholder="ยืนยันรหัสใหม่" />
                        <button onClick={handleChangePassword} disabled={isChangingPassword} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black text-sm">{isChangingPassword ? "..." : "บันทึก"}</button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Other modals (Delete, Edit Question, Add Student, Print) follow similar compact styling pattern... */}
        {showEditModal && editingQuestion && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4"><div className="bg-white rounded-[32px] p-6 w-full max-w-lg shadow-2xl relative"><button onClick={() => setShowEditModal(false)} className="absolute top-5 right-5 text-gray-300"><X size={20} /></button><h3 className="font-black text-lg mb-4 text-gray-900">แก้ไขโจทย์</h3><input type="text" value={editingQuestion.prompt} onChange={(e) => setEditingQuestion({...editingQuestion, prompt: e.target.value})} className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold text-gray-800 mb-4 text-sm" /><div className="grid grid-cols-1 gap-2 mb-4">{editingQuestion.choices?.map((c, i) => (<div key={i} className="flex gap-2"><input type="text" value={c} onChange={(e) => {const nc=[...(editingQuestion.choices||[])]; nc[i]=e.target.value; setEditingQuestion({...editingQuestion, choices: nc, correctAnswer: editingQuestion.correctAnswer===c ? e.target.value : editingQuestion.correctAnswer})}} className={`flex-1 p-2 border rounded-lg text-sm font-medium ${editingQuestion.correctAnswer===c ? 'border-green-500 bg-green-50' : 'border-slate-200'}`} /><button onClick={() => setEditingQuestion({...editingQuestion, correctAnswer: c})} className={`p-2 rounded-lg ${editingQuestion.correctAnswer===c ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}><Check size={16} /></button></div>))}</div><button onClick={saveEditedQuestion} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm">บันทึก</button></div></div>
        )}

        {showStudentModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4"><div className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl relative"><button onClick={() => setShowStudentModal(false)} className="absolute top-5 right-5 text-gray-300"><X size={20}/></button><h3 className="text-lg font-black mb-6 text-gray-800">ข้อมูลนักเรียน</h3><div className="space-y-4"><div><label className="text-xs font-bold text-slate-400 uppercase">รูปโปรไฟล์</label><div className="grid grid-cols-6 gap-2 mt-1">{AVATAR_OPTIONS.map(emoji => (<button key={emoji} onClick={() => setStudentForm({ ...studentForm, avatar: emoji })} className={`text-2xl p-1 rounded-xl border ${studentForm.avatar === emoji ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}>{emoji}</button>))}</div></div><div><label className="text-xs font-bold text-slate-400 uppercase">รหัส</label><div className="flex gap-2 mt-1"><input type="text" value={studentForm.username} readOnly className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-bold text-slate-600" /><button onClick={generateStudentId} className="p-3 bg-slate-100 rounded-xl"><RefreshCw size={18} /></button></div></div><div><label className="text-xs font-bold text-slate-400 uppercase">ชื่อ-นามสกุล</label><input type="text" value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value})} className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold text-gray-800 mt-1 text-sm" /></div><button onClick={handleSaveStudent} disabled={isSavingStudent} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md mt-2 text-sm">{isSavingStudent ? "..." : "บันทึกข้อมูล"}</button></div></div></div>
        )}
    </div>
  );
};

export default TeacherDashboard;