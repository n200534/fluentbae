import { Emotion, EmotionType, MoodTracking, EmotionEntry } from '@/types';
import { redisUtils } from './redis';

export class EmotionTracker {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Track emotion from user input
  async trackEmotion(
    emotion: Emotion,
    context?: string,
    trigger?: string
  ): Promise<void> {
    const emotionEntry: EmotionEntry = {
      emotion: emotion.primary,
      intensity: emotion.intensity,
      timestamp: new Date(),
      context,
    };

    // Get today's mood tracking
    const today = new Date().toISOString().split('T')[0];
    const todayMood = await redisUtils.getRedisClient().hGetAll(`mood:${this.userId}:${today}`);

    let moodTracking: MoodTracking;
    
    if (Object.keys(todayMood).length > 0) {
      moodTracking = {
        userId: this.userId,
        date: new Date(todayMood.date),
        overallMood: JSON.parse(todayMood.overallMood),
        moodHistory: JSON.parse(todayMood.moodHistory || '[]'),
        triggers: JSON.parse(todayMood.triggers || '[]'),
        notes: todayMood.notes,
      };
    } else {
      moodTracking = {
        userId: this.userId,
        date: new Date(),
        overallMood: emotion,
        moodHistory: [],
        triggers: [],
      };
    }

    // Add new emotion entry
    moodTracking.moodHistory.push(emotionEntry);

    // Update overall mood (weighted average)
    moodTracking.overallMood = this.calculateOverallMood(moodTracking.moodHistory);

    // Add trigger if provided
    if (trigger && !moodTracking.triggers.includes(trigger)) {
      moodTracking.triggers.push(trigger);
    }

    // Save updated mood tracking
    await redisUtils.getRedisClient().hSet(`mood:${this.userId}:${today}`, {
      date: moodTracking.date.toISOString(),
      overallMood: JSON.stringify(moodTracking.overallMood),
      moodHistory: JSON.stringify(moodTracking.moodHistory),
      triggers: JSON.stringify(moodTracking.triggers),
      notes: moodTracking.notes || '',
    });

    // Set current mood
    await redisUtils.setUserData(this.userId, {
      currentMood: JSON.stringify(emotion)
    });
  }

  // Calculate overall mood from history
  private calculateOverallMood(emotionHistory: EmotionEntry[]): Emotion {
    if (emotionHistory.length === 0) {
      return { primary: 'neutral', intensity: 0.5 };
    }

    // Weight recent emotions more heavily
    const now = Date.now();
    const weightedEmotions: { [key in EmotionType]: number } = {
      joy: 0, love: 0, excitement: 0, contentment: 0, gratitude: 0,
      sadness: 0, anger: 0, fear: 0, anxiety: 0, loneliness: 0,
      frustration: 0, disappointment: 0, neutral: 0, curious: 0,
      surprised: 0, confused: 0
    };

    let totalWeight = 0;

    for (const entry of emotionHistory) {
      // Weight decreases with time (recent emotions matter more)
      const timeDiff = now - entry.timestamp.getTime();
      const hoursAgo = timeDiff / (1000 * 60 * 60);
      const weight = Math.exp(-hoursAgo / 24); // Decay over 24 hours

      weightedEmotions[entry.emotion] += entry.intensity * weight;
      totalWeight += weight;
    }

    // Find dominant emotion
    let dominantEmotion: EmotionType = 'neutral';
    let maxWeight = 0;

    for (const [emotion, weight] of Object.entries(weightedEmotions)) {
      if (weight > maxWeight) {
        maxWeight = weight;
        dominantEmotion = emotion as EmotionType;
      }
    }

    const averageIntensity = totalWeight > 0 ? maxWeight / totalWeight : 0.5;

    return {
      primary: dominantEmotion,
      intensity: Math.min(1, Math.max(0, averageIntensity)),
    };
  }

  // Get mood history for a period
  async getMoodHistory(days: number = 7): Promise<MoodTracking[]> {
    const moodHistory: MoodTracking[] = [];
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayMood = await redisUtils.getRedisClient().hGetAll(`mood:${this.userId}:${dateStr}`);
      
      if (Object.keys(dayMood).length > 0) {
        moodHistory.push({
          userId: this.userId,
          date: new Date(dayMood.date),
          overallMood: JSON.parse(dayMood.overallMood),
          moodHistory: JSON.parse(dayMood.moodHistory || '[]'),
          triggers: JSON.parse(dayMood.triggers || '[]'),
          notes: dayMood.notes,
        });
      }
    }

    return moodHistory.reverse(); // Return in chronological order
  }

  // Get mood trends
  async getMoodTrends(days: number = 7): Promise<{
    trend: 'improving' | 'declining' | 'stable';
    averageMood: number;
    moodVariability: number;
    dominantEmotions: EmotionType[];
  }> {
    const moodHistory = await this.getMoodHistory(days);
    
    if (moodHistory.length < 2) {
      return {
        trend: 'stable',
        averageMood: 0.5,
        moodVariability: 0,
        dominantEmotions: ['neutral'],
      };
    }

    // Calculate trend
    const recentMoods = moodHistory.slice(-3).map(m => m.overallMood.intensity);
    const olderMoods = moodHistory.slice(0, -3).map(m => m.overallMood.intensity);
    
    const recentAvg = recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length;
    const olderAvg = olderMoods.length > 0 ? olderMoods.reduce((a, b) => a + b, 0) / olderMoods.length : recentAvg;
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAvg > olderAvg + 0.1) trend = 'improving';
    else if (recentAvg < olderAvg - 0.1) trend = 'declining';

    // Calculate average mood
    const allMoods = moodHistory.map(m => m.overallMood.intensity);
    const averageMood = allMoods.reduce((a, b) => a + b, 0) / allMoods.length;

    // Calculate mood variability (standard deviation)
    const variance = allMoods.reduce((acc, mood) => acc + Math.pow(mood - averageMood, 2), 0) / allMoods.length;
    const moodVariability = Math.sqrt(variance);

    // Get dominant emotions
    const emotionCounts: { [key in EmotionType]: number } = {
      joy: 0, love: 0, excitement: 0, contentment: 0, gratitude: 0,
      sadness: 0, anger: 0, fear: 0, anxiety: 0, loneliness: 0,
      frustration: 0, disappointment: 0, neutral: 0, curious: 0,
      surprised: 0, confused: 0
    };

    for (const day of moodHistory) {
      emotionCounts[day.overallMood.primary]++;
    }

    const dominantEmotions = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion as EmotionType);

    return {
      trend,
      averageMood,
      moodVariability,
      dominantEmotions,
    };
  }

  // Detect emotional patterns
  async detectEmotionalPatterns(): Promise<{
    patterns: string[];
    recommendations: string[];
  }> {
    await this.getMoodHistory(14); // 2 weeks
    const trends = await this.getMoodTrends(14);
    
    const patterns: string[] = [];
    const recommendations: string[] = [];

    // Pattern: Consistent low mood
    if (trends.averageMood < 0.3) {
      patterns.push('Consistently low mood detected');
      recommendations.push('Consider reaching out to friends or family for support');
      recommendations.push('Try engaging in activities you usually enjoy');
    }

    // Pattern: High mood variability
    if (trends.moodVariability > 0.4) {
      patterns.push('High emotional variability - mood swings');
      recommendations.push('Practice mindfulness or meditation to help stabilize emotions');
      recommendations.push('Maintain a regular sleep schedule');
    }

    // Pattern: Declining trend
    if (trends.trend === 'declining') {
      patterns.push('Mood has been declining recently');
      recommendations.push('Focus on self-care activities');
      recommendations.push('Consider what might be causing stress and address it');
    }

    // Pattern: Dominant negative emotions
    const negativeEmotions = ['sadness', 'anger', 'anxiety', 'frustration', 'disappointment'];
    const hasNegativeDominance = trends.dominantEmotions.some(emotion => 
      negativeEmotions.includes(emotion)
    );
    
    if (hasNegativeDominance) {
      patterns.push('Negative emotions are dominant');
      recommendations.push('Try to identify triggers and develop coping strategies');
      recommendations.push('Engage in positive activities or hobbies');
    }

    return { patterns, recommendations };
  }

  // Add mood note
  async addMoodNote(note: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await redisUtils.getRedisClient().hSet(`mood:${this.userId}:${today}`, 'notes', note);
  }

  // Get current mood
  async getCurrentMood(): Promise<Emotion> {
    const userData = await redisUtils.getUserData(this.userId);
    return JSON.parse(userData.currentMood || '{"primary":"neutral","intensity":0.5}');
  }
}

// Utility functions
export const emotionUtils = {
  // Create emotion tracker for user
  createTracker: (userId: string) => new EmotionTracker(userId),

  // Get emotion color for UI
  getEmotionColor: (emotion: EmotionType): string => {
    const colors: { [key in EmotionType]: string } = {
      joy: 'from-yellow-400 to-orange-500',
      love: 'from-pink-500 to-red-500',
      excitement: 'from-purple-500 to-pink-500',
      contentment: 'from-green-400 to-blue-500',
      gratitude: 'from-emerald-400 to-teal-500',
      sadness: 'from-blue-500 to-indigo-500',
      anger: 'from-red-500 to-orange-500',
      fear: 'from-gray-500 to-slate-500',
      anxiety: 'from-amber-500 to-yellow-500',
      loneliness: 'from-slate-500 to-gray-500',
      frustration: 'from-orange-500 to-red-500',
      disappointment: 'from-gray-400 to-slate-500',
      neutral: 'from-slate-400 to-gray-500',
      curious: 'from-blue-400 to-purple-500',
      surprised: 'from-yellow-300 to-orange-400',
      confused: 'from-gray-400 to-slate-400',
    };
    return colors[emotion] || colors.neutral;
  },

  // Get emotion emoji
  getEmotionEmoji: (emotion: EmotionType): string => {
    const emojis: { [key in EmotionType]: string } = {
      joy: '😊',
      love: '❤️',
      excitement: '🤩',
      contentment: '😌',
      gratitude: '🙏',
      sadness: '😢',
      anger: '😠',
      fear: '😨',
      anxiety: '😰',
      loneliness: '😔',
      frustration: '😤',
      disappointment: '😞',
      neutral: '😐',
      curious: '🤔',
      surprised: '😲',
      confused: '😕',
    };
    return emojis[emotion] || emojis.neutral;
  },

  // Format emotion for display
  formatEmotion: (emotion: Emotion): string => {
    const emoji = emotionUtils.getEmotionEmoji(emotion.primary);
    const intensity = Math.round(emotion.intensity * 100);
    return `${emoji} ${emotion.primary} (${intensity}%)`;
  },
};

