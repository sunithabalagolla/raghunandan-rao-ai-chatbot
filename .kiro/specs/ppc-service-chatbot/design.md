# Design Document - PPC Service Chatbot

## Overview

This document provides the complete system design for the PPC (Politikos People Center) Service Chatbot - a production-ready, multilingual AI chatbot with real-time communication, human agent handoff, and comprehensive service management.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │ Chatbot Widget   │         │ Agent Dashboard  │            │
│  │ (React)          │         │ (React)          │            │
│  │ - Socket.io      │         │ - Socket.io      │            │
│  │ - i18next        │         │ - Multi-chat UI  │            │
│  └────────┬─────────┘         └────────┬─────────┘            │
│           │                            │                       │
└───────────┼────────────────────────────┼───────────────────────┘
            │                            │
            │    WebSocket (Socket.io)   │
            │                            │
┌───────────┼────────────────────────────┼───────────────────────┐
│           ▼                            ▼                       │
│  ┌─────────────────────────────────────────────────────┐      │
│  │           BACKEND SERVER (Node.js + Express)        │      │
│  ├─────────────────────────────────────────────────────┤      │
│  │                                                     │      │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │      │
│  │  │ Socket.io    │  │ Redis Queue  │  │ Rate     │ │      │
│  │  │ Handler      │  │ Manager      │  │ Limiter  │ │      │
│  │  └──────┬───────┘  └──────┬───────┘  └────┬─────┘ │      │
│  │         │                 │                │       │      │
│  │  ┌──────▼─────────────────▼────────────────▼─────┐ │      │
│  │  │         AI Manager Service                    │ │      │
│  │  │  - Language Detection                         │ │      │
│  │  │  - Intent Classification                      │ │      │
│  │  │  - Handoff Triggers                          │ │      │
│  │  └──────┬────────────────────────────────────────┘ │      │
│  │         │                                          │      │
│  │  ┌──────▼───────┐  ┌──────────────┐  ┌─────────┐ │      │
│  │  │ RAG Service  │  │ AI Service   │  │ i18n    │ │      │
│  │  │ (Context     │  │ (Gemini AI)  │  │ Service │ │      │
│  │  │  Retrieval)  │  │              │  │         │ │      │
│  │  └──────┬───────┘  └──────┬───────┘  └─────────┘ │      │
│  │         │                 │                       │      │
│  └─────────┼─────────────────┼───────────────────────┘      │
│            │                 │                              │
└────────────┼─────────────────┼──────────────────────────────┘
             │                 │
             ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   MongoDB    │  │    Redis     │  │   Admin      │     │
│  │              │  │              │  │   Dashboard  │     │
│  │ - Users      │  │ - Sessions   │  │              │     │
│  │ - Knowledge  │  │ - Queue      │  │ - Manage     │     │
│  │ - Chats      │  │ - Cache      │  │   Content    │     │
│  │ - RTI/Cases  │  │ - Rate Limit │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **React 18+** - UI framework
- **TypeScript** - Type safety
- **Socket.io-client** - Real-time communication
- **i18next** - Internationalization (Telugu, Hindi, English)
- **react-i18next** - React bindings for i18next
- **Tailwind CSS** - Styling (already in use)
- **Lucide React** - Icons (already in use)

### Backend
- **Node.js 18+** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Socket.io** - Real-time WebSocket server
- **Redis** - Queue, cache, rate limiting
- **ioredis** - Redis client
- **MongoDB** - Database (already in use)
- **Mongoose** - MongoDB ODM (already in use)
- **Google Generative AI** - Gemini API (already in use)

### DevOps
- **PM2** - Process management (production)
- **Docker** - Containerization (optional)
- **Nginx** - Reverse proxy (production)

## What You Already Have (Keep These)

### Client Files to Keep:
```
client/
├── src/
│   ├── components/
│   │   └── ChatbotWidget.tsx          ✅ KEEP (will enhance)
│   ├── services/
│   │   └── chatbot.service.ts         ✅ KEEP (will modify)
│   ├── pages/
│   │   └── HomePage.tsx               ✅ KEEP
│   ├── index.css                      ✅ KEEP (will add more)
│   └── main.tsx                       ✅ KEEP
```

### Server Files to Keep:
```
server/
├── src/
│   ├── services/
│   │   ├── ai.service.ts              ✅ KEEP (will enhance)
│   │   ├── rag.service.ts             ✅ KEEP (will enhance)
│   │   └── aiManager.service.ts       ✅ KEEP (will modify)
│   ├── controllers/
│   │   └── chatbot.controller.ts      ✅ KEEP (will modify)
│   ├── routes/
│   │   └── chatbot.routes.ts          ✅ KEEP
│   ├── models/                        ✅ KEEP ALL
│   ├── app.ts                         ✅ KEEP (will enhance)
│   └── server.ts                      ✅ KEEP (will enhance)
```

## What to Add (New Files)

### Client - New Files:
```
client/
├── src/
│   ├── components/
│   │   ├── chatbot/
│   │   │   ├── WelcomeScreen.tsx      ➕ NEW
│   │   │   ├── CategoryCard.tsx       ➕ NEW
│   │   │   ├── QuickActions.tsx       ➕ NEW
│   │   │   ├── WhatICanDo.tsx         ➕ NEW
│   │   │   └── LanguageSelector.tsx   ➕ NEW
│   │   └── agent-dashboard/
│   │       ├── AgentDashboard.tsx     ➕ NEW
│   │       ├── ChatQueue.tsx          ➕ NEW
│   │       ├── ActiveChats.tsx        ➕ NEW
│   │       └── ChatWindow.tsx         ➕ NEW
│   ├── services/
│   │   ├── socket.service.ts          ➕ NEW
│   │   └── agent.service.ts           ➕ NEW
│   ├── hooks/
│   │   ├── useSocket.ts               ➕ NEW
│   │   └── useLanguage.ts             ➕ NEW
│   ├── i18n/
│   │   ├── config.ts                  ➕ NEW
│   │   ├── locales/
│   │   │   ├── en.json                ➕ NEW
│   │   │   ├── te.json                ➕ NEW
│   │   │   └── hi.json                ➕ NEW
│   └── pages/
│       └── AgentDashboardPage.tsx     ➕ NEW
```

### Server - New Files:
```
server/
├── src/
│   ├── socket/
│   │   ├── index.ts                   ➕ NEW
│   │   ├── chatSocket.ts              ➕ NEW
│   │   ├── agentSocket.ts             ➕ NEW
│   │   └── events.ts                  ➕ NEW
│   ├── services/
│   │   ├── redis.service.ts           ➕ NEW
│   │   ├── queue.service.ts           ➕ NEW
│   │   ├── rateLimit.service.ts       ➕ NEW
│   │   ├── language.service.ts        ➕ NEW
│   │   └── handoff.service.ts         ➕ NEW
│   ├── models/
│   │   ├── ChatSession.model.ts       ➕ NEW
│   │   ├── Agent.model.ts             ➕ NEW
│   │   └── KnowledgeBase.model.ts     ➕ NEW
│   └── middleware/
│       ├── socketAuth.ts              ➕ NEW
│       └── rateLimit.ts               ➕ NEW
```

## Component Architecture

### ChatbotWidget (Enhanced)

**Current State:** Basic chat with AI responses via HTTP

**Enhanced State:** Full-featured chatbot with categories, multilingual, Socket.io

```typescript
// Structure
ChatbotWidget
├── Header (with language selector)
├── WelcomeScreen (on first open)
│   ├── CategoryCards (6 categories)
│   └── QuickActions (3 buttons)
├── MessagesArea
│   ├── Message (AI/User/Agent)
│   └── TypingIndicator
├── WhatICanDoMenu (expandable)
└── InputArea
    ├── TextInput
    └── SendButton
```

**Key Features to Add:**
1. Socket.io connection instead of HTTP
2. Welcome screen with categories
3. Language selector (Telugu, Hindi, English)
4. "What I Can Do" expandable menu
5. Quick action buttons
6. Agent handoff UI

### Agent Dashboard (New Component)

```typescript
// Structure
AgentDashboard
├── Header
│   ├── AgentInfo (name, status)
│   └── Metrics (chats handled, avg response time)
├── Sidebar
│   ├── ChatQueue (waiting chats)
│   └── ActiveChats (current conversations)
└── MainArea
    ├── ChatWindow (selected chat)
    │   ├── UserInfo
    │   ├── ConversationHistory
    │   ├── MessageInput
    │   └── QuickReplies
    └── Analytics (for supervisors)
```

## Socket.io Events Specification

### Client → Server Events

```typescript
// Connection
'chat:connect' {
  userId: string;
  sessionId: string;
  language: 'en' | 'te' | 'hi';
}

// User sends message
'chat:message' {
  message: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
}

// User is typing
'chat:typing' {
  userId: string;
  isTyping: boolean;
}

// Request human agent
'chat:requestAgent' {
  userId: string;
  sessionId: string;
  reason: string;
}

// Language change
'chat:changeLanguage' {
  userId: string;
  language: 'en' | 'te' | 'hi';
}

// Disconnect
'chat:disconnect' {
  userId: string;
  sessionId: string;
}
```

### Server → Client Events

```typescript
// Bot response
'chat:response' {
  message: string;
  model: string;
  timestamp: Date;
  language: string;
}

// Streaming response (word-by-word)
'chat:stream' {
  chunk: string;
  isComplete: boolean;
}

// Bot is typing
'chat:typing' {
  isTyping: boolean;
  sender: 'bot' | 'agent';
}

// Status update (RTI, case, etc.)
'status:update' {
  type: 'rti' | 'case' | 'petition';
  id: string;
  newStatus: string;
  message: string;
}

// Agent joined conversation
'agent:joined' {
  agentName: string;
  agentId: string;
  message: string;
}

// Push notification
'notification:push' {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

// Error
'chat:error' {
  errorMessage: string;
  errorCode: string;
}
```

### Agent Dashboard Events

```typescript
// Agent → Server
'agent:connect' {
  agentId: string;
  status: 'available' | 'busy' | 'away';
}

'agent:acceptChat' {
  agentId: string;
  chatId: string;
}

'agent:sendMessage' {
  agentId: string;
  chatId: string;
  message: string;
}

'agent:closeChat' {
  agentId: string;
  chatId: string;
  resolution: string;
}

// Server → Agent
'agent:newChatInQueue' {
  chatId: string;
  userId: string;
  waitTime: number;
  language: string;
  preview: string;
}

'agent:chatAssigned' {
  chatId: string;
  conversationHistory: Message[];
  userInfo: UserProfile;
}
```

## Database Schema

### MongoDB Collections

#### 1. ChatSessions
```typescript
{
  _id: ObjectId,
  userId: string,
  sessionId: string,
  language: 'en' | 'te' | 'hi',
  messages: [
    {
      id: string,
      role: 'user' | 'bot' | 'agent',
      content: string,
      timestamp: Date,
      metadata: {
        model?: string,
        confidence?: number,
        agentId?: string
      }
    }
  ],
  status: 'active' | 'waiting_agent' | 'with_agent' | 'closed',
  assignedAgent: ObjectId | null,
  handoffReason: string | null,
  createdAt: Date,
  updatedAt: Date,
  closedAt: Date | null
}
```

#### 2. KnowledgeBase
```typescript
{
  _id: ObjectId,
  category: 'services' | 'faqs' | 'centers' | 'events' | 'petitions' | 'emergency' | 'rti' | 'legal',
  title: {
    en: string,
    te: string,
    hi: string
  },
  content: {
    en: string,
    te: string,
    hi: string
  },
  keywords: {
    en: string[],
    te: string[],
    hi: string[]
  },
  metadata: {
    priority: number,
    isActive: boolean,
    usageCount: number
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. Agents
```typescript
{
  _id: ObjectId,
  name: string,
  email: string,
  password: string (hashed),
  role: 'agent' | 'senior_agent' | 'supervisor',
  languages: ['en', 'te', 'hi'],
  status: 'available' | 'busy' | 'away' | 'offline',
  currentChats: ObjectId[],
  maxConcurrentChats: number,
  metrics: {
    totalChatsHandled: number,
    averageResponseTime: number,
    satisfactionRating: number
  },
  createdAt: Date,
  lastActiveAt: Date
}
```

#### 4. Users (Enhance existing)
```typescript
{
  _id: ObjectId,
  // ... existing fields ...
  languagePreference: 'en' | 'te' | 'hi',
  chatHistory: ObjectId[], // references to ChatSessions
  preferences: {
    notifications: boolean,
    emailUpdates: boolean
  }
}
```

## Redis Data Structures

### 1. Message Queue
```
Key: chat:queue
Type: List
Value: JSON stringified chat requests
TTL: 1 hour
```

### 2. Session Storage
```
Key: session:{sessionId}
Type: Hash
Fields: {
  userId: string,
  language: string,
  context: JSON string (last 10 messages),
  createdAt: timestamp
}
TTL: 30 minutes
```

### 3. Rate Limiting
```
Key: ratelimit:{userId}:minute
Type: String (counter)
TTL: 60 seconds

Key: ratelimit:{userId}:hour
Type: String (counter)
TTL: 3600 seconds
```

### 4. FAQ Cache
```
Key: faq:{language}:{query_hash}
Type: String (JSON)
TTL: 1 hour
```

### 5. Agent Status
```
Key: agent:{agentId}:status
Type: Hash
Fields: {
  status: string,
  activeChats: JSON array,
  lastSeen: timestamp
}
TTL: None (persistent)
```

## API Endpoints

### Existing (Keep)
```
POST   /api/chatbot/message      - Send message (will deprecate for Socket.io)
GET    /api/chatbot/status       - Get chatbot status
GET    /api/chatbot/search       - Search knowledge base
```

### New Endpoints
```
// Language
PUT    /api/user/language        - Update language preference
GET    /api/i18n/:lang           - Get translations

// Agent Dashboard
POST   /api/agent/login          - Agent authentication
GET    /api/agent/queue          - Get chat queue
GET    /api/agent/chats          - Get active chats
POST   /api/agent/chat/:id/close - Close chat
GET    /api/agent/analytics      - Get analytics

// Knowledge Base (Admin)
POST   /api/admin/knowledge      - Add knowledge entry
PUT    /api/admin/knowledge/:id  - Update knowledge entry
DELETE /api/admin/knowledge/:id  - Delete knowledge entry
```

## Multilingual Implementation

### i18next Configuration

```typescript
// client/src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import te from './locales/te.json';
import hi from './locales/hi.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      te: { translation: te },
      hi: { translation: hi }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

### Translation Files Structure

```json
// en.json
{
  "chat": {
    "welcome": "Hello! How can I help you today?",
    "typing": "Typing...",
    "sendMessage": "Send message",
    "talkToAgent": "Talk to Human Agent"
  },
  "categories": {
    "legal": "Legal & Justice",
    "emergency": "Emergency Support",
    "services": "Citizen Services",
    "education": "Education & Awareness",
    "involvement": "Get Involved",
    "locations": "Find Locations"
  },
  "quickActions": {
    "trackStatus": "Track Status",
    "fileReport": "File Report",
    "findCenter": "Find Center"
  }
}

// te.json (Telugu)
{
  "chat": {
    "welcome": "నమస్కారం! నేను మీకు ఎలా సహాయం చేయగలను?",
    "typing": "టైప్ చేస్తున్నారు...",
    "sendMessage": "సందేశం పంపండి",
    "talkToAgent": "మానవ ఏజెంట్‌తో మాట్లాడండి"
  },
  // ... more translations
}

// hi.json (Hindi)
{
  "chat": {
    "welcome": "नमस्ते! मैं आपकी कैसे मदद कर सकता हूं?",
    "typing": "टाइप कर रहे हैं...",
    "sendMessage": "संदेश भेजें",
    "talkToAgent": "मानव एजेंट से बात करें"
  },
  // ... more translations
}
```

## Implementation Phases

### Phase 1: Socket.io Migration (Week 1)
**Goal:** Replace HTTP with Socket.io for real-time communication

**Tasks:**
1. Install Socket.io dependencies
2. Set up Socket.io server
3. Create socket service on client
4. Migrate ChatbotWidget to use Socket.io
5. Test real-time messaging

**Files to Modify:**
- `server/src/server.ts` - Add Socket.io server
- `server/src/app.ts` - Configure Socket.io
- `client/src/services/chatbot.service.ts` - Add Socket.io methods
- `client/src/components/ChatbotWidget.tsx` - Use Socket.io

**Files to Create:**
- `server/src/socket/index.ts`
- `server/src/socket/chatSocket.ts`
- `client/src/services/socket.service.ts`
- `client/src/hooks/useSocket.ts`

### Phase 2: Redis Integration (Week 1)
**Goal:** Add Redis for queuing, caching, and rate limiting

**Tasks:**
1. Install Redis and ioredis
2. Create Redis service
3. Implement message queue
4. Add rate limiting
5. Add FAQ caching

**Files to Create:**
- `server/src/services/redis.service.ts`
- `server/src/services/queue.service.ts`
- `server/src/services/rateLimit.service.ts`
- `server/src/middleware/rateLimit.ts`

### Phase 3: Multilingual Support (Week 2)
**Goal:** Add Telugu, Hindi, English support

**Tasks:**
1. Install i18next dependencies
2. Create translation files
3. Set up i18next configuration
4. Add language selector to ChatbotWidget
5. Implement language detection
6. Update Gemini prompts for each language

**Files to Create:**
- `client/src/i18n/config.ts`
- `client/src/i18n/locales/en.json`
- `client/src/i18n/locales/te.json`
- `client/src/i18n/locales/hi.json`
- `client/src/components/chatbot/LanguageSelector.tsx`
- `client/src/hooks/useLanguage.ts`
- `server/src/services/language.service.ts`

**Files to Modify:**
- `client/src/components/ChatbotWidget.tsx`
- `server/src/services/ai.service.ts`

### Phase 4: Enhanced UI Features (Week 2-3)
**Goal:** Add welcome screen, categories, quick actions

**Tasks:**
1. Create WelcomeScreen component
2. Create CategoryCard component
3. Create QuickActions component
4. Create WhatICanDo menu
5. Enhance RAG service with more categories

**Files to Create:**
- `client/src/components/chatbot/WelcomeScreen.tsx`
- `client/src/components/chatbot/CategoryCard.tsx`
- `client/src/components/chatbot/QuickActions.tsx`
- `client/src/components/chatbot/WhatICanDo.tsx`

**Files to Modify:**
- `client/src/components/ChatbotWidget.tsx`
- `server/src/services/rag.service.ts`

### Phase 5: Agent Dashboard (Week 3-4)
**Goal:** Build agent dashboard for human handoff

**Tasks:**
1. Create Agent model
2. Create agent authentication
3. Build AgentDashboard component
4. Implement chat queue
5. Add multi-chat support
6. Implement handoff logic

**Files to Create:**
- `server/src/models/Agent.model.ts`
- `server/src/models/ChatSession.model.ts`
- `server/src/services/handoff.service.ts`
- `server/src/socket/agentSocket.ts`
- `client/src/pages/AgentDashboardPage.tsx`
- `client/src/components/agent-dashboard/AgentDashboard.tsx`
- `client/src/components/agent-dashboard/ChatQueue.tsx`
- `client/src/components/agent-dashboard/ActiveChats.tsx`
- `client/src/components/agent-dashboard/ChatWindow.tsx`
- `client/src/services/agent.service.ts`

### Phase 6: Admin Dashboard Enhancements (Week 4)
**Goal:** Add admin features for content management

**Tasks:**
1. Create KnowledgeBase model
2. Add admin API endpoints
3. Build admin UI for knowledge management
4. Add multilingual content support

**Files to Create:**
- `server/src/models/KnowledgeBase.model.ts`
- `server/src/controllers/admin.controller.ts`
- `server/src/routes/admin.routes.ts`

## Testing Strategy

### Unit Tests
- Test individual services (RAG, AI, Redis)
- Test Socket.io event handlers
- Test language detection
- Test rate limiting

### Integration Tests
- Test complete chat flow
- Test agent handoff
- Test multilingual responses
- Test queue management

### End-to-End Tests
- Test user journey from chat to agent
- Test language switching
- Test multiple concurrent users

## Deployment Considerations

### Environment Variables
```env
# Server
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
GEMINI_API_KEY=...
JWT_SECRET=...

# Socket.io
SOCKET_CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_MINUTE=10
RATE_LIMIT_HOUR=100
```

### Production Setup
1. Use PM2 for process management
2. Set up Nginx as reverse proxy
3. Enable SSL/TLS
4. Configure Redis persistence
5. Set up MongoDB replica set
6. Enable Socket.io sticky sessions for load balancing

## Security Considerations

1. **Authentication:** JWT tokens for agents
2. **Rate Limiting:** Redis-based rate limiting
3. **Input Validation:** Sanitize all user inputs
4. **XSS Protection:** Escape HTML in messages
5. **CORS:** Restrict origins in production
6. **Socket.io Auth:** Verify tokens on connection
7. **API Keys:** Never expose Gemini API key to client

## Performance Optimization

1. **Redis Caching:** Cache frequent FAQ responses
2. **Message Queue:** Handle concurrent requests efficiently
3. **Lazy Loading:** Load translations on demand
4. **Connection Pooling:** MongoDB and Redis connection pools
5. **CDN:** Serve static assets via CDN
6. **Compression:** Enable gzip compression
7. **Socket.io Rooms:** Use rooms for efficient broadcasting

---

This design document provides the complete blueprint for building the PPC Service Chatbot. Follow the implementation phases sequentially, and refer to the LEARNING_GUIDE.md for detailed step-by-step instructions.
