"use client";

import React from "react";
import { motion } from "framer-motion";

export function SocialAuthButtons() {
  return (
    <div className="w-full">
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
            Or sign up with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Google Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.985 }}
          className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.5 0 2.8.5 3.8 1.4l2.8-2.8C16.9 2 14.6 1.2 12 1.2 7.7 1.2 4 3.7 2.3 7.3l3.3 2.6C6.5 7.1 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.2 2.8-2.5 3.7l3.3 2.6c2.3-2.1 3.7-5.2 3.7-8.6z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L2.3 7.5C1.4 9.2 1 11.1 1 12.4c0 1.9.5 3.7 1.3 5.3l3.3-2.6z"
            />
            <path
              fill="#34A853"
              d="M12 23.8c3.2 0 6-1.1 8-3l-3.3-2.6c-1 .7-2.3 1.1-4.7 1.1-3 0-5.5-2.1-6.4-4.9L2.3 17c1.7 3.5 5.4 6.8 9.7 6.8z"
            />
          </svg>
          <span>Google</span>
        </motion.button>

        {/* GitHub Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.985 }}
          className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <svg className="w-4 h-4 fill-slate-800" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>GitHub</span>
        </motion.button>
      </div>
    </div>
  );
}
