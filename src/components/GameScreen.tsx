import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { playTextToSpeech } from '../services/geminiService';
import { Volume2, CheckCircle, XCircle, ArrowRight, Trophy, Star, Home, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameScreenProps {
  questions: Question[];
  onComplete: (score: number) => void;
  onExit: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ questions, onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (currentQuestion?.audioText && !isFinished) {
      setTimeout(() => playTextToSpeech(currentQuestion.audioText!), 500);
    }
  }, [currentIndex, currentQuestion, isFinished]);

  const handleAnswer = (choice: string) => {
    if (showFeedback) return;
    setSelectedAnswer(choice);
    setShowFeedback(true);

    // Auto-play explanation
    if (currentQuestion.explanation) {
        playTextToSpeech(currentQuestion.explanation);
    }

    const isCorrect = choice === currentQuestion.correctAnswer;
    if (isCorrect) {
      const points = 10 + (streak * 2);
      setScore(s => s + points);
      setCorrectCount(c => c + 1);
      setStreak(s => s + 1);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 }, colors: ['#4ade80', '#22c55e'] });
    } else {
      setStreak(0);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setIsFinished(true);
      if (correctCount > questions.length / 2) {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      }
    }
  };

  if (isFinished) {
    const percentage = (correctCount / questions.length) * 100;
    let message = percentage >= 80 ? "สุดยอดไปเลย!" : percentage >= 50 ? "เก่งมาก!" : "พยายามได้ดีมาก!";
    
    return (
        <div className="max-w-2xl mx-auto p-6 flex flex-col items-center justify-center h-full min-h-[500px] text-center animate-fade-in">
            <div className="bg-white p-8 rounded-[40px] shadow-xl border-4 border-blue-100 w-full relative overflow-hidden">
                <div className="relative z-10 mb-6 flex justify-center animate-bounce-slow">
                    <div className="bg-white p-6 rounded-full shadow-lg border-4 border-blue-50">
                        <Trophy size={64} className="text-yellow-400 drop-shadow-lg" />
                    </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{message}</h2>
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <div className="text-gray-500 text-sm mb-1 font-semibold">คะแนน XP</div>
                        <div className="text-2xl md:text-3xl font-bold text-blue-600">+{score}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                        <div className="text-gray-500 text-sm mb-1 font-semibold">ถูกต้อง</div>
                        <div className="text-2xl md:text-3xl font-bold text-green-600">{correctCount}/{questions.length}</div>
                    </div>
                </div>
                <button onClick={() => onComplete(score)} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex justify-center items-center gap-2">
                    <Home size={24} /> กลับหน้าหลัก
                </button>
            </div>
        </div>
    );
  }

  if (!currentQuestion) return <div className="text-center p-10 text-xl font-bold animate-pulse text-gray-400">กำลังโหลดคำถาม...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <button onClick={onExit} className="text-red-500 hover:text-red-700 font-bold transition-all text-sm md:text-base flex items-center gap-1 p-2 bg-red-50 hover:bg-red-100 rounded-lg active:scale-95 z-50">
          <XCircle size={18} /> ออก
        </button>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-yellow-600 font-bold text-lg md:text-xl">🔥 {streak}</div>
          <div className="flex items-center gap-1.5 text-blue-700 font-bold text-lg md:text-xl">⭐ {score}</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 relative overflow-hidden border border-gray-100">
        <div className="absolute top-0 left-0 w-full h-2 bg-gray-100"><div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} /></div>
        <div className="mt-4 mb-8 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 leading-relaxed tracking-wide">{currentQuestion.prompt}</h2>
          <button onClick={() => currentQuestion.audioText ? playTextToSpeech(currentQuestion.audioText) : playTextToSpeech(currentQuestion.prompt)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors font-semibold shadow-sm text-sm md:text-base">
            <Volume2 size={20} /> ฟังเสียง
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.choices?.map((choice, idx) => {
            let stateClass = "bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50";
            if (showFeedback) {
              if (choice === currentQuestion.correctAnswer) stateClass = "bg-green-100 border-2 border-green-500 text-green-900";
              else if (choice === selectedAnswer) stateClass = "bg-red-100 border-2 border-red-500 text-red-900";
              else stateClass = "opacity-50 grayscale bg-slate-50 text-slate-400 border-slate-100";
            }
            return (
              <button key={idx} onClick={() => handleAnswer(choice)} disabled={showFeedback} className={`w-full p-4 rounded-xl font-bold transition-all duration-200 transform ${showFeedback ? '' : 'active:scale-[0.98] shadow-sm'} ${stateClass} text-left flex justify-between items-center group`}>
                <span className="flex-1 text-lg leading-snug break-words pr-2">{choice}</span>
                <div className="flex-shrink-0 ml-2">
                    {showFeedback && choice === currentQuestion.correctAnswer && <CheckCircle className="text-green-600 w-6 h-6" />}
                    {showFeedback && choice === selectedAnswer && choice !== currentQuestion.correctAnswer && <XCircle className="text-red-500 w-6 h-6" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showFeedback && (
        <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-slide-up z-50">
          <div className="max-w-md mx-auto">
            <div className={`mb-4 p-4 rounded-xl border flex gap-3 ${selectedAnswer === currentQuestion.correctAnswer ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
              <div className="mt-1">{selectedAnswer === currentQuestion.correctAnswer ? <CheckCircle size={24} /> : <XCircle size={24} />}</div>
              <div className="flex-1">
                 <p className="font-bold text-lg mb-1">{selectedAnswer === currentQuestion.correctAnswer ? 'ถูกต้อง! (Correct)' : 'ยังไม่ถูกนะ (Incorrect)'}</p>
                 <div className="flex items-start gap-2">
                    <p className="text-base opacity-90 font-medium leading-snug flex-1">{currentQuestion.explanation}</p>
                    <button 
                        onClick={() => playTextToSpeech(currentQuestion.explanation)}
                        className="p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors flex-shrink-0"
                        title="ฟังคำอธิบาย"
                    >
                        <Volume2 size={20} />
                    </button>
                 </div>
              </div>
            </div>
            <button onClick={nextQuestion} className={`w-full py-4 rounded-xl font-bold text-xl text-white shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2 ${selectedAnswer === currentQuestion.correctAnswer ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-800 hover:bg-slate-900'}`}>
              {currentIndex < questions.length - 1 ? <>ข้อต่อไป <ArrowRight /></> : <>ดูผลคะแนน <Trophy /></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;