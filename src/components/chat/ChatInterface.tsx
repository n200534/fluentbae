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
      {/* Mobile-Optimized Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between p-3 sm:p-6 border-b border-pink-200/50 dark:border-pink-700/50 bg-gradient-to-r from-white/95 to-pink-50/95 dark:from-purple-900/95 dark:to-pink-900/95 backdrop-blur-md shadow-lg"
      >
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
          <motion.div 
            className={`w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-pink-400 to-rose-500 shadow-lg shadow-pink-500/30 flex items-center justify-center transition-all duration-300 flex-shrink-0`}
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
            <span className="text-white font-bold text-lg sm:text-2xl">💕</span>
          </motion.div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent truncate">
              BabyAI
            </h1>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex-shrink-0"
              >
                {getEmotionIcon(currentMood)}
              </motion.div>
              <span className="text-xs sm:text-sm text-pink-700 dark:text-pink-300 capitalize font-medium truncate">
                <span className="hidden sm:inline">Feeling {currentMood.primary} • {Math.round(currentMood.intensity * 100)}%</span>
                <span className="sm:hidden">{currentMood.primary} {Math.round(currentMood.intensity * 100)}%</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
          <div className="text-xs sm:text-sm text-pink-700 dark:text-pink-300 hidden md:block font-medium">
            Your sweet BabyAI companion 💖
          </div>
         
         <div className="flex items-center space-x-1 sm:space-x-2">
           <motion.button
             whileHover={{ scale: 1.1, rotate: 5 }}
             whileTap={{ scale: 0.9 }}
             onClick={toggleTheme}
             className="p-2 sm:p-3 rounded-full bg-pink-100 dark:bg-pink-800 hover:bg-pink-200 dark:hover:bg-pink-700 transition-colors shadow-md"
           >
             {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />}
           </motion.button>
           
           <motion.button
             whileHover={{ scale: 1.1, rotate: 5 }}
             whileTap={{ scale: 0.9 }}
             onClick={() => setShowSettings(!showSettings)}
             className="p-2 sm:p-3 rounded-full bg-pink-100 dark:bg-pink-800 hover:bg-pink-200 dark:hover:bg-pink-700 transition-colors shadow-md"
           >
             <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 dark:text-pink-300" />
           </motion.button>
         </div>
       </div>
      </motion.div>

      {/* Messages - Mobile Optimized */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-6 min-h-0">
        {messages.length === 0 ? (
                     <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
             className="flex flex-col items-center justify-center h-full text-center px-2 sm:px-4"
           >
             {/* Cute animated character - Mobile optimized */}
             <motion.div 
               className="relative mb-4 sm:mb-8"
               animate={{ 
                 y: [0, -10, 0]
               }}
               transition={{ 
                 duration: 4,
                 repeat: Infinity,
                 ease: "easeInOut"
               }}
             >
               <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center shadow-2xl shadow-pink-500/30">
                 <span className="text-3xl sm:text-6xl">🥰</span>
               </div>
               {/* Floating hearts */}
               <motion.div
                 className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-lg sm:text-2xl"
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
                 className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 text-sm sm:text-xl"
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
               className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2 sm:mb-4 px-2"
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
             >
               Hey there, sweetie! 💖
             </motion.h2>
             
             <motion.p 
               className="text-sm sm:text-lg text-pink-800 dark:text-pink-200 mb-4 sm:mb-8 max-w-lg leading-relaxed font-medium px-2"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.5 }}
             >
               I&apos;m BabyAI, your adorable AI companion! I&apos;m here to chat, listen, and make you smile. 
               Let&apos;s be friends and share some lovely moments together! 🌸
             </motion.p>
             
             <motion.div 
               className="space-y-3 sm:space-y-6 w-full max-w-2xl"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.7 }}
             >
               <p className="text-xs sm:text-sm text-pink-700 dark:text-pink-300 font-semibold">Let&apos;s start chatting! Try saying:</p>
               <div className="grid grid-cols-1 gap-2 sm:gap-3">
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
                       whileHover={{ scale: 1.02, y: -1 }}
                       whileTap={{ scale: 0.98 }}
                       onClick={() => setInputValue(suggestion.text)}
                       className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-800/30 dark:to-rose-800/30 hover:from-pink-200 hover:to-rose-200 dark:hover:from-pink-700/40 dark:hover:to-rose-700/40 transition-all duration-300 border border-pink-200 dark:border-pink-700 shadow-md hover:shadow-lg"
                     >
                       <div className="flex items-center space-x-2 sm:space-x-3">
                         <span className="text-lg sm:text-2xl flex-shrink-0">{suggestion.emoji}</span>
                         <span className="text-xs sm:text-sm font-medium text-pink-700 dark:text-pink-200 text-left">
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
                   className={`flex max-w-[85%] sm:max-w-[80%] ${
                     message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                   } items-start space-x-1 sm:space-x-2 group`}
                 >
                   {message.role === 'assistant' && (
                     <motion.div
                       whileHover={{ scale: 1.05, rotate: 3 }}
                       transition={{ duration: 0.2 }}
                       className="flex-shrink-0"
                     >
                       <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                         <AvatarFallback className="bg-gradient-to-r from-pink-400 to-rose-500 text-white text-sm sm:text-lg shadow-lg shadow-pink-500/30">
                           💕
                         </AvatarFallback>
                       </Avatar>
                     </motion.div>
                   )}
                   
                   <div className="relative min-w-0 flex-1">
                     <motion.div
                       className={`rounded-2xl sm:rounded-3xl px-3 py-2 sm:px-5 sm:py-4 relative ${
                         message.role === 'user'
                           ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-lg shadow-pink-500/30'
                           : 'bg-gradient-to-r from-white to-pink-50 dark:from-pink-900/20 dark:to-rose-900/20 text-slate-800 dark:text-slate-200 shadow-lg border border-pink-200/50 dark:border-pink-700/50 hover:shadow-xl transition-all duration-300'
                       }`}
                       whileHover={{ scale: 1.01, y: -1 }}
                       transition={{ duration: 0.2 }}
                     >
                       <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium break-words">{message.content}</p>
                      
                                             {message.emotion && message.role === 'assistant' && (
                         <motion.div 
                           className="flex items-center space-x-1 sm:space-x-2 mt-2 sm:mt-3"
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
                             className="flex-shrink-0"
                           >
                             {getEmotionIcon(message.emotion)}
                           </motion.div>
                           <span className="text-xs text-pink-600 dark:text-pink-300 capitalize font-medium truncate">
                             <span className="hidden sm:inline">Feeling {message.emotion.primary}</span>
                             <span className="sm:hidden">{message.emotion.primary}</span>
                           </span>
                         </motion.div>
                       )}
                       
                       {/* Message actions for assistant messages - Mobile optimized */}
                       {message.role === 'assistant' && (
                         <motion.div
                           className="absolute -right-2 -top-2 sm:-right-3 sm:-top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                           initial={{ scale: 0, rotate: -10 }}
                           animate={{ scale: 1, rotate: 0 }}
                           transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                         >
                           <div className="flex space-x-1 sm:space-x-2">
                             <motion.button
                               whileHover={{ scale: 1.1, rotate: 3 }}
                               whileTap={{ scale: 0.9 }}
                               onClick={() => copyToClipboard(message.content)}
                               className="p-1.5 sm:p-2 rounded-full bg-pink-100 dark:bg-pink-800 hover:bg-pink-200 dark:hover:bg-pink-700 transition-colors shadow-md"
                             >
                               <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-pink-600 dark:text-pink-300" />
                             </motion.button>
                             <motion.button
                               whileHover={{ scale: 1.1, rotate: 3 }}
                               whileTap={{ scale: 0.9 }}
                               className="p-1.5 sm:p-2 rounded-full bg-green-100 dark:bg-green-800 hover:bg-green-200 dark:hover:bg-green-700 transition-colors shadow-md"
                             >
                               <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-300" />
                             </motion.button>
                             <motion.button
                               whileHover={{ scale: 1.1, rotate: 3 }}
                               whileTap={{ scale: 0.9 }}
                               className="p-1.5 sm:p-2 rounded-full bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 transition-colors shadow-md"
                             >
                               <ThumbsDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 dark:text-red-300" />
                             </motion.button>
                           </div>
                         </motion.div>
                       )}
                    </motion.div>
                  </div>
                  
                                     {message.role === 'user' && (
                     <motion.div
                       whileHover={{ scale: 1.05, rotate: 3 }}
                       transition={{ duration: 0.2 }}
                       className="flex-shrink-0"
                     >
                       <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                         <AvatarFallback className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white text-sm sm:text-lg shadow-lg shadow-blue-500/30">
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
             <div className="flex items-start space-x-2 sm:space-x-3">
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
                 className="flex-shrink-0"
               >
                 <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                   <AvatarFallback className="bg-gradient-to-r from-pink-400 to-rose-500 text-white text-sm sm:text-lg shadow-lg shadow-pink-500/30">
                     💕
                   </AvatarFallback>
                 </Avatar>
               </motion.div>
               <motion.div 
                 className="bg-gradient-to-r from-white to-pink-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl sm:rounded-3xl px-3 py-2 sm:px-5 sm:py-4 shadow-lg border border-pink-200/50 dark:border-pink-700/50"
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
                 <div className="flex items-center space-x-1 sm:space-x-2">
                   <span className="text-xs sm:text-sm text-pink-600 dark:text-pink-300 font-medium">
                     <span className="hidden sm:inline">BabyAI is typing</span>
                     <span className="sm:hidden">Typing...</span>
                   </span>
                   <div className="flex space-x-1">
                     <motion.div 
                       className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-400 rounded-full"
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
                       className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-400 rounded-full"
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
                       className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-400 rounded-full"
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

      {/* Input - Mobile Optimized */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0 p-3 sm:p-6 border-t border-pink-200/50 dark:border-pink-700/50 bg-gradient-to-r from-white/95 to-pink-50/95 dark:from-purple-900/95 dark:to-pink-900/95 backdrop-blur-md"
      >
        <form onSubmit={handleSubmit} className="flex space-x-2 sm:space-x-4" noValidate>
          <motion.div 
            className="flex-1 relative"
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a sweet message... 💕"
              className="w-full pr-10 sm:pr-12 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border-pink-300 dark:border-pink-600 focus:border-pink-400 dark:focus:border-pink-400 focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 transition-all duration-200 bg-gradient-to-r from-white to-pink-50 dark:from-pink-900/20 dark:to-rose-900/20 shadow-md placeholder:text-pink-600 dark:placeholder:text-pink-300 text-sm sm:text-base"
              disabled={isLoading}
            />
            {inputValue && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2"
              >
                <span className="text-xs text-pink-500 dark:text-pink-300 font-medium">
                  {inputValue.length}
                </span>
              </motion.div>
            )}
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              type="submit" 
              disabled={!inputValue.trim() || isLoading}
              className="px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-200"
            >
              <motion.div
                animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 1, repeat: isLoading ? Infinity : 0 }}
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.div>
            </Button>
          </motion.div>
        </form>
        
        {/* Quick actions - Mobile optimized */}
        {inputValue.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3"
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
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setInputValue(quickAction.text)}
                className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-800/30 dark:to-rose-800/30 hover:from-pink-200 hover:to-rose-200 dark:hover:from-pink-700/40 dark:hover:to-rose-700/40 rounded-full transition-all duration-200 border border-pink-200 dark:border-pink-700 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="text-sm sm:text-lg flex-shrink-0">{quickAction.emoji}</span>
                  <span className="text-pink-800 dark:text-pink-200 font-medium truncate max-w-[120px] sm:max-w-none">
                    <span className="hidden sm:inline">{quickAction.text}</span>
                    <span className="sm:hidden">{quickAction.text.split(' ')[0]}...</span>
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

