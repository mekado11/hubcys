import React, { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";

export default function SimpleCaptcha({ onVerify, className = "" }) {
  const [captcha, setCaptcha] = useState({ question: '', answer: null });
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const generateCaptcha = useCallback(() => {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1, num2, answer, question;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 50) + 20;
        num2 = Math.floor(Math.random() * 20) + 1;
        answer = num1 - num2;
        question = `${num1} - ${num2}`;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
        question = `${num1} × ${num2}`;
        break;
    }
    
    setCaptcha({ question, answer });
    setUserAnswer('');
    setIsVerified(false);
    onVerify(false);
  }, [onVerify]);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  useEffect(() => {
    const userNum = parseInt(userAnswer);
    const verified = !isNaN(userNum) && userNum === captcha.answer;
    setIsVerified(verified);
    onVerify(verified);
  }, [userAnswer, captcha.answer, onVerify]);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-white flex items-center gap-2">
        Security Verification *
        <button
          type="button"
          onClick={generateCaptcha}
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
          title="Generate new question"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </Label>
      <div className="flex items-center gap-3">
        <div className="bg-slate-700 px-4 py-2 rounded-md font-mono text-white border">
          {captcha.question} = ?
        </div>
        <Input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Enter answer"
          className="w-24 bg-slate-800/50 border-gray-600 text-white"
        />
        {isVerified && (
          <span className="text-green-400 text-sm">✓ Verified</span>
        )}
        {userAnswer && !isVerified && (
          <span className="text-red-400 text-sm">✗ Incorrect</span>
        )}
      </div>
      <p className="text-xs text-gray-400">
        Please solve the math problem to verify you're human
      </p>
    </div>
  );
}