'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Emotion } from '@/types';

interface MoodIndicatorProps {
  emotion: Emotion;
  size?: 'sm' | 'md' | 'lg';
  showIntensity?: boolean;
  animated?: boolean;
}

export function MoodIndicator({ 
  emotion, 
  size = 'md', 
  showIntensity = true, 
  animated = true 
}: MoodIndicatorProps) {
  const getEmotionIcon = (emotionType: string) => {
    switch (emotionType) {
      case 'love':
        return '❤️';
      case 'joy':
        return '😊';
      case 'excitement':
        return '🤩';
      case 'contentment':
        return '😌';
      case 'gratitude':
        return '🙏';
      case 'sadness':
        return '😢';
      case 'anger':
        return '😠';
      case 'fear':
        return '😨';
      case 'anxiety':
        return '😰';
      case 'loneliness':
        return '😔';
      case 'frustration':
        return '😤';
      case 'disappointment':
        return '😞';
      case 'neutral':
        return '😐';
      case 'curious':
        return '🤔';
      case 'surprised':
        return '😲';
      case 'confused':
        return '😕';
      default:
        return '😐';
    }
  };

  const getEmotionColor = (emotionType: string) => {
    switch (emotionType) {
      case 'love':
        return 'from-pink-500 to-red-500';
      case 'joy':
        return 'from-yellow-400 to-orange-500';
      case 'excitement':
        return 'from-purple-500 to-pink-500';
      case 'contentment':
        return 'from-green-400 to-blue-500';
      case 'gratitude':
        return 'from-emerald-400 to-teal-500';
      case 'sadness':
        return 'from-blue-500 to-indigo-500';
      case 'anger':
        return 'from-red-500 to-orange-500';
      case 'fear':
        return 'from-gray-500 to-slate-500';
      case 'anxiety':
        return 'from-amber-500 to-yellow-500';
      case 'loneliness':
        return 'from-slate-500 to-gray-500';
      case 'frustration':
        return 'from-orange-500 to-red-500';
      case 'disappointment':
        return 'from-gray-400 to-slate-500';
      case 'neutral':
        return 'from-slate-400 to-gray-500';
      case 'curious':
        return 'from-blue-400 to-purple-500';
      case 'surprised':
        return 'from-yellow-300 to-orange-400';
      case 'confused':
        return 'from-gray-400 to-slate-400';
      default:
        return 'from-slate-400 to-gray-500';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6 text-sm';
      case 'lg':
        return 'w-16 h-16 text-2xl';
      default:
        return 'w-12 h-12 text-lg';
    }
  };

  const intensity = Math.round(emotion.intensity * 100);

  return (
    <div className="flex flex-col items-center space-y-2">
      <motion.div
        className={`${getSizeClasses()} rounded-full bg-gradient-to-r ${getEmotionColor(emotion.primary)} flex items-center justify-center shadow-lg`}
        animate={animated ? {
          scale: [1, 1.05, 1],
          rotate: emotion.primary === 'love' ? [0, 5, -5, 0] : 0
        } : {}}
        transition={animated ? {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
        style={{
          boxShadow: `0 4px 20px ${getEmotionColor(emotion.primary).split(' ')[0].replace('from-', '')}40`
        }}
      >
        <span className="text-white font-bold">
          {getEmotionIcon(emotion.primary)}
        </span>
      </motion.div>
      
      {showIntensity && (
        <div className="text-center">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
            {emotion.primary}
          </div>
          <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${getEmotionColor(emotion.primary)}`}
              initial={{ width: 0 }}
              animate={{ width: `${intensity}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            {intensity}%
          </div>
        </div>
      )}
    </div>
  );
}

// Mood history chart component
interface MoodHistoryProps {
  emotions: Emotion[];
  days?: number;
}

export function MoodHistory({ emotions, days = 7 }: MoodHistoryProps) {
  const getEmotionValue = (emotion: Emotion) => {
    // Convert emotion to a numeric value for charting
    const emotionValues: { [key: string]: number } = {
      'love': 1.0,
      'joy': 0.9,
      'excitement': 0.8,
      'contentment': 0.7,
      'gratitude': 0.6,
      'neutral': 0.5,
      'curious': 0.4,
      'surprised': 0.3,
      'confused': 0.2,
      'disappointment': 0.1,
      'frustration': 0.0,
      'loneliness': -0.1,
      'anxiety': -0.2,
      'fear': -0.3,
      'anger': -0.4,
      'sadness': -0.5
    };
    
    return (emotionValues[emotion.primary] || 0) * emotion.intensity;
  };

  const getEmotionColorForChart = (emotionType: string) => {
    switch (emotionType) {
      case 'love':
        return 'pink-500, red-500';
      case 'joy':
        return 'yellow-400, orange-500';
      case 'excitement':
        return 'purple-500, pink-500';
      case 'contentment':
        return 'green-400, blue-500';
      case 'gratitude':
        return 'emerald-400, teal-500';
      case 'sadness':
        return 'blue-500, indigo-500';
      case 'anger':
        return 'red-500, orange-500';
      case 'fear':
        return 'gray-500, slate-500';
      case 'anxiety':
        return 'amber-500, yellow-500';
      case 'loneliness':
        return 'slate-500, gray-500';
      case 'frustration':
        return 'orange-500, red-500';
      case 'disappointment':
        return 'gray-400, slate-500';
      case 'neutral':
        return 'slate-400, gray-500';
      case 'curious':
        return 'blue-400, purple-500';
      case 'surprised':
        return 'yellow-300, orange-400';
      case 'confused':
        return 'gray-400, slate-400';
      default:
        return 'slate-400, gray-500';
    }
  };

  const maxValue = 1;
  const minValue = -0.5;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">
        Mood Trend ({days} days)
      </h3>
      
      <div className="flex items-end space-x-1 h-20">
        {emotions.slice(-days).map((emotion, index) => {
          const value = getEmotionValue(emotion);
          const height = ((value - minValue) / (maxValue - minValue)) * 100;
          
          return (
            <motion.div
              key={index}
              className="flex-1 bg-gradient-to-t from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-t"
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              style={{
                background: `linear-gradient(to top, ${getEmotionColorForChart(emotion.primary)})`
              }}
            />
          );
        })}
      </div>
      
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}
