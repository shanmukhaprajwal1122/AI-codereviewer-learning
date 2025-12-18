import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, RadialBarChart, RadialBar, Legend
} from "recharts";
import Sidebar from "../patterns/Sidebar";

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
}

const COLORS = ["#60a5fa", "#a78bfa", "#ec4899", "#10b981", "#f59e0b", "#ef4444"];

export default function Dashboard({ user, onLogout, onSelectNav }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [progress, setProgress] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const username = user?.username || user?.name || "User";
  const avatarSrc = user?.avatar || user?.avatarUrl || user?.photoURL;
  const displayName = user?.name || user?.fullName || user?.username || "User";

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [progressRes, activitiesRes] = await Promise.all([
          axios.get(`/api/progress/${username}`),
          axios.get(`/api/activity/history?username=${username}`).catch(() => ({ data: { activities: [] } }))
        ]);

        if (progressRes.data.success) {
          setProgress(progressRes.data.progress);
        }

        if (activitiesRes.data.activities) {
          setActivities(activitiesRes.data.activities);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [username]);

  const totalXP = progress?.xp || 0;
  const completedChallenges = progress?.completedChallengeIds?.length || 0;
  const badges = progress?.badges || [];
  const level = Math.floor(totalXP / 100) + 1;
  const xpToNextLevel = 100 - (totalXP % 100);
  const progressPercent = ((totalXP % 100) / 100) * 100;

  const weeklyData = generateWeeklyData(activities);
  const difficultyData = generateDifficultyData(progress);
    const activityTypeData = generateActivityTypeData(activities, completedChallenges);
    const streakData = generateStreakData(progress);

  return (
    <div className="min-h-screen px-5 py-6">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(key) => {
          setSidebarOpen(false);
          onSelectNav?.(key);
        }}
        user={user}
        onLogout={onLogout}
      />
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />}

      <motion.header
        className="relative w-full py-5 flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-purple-500/30 hover:border-purple-500/50 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-200 backdrop-blur-sm shadow-lg"
          >☰</button>
          <div className="hero-heading text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            Progress Dashboard 📊
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-purple-500/20 backdrop-blur-sm">
          {avatarSrc ? (
            <img src={avatarSrc} alt={displayName} className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500/30" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-lg">
              {getInitials(displayName)}
            </div>
          )}
          <span className="text-sm font-medium text-gray-200">{displayName}</span>
        </div>
      </motion.header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-pulse">📊</div>
            <div className="text-lg text-gray-400">Loading your progress...</div>
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon="⚡"
              label="Total XP"
              value={totalXP}
              gradient="from-blue-500 to-cyan-400"
              subtext={`${xpToNextLevel} XP to Level ${level + 1}`}
            />
            <StatCard
              icon="🎯"
              label="Challenges Solved"
              value={completedChallenges}
              gradient="from-purple-500 to-pink-500"
              subtext={completedChallenges > 0 ? "Keep it up!" : "Start solving!"}
            />
            <StatCard
              icon="🏆"
              label="Current Level"
              value={level}
              gradient="from-amber-500 to-orange-500"
              subtext={`${progressPercent.toFixed(0)}% to next level`}
            />
            <StatCard
              icon="🎖️"
              label="Badges Earned"
              value={badges.length}
              gradient="from-emerald-500 to-teal-500"
              subtext={badges.length > 0 ? "Nice collection!" : "Earn your first!"}
            />
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-900/80 via-gray-900/90 to-gray-950/95 backdrop-blur-xl shadow-2xl p-6"
              >
                <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                  Level Progress
                </h3>
                <div className="relative h-6 bg-gray-800/60 rounded-full overflow-hidden border border-purple-500/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow">
                    Level {level} • {totalXP} XP
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-900/80 via-gray-900/90 to-gray-950/95 backdrop-blur-xl shadow-2xl p-6"
              >
                <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 text-transparent bg-clip-text flex justify-between">
                  <span>Problems Solved</span>
                  <span className="text-sm font-mono text-gray-400">{completedChallenges} Solved</span>
                </h3>
                <div className="relative h-6 bg-gray-800/60 rounded-full overflow-hidden border border-emerald-500/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (completedChallenges / 20) * 100)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow">
                    {completedChallenges} / 20 Challenges
                  </div>
                </div>
              </motion.div>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-900/80 via-gray-900/90 to-gray-950/95 backdrop-blur-xl shadow-2xl p-6"
            >
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                Weekly Activity
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid rgba(167,139,250,0.3)",
                        borderRadius: "12px",
                        color: "#e5e7eb"
                      }}
                    />
                    <Area type="monotone" dataKey="xp" stroke="#a78bfa" fillOpacity={1} fill="url(#colorXp)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-900/80 via-gray-900/90 to-gray-950/95 backdrop-blur-xl shadow-2xl p-6"
            >
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                Challenge Difficulty Breakdown
              </h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {difficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid rgba(167,139,250,0.3)",
                        borderRadius: "12px",
                        color: "#e5e7eb"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-900/80 via-gray-900/90 to-gray-950/95 backdrop-blur-xl shadow-2xl p-6"
            >
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                Activity Overview
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityTypeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid rgba(167,139,250,0.3)",
                        borderRadius: "12px",
                        color: "#e5e7eb"
                      }}
                    />
                    <Bar dataKey="count" fill="#60a5fa" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-900/80 via-gray-900/90 to-gray-950/95 backdrop-blur-xl shadow-2xl p-6"
            >
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                Skill Progress
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={streakData} startAngle={180} endAngle={0}>
                    <RadialBar
                      minAngle={15}
                      background
                      clockWise
                      dataKey="value"
                      cornerRadius={10}
                    />
                    <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid rgba(167,139,250,0.3)",
                        borderRadius: "12px",
                        color: "#e5e7eb"
                      }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-900/80 via-gray-900/90 to-gray-950/95 backdrop-blur-xl shadow-2xl p-6"
          >
            <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
              🎖️ Badges Collection
            </h3>
            {badges.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {badges.map((badge, index) => (
                  <motion.div
                    key={badge}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 hover:border-purple-500/50 hover:scale-105 transition-all duration-200"
                  >
                    <div className="text-3xl mb-2">{getBadgeIcon(badge)}</div>
                    <span className="text-xs text-center font-medium text-gray-300">{badge}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3 opacity-50">🎖️</div>
                <p className="text-gray-400">Complete challenges to earn badges!</p>
              </div>
            )}
          </motion.div>

          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-900/80 via-gray-900/90 to-gray-950/95 backdrop-blur-xl shadow-2xl p-6"
            >
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text flex items-center justify-between">
                <span>🎯 Completed Challenges</span>
                <span className="text-sm font-normal text-gray-400">{completedChallenges} solved</span>
              </h3>
              {completedChallenges > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {(progress?.completedChallenges || progress?.completedChallengeIds || []).slice(0, 20).map((item, index) => {
                    const isObject = typeof item === 'object';
                    const title = isObject ? item.title : item;
                    const difficulty = isObject ? item.difficulty : null;
                    const lang = isObject ? item.language : null;
                    const completedAt = isObject && item.completedAt ? new Date(item.completedAt).toLocaleDateString() : null;
                    
                    return (
                      <motion.div
                        key={isObject ? item.id : item}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.03 * index }}
                        className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                            ✓
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-emerald-300 truncate group-hover:text-emerald-200 transition-colors">
                              {title}
                            </p>
                            {(difficulty || lang || completedAt) && (
                              <div className="flex items-center gap-2 mt-0.5">
                                {difficulty && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                                    difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-green-500/20 text-green-400'
                                  }`}>
                                    {difficulty}
                                  </span>
                                )}
                                {lang && (
                                  <span className="text-xs text-gray-500">{lang}</span>
                                )}
                                {completedAt && (
                                  <span className="text-xs text-gray-600">{completedAt}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {completedChallenges > 20 && (
                    <div className="text-center py-2 text-sm text-gray-500">
                      +{completedChallenges - 20} more challenges completed
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3 opacity-50">🎯</div>
                  <p className="text-gray-400">No challenges completed yet. Start coding!</p>
                </div>
              )}
            </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, gradient, subtext }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-900/80 via-gray-900/90 to-gray-950/95 backdrop-blur-xl shadow-2xl p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className={`text-3xl font-bold bg-gradient-to-r ${gradient} text-transparent bg-clip-text`}>
            {value}
          </p>
          <p className="text-xs text-gray-500 mt-1">{subtext}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </motion.div>
  );
}

function getBadgeIcon(badge) {
  const icons = {
    "First Solve": "🌟",
    "Hard Hitter": "💪",
    "Apprentice (5)": "🥉",
    "Pro (10)": "🥈",
    "Master (20)": "🥇"
  };
  if (badge.includes("First") && badge.includes("Solve")) return "🚀";
  return icons[badge] || "🏅";
}

function generateWeeklyData(activities = []) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dayName = days[d.getDay()];
    const dateStr = d.toISOString().split("T")[0];

    const dayActivities = activities.filter(a => {
      const actDate = new Date(a.createdAt).toISOString().split("T")[0];
      return actDate === dateStr;
    });

    // Estimate XP: 10 XP per activity if not specified
    const estimatedXp = dayActivities.reduce((acc, curr) => {
      return acc + (curr.details?.xp || 10);
    }, 0);

    result.push({
      day: dayName,
      xp: estimatedXp
    });
  }
  return result;
}

function generateDifficultyData(progress) {
  const completed = progress?.completedChallengeIds?.length || 0;
  if (completed === 0) {
    return [
      { name: "Easy", value: 0 },
      { name: "Medium", value: 0 },
      { name: "Hard", value: 0 }
    ];
  }
  // If we don't have difficulty in the model, we distribute based on progress
  return [
    { name: "Easy", value: Math.ceil(completed * 0.6) },
    { name: "Medium", value: Math.ceil(completed * 0.3) },
    { name: "Hard", value: Math.floor(completed * 0.1) }
  ].filter(d => d.value > 0);
}

function generateActivityTypeData(activities = [], completedChallenges = 0) {
  const codeReviews = activities.filter(a => a.action === "code_review").length;
  const quizzes = activities.filter(a => a.action === "quiz_session").length;
  const uploads = activities.filter(a => a.action === "file_upload").length;
  
  return [
    { name: "Code Reviews", count: codeReviews },
    { name: "Quiz Sessions", count: quizzes },
    { name: "Problems Solved", count: completedChallenges },
    { name: "File Uploads", count: uploads }
  ];
}

function generateStreakData(progress) {
  const totalXP = progress?.xp || 0;
  const completed = progress?.completedChallengeIds?.length || 0;
  
  return [
    { name: "Problem Solving", value: Math.min(100, completed * 10), fill: "#60a5fa" },
    { name: "Code Quality", value: Math.min(100, (totalXP / 500) * 100), fill: "#a78bfa" },
    { name: "Learning Progress", value: Math.min(100, (progress?.badges?.length || 0) * 20), fill: "#ec4899" }
  ];
}
