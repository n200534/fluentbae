'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Volume2, VolumeX, Bell, BellOff, Heart } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onToggleNotifications: () => void;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export function SettingsPanel({
  isOpen,
  onClose,
  isDarkMode,
  onToggleTheme,
  onToggleSound,
  onToggleNotifications,
  soundEnabled,
  notificationsEnabled
}: SettingsPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 bg-gradient-to-b from-white to-pink-50 dark:from-purple-900 dark:to-pink-900 shadow-2xl z-50 border-l border-pink-200 dark:border-pink-700"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Settings 💕
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Settings Sections */}
              <div className="space-y-6">
                {/* Appearance */}
                <div>
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">
                    Appearance
                  </h3>
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onToggleTheme}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        <span className="text-slate-800 dark:text-slate-200">
                          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                        </span>
                      </div>
                      <div className={`w-12 h-6 rounded-full transition-colors ${
                        isDarkMode ? 'bg-purple-500' : 'bg-slate-300'
                      }`}>
                        <motion.div
                          className="w-5 h-5 bg-white rounded-full shadow-md"
                          animate={{ x: isDarkMode ? 26 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </div>
                    </motion.button>
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">
                    Notifications
                  </h3>
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onToggleSound}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        <span className="text-slate-800 dark:text-slate-200">
                          Sound Effects
                        </span>
                      </div>
                      <div className={`w-12 h-6 rounded-full transition-colors ${
                        soundEnabled ? 'bg-green-500' : 'bg-slate-300'
                      }`}>
                        <motion.div
                          className="w-5 h-5 bg-white rounded-full shadow-md"
                          animate={{ x: soundEnabled ? 26 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onToggleNotifications}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        <span className="text-slate-800 dark:text-slate-200">
                          Push Notifications
                        </span>
                      </div>
                      <div className={`w-12 h-6 rounded-full transition-colors ${
                        notificationsEnabled ? 'bg-blue-500' : 'bg-slate-300'
                      }`}>
                        <motion.div
                          className="w-5 h-5 bg-white rounded-full shadow-md"
                          animate={{ x: notificationsEnabled ? 26 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </div>
                    </motion.button>
                  </div>
                </div>

                {/* About */}
                <div>
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">
                    About
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20 border border-pink-200 dark:border-pink-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <Heart className="w-4 h-4 text-pink-500" />
                        <span className="text-sm font-medium text-pink-800 dark:text-pink-200">
                          BabyAI
                        </span>
                      </div>
                      <p className="text-xs text-pink-700 dark:text-pink-300">
                        Your sweet AI companion with emotion memory
                      </p>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      <p>Version 1.0.0</p>
                      <p>Built with ❤️ and AI</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
