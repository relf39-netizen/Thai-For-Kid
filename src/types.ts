export enum GameType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  SPELLING = 'SPELLING',
  LISTENING = 'LISTENING'
}

export interface Question {
  id: string;
  type: GameType;
  prompt: string;
  choices?: string[];
  correctAnswer: string;
  explanation: string;
  audioText?: string;
}

export interface Exam {
  id: string;
  title: string;
  topicId: string;
  questions: Question[];
  createdAt: number;
}

export type UserRole = 'student' | 'teacher';

export interface UserProfile {
  username: string;
  role: UserRole;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  badges: string[];
  avatar?: string;
}

export interface GameSession {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
}

export interface ActivityLog {
  timestamp: number;
  username: string;
  action: string;
  score: number;
  details: string;
}

export const TOPICS = [
  { id: 't1', name: 'มาตราตัวสะกด (Spelling Sections)', icon: '🧩' },
  { id: 't2', name: 'การผันวรรณยุกต์ (Tones)', icon: '🎵' },
  { id: 't3', name: 'คำควบกล้ำ (Cluster Words)', icon: '👯' },
  { id: 't4', name: 'คำที่มี รร (Ro Han)', icon: '🌳' },
  { id: 't5', name: 'คำคล้องจอง (Rhymes)', icon: '🔗' },
];