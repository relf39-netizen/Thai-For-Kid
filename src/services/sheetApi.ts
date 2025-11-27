import { Exam, Question, UserProfile, UserRole, ActivityLog } from '../types';

const API_URL_KEY = 'thaiquest_api_url';
const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbyyXrUffEWkPjTfaCTUDVrvD7KcZfXuq6IFR1KV3eYU_4INB80WmP_AGA1D3p5fGxVtzA/exec';

const MOCK_DELAY = 800;

export const getApiUrl = () => {
  const local = localStorage.getItem(API_URL_KEY);
  if (local && local.trim() !== '') return local.trim();
  return DEFAULT_API_URL;
};

export const setApiUrl = (url: string) => localStorage.setItem(API_URL_KEY, url);

const MOCK_USERS: Record<string, UserProfile> = {
  'student': {
    username: 'student',
    role: 'student',
    name: 'ด.ช. รักเรียน',
    level: 2,
    xp: 450,
    xpToNextLevel: 1000,
    streak: 3,
    badges: ['⭐ นักอ่านฝึกหัด'],
    avatar: '🤓'
  },
  '12345': {
    username: '12345',
    role: 'student',
    name: 'ด.ญ. ใจดี มีสุข',
    level: 5,
    xp: 1250,
    xpToNextLevel: 2000,
    streak: 5,
    badges: ['🏆 แชมป์สะกดคำ'],
    avatar: '🐰'
  },
  'teacher': {
    username: 'teacher',
    role: 'teacher',
    name: 'คุณครูภาษาไทย',
    level: 99,
    xp: 0,
    xpToNextLevel: 0,
    streak: 0,
    badges: [],
    avatar: '👩‍🏫'
  }
};

const postOptions = (body: any) => ({
    method: 'POST',
    redirect: 'follow' as RequestRedirect,
    headers: {
        "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(body)
});

export const apiLogin = async (username: string, password: string): Promise<{ success: boolean; user?: UserProfile; message?: string }> => {
  const url = getApiUrl();
  try {
    const response = await fetch(url, postOptions({ action: 'login', username, password }));
    const data = await response.json();
    
    if (data.success) {
        return { 
            success: true, 
            user: { 
              ...data.user, 
              xpToNextLevel: 1000, 
              badges: [], 
              streak: 0,
              avatar: data.user.avatar || (data.user.role === 'teacher' ? '👩‍🏫' : '👦')
            } 
        };
    }
    return { success: false, message: data.message || 'เข้าสู่ระบบไม่สำเร็จ' };
  } catch (error) {
    console.warn("API Error (Login), falling back to mock:", error);
    await new Promise(r => setTimeout(r, MOCK_DELAY));
    if (MOCK_USERS[username] && (password === '1111' || password === '1234' || password === username)) {
        return { success: true, user: MOCK_USERS[username] };
    }
    return { success: false, message: 'ไม่พบข้อมูลผู้ใช้ หรือระบบกำลังออฟไลน์' };
  }
};

export const apiChangePassword = async (username: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
  const url = getApiUrl();
  try {
    const response = await fetch(url, postOptions({ action: 'change_password', username, newPassword }));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to change password", error);
    await new Promise(r => setTimeout(r, MOCK_DELAY));
    return { success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ (Mock Mode)" };
  }
};

export const apiGetExams = async (): Promise<Exam[]> => {
  const url = getApiUrl();
  try {
    const response = await fetch(`${url}?action=get_exams&_t=${Date.now()}`, { redirect: 'follow' });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch exams", error);
    const local = localStorage.getItem('thaiquest_exams');
    return local ? JSON.parse(local) : [];
  }
};

export const apiSaveExam = async (exam: Exam): Promise<boolean> => {
  const url = getApiUrl();
  try {
    const response = await fetch(url, postOptions({ action: 'save_exam', ...exam }));
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("Failed to save exam", error);
    const local = localStorage.getItem('thaiquest_exams');
    const exams = local ? JSON.parse(local) : [];
    exams.push(exam);
    localStorage.setItem('thaiquest_exams', JSON.stringify(exams));
    return true;
  }
};

export const apiDeleteExam = async (examId: string): Promise<boolean> => {
  const url = getApiUrl();
  try {
    // Attempt to delete on server
    await fetch(url, postOptions({ action: 'delete_exam', examId }));
    
    // Also cleanup local storage just in case or for hybrid mode
    const local = localStorage.getItem('thaiquest_exams');
    if (local) {
        let exams: Exam[] = JSON.parse(local);
        exams = exams.filter(e => e.id !== examId);
        localStorage.setItem('thaiquest_exams', JSON.stringify(exams));
    }
    return true;
  } catch (error) {
    console.error("Failed to delete exam from server", error);
    // Fallback to local delete
    const local = localStorage.getItem('thaiquest_exams');
    if (local) {
        let exams: Exam[] = JSON.parse(local);
        exams = exams.filter(e => e.id !== examId);
        localStorage.setItem('thaiquest_exams', JSON.stringify(exams));
        return true;
    }
    return false;
  }
};

export const apiSaveScore = async (username: string, score: number, details: string): Promise<void> => {
  const url = getApiUrl();
  try {
    await fetch(url, postOptions({ action: 'save_score', username, score, details }));
  } catch (error) {
    console.error("Failed to save score", error);
  }
};

export const apiGetStudents = async (): Promise<UserProfile[]> => {
  const url = getApiUrl();
  try {
    const response = await fetch(`${url}?action=get_students&_t=${Date.now()}`, { redirect: 'follow' });
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch students", error);
    return Object.values(MOCK_USERS).filter(u => u.role === 'student');
  }
};

export const apiGetActivityLogs = async (): Promise<ActivityLog[]> => {
  const url = getApiUrl();
  try {
    const response = await fetch(`${url}?action=get_activity_logs&_t=${Date.now()}`, { redirect: 'follow' });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch logs", error);
    return [];
  }
};

export const apiSaveStudent = async (student: { username: string, name: string, avatar?: string }): Promise<boolean> => {
  const url = getApiUrl();
  try {
    const response = await fetch(url, postOptions({ action: 'save_student', ...student }));
    const text = await response.text();
    try {
        const data = JSON.parse(text);
        if (data.success) return true;
        console.error("Save student error message:", data.message);
        return false;
    } catch (e) {
        console.error("Server return invalid JSON (Likely Error Page):", text);
        return false;
    }
  } catch (error) {
    console.error("Failed to save student", error);
    return false;
  }
};

export const apiDeleteStudent = async (username: string): Promise<{ success: boolean; message?: string }> => {
  const url = getApiUrl();
  try {
    const safeUsername = String(username).trim();
    const response = await fetch(url, postOptions({ action: 'delete_student', username: safeUsername }));
    const text = await response.text();
    try {
        const data = JSON.parse(text);
        if (data.success === true) {
            return { success: true };
        } else {
            return { success: false, message: data.message || "Server returned failure" };
        }
    } catch (e) {
        console.error("Delete failed invalid json", text);
        return { success: false, message: "Server Error: " + text.substring(0, 50) };
    }
  } catch (error) {
    console.error("Failed to delete student", error);
    return { success: false, message: "Connection Error: " + error };
  }
};