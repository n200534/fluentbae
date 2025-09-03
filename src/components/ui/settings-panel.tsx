'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Volume2, VolumeX, Bell, BellOff } from 'lucide-react';
import { Button } from './button';

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
  notificationsEnabled,
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
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          
          {/* Settings Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 sm:w-96 bg-gradient-to-br from-white to-pink-50 dark:from-purple-900 dark:to-pink-900 shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Settings
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full bg-pink-100 dark:bg-pink-800 hover:bg-pink-200 dark:hover:bg-pink-700 transition-colors"
                >
                  <X className="w-5 h-5 text-pink-600 dark:text-pink-300" />
                </motion.button>
              </div>

              {/* Settings Options */}
              <div className="space-y-4">
                {/* Theme Toggle */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-800/30 dark:to-rose-800/30 border border-pink-200 dark:border-pink-700"
                >
                  <div className="flex items-center space-x-3">
                    {isDarkMode ? (
                      <Moon className="w-5 h-5 text-purple-500" />
                    ) : (
                      <Sun className="w-5 h-5 text-yellow-500" />
                    )}
                    <div>
                      <h3 className="font-semibold text-pink-800 dark:text-pink-200">
                        Theme
                      </h3>
                      <p className="text-sm text-pink-600 dark:text-pink-300">
                        {isDarkMode ? 'Dark mode' : 'Light mode'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggleTheme}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isDarkMode ? 'bg-purple-500' : 'bg-yellow-400'
                    }`}
                  >
                    <motion.div
                      animate={{ x: isDarkMode ? 24 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                    />
                  </motion.button>
                </motion.div>

                {/* Sound Toggle */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-800/30 dark:to-rose-800/30 border border-pink-200 dark:border-pink-700"
                >
                  <div className="flex items-center space-x-3">
                    {soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-gray-500" />
                    )}
                    <div>
                      <h3 className="font-semibold text-pink-800 dark:text-pink-200">
                        Sound Effects
                      </h3>
                      <p className="text-sm text-pink-600 dark:text-pink-300">
                        {soundEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggleSound}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      soundEnabled ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  >
                    <motion.div
                      animate={{ x: soundEnabled ? 24 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                    />
                  </motion.button>
                </motion.div>

                {/* Notifications Toggle */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-800/30 dark:to-rose-800/30 border border-pink-200 dark:border-pink-700"
                >
                  <div className="flex items-center space-x-3">
                    {notificationsEnabled ? (
                      <Bell className="w-5 h-5 text-blue-500" />
                    ) : (
                      <BellOff className="w-5 h-5 text-gray-500" />
                    )}
                    <div>
                      <h3 className="font-semibold text-pink-800 dark:text-pink-200">
                        Notifications
                      </h3>
                      <p className="text-sm text-pink-600 dark:text-pink-300">
                        {notificationsEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggleNotifications}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      notificationsEnabled ? 'bg-blue-500' : 'bg-gray-400'
                    }`}
                  >
                    <motion.div
                      animate={{ x: notificationsEnabled ? 24 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                    />
                  </motion.button>
                </motion.div>

                {/* About Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 rounded-2xl bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-800/30 dark:to-rose-800/30 border border-pink-200 dark:border-pink-700"
                >
                  <h3 className="font-semibold text-pink-800 dark:text-pink-200 mb-2">
                    About BabyAI
                  </h3>
                  <p className="text-sm text-pink-600 dark:text-pink-300 leading-relaxed">
                    Your sweet AI companion that remembers everything about you and builds genuine emotional connections. 
                    Made with 💕 and powered by advanced AI technology.
                  </p>
                </motion.div>
              </div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 pt-6 border-t border-pink-200 dark:border-pink-700"
              >
                <p className="text-xs text-center text-pink-500 dark:text-pink-400">
                  Made with 💕 for meaningful connections
                </p>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}