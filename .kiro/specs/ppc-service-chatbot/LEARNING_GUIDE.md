# Learning Guide - PPC Service Chatbot

## Overview

This guide will help you learn and build the PPC Service Chatbot step-by-step. You'll learn real-world technologies used in production chat applications while building a complete system.

## Prerequisites

### What You Should Know:
- ✅ JavaScript/TypeScript basics
- ✅ React fundamentals
- ✅ Node.js and Express basics
- ✅ MongoDB basics (you already have this)
- ✅ REST API concepts

### What You'll Learn:
- 🎓 Socket.io (real-time WebSockets)
- 🎓 Redis (caching, queuing, rate limiting)
- 🎓 i18next (internationalization)
- 🎓 RAG (Retrieval-Augmented Generation)
- 🎓 Production chat architecture
- 🎓 Agent dashboard patterns

## Learning Path

### Phase 1: Socket.io Basics (Week 1 - Days 1-3)
### Phase 2: Redis Integration (Week 1 - Days 4-5)
### Phase 3: Multilingual Support (Week 2 - Days 1-3)
### Phase 4: Enhanced UI (Week 2-3 - Days 4-7)
### Phase 5: Agent Dashboard (Week 3-4)
### Phase 6: Admin Features (Week 4)

---

## Phase 1: Socket.io Basics (Days 1-3)

### 🎯 Goal
Replace HTTP API with Socket.io for real-time bidirectional communication

### 📚 What to Learn First

**1. Watch These Videos (2-3 hours):**
- Socket.io Crash Course: https://www.youtube.com/watch?v=1BfCnjr_Vjg
- Real-time Chat with Socket.io: https://www.youtube.com/watch?v=rxzOqP9YwmM

**2. Read Documentation (1 hour):**
- Socket.io Docs: https://socket.io/docs/v4/
- Socket.io Client API: https://socket.io/docs/v4/client-api/

**3. Key Concepts to Understand:**
- WebSocket vs HTTP
- Events and event listeners
- Rooms and namespaces
- Broadcasting messages
- Connection/disconnection handling

### 🛠️ What to Build

#### Step 1.1: Install Dependencies

```bash
# Server
cd server
npm install socket.io
npm install @types/socket.io --save-dev

# Client
cd client
npm install socket.io-client
```

#### Step 1.2: Set Up Socket.io Server

**File to Create:** `server/src/socket/index.ts`

**What to Learn:** How to initialize Socket.io with Express

**Your Task:** Create a Socket.io server that:
- Connects to your Express app
- Handles CORS properly
- Logs connections and disconnections

**Hints:**
```typescript
// Import Socket.io
import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';

// Initialize with your HTTP server
// Configure CORS to allow your client origin
// Listen for 'connection' event
```

**Resources:**
- https://socket.io/docs/v4/server-initialization/
- https://socket.io/docs/v4/handling-cors/


#### Step 1.3: Create Chat Socket Handler

**File to Create:** `server/src/socket/chatSocket.ts`

**What to Learn:** How to handle Socket.io events

**Your Task:** Create event handlers for:
- `chat:connect` - User connects
- `chat:message` - User sends message
- `chat:typing` - User is typing
- `chat:disconnect` - User disconnects

**Hints:**
```typescript
// Listen for events with socket.on()
// Emit responses with socket.emit()
// Use socket.id for unique identification
// Store user session data
```

**Resources:**
- https://socket.io/docs/v4/listening-to-events/
- https://socket.io/docs/v4/emitting-events/

#### Step 1.4: Create Client Socket Service

**File to Create:** `client/src/services/socket.service.ts`

**What to Learn:** How to connect to Socket.io from React

**Your Task:** Create a service that:
- Connects to Socket.io server
- Provides methods to emit events
- Provides methods to listen for events
- Handles reconnection

**Hints:**
```typescript
// Import io from 'socket.io-client'
// Connect to your server URL
// Create methods: connect(), disconnect(), emit(), on()
// Handle connection errors
```

**Resources:**
- https://socket.io/docs/v4/client-initialization/
- https://socket.io/docs/v4/client-api/

#### Step 1.5: Create useSocket Hook

**File to Create:** `client/src/hooks/useSocket.ts`

**What to Learn:** How to use Socket.io in React with hooks

**Your Task:** Create a custom hook that:
- Manages Socket.io connection
- Provides methods to send/receive messages
- Handles connection state
- Cleans up on unmount

**Hints:**
```typescript
// Use useEffect for connection/cleanup
// Use useState for connection status
// Use useCallback for event handlers
// Return connection status and methods
```

**Resources:**
- https://react.dev/reference/react/useEffect
- https://socket.io/how-to/use-with-react

#### Step 1.6: Update ChatbotWidget

**File to Modify:** `client/src/components/ChatbotWidget.tsx`

**What to Learn:** How to integrate Socket.io into existing component

**Your Task:** Modify ChatbotWidget to:
- Use useSocket hook instead of HTTP fetch
- Emit 'chat:message' when user sends message
- Listen for 'chat:response' for AI replies
- Show typing indicator when bot is typing
- Handle connection status

**Hints:**
```typescript
// Replace chatbotService.sendMessage() with socket.emit()
// Add socket.on() listeners in useEffect
// Update state when receiving messages
// Show "Connecting..." if socket disconnected
```

### ✅ Checkpoint 1: Test Socket.io

**How to Test:**
1. Start Redis: `redis-server` (install if needed)
2. Start server: `cd server && npm run dev`
3. Start client: `cd client && npm run dev`
4. Open chatbot and send a message
5. Check browser console for Socket.io logs
6. Check server console for received events

**Expected Result:**
- Messages sent via Socket.io (not HTTP)
- Real-time responses without page refresh
- Typing indicator works
- Connection status shows "Connected"

**Troubleshooting:**
- CORS errors? Check Socket.io CORS config
- Connection refused? Check server URL in client
- Events not received? Check event names match exactly

---

## Phase 2: Redis Integration (Days 4-5)

### 🎯 Goal
Add Redis for message queuing, caching, and rate limiting

### 📚 What to Learn First

**1. Watch These Videos (2 hours):**
- Redis Crash Course: https://www.youtube.com/watch?v=jgpVdJB2sKQ
- Redis with Node.js: https://www.youtube.com/watch?v=oaJq1mQ3dFI

**2. Read Documentation (1 hour):**
- Redis Docs: https://redis.io/docs/
- ioredis (Node.js client): https://github.com/redis/ioredis

**3. Key Concepts to Understand:**
- Key-value storage
- Data types (String, List, Hash, Set)
- TTL (Time To Live)
- Pub/Sub pattern
- Queues with Lists

### 🛠️ What to Build

#### Step 2.1: Install Redis

**On Windows:**
```bash
# Install via WSL or use Redis Docker
docker run -d -p 6379:6379 redis
```

**On Mac:**
```bash
brew install redis
brew services start redis
```

**On Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

#### Step 2.2: Install ioredis

```bash
cd server
npm install ioredis
npm install @types/ioredis --save-dev
```

#### Step 2.3: Create Redis Service

**File to Create:** `server/src/services/redis.service.ts`

**What to Learn:** How to connect to Redis and perform operations

**Your Task:** Create a Redis service that:
- Connects to Redis
- Provides methods: get, set, del, expire
- Handles connection errors
- Exports a singleton instance

**Hints:**
```typescript
// Import Redis from 'ioredis'
// Create connection with URL from env
// Add error handling
// Export single instance
```

**Resources:**
- https://github.com/redis/ioredis#basic-usage

#### Step 2.4: Create Queue Service

**File to Create:** `server/src/services/queue.service.ts`

**What to Learn:** How to implement message queue with Redis Lists

**Your Task:** Create a queue service that:
- Adds messages to queue (LPUSH)
- Processes messages from queue (RPOP)
- Handles queue overflow
- Returns queue length

**Hints:**
```typescript
// Use Redis LPUSH to add to queue
// Use Redis RPOP to get from queue
// Use Redis LLEN to get queue length
// Set max queue size (1000)
```

**Resources:**
- https://redis.io/commands/lpush/
- https://redis.io/commands/rpop/

#### Step 2.5: Create Rate Limit Service

**File to Create:** `server/src/services/rateLimit.service.ts`

**What to Learn:** How to implement rate limiting with Redis

**Your Task:** Create rate limiting that:
- Tracks messages per user per minute
- Tracks messages per user per hour
- Returns true/false if limit exceeded
- Uses Redis INCR and EXPIRE

**Hints:**
```typescript
// Key format: ratelimit:{userId}:minute
// Use INCR to increment counter
// Use EXPIRE to set TTL
// Check if count > limit
```

**Resources:**
- https://redis.io/commands/incr/
- https://redis.io/commands/expire/

#### Step 2.6: Add Rate Limit Middleware

**File to Create:** `server/src/middleware/rateLimit.ts`

**What to Learn:** How to create Express middleware

**Your Task:** Create middleware that:
- Checks rate limit before processing
- Returns 429 error if exceeded
- Adds rate limit headers to response

**Hints:**
```typescript
// Get userId from request
// Call rateLimitService.checkLimit()
// If exceeded, return 429 status
// Otherwise, call next()
```

#### Step 2.7: Integrate Queue with Chat

**File to Modify:** `server/src/socket/chatSocket.ts`

**What to Learn:** How to use queue for concurrent requests

**Your Task:** Modify chat handler to:
- Add incoming messages to queue
- Process queue messages one by one
- Handle queue overflow gracefully

**Hints:**
```typescript
// On 'chat:message', add to queue
// Process queue in background
// Emit response when processed
// Handle errors
```

### ✅ Checkpoint 2: Test Redis

**How to Test:**
1. Start Redis: `redis-server`
2. Test rate limiting: Send 11 messages quickly
3. Check Redis: `redis-cli` then `KEYS *`
4. Verify queue: Send multiple messages simultaneously

**Expected Result:**
- Rate limit kicks in after 10 messages/minute
- Messages queued when AI is busy
- Redis stores session data
- FAQ responses cached

---

## Phase 3: Multilingual Support (Days 1-3 of Week 2)

### 🎯 Goal
Add Telugu, Hindi, and English language support

### 📚 What to Learn First

**1. Watch These Videos (2 hours):**
- i18next Tutorial: https://www.youtube.com/watch?v=SA_9i4TtxLQ
- React i18next: https://www.youtube.com/watch?v=txHU6lrsa3o

**2. Read Documentation (1 hour):**
- i18next Docs: https://www.i18next.com/
- react-i18next: https://react.i18next.com/

**3. Key Concepts to Understand:**
- Translation keys and namespaces
- Language detection
- Interpolation and pluralization
- Lazy loading translations

### 🛠️ What to Build

#### Step 3.1: Install i18next

```bash
cd client
npm install i18next react-i18next i18next-browser-languagedetector
```

#### Step 3.2: Create Translation Files

**Files to Create:**
- `client/src/i18n/locales/en.json`
- `client/src/i18n/locales/te.json`
- `client/src/i18n/locales/hi.json`

**What to Learn:** How to structure translation files

**Your Task:** Create translation files with:
- Chat messages
- Button labels
- Category names
- Error messages

**Example Structure:**
```json
{
  "chat": {
    "welcome": "Hello! How can I help?",
    "send": "Send",
    "typing": "Typing..."
  },
  "categories": {
    "legal": "Legal & Justice",
    "emergency": "Emergency Support"
  }
}
```

**Resources:**
- Google Translate for Telugu/Hindi
- Ask native speakers to review

#### Step 3.3: Configure i18next

**File to Create:** `client/src/i18n/config.ts`

**What to Learn:** How to initialize i18next

**Your Task:** Configure i18next with:
- Language detector
- Translation resources
- Fallback language (English)
- React integration

**Hints:**
```typescript
// Import i18n, initReactI18next, LanguageDetector
// Load translation files
// Set fallbackLng to 'en'
// Initialize with .init()
```

**Resources:**
- https://www.i18next.com/overview/configuration-options

#### Step 3.4: Create Language Selector

**File to Create:** `client/src/components/chatbot/LanguageSelector.tsx`

**What to Learn:** How to change language dynamically

**Your Task:** Create a component that:
- Shows current language
- Displays language options (EN, తె, हि)
- Changes language on click
- Saves preference to localStorage

**Hints:**
```typescript
// Use useTranslation() hook
// Call i18n.changeLanguage()
// Store in localStorage
// Update UI immediately
```

#### Step 3.5: Create useLanguage Hook

**File to Create:** `client/src/hooks/useLanguage.ts`

**What to Learn:** How to manage language state

**Your Task:** Create a hook that:
- Gets current language
- Provides changeLanguage function
- Detects language from browser
- Syncs with backend

**Hints:**
```typescript
// Use i18n.language for current
// Use i18n.changeLanguage() to change
// Emit socket event on change
// Load from localStorage on mount
```

#### Step 3.6: Update ChatbotWidget with Translations

**File to Modify:** `client/src/components/ChatbotWidget.tsx`

**What to Learn:** How to use translations in components

**Your Task:** Replace all hardcoded text with:
- `t('chat.welcome')` for welcome message
- `t('chat.send')` for send button
- `t('categories.legal')` for categories
- Add LanguageSelector to header

**Hints:**
```typescript
// Import useTranslation
// const { t } = useTranslation()
// Replace strings with t('key')
// Add LanguageSelector component
```

#### Step 3.7: Add Language Detection on Backend

**File to Create:** `server/src/services/language.service.ts`

**What to Learn:** How to detect language from text

**Your Task:** Create service that:
- Detects Telugu (Unicode U+0C00-U+0C7F)
- Detects Hindi (Unicode U+0900-U+097F)
- Detects English (default)
- Returns language code

**Hints:**
```typescript
// Use regex to check Unicode ranges
// Check first few characters
// Return 'te', 'hi', or 'en'
```

#### Step 3.8: Update Gemini Prompts for Language

**File to Modify:** `server/src/services/ai.service.ts`

**What to Learn:** How to instruct AI to respond in specific language

**Your Task:** Modify buildSystemPrompt to:
- Accept language parameter
- Add language instruction to prompt
- Include language-specific examples

**Hints:**
```typescript
// Add language param to function
// Add: "You must respond in [Telugu/Hindi/English]"
// Provide examples in that language
```

### ✅ Checkpoint 3: Test Multilingual

**How to Test:**
1. Open chatbot
2. Click language selector
3. Switch to Telugu (తె)
4. Verify UI changes to Telugu
5. Send message in Telugu
6. Verify AI responds in Telugu
7. Switch to Hindi and test
8. Check localStorage for saved preference

**Expected Result:**
- UI translates instantly
- AI responds in selected language
- Language persists across sessions
- Auto-detection works for Telugu/Hindi input

---

## Next Steps

Continue with Phase 4 (Enhanced UI), Phase 5 (Agent Dashboard), and Phase 6 (Admin Features) following the same pattern:
1. Learn the concepts
2. Build step-by-step
3. Test at checkpoints
4. Ask for help when stuck

## Getting Help

**When You're Stuck:**
1. Check the error message carefully
2. Search the error on Google/Stack Overflow
3. Review the documentation links
4. Ask me specific questions with:
   - What you're trying to do
   - What error you're getting
   - What you've already tried

**Good Question Example:**
"I'm trying to emit a Socket.io event from ChatbotWidget, but the server isn't receiving it. I've checked that the event names match ('chat:message'). Here's my code: [paste code]. The error I'm seeing is: [paste error]."

## Resources Summary

### Socket.io
- Docs: https://socket.io/docs/v4/
- Tutorial: https://socket.io/get-started/chat

### Redis
- Docs: https://redis.io/docs/
- ioredis: https://github.com/redis/ioredis

### i18next
- Docs: https://www.i18next.com/
- React: https://react.i18next.com/

### General
- TypeScript: https://www.typescriptlang.org/docs/
- React Hooks: https://react.dev/reference/react

---

**Remember:** The goal is to LEARN, not just get code working. Take time to understand each concept before moving to the next. Build slowly and test frequently!

Good luck! 🚀
