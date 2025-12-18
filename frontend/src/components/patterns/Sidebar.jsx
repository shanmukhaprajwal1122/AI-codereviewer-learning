// src/components/patterns/Sidebar.jsx
import React from "react";
import { motion } from "framer-motion";

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
}

export default function Sidebar({ open, onClose, onSelect, user, onLogout }) {
  const avatarSrc = user?.avatar || user?.avatarUrl || user?.photoURL;
  const displayName = user?.name || user?.fullName || user?.username || "User";

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: open ? 0 : -280 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 border-r border-purple-500/20 shadow-2xl z-50 backdrop-blur-xl flex flex-col"
      aria-hidden={!open}
    >
      <div className="flex items-center justify-between px-6 h-20 border-b border-purple-500/20 bg-white/5">
        <span className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Platforms
        </span>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-white/10 transition flex items-center justify-center text-gray-400 hover:text-white"
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      <nav className="py-6 overflow-y-auto pb-28 px-3">
{[
            { key: "mentor", label: "AI Code Mentor", icon: "🤖" },
            { key: "dashboard", label: "Progress Dashboard", icon: "📊" },
            { key: "quiz", label: "Aptitude Panel", icon: "📝" },
            { key: "learning", label: "Learning Panel", icon: "🧩" },
          ].map((item) => (
          <button
            key={item.key}
            onClick={() => onSelect?.(item.key)}
            className="w-full text-left px-5 py-4 mb-2 text-gray-200 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 hover:text-white transition rounded-xl border border-transparent hover:border-purple-500/30 flex items-center gap-3 group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="font-medium tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto border-t border-purple-500/20 p-5 bg-white/5">
        <div className="flex items-center gap-3 mb-4">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-purple-500/30"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
              {getInitials(displayName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white truncate tracking-tight">{displayName}</div>
            <div className="text-xs text-gray-400 truncate">Active now</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full text-center px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-500/10 to-pink-500/10 hover:from-red-500/20 hover:to-pink-500/20 border border-red-500/30 text-sm font-medium text-red-400 hover:text-red-300 transition"
        >
          Logout
        </button>
      </div>
    </motion.aside>
  );
}
