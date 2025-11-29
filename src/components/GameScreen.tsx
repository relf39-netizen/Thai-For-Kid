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
    if (currentQuestion.explanation) { playTextToSpeech(currentQuestion.explanation); }
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
      if (correctCount > questions.length / 2) { confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } }); }
    }
  };

  if (isFinished) {
    const percentage = (correctCount / questions.length) * 100;
    let message = percentage >= 80 ? "สุดยอด!" : percentage >= 50 ? "เก่งมาก!" : "พยายามอีกนิด!";
    
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in w-full max-w-md mx-auto">
            <div className="bg-white p-8 rounded-[32px] shadow-xl border-4 border-blue-50 w-full relative overflow-hidden">
                <div className="relative z-10 mb-6 flex justify-center animate-bounce-slow">
                    <div className="bg-white p-6 rounded-full shadow-lg border-4 border-blue-50">
                        <Trophy size={64} className="text-yellow-400 drop-shadow-lg fill-yellow-100" />
                    </div>
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-2">{message}</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100"><div className="text-blue-400 text-xs font-black uppercase">XP</div><div className="text-3xl font-black text-blue-600">+{score}</div></div>
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100"><div className="text-green-400 text-xs font-black uppercase">ถูก</div><div className="text-3xl font-black text-green-600">{correctCount}<span className="text-lg text-green-400">/{questions.length}</span></div></div>
                </div>
                <button onClick={() => onComplete(score)} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-slate-900 transition-all flex justify-center items-center gap-2"><Home size={20} /> กลับหน้าหลัก</button>
            </div>
        </div>
    );
  }

  if (!currentQuestion) return <div className="text-center p-10 text-lg font-bold animate-pulse text-gray-400 flex items-center justify-center h-full">กำลังโหลด...</div>;

  return (
    <div className="flex flex-col h-full relative w-full mx-auto">
      <div className="p-4 flex-1 overflow-y-auto pb-32 no-scrollbar">
          <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <button onClick={onExit} className="text-red-500 font-bold text-sm flex items-center gap-1 p-2 bg-red-50 rounded-xl"><XCircle size={18} /> ออก</button>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 rounded-xl border border-orange-100"><span className="text-lg">🔥</span><span className="text-orange-700 font-black text-base">{streak}</span></div>
              <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-xl border border-blue-100"><span className="text-lg">⭐</span><span className="text-blue-700 font-black text-base">{score}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm p-6 mb-4 relative overflow-hidden border-2 border-slate-50 min-h-[200px] flex flex-col justify-center">
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-100"><div className="h-full bg-blue-500 rounded-r-full transition-all duration-500 ease-out" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} /></div>
            <div className="mt-2 mb-6 text-center">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-4 leading-relaxed font-sarabun">{currentQuestion.prompt}</h2>
              <button onClick={() => currentQuestion.audioText ? playTextToSpeech(currentQuestion.audioText) : playTextToSpeech(currentQuestion.prompt)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-full hover:bg-blue-100 font-bold text-sm">
                <Volume2 size={18} /> ฟังเสียง
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.choices?.map((choice, idx) => {
                let stateClass = "bg-white border-2 border-slate-100 text-slate-600 shadow-sm hover:border-blue-300 hover:bg-blue-50";
                if (showFeedback) {
                  if (choice === currentQuestion.correctAnswer) stateClass = "bg-green-100 border-2 border-green-500 text-green-800 shadow-sm";
                  else if (choice === selectedAnswer) stateClass = "bg-red-50 border-2 border-red-400 text-red-900";
                  else stateClass = "opacity-40 grayscale bg-slate-50 text-slate-400 border-slate-100";
                }
                return (
                  <button key={idx} onClick={() => handleAnswer(choice)} disabled={showFeedback} className={`w-full p-4 rounded-2xl font-bold transition-all transform ${showFeedback ? '' : 'active:scale-[0.98]'} ${stateClass} text-left flex justify-between items-center group relative overflow-hidden`}>
                    <span className="flex-1 text-lg leading-snug break-words pr-2 relative z-10">{choice}</span>
                    <div className="flex-shrink-0 ml-2 relative z-10">
                        {showFeedback && choice === currentQuestion.correctAnswer && <CheckCircle className="text-green-600 w-6 h-6" />}
                        {showFeedback && choice === selectedAnswer && choice !== currentQuestion.correctAnswer && <XCircle className="text-red-500 w-6 h-6" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
      </div>

      {showFeedback && (
        <div className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-slide-up z-50 rounded-t-[32px] pb-6">
          <div className="w-full max-w-md mx-auto flex flex-col gap-4">
            <div className={`p-4 rounded-2xl border flex gap-3 items-center w-full ${selectedAnswer === currentQuestion.correctAnswer ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
              <div className="p-2 bg-white rounded-full shadow-sm shrink-0">{selectedAnswer === currentQuestion.correctAnswer ? <CheckCircle size={24} className="text-green-500" /> : <XCircle size={24} className="text-red-500" />}</div>
              <div className="flex-1">
                 <p className="font-black text-lg">{selectedAnswer === currentQuestion.correctAnswer ? 'ถูกต้อง!' : 'ผิดนิดเดียวนะ'}</p>
                 <p className="text-sm opacity-90 font-medium">{currentQuestion.explanation}</p>
              </div>
            </div>
            <button onClick={nextQuestion} className={`w-full py-4 rounded-2xl font-black text-xl text-white shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2 ${selectedAnswer === currentQuestion.correctAnswer ? 'bg-green-500' : 'bg-slate-800'}`}>
              {currentIndex < questions.length - 1 ? <>ข้อต่อไป <ArrowRight size={20}/></> : <>ดูผลคะแนน <Trophy size={20}/></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;