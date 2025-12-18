// src/components/learning/LearningPanel.jsx
// Enhanced Professional Learning Mode with stunning aesthetics

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "react-simple-code-editor";
import prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import Sidebar from "../patterns/Sidebar";

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
}

const API =
  import.meta?.env?.VITE_API_BASE ||
  `${window.location.protocol}//${window.location.hostname}:3000`;

const LANG_OPTIONS = [
  { value: "python", label: "Python", prism: "python", icon: "🐍" },
  { value: "java", label: "Java", prism: "java", icon: "☕" },
  { value: "javascript", label: "JavaScript", prism: "javascript", icon: "🟨" },
  { value: "cpp", label: "C++", prism: "cpp", icon: "⚙️" },
  { value: "c", label: "C", prism: "c", icon: "🔧" },
];

const TOPIC_ICONS = {
  Loops: "🔄",
  Arrays: "📊",
  Strings: "📝",
  Recursion: "🌀"
};

const DIFFICULTY_CONFIG = {
  easy: { color: "from-green-400 to-emerald-500", bg: "bg-green-500/10", border: "border-green-400/30", glow: "shadow-green-500/20" },
  medium: { color: "from-yellow-400 to-orange-500", bg: "bg-yellow-500/10", border: "border-yellow-400/30", glow: "shadow-yellow-500/20" },
  hard: { color: "from-red-400 to-pink-500", bg: "bg-red-500/10", border: "border-red-400/30", glow: "shadow-red-500/20" }
};

const LS_KEY = (topic, difficulty, language) =>
  `learning_seen_${(topic || "General").toLowerCase()}_${(difficulty || "easy").toLowerCase()}_${(language || "python").toLowerCase()}`;

function loadSeen(topic, difficulty, language) {
  try {
    const s = localStorage.getItem(LS_KEY(topic, difficulty, language));
    return s ? new Set(JSON.parse(s)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeen(topic, difficulty, language, seenSet) {
  try {
    localStorage.setItem(LS_KEY(topic, difficulty, language), JSON.stringify([...seenSet]));
  } catch {}
}

// SVG Icon Components
const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const ZapIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon = ({ spinning }) => (
  <svg className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const PlayIcon = ({ pulsing }) => (
  <svg className={`w-4 h-4 ${pulsing ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function LearningPanel({ user, onLogout, onSelectNav }) {
  const [topic, setTopic] = useState("Loops");
  const [difficulty, setDifficulty] = useState("easy");
  const [language, setLanguage] = useState("python");

  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("idle");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [progress, setProgress] = useState({ xp: 0, badges: [] });
  const [awardMsg, setAwardMsg] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const topics = useMemo(() => ["Loops", "Arrays", "Strings", "Recursion"], []);

  const username = user?.username || user?.name || "guest";

  const [seen, setSeen] = useState(() => loadSeen(topic, difficulty, language));
  useEffect(() => { setSeen(loadSeen(topic, difficulty, language)); }, [topic, difficulty, language]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/progress/${encodeURIComponent(username)}`);
        const data = await res.json();
        if (data.success && data.progress) {
          setProgress({ xp: data.progress.xp || 0, badges: data.progress.badges || [] });
        }
      } catch {}
    })();
  }, [username]);

  const [loadingMsg, setLoadingMsg] = useState("Preparing...");

  async function fetchChallengeNoRepeat(attempts = 3) {
    setLoading(true); setFeedback(""); setAwardMsg(""); setResults([]); setStatus("idle");
    setLoadingMsg("Summoning AI mentor...");
    const excludeIds = [...seen];

    for (let i = 0; i < attempts; i++) {
      try {
        if (i > 0) setLoadingMsg(`Retrying... (Attempt ${i + 1})`);
        const res = await fetch(`${API}/ai/generate-challenge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, difficulty, language, excludeIds }),
        });
        if (!res.ok) throw new Error(`Server ${res.status}`);
        const data = await res.json();
        if (!data.success || !data.challenge) throw new Error(data.message || "Bad payload");
        const ch = data.challenge;
        if (seen.has(ch.id)) continue;
        setChallenge(ch);
        setCode(ch.starterCode || "");
        const newSeen = new Set(seen); newSeen.add(ch.id);
        setSeen(newSeen); saveSeen(topic, difficulty, language, newSeen);
        setLoading(false); return;
      } catch (err) {
        if (i === attempts - 1) {
          console.error("fetchChallenge error:", err);
          setFeedback("Error fetching challenge. Please try again.");
        }
      }
    }

    if (seen.size > 50) {
      const cleared = new Set();
      setSeen(cleared); saveSeen(topic, difficulty, language, cleared);
    }
    setLoading(false);
  }

  async function awardProgress() {
    try {
      const res = await fetch(`${API}/api/progress/award`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          difficulty,
          language,
          passed: true,
        }),
      });
      const data = await res.json();
      if (!data.success) return;
      if (!data.alreadyCompleted) {
        setProgress({
          xp: data.progress?.xp ?? progress.xp,
          badges: data.progress?.badges ?? progress.badges,
        });
        const badgeLine = data.badgesAwarded?.length ? ` 🏆 ${data.badgesAwarded.join(", ")}` : "";
        setAwardMsg(`+${data.xpGained || 0} XP${badgeLine}`);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        setAwardMsg("Already completed earlier — no additional XP.");
      }
    } catch {}
  }

  async function runTests() {
    if (!challenge) return;
    setRunning(true); setFeedback(""); setAwardMsg(""); setResults([]); setStatus("idle");

    try {
      const res = await fetch(`${API}/ai/run-tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          functionName: challenge.functionName,
          code,
          testCases: challenge.testCases,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Server returned an error status
        throw new Error(data.message || `Server error: ${res.status}`);
      }
      
      if (!data.success) {
        // API returned success:false
        throw new Error(data.message || "Test execution failed");
      }
      
      setResults(data.results || []);
      setStatus(data.allPassed ? "passed" : "failed");
      setFeedback(data.allPassed ? "All tests passed! Excellent work!" : "Some tests failed. Review the results and try again.");
      
      if (data.allPassed) await awardProgress();
    } catch (err) {
      console.error("runTests error:", err);
      setStatus("failed");
      
      // Show more specific error messages
      let errorMessage = "Error running tests. ";
      if (err.message.includes("Python is not installed")) {
        errorMessage += "Python is not installed on the server. Please contact support.";
      } else if (err.message.includes("Python execution failed")) {
        errorMessage += "There was an error executing your code. Check for syntax errors.";
      } else {
        errorMessage += err.message || "Please check your code and try again.";
      }
      
      setFeedback(errorMessage);
    } finally {
      setRunning(false);
    }
  }

  function revealSolution() {
    if (!challenge?.solution) { setFeedback("No solution provided by the challenge."); return; }
    setCode(challenge.solution);
    setFeedback("Solution revealed! Study it carefully to understand the approach.");
  }

  useEffect(() => { fetchChallengeNoRepeat(); }, [topic, difficulty, language]);

  const avatarSrc = user?.avatar || user?.avatarUrl || user?.photoURL;
  const displayName = user?.name || user?.fullName || user?.username || "User";
  const currentLang = LANG_OPTIONS.find(l => l.value === language)?.prism || "python";
  const diffConfig = DIFFICULTY_CONFIG[difficulty];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Confetti effect */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), opacity: 1, scale: 0 }}
                animate={{ 
                  y: (typeof window !== 'undefined' ? window.innerHeight : 1000) + 20, 
                  rotate: Math.random() * 360,
                  scale: 1
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5 }}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#fbbf24', '#60a5fa', '#a78bfa', '#34d399'][Math.floor(Math.random() * 4)]
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

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

      <div className="relative z-10 px-6 py-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.header
          className="flex items-center justify-between mb-8 flex-wrap gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(true)}
              className="p-3 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/10 hover:border-purple-400/30 transition-all shadow-lg hover:shadow-purple-500/20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>
            
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="text-3xl"
              >
                🎯
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Learning Arena
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">Master coding through practice</p>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <motion.div 
            className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl"
            whileHover={{ scale: 1.02 }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={displayName} className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/50" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-lg font-bold shadow-lg">
                {getInitials(displayName)}
              </div>
            )}
            <div>
              <div className="text-sm font-semibold text-white">{displayName}</div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30">
                  <ZapIcon />
                  <span className="text-xs font-bold text-amber-300">{progress.xp}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30">
                  <TrophyIcon />
                  <span className="text-xs font-bold text-purple-300">{progress.badges?.length || 0}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.header>

        {/* Controls */}
        <motion.div
          className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-wrap gap-6 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              {/* Topic Selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <TargetIcon />
                  Topic
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="px-5 py-3 rounded-xl bg-slate-900/80 border border-white/10 hover:border-purple-400/30 focus:border-purple-400/50 focus:outline-none transition-all text-sm font-medium backdrop-blur-sm shadow-lg cursor-pointer"
                >
                  {topics.map((t) => (
                    <option key={t} value={t}>{TOPIC_ICONS[t]} {t}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <AlertCircleIcon />
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="px-5 py-3 rounded-xl bg-slate-900/80 border border-white/10 hover:border-purple-400/30 focus:border-purple-400/50 focus:outline-none transition-all text-sm font-medium backdrop-blur-sm shadow-lg cursor-pointer"
                >
                  <option value="easy">🟢 Easy</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hard">🔴 Hard</option>
                </select>
              </div>

              {/* Language Selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <CodeIcon />
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-5 py-3 rounded-xl bg-slate-900/80 border border-white/10 hover:border-purple-400/30 focus:border-purple-400/50 focus:outline-none transition-all text-sm font-medium backdrop-blur-sm shadow-lg cursor-pointer"
                >
                  {LANG_OPTIONS.map((l) => (
                    <option key={l.value} value={l.value}>{l.icon} {l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fetchChallengeNoRepeat()}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg hover:shadow-purple-500/50 text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-400/20"
                >
                  <RefreshIcon spinning={loading} />
                  {loading ? loadingMsg : "New Challenge"}
                </motion.button>


              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={runTests}
                disabled={!challenge || !code.trim() || running}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg hover:shadow-green-500/50 text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-green-400/20"
              >
                <PlayIcon pulsing={running} />
                {running ? "Running..." : "Run Tests"}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={revealSolution}
                disabled={!challenge}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 transition-all shadow-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/20"
              >
                <EyeIcon />
                Solution
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6">
          {/* Challenge Card */}
          <AnimatePresence mode="wait">
            {challenge ? (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl"
              >
                <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 flex items-center justify-center text-2xl">
                      {TOPIC_ICONS[topic]}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{challenge.title}</h2>
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${diffConfig.bg} border ${diffConfig.border}`}>
                        <span className={`text-xs font-bold bg-gradient-to-r ${diffConfig.color} bg-clip-text text-transparent uppercase`}>
                          {difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 mb-6">
                  <pre className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap font-mono">
{challenge.prompt}
                  </pre>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CodeIcon />
                      <span className="text-sm font-bold text-slate-300">Your Solution</span>
                    </div>
                    
                    {/* Inline Language Selector for better visibility */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/50 border border-white/5 backdrop-blur-sm">
                      {LANG_OPTIONS.map((l) => (
                        <button
                          key={l.value}
                          onClick={() => setLanguage(l.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            language === l.value
                              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                          }`}
                        >
                          <span>{l.icon}</span>
                          <span className="hidden sm:inline">{l.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-950/80 shadow-2xl">
                    <Editor
                      value={code}
                      onValueChange={setCode}
                      highlight={(input) =>
                        prism.highlight(
                          input,
                          prism.languages[currentLang] || prism.languages.python,
                          currentLang
                        )
                      }
                      padding={20}
                      className="font-mono text-sm leading-7 min-h-[300px]"
                      style={{ outline: "none", background: "transparent" }}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 rounded-3xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-dashed border-white/20 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 text-slate-600">
                  <SparklesIcon />
                </div>
                <p className="text-slate-400 text-lg">Click "New Challenge" to begin your journey</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Section */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-green-400">
                    <CheckCircleIcon />
                  </div>
                  <h3 className="text-xl font-bold text-white">Test Results</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-3 px-4 text-left text-slate-400 font-semibold">Test</th>
                        <th className="py-3 px-4 text-left text-slate-400 font-semibold">Description</th>
                        <th className="py-3 px-4 text-left text-slate-400 font-semibold">Input</th>
                        <th className="py-3 px-4 text-left text-slate-400 font-semibold">Expected</th>
                        <th className="py-3 px-4 text-left text-slate-400 font-semibold">Output</th>
                        <th className="py-3 px-4 text-center text-slate-400 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, idx) => (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <span className="px-3 py-1.5 rounded-lg bg-slate-800/80 font-mono text-cyan-400">
                              #{r.case ?? idx + 1}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-300">{r.description || "—"}</td>
                          <td className="py-4 px-4">
                            <code className="px-2 py-1 rounded bg-slate-900/60 text-blue-300 text-xs font-mono">
                              {JSON.stringify(r.args)}
                            </code>
                          </td>
                          <td className="py-4 px-4">
                            <code className="px-2 py-1 rounded bg-slate-900/60 text-green-300 text-xs font-mono">
                              {JSON.stringify(r.expected)}
                            </code>
                          </td>
                          <td className="py-4 px-4">
                            {r.error ? (
                              <span className="text-red-400 text-xs">{r.error}</span>
                            ) : (
                              <code className="px-2 py-1 rounded bg-slate-900/60 text-purple-300 text-xs font-mono">
                                {JSON.stringify(r.output)}
                              </code>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex justify-center">
                              {r.passed ? (
                                <div className="text-green-400">
                                  <CheckCircleIcon />
                                </div>
                              ) : (
                                <div className="text-red-400">
                                  <XCircleIcon />
                                </div>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback Section */}
          <AnimatePresence>
            {(feedback || awardMsg) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-6 rounded-3xl backdrop-blur-xl border shadow-2xl ${
                  status === "passed"
                    ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/30 shadow-green-500/20"
                    : "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-400/30 shadow-yellow-500/20"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 mt-1 ${status === "passed" ? "text-green-400" : "text-yellow-400"}`}>
                    {status === "passed" ? <CheckCircleIcon /> : <AlertCircleIcon />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-base font-semibold mb-2 ${
                      status === "passed" ? "text-green-300" : "text-yellow-300"
                    }`}>
                      {feedback}
                    </p>
                    {awardMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="text-amber-400">
                          <SparklesIcon />
                        </div>
                        <span className="text-sm font-bold text-amber-300">{awardMsg}</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}