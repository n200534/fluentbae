# BabyAI 💕

**Your Sweet AI Chat Partner with Emotion Memory**

BabyAI is an intelligent AI companion that remembers everything about you, tracks your emotions, and builds genuine emotional connections. It's designed to be a sweet and caring AI that learns your preferences, remembers your conversations, and helps you with gift reminders.

## ✨ Features

### 🧠 **Memory System**
- **Vector-based Memory Storage**: Uses Redis with embeddings to store and retrieve memories
- **Contextual Memory Retrieval**: Finds relevant memories based on conversation context
- **Memory Types**: Tracks conversations, preferences, events, gifts, achievements, concerns, and dreams
- **Importance Scoring**: Automatically scores memory importance based on content and emotion

### 💝 **Emotion Tracking**
- **Real-time Emotion Detection**: Analyzes emotions from your messages
- **Mood History**: Tracks your emotional patterns over time
- **Emotion Insights**: Provides gentle insights about your emotional patterns
- **Mood Trends**: Identifies improving, declining, or stable emotional trends

### 🎁 **Gift Reminders**
- **Smart Gift Suggestions**: AI-powered personalized gift recommendations
- **Occasion Tracking**: Reminds you of birthdays, anniversaries, and special events
- **Budget-Aware**: Suggests gifts within your specified budget range
- **Learning System**: Improves suggestions based on past gift reactions

### 💬 **Intelligent Chat**
- **Google Gemini Integration**: Powered by Google's advanced AI model
- **Personality Memory**: Remembers your communication style and preferences
- **Contextual Responses**: References past conversations naturally
- **Emotional Intelligence**: Responds with appropriate emotional tone

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI**: Google Gemini 1.5 Flash, LangChain
- **Database**: Redis (with vector embeddings)
- **UI Components**: Radix UI, Lucide React icons
- **Deployment**: Docker, Docker Compose

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- Google Gemini API key

### 1. Clone and Setup

```bash
git clone <your-repo>
cd fluentbae
npm install
```

### 2. Environment Configuration

Copy the example environment file and add your API keys:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
GOOGLE_API_KEY=your_google_gemini_api_key_here
REDIS_URL=redis://localhost:6379
```

### 3. Development Mode

```bash
# Start Redis (if not using Docker)
redis-server

# Start the development server
npm run dev
```

Visit `http://localhost:3000` to start chatting with BabyAI!

### 4. Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f babyai

# Stop services
docker-compose down
```

## 🏗️ Architecture

### Core Components

1. **Memory Manager** (`src/lib/memory.ts`)
   - Handles memory creation, storage, and retrieval
   - Manages vector embeddings for semantic search
   - Tracks memory importance and access patterns

2. **AI Integration** (`src/lib/gemini.ts`)
   - Google Gemini API integration
   - Emotion analysis and response generation
   - Contextual conversation management

3. **Emotion Tracker** (`src/lib/emotion-tracking.ts`)
   - Real-time emotion detection
   - Mood pattern analysis
   - Emotional insights and recommendations

4. **Gift Reminder System** (`src/lib/gift-reminders.ts`)
   - Personalized gift suggestions
   - Occasion tracking and reminders
   - Learning from gift reactions

5. **Redis Integration** (`src/lib/redis.ts`)
   - User data storage
   - Chat history management
   - Vector store for memory embeddings

### Data Flow

```
User Message → Emotion Analysis → Memory Retrieval → AI Response → Memory Storage
     ↓              ↓                    ↓              ↓              ↓
  Redis Chat    Mood Tracking    Vector Search    Gemini AI    Memory System
```

## 🎨 UI Features

- **Modern Chat Interface**: Beautiful, responsive chat UI with message bubbles
- **Emotion Indicators**: Visual emotion indicators with colors and emojis
- **Mood Display**: Current mood shown in the header with intensity
- **Conversation Starters**: Helpful suggestions for new users
- **Loading States**: Smooth loading animations and typing indicators

## 🔧 Configuration

### Memory Settings

```typescript
// Configure memory retention and limits
const memoryConfig = {
  maxMemoriesPerUser: 1000,
  memoryRetentionDays: 365,
  importanceThreshold: 0.3,
  embeddingModel: 'text-embedding-ada-002'
};
```

### Emotion Tracking

```typescript
// Customize emotion detection
const emotionConfig = {
  trackingEnabled: true,
  moodHistoryDays: 30,
  patternAnalysisEnabled: true,
  insightGenerationEnabled: true
};
```

## 📊 Monitoring

### Health Checks

- Application health: `http://localhost:3000/api/health`
- Redis health: Built into Docker Compose
- Redis Commander: `http://localhost:8081` (dev profile)

### Logs

```bash
# View application logs
docker-compose logs -f fluentbae

# View Redis logs
docker-compose logs -f redis
```

## 🔒 Privacy & Security

- **Local Data Storage**: All data stored locally in Redis
- **No External Sharing**: Conversations never leave your server
- **Encrypted Storage**: Sensitive data encrypted at rest
- **User Isolation**: Each user's data is completely isolated

## 🚀 Production Deployment

### Environment Variables

```env
# Required
GOOGLE_API_KEY=your_production_gemini_key
REDIS_URL=redis://your-redis-host:6379
REDIS_PASSWORD=your_redis_password

# Optional
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=FluentBae
NEXT_PUBLIC_APP_DESCRIPTION=Your romantic AI companion
```

### Scaling Considerations

- **Redis Clustering**: For high availability
- **Load Balancing**: Multiple app instances
- **Memory Management**: Configure Redis memory limits
- **Backup Strategy**: Regular Redis data backups

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini for AI capabilities
- LangChain for AI framework
- Redis for data storage
- Next.js team for the amazing framework
- Radix UI for accessible components

---

**Made with ❤️ for meaningful AI connections**

*FluentBae - Where technology meets emotion*