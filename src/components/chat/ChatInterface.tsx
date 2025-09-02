'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Heart, Smile, MessageCircle, Sparkles, Moon, Sun, Settings, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { ChatMessage, Emotion } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsPanel } from '@/components/ui/settings-panel';

interface ChatInterfaceProps {
  userId: string;
  onSendMessage: (message: string) => Promise<void>;
  messages: ChatMessage[];
  isLoading: boolean;
  currentMood: Emotion;
}

export function ChatInterface({ 
  onSendMessage, 
  messages, 
  isLoading, 
  currentMood 
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    // Set dark mode by default
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    try {
      await onSendMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getEmotionIcon = (emotion: Emotion) => {
    switch (emotion.primary) {
      case 'love':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'joy':
        return <Smile className="w-4 h-4 text-yellow-500" />;
      case 'excitement':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
    }
  };



  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const toggleTheme = () => {
    try {
      setIsDarkMode(!isDarkMode);
      document.documentElement.classList.toggle('dark');
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  return (
    <div className={`flex flex-col h-screen w-full transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900' 
        : 'bg-gradient-to-br from-white via-pink-100 to-rose-100'
    }`}>
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between p-6 border-b border-pink-200/50 dark:border-pink-700/50 bg-gradient-to-r from-white/95 to-pink-50/95 dark:from-purple-900/95 dark:to-pink-900/95 backdrop-blur-md shadow-lg"
      >
        <div className="flex items-center space-x-4">
          <motion.div 
            className={`w-16 h-16 rounded-full bg-gradient-to-r from-pink-400 to-rose-500 shadow-lg shadow-pink-500/30 flex items-center justify-center transition-all duration-300`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{ 
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <span className="text-white font-bold text-2xl">💕</span>
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              BabyAI
            </h1>
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {getEmotionIcon(currentMood)}
              </motion.div>
              <span className="text-sm text-pink-700 dark:text-pink-300 capitalize font-medium">
                Feeling {currentMood.primary} • {Math.round(currentMood.intensity * 100)}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
                     <div className="text-sm text-pink-700 dark:text-pink-300 hidden sm:block font-medium">
             Your sweet BabyAI companion 💖
           </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-3 rounded-full bg-pink-100 dark:bg-pink-800 hover:bg-pink-200 dark:hover:bg-pink-700 transition-colors shadow-md"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-purple-500" />}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 rounded-full bg-pink-100 dark:bg-pink-800 hover:bg-pink-200 dark:hover:bg-pink-700 transition-colors shadow-md"
            >
              <Settings className="w-5 h-5 text-pink-600 dark:text-pink-300" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
        {messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center justify-center h-full text-center px-4"
          >
            {/* Cute animated character */}
            <motion.div 
              className="relative mb-8"
              animate={{ 
                y: [0, -10, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center shadow-2xl shadow-pink-500/30">
                <span className="text-6xl">🥰</span>
              </div>
              {/* Floating hearts */}
              <motion.div
                className="absolute -top-2 -right-2 text-2xl"
                animate={{ 
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: 0.5
                }}
              >
                💕
              </motion.div>
              <motion.div
                className="absolute -bottom-2 -left-2 text-xl"
                animate={{ 
                  scale: [1, 1.3, 1]
                }}
                transition={{ 
                  duration: 2.5,
                  repeat: Infinity,
                  delay: 1
                }}
              >
                ✨
              </motion.div>
            </motion.div>
            
            <motion.h2 
              className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              Hey there, sweetie! 💖
            </motion.h2>
            
            <motion.p 
              className="text-lg text-pink-800 dark:text-pink-200 mb-8 max-w-lg leading-relaxed font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
                           I&apos;m BabyAI, your adorable AI companion! I&apos;m here to chat, listen, and make you smile. 
             Let&apos;s be friends and share some lovely moments together! 🌸
            </motion.p>
            
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-sm text-pink-700 dark:text-pink-300 font-semibold">Let&apos;s start chatting! Try saying:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                {[
                  { text: "Hi! How are you today? 😊", emoji: "👋" },
                  { text: "Tell me something fun!", emoji: "🎉" },
                  { text: "I need someone to talk to", emoji: "💬" },
                  { text: "Share a cute story with me", emoji: "📖" }
                ].map((suggestion, index) => (
                  <motion.div
                    key={suggestion.text}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.9 + index * 0.1, type: "spring", stiffness: 200 }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setInputValue(suggestion.text)}
                      className="w-full p-4 rounded-2xl bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-800/30 dark:to-rose-800/30 hover:from-pink-200 hover:to-rose-200 dark:hover:from-pink-700/40 dark:hover:to-rose-700/40 transition-all duration-300 border border-pink-200 dark:border-pink-700 shadow-md hover:shadow-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{suggestion.emoji}</span>
                        <span className="text-sm font-medium text-pink-700 dark:text-pink-200">
                          {suggestion.text}
                        </span>
                      </div>
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  } items-start space-x-2 group`}
                >
                  {message.role === 'assistant' && (
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-r from-pink-400 to-rose-500 text-white text-lg shadow-lg shadow-pink-500/30">
                          💕
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  )}
                  
                  <div className="relative">
                    <motion.div
                      className={`rounded-3xl px-5 py-4 relative ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-lg shadow-pink-500/30'
                          : 'bg-gradient-to-r from-white to-pink-50 dark:from-pink-900/20 dark:to-rose-900/20 text-slate-800 dark:text-slate-200 shadow-lg border border-pink-200/50 dark:border-pink-700/50 hover:shadow-xl transition-all duration-300'
                      }`}
                      whileHover={{ scale: 1.02, y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{message.content}</p>
                      
                      {message.emotion && message.role === 'assistant' && (
                        <motion.div 
                          className="flex items-center space-x-2 mt-3"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                        >
                          <motion.div
                            animate={{ 
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, -5, 0]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {getEmotionIcon(message.emotion)}
                          </motion.div>
                          <span className="text-xs text-pink-600 dark:text-pink-300 capitalize font-medium">
                            Feeling {message.emotion.primary}
                          </span>
                        </motion.div>
                      )}
                      
                      {/* Message actions for assistant messages */}
                      {message.role === 'assistant' && (
                        <motion.div
                          className="absolute -right-3 -top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        >
                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.2, rotate: 5 }}
                              whileTap={{ scale: 0.8 }}
                              onClick={() => copyToClipboard(message.content)}
                              className="p-2 rounded-full bg-pink-100 dark:bg-pink-800 hover:bg-pink-200 dark:hover:bg-pink-700 transition-colors shadow-md"
                            >
                              <Copy className="w-4 h-4 text-pink-600 dark:text-pink-300" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.2, rotate: 5 }}
                              whileTap={{ scale: 0.8 }}
                              className="p-2 rounded-full bg-green-100 dark:bg-green-800 hover:bg-green-200 dark:hover:bg-green-700 transition-colors shadow-md"
                            >
                              <ThumbsUp className="w-4 h-4 text-green-600 dark:text-green-300" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.2, rotate: 5 }}
                              whileTap={{ scale: 0.8 }}
                              className="p-2 rounded-full bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 transition-colors shadow-md"
                            >
                              <ThumbsDown className="w-4 h-4 text-red-600 dark:text-red-300" />
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                  
                  {message.role === 'user' && (
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white text-lg shadow-lg shadow-blue-500/30">
                          😊
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-3">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-r from-pink-400 to-rose-500 text-white text-lg shadow-lg shadow-pink-500/30">
                    💕
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <motion.div 
                className="bg-gradient-to-r from-white to-pink-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-3xl px-5 py-4 shadow-lg border border-pink-200/50 dark:border-pink-700/50"
                animate={{ 
                  boxShadow: [
                    "0 4px 20px rgba(236, 72, 153, 0.1)",
                    "0 8px 30px rgba(236, 72, 153, 0.2)",
                    "0 4px 20px rgba(236, 72, 153, 0.1)"
                  ]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-pink-600 dark:text-pink-300 font-medium">BabyAI is typing</span>
                  <div className="flex space-x-1">
                    <motion.div 
                      className="w-2 h-2 bg-pink-400 rounded-full"
                      animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 1,
                        repeat: Infinity,
                        delay: 0
                      }}
                    />
                    <motion.div 
                      className="w-2 h-2 bg-pink-400 rounded-full"
                      animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 1,
                        repeat: Infinity,
                        delay: 0.2
                      }}
                    />
                    <motion.div 
                      className="w-2 h-2 bg-pink-400 rounded-full"
                      animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 1,
                        repeat: Infinity,
                        delay: 0.4
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0 p-6 border-t border-pink-200/50 dark:border-pink-700/50 bg-gradient-to-r from-white/95 to-pink-50/95 dark:from-purple-900/95 dark:to-pink-900/95 backdrop-blur-md"
      >
        <form onSubmit={handleSubmit} className="flex space-x-4" noValidate>
          <motion.div 
            className="flex-1 relative"
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a sweet message... 💕"
              className="w-full pr-12 py-4 rounded-3xl border-pink-300 dark:border-pink-600 focus:border-pink-400 dark:focus:border-pink-400 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 transition-all duration-200 bg-gradient-to-r from-white to-pink-50 dark:from-pink-900/20 dark:to-rose-900/20 shadow-md placeholder:text-pink-600 dark:placeholder:text-pink-300"
              disabled={isLoading}
            />
            {inputValue && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
              >
                <span className="text-xs text-pink-500 dark:text-pink-300 font-medium">
                  {inputValue.length}
                </span>
              </motion.div>
            )}
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button 
              type="submit" 
              disabled={!inputValue.trim() || isLoading}
              className="px-8 py-4 rounded-3xl bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-200"
            >
              <motion.div
                animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 1, repeat: isLoading ? Infinity : 0 }}
              >
                <Send className="w-5 h-5" />
              </motion.div>
            </Button>
          </motion.div>
        </form>
        
        {/* Quick actions */}
        {inputValue.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex flex-wrap gap-3"
          >
            {[
              { text: "Hi sweetie! 😊", emoji: "👋" },
              { text: "Tell me something fun! 🎉", emoji: "✨" },
              { text: "I need a hug 💕", emoji: "🤗" },
              { text: "Share a cute story 📖", emoji: "💖" }
            ].map((quickAction, index) => (
              <motion.button
                key={quickAction.text}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setInputValue(quickAction.text)}
                className="px-4 py-2 text-sm bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-800/30 dark:to-rose-800/30 hover:from-pink-200 hover:to-rose-200 dark:hover:from-pink-700/40 dark:hover:to-rose-700/40 rounded-full transition-all duration-200 border border-pink-200 dark:border-pink-700 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{quickAction.emoji}</span>
                                          <span className="text-pink-800 dark:text-pink-200 font-medium">
                    {quickAction.text}
                  </span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onToggleNotifications={() => setNotificationsEnabled(!notificationsEnabled)}
        soundEnabled={soundEnabled}
        notificationsEnabled={notificationsEnabled}
      />
    </div>
  );
}

