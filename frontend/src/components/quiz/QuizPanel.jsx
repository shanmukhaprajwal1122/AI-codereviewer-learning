// src/components/quiz/QuizPanel.jsx
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../patterns/Sidebar";

/* Utils */
function shuffle(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i-- ) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

function shuffleOptions(options, answerIndex) {
  const pairs = options.map((o, i) => ({ o, i }));
  const s = shuffle(pairs);
  return {
    options: s.map(x => x.o),
    answerIndex: s.findIndex(x => x.i === answerIndex)
  };
}

/**
 * Local sample questions to use as a fallback when the server returns 500 or is unreachable.
 * Keep them small and valid to match the expected question shape.
 */
function getSampleQuestions(lang) {
  // minimal language-specific samples; keep structure identical to actual API
  const common = {
    python: [
      { difficulty: "easy", question: "What is the output of: print(2 + 3 * 4)?", code: "", options: ["20","14","24","None"], answerIndex: 1, explanation: "Multiplication before addition: 3*4=12, plus 2 equals 14." },
      { difficulty: "easy", question: "Which keyword defines a function in Python?", code: "", options: ["func","def","function","fn"], answerIndex: 1, explanation: "The 'def' keyword is used to define functions." },
      { difficulty: "medium", question: "What does list.append(x) do?", code: "", options: ["Insert at index 0","Add x to the end","Replace list","Remove last"], answerIndex: 1, explanation: "append adds the element to the end of the list." }
    ],
    javascript: [
      { difficulty: "easy", question: "Which operator is used for strict equality in JS?", code: "", options: ["=","==","===","!=="], answerIndex: 2, explanation: "=== checks value and type equality." },
      { difficulty: "easy", question: "What is the result of typeof [] in JS?", code: "", options: ["array","object","list","undefined"], answerIndex: 1, explanation: "Arrays are objects in JavaScript; typeof returns 'object'." },
      { difficulty: "medium", question: "Which keyword declares block-scoped variables?", code: "", options: ["var","let","const","both let and const"], answerIndex: 3, explanation: "Both let and const are block-scoped; var is function-scoped." }
    ],
    java: [
      { difficulty: "easy", question: "Which keyword is used to inherit a class in Java?", code: "", options: ["extends","implements","inherits","super"], answerIndex: 0, explanation: "The 'extends' keyword denotes class inheritance." },
      { difficulty: "easy", question: "What package is automatically imported in every Java program?", code: "", options: ["java.lang","java.util","java.core","java.base"], answerIndex: 0, explanation: "java.lang is implicitly imported." },
      { difficulty: "medium", question: "Which method signature is the entry point in Java?", code: "", options: ["public void main()", "public static void main(String[] args)", "static main()", "void main(String[])"], answerIndex: 1, explanation: "The standard entry point is public static void main(String[] args)." }
    ],
    cpp: [
      { difficulty: "easy", question: "Which header is required for std::cout?", code: "", options: ["<stdio.h>","<iostream>","<output>","<cout>"], answerIndex: 1, explanation: "std::cout lives in <iostream>." },
      { difficulty: "easy", question: "Which operator is used to allocate dynamic memory in C++?", code: "", options: ["malloc","new","alloc","create"], answerIndex: 1, explanation: "new allocates objects in C++." },
      { difficulty: "medium", question: "What is the output type of sizeof operator?", code: "", options: ["int","size_t","long","void"], answerIndex: 1, explanation: "sizeof returns size_t." }
    ],
    csharp: [
      { difficulty: "easy", question: "Which keyword is used for declaring namespaces in C#?", code: "", options: ["package","namespace","using","module"], answerIndex: 1, explanation: "The 'namespace' keyword declares namespaces." },
      { difficulty: "easy", question: "Which type holds true/false in C#?", code: "", options: ["int","bool","Boolean","logical"], answerIndex: 1, explanation: "bool is the boolean type in C#." },
      { difficulty: "medium", question: "How do you declare a constant in C#?", code: "", options: ["const int x = 5;","final int x = 5;","static const x = 5;","immutable int x = 5;"], answerIndex: 0, explanation: "Use const to declare compile-time constants." }
    ]
  };

  // default: flatten and return at least a few questions
  const arr = common[lang] || common.javascript;
  // duplicate until we have at least 6 items (UI requests 10 typically but fewer is fine)
  let out = [...arr];
  while (out.length < 6) out = out.concat(arr.map(q => ({ ...q })));
  // ensure unique-ish by slicing
  return out.slice(0, 6).map((q, i) => ({ ...q, question: q.question, id: `sample-${lang}-${i}` }));
}

export default function QuizPanel({ user, onLogout, onSelectNav }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [language, setLanguage] = useState("python");
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const languages = [
    { value: "python", label: "🐍 Python", color: "from-blue-500 to-yellow-500" },
    { value: "javascript", label: "⚡ JavaScript", color: "from-yellow-400 to-orange-500" },
    { value: "java", label: "☕ Java", color: "from-red-500 to-orange-600" },
    { value: "cpp", label: "⚙️ C++", color: "from-blue-600 to-purple-600" },
    { value: "csharp", label: "💜 C#", color: "from-purple-500 to-pink-500" }
  ];

  const fetchQuestions = async (lang) => {
    setLoading(true);
    setError(null);
    try {
      const API_BASE = "http://localhost:3000";
      const response = await fetch(`${API_BASE}/ai/generate-quiz/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          language: lang,
          count: 10,
          difficulties: { easy: 4, medium: 4, hard: 2 }
        })
      });

      // If server responded with an error status, handle fallback
      if (!response.ok) {
        // If it's a 500 Internal Server Error, use local sample questions instead of failing hard
        if (response.status === 500) {
          console.warn(`Server returned 500 for /ai/generate-quiz — using local sample questions for "${lang}".`);
          const sample = getSampleQuestions(lang);
          // shuffle options and normalize
          const shuffledQuestions = sample.map(q => {
            const { options, answerIndex } = shuffleOptions(q.options, q.answerIndex || 0);
            return { ...q, options, answerIndex };
          }).filter(Boolean);
          if (shuffledQuestions.length === 0) throw new Error("No valid sample questions available");
          setQuestions(shuffledQuestions);
          setIndex(0);
          setAnswers({});
          setShowResult(false);
          setLoading(false);
          return;
        }
        // For non-500 statuses, throw to be caught below (keeps behavior)
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let quizData = data.questions || data.data || data;

      if (typeof quizData === 'string') {
        try {
          quizData = JSON.parse(quizData);
        } catch (e) {
          console.error("Failed to parse quiz data:", e);
          throw new Error("Invalid quiz data format");
        }
      }

      if (!Array.isArray(quizData)) quizData = quizData.questions || [];

      const shuffledQuestions = quizData.map(q => {
        if (!q.question || !q.options || !Array.isArray(q.options)) {
          console.warn("Invalid question format:", q);
          return null;
        }
        const { options, answerIndex } = shuffleOptions(q.options, q.answerIndex || 0);
        return { ...q, options, answerIndex };
      }).filter(Boolean);

      if (shuffledQuestions.length === 0) {
        throw new Error("No valid questions received from API");
      }

      setQuestions(shuffledQuestions);
      setIndex(0);
      setAnswers({});
      setShowResult(false);
    } catch (err) {
      console.error("Error fetching quiz:", err);
      setError(err.message || "Failed to generate quiz. Please try again.");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions(language);
  }, [language]);

  const current = questions[index];
  const progress = questions.length > 0 ? Math.round(((index) / questions.length) * 100) : 0;
  const score = useMemo(() =>
    Object.entries(answers).reduce((acc, [i, sel]) =>
      acc + (sel === questions[Number(i)]?.answerIndex ? 1 : 0), 0
    ), [answers, questions]
  );

  function selectAnswer(i) {
    if (showResult) return;
    setAnswers(prev => ({ ...prev, [index]: i }));
  }

  function next() {
    if (index < questions.length - 1) setIndex(i => i + 1);
    else setShowResult(true);
  }

  function prev() {
    if (index > 0) setIndex(i => i - 1);
  }

  function restart() {
    fetchQuestions(language);
  }

  const getDifficultyBadge = (diff) => {
    const styles = {
      easy: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      hard: "bg-red-500/20 text-red-300 border-red-500/30"
    };
    const icons = { easy: "🟢", medium: "🟡", hard: "🔴" };
    return { style: styles[diff] || styles.easy, icon: icons[diff] || "⚪" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 px-5 py-6 text-white">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(key) => {
          setSidebarOpen(false);
          if (key === "mentor") onSelectNav?.("editor");
          else if (key === "quiz") onSelectNav?.("quiz");
          else if (key === "learning") onSelectNav?.("learning");
          else if (key === "dashboard") onSelectNav?.("dashboard");
        }}
        user={user}
        onLogout={onLogout}
      />
      
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        className="w-full py-6 flex flex-col md:flex-row items-center justify-between mb-8 gap-4"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(true)}
            className="p-3 rounded-xl bg-white/5 border border-purple-500/30 hover:border-purple-500/50 hover:bg-white/10 transition-all backdrop-blur-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </motion.button>
          
          <div className="flex flex-col">
            <div className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
              Aptitude Quiz
            </div>
            <div className="text-sm text-gray-400 mt-1">Test your programming knowledge</div>
          </div>
        </div>

        <motion.select
          whileHover={{ scale: 1.02 }}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-5 py-3 rounded-xl bg-white/5 border border-purple-500/30 hover:bg-white/10 hover:border-purple-500/50 transition-all backdrop-blur-sm text-base font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          {languages.map(lang => (
            <option key={lang.value} value={lang.value} className="bg-gray-900">
              {lang.label}
            </option>
          ))}
        </motion.select>
      </motion.header>

      {/* Loading State */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl mx-auto rounded-3xl border border-purple-500/20 bg-gradient-to-br from-gray-900/90 via-gray-800/50 to-gray-900/90 backdrop-blur-xl shadow-2xl p-12"
          >
            <div className="flex flex-col items-center justify-center gap-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="relative"
              >
                <div className="w-20 h-20 border-4 border-purple-500/20 rounded-full"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full"></div>
              </motion.div>
              
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">Generating Quiz</div>
                <div className="text-base text-gray-400">Creating personalized questions for you...</div>
              </div>
              
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-64 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl mx-auto rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-900/20 via-red-800/10 to-red-900/20 backdrop-blur-xl shadow-2xl p-12"
          >
            <div className="flex flex-col items-center gap-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl"
              >
                ⚠️
              </motion.div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-300 mb-3">Unable to Load Quiz</div>
                <div className="text-base text-gray-300 max-w-md">{error}</div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchQuestions(language)}
                className="mt-4 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold"
              >
                🔄 Retry
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Quiz Content */}
        {!loading && !error && questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl mx-auto"
          >
            {!showResult ? (
              <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-gray-900/90 via-gray-800/50 to-gray-900/90 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Progress Bar */}
                <div className="relative p-6 border-b border-purple-500/20 bg-black/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-gray-300">
                      Question {index + 1} of {questions.length}
                    </div>
                    <div className="text-sm font-bold text-purple-400">
                      {progress}% Complete
                    </div>
                  </div>
                  
                  <div className="relative w-full h-3 rounded-full bg-black/40 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg"
                    />
                  </div>
                </div>

                {/* Question Card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="p-8"
                  >
                    {/* Difficulty Badge */}
                    <div className="flex items-center gap-3 mb-6">
                      {current?.difficulty && (
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${getDifficultyBadge(current.difficulty).style}`}>
                          {getDifficultyBadge(current.difficulty).icon}
                          {current.difficulty.toUpperCase()}
                        </span>
                      )}
                      <span className="text-sm text-gray-400">
                        {languages.find(l => l.value === language)?.label || language}
                      </span>
                    </div>

                    {/* Question */}
                    <h3 className="text-2xl md:text-3xl font-bold mb-6 leading-relaxed text-white">
                      {current?.question}
                    </h3>

                    {/* Code Block */}
                    {current?.code && (
                      <motion.pre
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm rounded-2xl border border-purple-500/30 p-5 overflow-auto mb-8 bg-black/50 backdrop-blur-sm shadow-inner"
                      >
                        <code className="text-gray-300 font-mono">{current.code}</code>
                      </motion.pre>
                    )}

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {current?.options?.map((opt, i) => {
                        const sel = answers[index] === i;
                        const optionLabels = ["A", "B", "C", "D"];
                        
                        return (
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => selectAnswer(i)}
                            className={`group relative text-left px-5 py-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                              sel
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 border-transparent shadow-lg shadow-purple-500/30"
                                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30"
                            }`}
                          >
                            <div className="relative z-10 flex items-start gap-3">
                              <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                sel ? "bg-white/20" : "bg-purple-500/20 text-purple-300"
                              }`}>
                                {optionLabels[i]}
                              </span>
                              <span className="flex-1 text-base leading-relaxed">{opt}</span>
                              {sel && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="text-xl"
                                >
                                  ✓
                                </motion.span>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Navigation */}
                    <div className="mt-10 flex flex-wrap gap-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={prev}
                        disabled={index === 0}
                        className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
                      >
                        ← Previous
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={next}
                        className="ml-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold"
                      >
                        {index === questions.length - 1 ? "Finish Quiz 🏁" : "Next Question →"}
                      </motion.button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              /* Results Screen */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-gray-900/90 via-gray-800/50 to-gray-900/90 backdrop-blur-xl shadow-2xl overflow-hidden"
              >
                {/* Score Header */}
                <div className="p-8 border-b border-purple-500/20 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="text-7xl mb-4"
                  >
                    {score === questions.length ? "🏆" :
                      score >= questions.length * 0.7 ? "🎉" :
                        score >= questions.length * 0.5 ? "💪" : "📚"}
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="text-5xl font-black mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                      {score}/{questions.length}
                    </div>
                    <div className="text-xl text-gray-300">
                      {score === questions.length ? "Perfect Score! Outstanding!" :
                        score >= questions.length * 0.7 ? "Excellent Work!" :
                          score >= questions.length * 0.5 ? "Good Effort!" :
                            "Keep Practicing!"}
                    </div>
                    <div className="mt-4 text-sm text-gray-400">
                      You answered {score} out of {questions.length} questions correctly
                    </div>
                  </motion.div>
                </div>

                {/* Detailed Results */}
                <div className="p-8 space-y-4 max-h-[600px] overflow-y-auto">
                  {questions.map((q, qi) => {
                    const correct = answers[qi] === q.answerIndex;
                    const badge = getDifficultyBadge(q.difficulty);
                    
                    return (
                      <motion.div
                        key={qi}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: qi * 0.05 }}
                        className={`p-6 rounded-2xl border-2 ${
                          correct
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : "border-red-500/30 bg-red-500/5"
                        } backdrop-blur-sm`}
                      >
                        {/* Question Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`text-2xl ${correct ? "text-emerald-400" : "text-red-400"}`}>
                              {correct ? "✓" : "✗"}
                            </span>
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Question {qi + 1}</div>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.style}`}>
                                {badge.icon} {q.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Question Text */}
                        <div className="font-semibold text-lg mb-3">{q.question}</div>

                        {/* Code */}
                        {q.code && (
                          <pre className="text-xs rounded-xl border border-purple-500/20 p-4 overflow-auto mb-4 bg-black/30">
                            <code className="text-gray-300">{q.code}</code>
                          </pre>
                        )}

                        {/* Answer Info */}
                        <div className="space-y-2 text-sm">
                          {!correct && (
                            <div className="flex items-start gap-2 text-red-300">
                              <span className="font-semibold">Your answer:</span>
                              <span>{q.options[answers[qi]] ?? "Not answered"}</span>
                            </div>
                          )}
                          <div className="flex items-start gap-2 text-emerald-300">
                            <span className="font-semibold">Correct answer:</span>
                            <span>{q.options[q.answerIndex]}</span>
                          </div>
                          <div className="flex items-start gap-2 text-gray-300 bg-black/20 p-3 rounded-lg mt-3">
                            <span className="text-lg">💡</span>
                            <span>{q.explanation}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="p-8 border-t border-purple-500/20 bg-black/20 flex flex-wrap gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelectNav?.("editor")}
                    className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-medium"
                  >
                    ← Back to Code Mentor
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(168, 85, 247, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={restart}
                    className="ml-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transition-all font-semibold"
                  >
                    🔄 Start New Quiz
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
