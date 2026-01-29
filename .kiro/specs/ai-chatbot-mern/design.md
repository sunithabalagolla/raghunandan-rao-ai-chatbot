# Design Document: AI Chatbot with Human Agent Handoff

## Overview

This document describes the design for a full-stack AI chatbot application built with the MERN stack (MongoDB, Express.js, React, Node.js). The system provides intelligent conversational AI using the Gemini API, with seamless handoff to human agents when needed. The architecture emphasizes real-time communication, scalability, and zero-cost operation using free-tier services.

The application consists of three main interfaces:
1. **User Chat Interface** - React-based web application for end users
2. **Agent Dashboard** - Real-time interface for support agents
3. **Backend API** - Node.js/Express server with Socket.io for real-time features

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI[User Chat Interface<br/>React + Vite]
        AD[Agent Dashboard<br/>React + Vite]
    end
    
    subgraph "Communication Layer"
        WS[Socket.io Server<br/>Real-time Events]
    end
    
    subgraph "Application Layer"
        API[Express REST API<br/>Authentication & CRUD]
        QM[Queue Manager<br/>Agent Assignment]
        AM[AI Manager<br/>Gemini Integration]
    end
    
    subgraph "Data Layer"
        DB[(MongoDB<br/>Users, Conversations, Tickets)]
        CACHE[(Redis Optional<br/>Sessions, Queue)]
    end
    
    subgraph "External Services"
        GEMINI[Google Gemini API<br/>AI Responses]
    end
    
    UI <-->|WebSocket| WS
    AD <-->|WebSocket| WS
    UI <-->|HTTP| API
    AD <-->|HTTP| API
    WS --> QM
    API --> AM
    AM --> GEMINI
    API --> DB
    QM --> DB
    QM -.->|Optional| CACHE
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui (styling)
- Socket.io-client (real-time)
- Zustand (state management)
- react-markdown (message formatting)
- framer-motion (animations)
- lucide-react (icons)

**Backend:**
- Node.js 18+
- Express.js (REST API)
- Socket.io (WebSocket server)
- Mongoose (MongoDB ODM)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- express-rate-limit (API protection)

**Database:**
- MongoDB Atlas (free tier: 512MB)
- Redis (optional, via Upstash free tier)

**AI Service:**
- Google Gemini API (free tier)

**Deployment:**
- Frontend: Vercel/Netlify (free)
- Backend: Render/Railway (free tier)
- Database: MongoDB Atlas (free tier)

## Components and Interfaces

### 1. User Authentication System

**NOTE:** Authentication system is already implemented in a separate project and will be integrated into this chatbot application.

**Existing Features:**
- ✅ Email/password registration
- ✅ JWT token generation and validation
- ✅ Google OAuth integration
- ✅ Email verification
- ✅ Password reset functionality

**Integration Approach:**
- Copy existing auth code into chatbot backend
- Reuse User model, AuthController, and AuthMiddleware
- Maintain existing API endpoints
- Extend User model if needed for chatbot-specific fields

**Components (from existing project):**
- `AuthController` - Handles registration, login, logout, OAuth
- `AuthMiddleware` - JWT token validation
- `User` model - MongoDB schema for user data
- `EmailService` - Email verification and password reset

**Interface:**
```typescript
interface User {
  _id: string;
  email: string;
  passwordHash?: string; // Optional for OAuth users
  googleId?: string; // For Google OAuth
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  lastLogin: Date;
  preferredLanguage?: string; // Chatbot-specific addition
}

interface AuthTokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}
```

**Existing API Endpoints:**
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate and return JWT
- `POST /api/auth/logout` - Invalidate session
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### 2. Conversation Management System

**Components:**
- `ConversationController` - CRUD operations for conversations
- `Conversation` model - MongoDB schema
- `Message` model - Embedded in conversations

**Interface:**
```typescript
interface Message {
  _id: string;
  role: 'user' | 'ai' | 'agent';
  content: string;
  timestamp: Date;
  agentId?: string; // Present if role is 'agent'
}

interface Conversation {
  _id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'archived';
}
```

**API Endpoints:**
- `GET /api/conversations` - List user's conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id` - Get conversation with messages
- `DELETE /api/conversations/:id` - Delete conversation
- `POST /api/conversations/:id/export` - Export as text file

### 3. AI Integration System

**Components:**
- `AIService` - Gemini API integration
- `ContextManager` - Manages conversation context
- `RateLimiter` - Throttles requests to stay in free tier

**Interface:**
```typescript
interface AIRequest {
  conversationId: string;
  userMessage: string;
  conversationHistory: Message[];
}

interface AIResponse {
  content: string;
  confidence: number; // 0-1 score
  shouldHandoff: boolean; // True if AI suggests human help
  processingTime: number;
}

interface GeminiConfig {
  apiKey: string;
  model: string; // 'gemini-pro'
  maxTokens: number;
  temperature: number;
}
```

**Gemini Integration Flow:**
1. Receive user message
2. Build context from last N messages (e.g., 10)
3. Format prompt with system instructions
4. Call Gemini API with context
5. Parse response and extract confidence
6. Return formatted response

**Rate Limiting Strategy:**
- Track requests per user per minute
- Implement exponential backoff on rate limit errors
- Queue requests when approaching limits
- Display wait time to users

### 4. Real-Time Messaging System

**Components:**
- `SocketServer` - Socket.io server configuration
- `MessageHandler` - Routes socket events
- `TypingIndicator` - Manages typing status

**Socket Events:**

**Client → Server:**
```typescript
// User sends message to AI
socket.emit('user:message', {
  conversationId: string,
  content: string
});

// User requests human agent
socket.emit('user:request-handoff', {
  conversationId: string,
  reason: string
});

// User typing indicator
socket.emit('user:typing', {
  conversationId: string,
  isTyping: boolean
});
```

**Server → Client:**
```typescript
// AI response received
socket.on('ai:message', {
  conversationId: string,
  content: string,
  messageId: string
});

// AI is processing
socket.on('ai:typing', {
  conversationId: string
});

// Agent joined conversation
socket.on('agent:joined', {
  conversationId: string,
  agentName: string
});

// Agent message
socket.on('agent:message', {
  conversationId: string,
  content: string,
  agentName: string
});
```

### 5. Human Agent Handoff System

**Components:**
- `HandoffController` - Manages handoff requests
- `QueueManager` - Maintains agent queue
- `HandoffTicket` model - MongoDB schema
- `AgentSession` - Tracks agent availability

**Interface:**
```typescript
interface HandoffTicket {
  _id: string;
  userId: string;
  conversationId: string;
  status: 'waiting' | 'assigned' | 'resolved' | 'cancelled';
  priority: number; // 1-5, higher = more urgent
  reason: string;
  conversationContext: Message[]; // Last 10 messages
  createdAt: Date;
  assignedAgentId?: string;
  assignedAt?: Date;
  resolvedAt?: Date;
  resolutionNotes?: string;
  userFeedback?: {
    rating: number; // 1-5
    comment: string;
  };
}

interface AgentSession {
  agentId: string;
  socketId: string;
  status: 'available' | 'busy' | 'offline';
  currentTicketId?: string;
  connectedAt: Date;
}

interface QueuePosition {
  position: number;
  estimatedWaitMinutes: number;
  totalInQueue: number;
}
```

**Handoff Workflow:**

```mermaid
sequenceDiagram
    participant U as User
    participant S as Socket Server
    participant Q as Queue Manager
    participant A as Agent
    participant DB as MongoDB

    U->>S: Request handoff
    S->>DB: Create HandoffTicket
    S->>Q: Add to queue
    Q->>U: Send queue position
    
    loop Check for available agent
        Q->>Q: Poll agent availability
    end
    
    Q->>A: Notify new ticket
    A->>S: Accept ticket
    S->>DB: Update ticket status
    S->>U: Agent joined
    
    loop Live conversation
        U->>S: Send message
        S->>A: Forward message
        A->>S: Send reply
        S->>U: Forward reply
        S->>DB: Save messages
    end
    
    A->>S: Close ticket
    S->>U: Request feedback
    U->>S: Submit feedback
    S->>DB: Save resolution
```

**API Endpoints:**
- `POST /api/handoff/request` - Create handoff request
- `GET /api/handoff/queue-status` - Get user's queue position
- `POST /api/handoff/:id/cancel` - User cancels handoff
- `GET /api/agent/tickets` - Agent views pending tickets
- `POST /api/agent/tickets/:id/accept` - Agent accepts ticket
- `POST /api/agent/tickets/:id/resolve` - Agent closes ticket

**Socket Events for Agents:**
```typescript
// Agent → Server
socket.emit('agent:connect', {
  agentId: string
});

socket.emit('agent:accept-ticket', {
  ticketId: string
});

socket.emit('agent:message', {
  ticketId: string,
  content: string
});

socket.emit('agent:resolve', {
  ticketId: string,
  notes: string
});

// Server → Agent
socket.on('agent:new-ticket', {
  ticket: HandoffTicket
});

socket.on('agent:user-message', {
  ticketId: string,
  content: string
});
```

### 6. Agent Dashboard

**Components:**
- `TicketList` - Shows pending handoff requests
- `ActiveChat` - Real-time chat interface
- `TicketDetails` - Displays conversation history
- `AgentStatus` - Toggle availability

**Features:**
- Real-time ticket notifications with sound
- Display conversation history for context
- Multi-ticket management (queue view)
- Quick responses / canned messages
- Ticket resolution with notes
- Performance metrics (tickets handled, avg time)

### 7. Queue Management System

**Components:**
- `QueueManager` - Core queue logic
- `PriorityCalculator` - Determines ticket priority
- `WaitTimeEstimator` - Calculates estimated wait

**Queue Logic:**
```typescript
interface QueueConfig {
  maxQueueSize: number; // e.g., 50
  warningThreshold: number; // e.g., 10
  maxWaitMinutes: number; // e.g., 30
  priorityFactors: {
    waitTime: number; // Weight for time waiting
    userTier: number; // Weight for user importance
    issueType: number; // Weight for issue urgency
  };
}
```

**Priority Calculation:**
- Base priority = 1
- +1 for every 5 minutes waiting
- +2 for premium users (future feature)
- +3 for critical issues (detected keywords)

**Wait Time Estimation:**
```
estimatedWait = (queuePosition * averageHandlingTime) / availableAgents
```

Where:
- `averageHandlingTime` = rolling average of last 20 tickets
- `availableAgents` = count of agents with status 'available'

### 8. Offline Handoff System

**Components:**
- `SupportTicketController` - Creates offline tickets
- `EmailService` - Sends notifications (optional)

**Workflow when no agents available:**
1. Detect no agents online
2. Show offline form to user
3. Collect: email, phone (optional), issue description
4. Create `SupportTicket` in database
5. Send confirmation email (if email service configured)
6. Agent reviews tickets when online
7. Agent contacts user via email/phone

**Interface:**
```typescript
interface SupportTicket {
  _id: string;
  userId: string;
  conversationId: string;
  contactEmail: string;
  contactPhone?: string;
  issueDescription: string;
  conversationContext: Message[];
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: Date;
  assignedAgentId?: string;
  followUpNotes?: string;
}
```

## Data Models

### MongoDB Schemas

**User Schema:**
```javascript
const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

// Indexes
userSchema.index({ email: 1 });
```

**Conversation Schema:**
```javascript
const messageSchema = new Schema({
  role: { type: String, enum: ['user', 'ai', 'agent'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  agentId: { type: Schema.Types.ObjectId, ref: 'User' }
});

const conversationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'New Conversation' },
  messages: [messageSchema],
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ userId: 1, status: 1 });
```

**HandoffTicket Schema:**
```javascript
const handoffTicketSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  status: { 
    type: String, 
    enum: ['waiting', 'assigned', 'resolved', 'cancelled'], 
    default: 'waiting' 
  },
  priority: { type: Number, default: 1, min: 1, max: 5 },
  reason: { type: String, required: true },
  conversationContext: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  assignedAgentId: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedAt: { type: Date },
  resolvedAt: { type: Date },
  resolutionNotes: { type: String },
  userFeedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String }
  }
});

// Indexes
handoffTicketSchema.index({ status: 1, priority: -1, createdAt: 1 });
handoffTicketSchema.index({ userId: 1 });
handoffTicketSchema.index({ assignedAgentId: 1 });
```

**SupportTicket Schema:**
```javascript
const supportTicketSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String },
  issueDescription: { type: String, required: true },
  conversationContext: [messageSchema],
  status: { type: String, enum: ['open', 'in-progress', 'resolved'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
  assignedAgentId: { type: Schema.Types.ObjectId, ref: 'User' },
  followUpNotes: { type: String }
});

// Indexes
supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ assignedAgentId: 1 });
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:
- Properties 3.1 and 3.2 (message persistence) can be combined into one property about all messages being persisted
- Properties 5.4 and 6.2 (typing indicator) are duplicates and will be combined
- Properties 4.2 and 3.4 (loading conversation history) are similar and will be combined
- Several edge cases (empty conversations, specific timeouts) will be handled by unit tests rather than separate properties

### Authentication Properties

**Property 1: User registration creates valid accounts**
*For any* valid email and password combination, registering a new user should create a user record in the database with a hashed password (not plaintext).
**Validates: Requirements 1.1, 1.4**

**Property 2: Valid credentials authenticate successfully**
*For any* registered user with correct credentials, login should return a valid JWT token that can be used for authenticated requests.
**Validates: Requirements 1.2**

**Property 3: Invalid credentials are rejected**
*For any* login attempt with incorrect password or non-existent email, the system should reject authentication and return an error.
**Validates: Requirements 1.3**

**Property 4: Logout invalidates tokens**
*For any* authenticated user, after logout, their previous JWT token should be invalid for subsequent requests.
**Validates: Requirements 1.5**

### Messaging Properties

**Property 5: Empty messages are rejected**
*For any* string composed entirely of whitespace characters, attempting to send it as a message should be rejected and the conversation state should remain unchanged.
**Validates: Requirements 2.3**

**Property 6: AI responses include conversation context**
*For any* message sent to the AI service, the request should include the previous messages from the conversation to maintain context.
**Validates: Requirements 2.5**

**Property 7: Messages are immediately persisted**
*For any* message sent by a user or AI response received, the message should be persisted to the database and retrievable immediately after.
**Validates: Requirements 3.1, 3.2**

**Property 8: User conversations are fully retrievable**
*For any* user with existing conversations, logging in and fetching conversations should return all conversations with complete message history.
**Validates: Requirements 3.3, 3.4**

**Property 9: Message ordering is preserved**
*For any* sequence of messages sent rapidly, they should be processed and stored in the exact order they were sent (FIFO).
**Validates: Requirements 6.4**

**Property 10: Network failures queue messages**
*For any* message sent during network failure, the message should be cached locally and successfully sent when connectivity is restored.
**Validates: Requirements 8.3**

### Conversation Management Properties

**Property 11: New conversations start empty**
*For any* user creating a new conversation, the conversation should be created with zero messages and a unique ID.
**Validates: Requirements 4.1**

**Property 12: Conversation deletion removes all data**
*For any* conversation deleted by a user, all associated messages should be removed from the database and the conversation should not appear in subsequent queries.
**Validates: Requirements 4.3, 7.1**

**Property 13: Conversation list shows correct metadata**
*For any* conversation with messages, the conversation list should include the most recent message preview, timestamp, and message count.
**Validates: Requirements 4.4**

**Property 14: Export contains complete conversation**
*For any* conversation, exporting should generate a text file containing all messages with timestamps and sender labels in chronological order.
**Validates: Requirements 7.2, 7.4**

**Property 15: Delete all removes user's conversations**
*For any* user with multiple conversations, deleting all conversations should remove every conversation and message for that user from the database.
**Validates: Requirements 7.3**

**Property 16: Cancel preserves data**
*For any* delete operation that is cancelled, all conversation data should remain unchanged in the database.
**Validates: Requirements 7.5**

### UI State Properties

**Property 17: User messages appear immediately**
*For any* message sent by a user, the message should appear in the conversation UI state before the AI response is received.
**Validates: Requirements 6.1**

**Property 18: Typing indicator reflects processing state**
*For any* AI request in progress, the typing indicator should be visible, and should be removed when the response is received.
**Validates: Requirements 5.4, 6.2, 6.3**

**Property 19: Messages include required display fields**
*For any* message displayed in the UI, it should have a timestamp, role (user/ai/agent), and content field.
**Validates: Requirements 5.5**

### AI Service Properties

**Property 20: Rate limiting prevents quota exhaustion**
*For any* sequence of AI requests approaching the rate limit, the system should throttle requests to stay within the free tier limits.
**Validates: Requirements 9.2**

**Property 21: Provider switching preserves conversations**
*For any* conversation in progress, switching the AI provider should not cause data loss and the conversation should continue functioning.
**Validates: Requirements 9.5**

### Handoff System Properties

**Property 22: Handoff creates ticket with context**
*For any* user requesting human agent handoff, a handoff ticket should be created containing the user ID, conversation ID, and the last 10 messages as context.
**Validates: Requirements 10.1, 10.3**

**Property 23: Queue position is accurate**
*For any* user in the handoff queue, their displayed queue position should match their actual position in the ordered queue.
**Validates: Requirements 10.2**

**Property 24: Queue processes in FIFO order**
*For any* multiple users in the handoff queue, when an agent becomes available, the user who requested handoff first should be notified first.
**Validates: Requirements 10.5, 14.1**

**Property 25: Agents receive real-time notifications**
*For any* handoff request created, all agents with status 'available' should receive a real-time socket notification within 2 seconds.
**Validates: Requirements 11.1**

**Property 26: Agent dashboard shows pending tickets**
*For any* agent viewing the dashboard, all handoff tickets with status 'waiting' should be displayed with user information and wait time.
**Validates: Requirements 11.2, 11.4**

**Property 27: Ticket assignment is exclusive**
*For any* handoff ticket, only one agent should be able to accept it, and subsequent accept attempts by other agents should be rejected.
**Validates: Requirements 11.5, 12.4**

**Property 28: Agent acceptance establishes connection**
*For any* agent accepting a handoff ticket, a real-time socket connection should be established between the agent and user, and the ticket status should change to 'assigned'.
**Validates: Requirements 12.1**

**Property 29: Agent-user messages are persisted**
*For any* message exchanged between an agent and user during a handoff session, the message should be persisted to the database with role 'agent' or 'user'.
**Validates: Requirements 12.5**

**Property 30: Resolution closes session**
*For any* agent marking a ticket as resolved, the ticket status should change to 'resolved', the handoff session should close, and the user should return to AI mode.
**Validates: Requirements 13.1, 13.2**

**Property 31: Resolution updates agent status**
*For any* agent closing a handoff session, their status should change to 'available' if they have no other active tickets.
**Validates: Requirements 13.4**

**Property 32: Resolution saves notes and feedback**
*For any* resolved ticket, the resolution notes from the agent and user feedback (if provided) should be persisted to the database.
**Validates: Requirements 13.3, 13.5**

**Property 33: Disconnect removes from queue**
*For any* user disconnecting while in the handoff queue, they should be automatically removed from the queue and their ticket status should change to 'cancelled'.
**Validates: Requirements 14.4**

**Property 34: Wait time calculation is consistent**
*For any* user in the queue, the estimated wait time should be calculated as (queue position × average handling time) / available agents.
**Validates: Requirements 14.2**

## Error Handling

### Error Categories

**1. Authentication Errors:**
- Invalid credentials → 401 Unauthorized
- Expired JWT token → 401 Unauthorized
- Missing authentication → 401 Unauthorized
- Insufficient permissions → 403 Forbidden

**2. Validation Errors:**
- Empty message → 400 Bad Request with message "Message cannot be empty"
- Invalid email format → 400 Bad Request with message "Invalid email format"
- Password too short → 400 Bad Request with message "Password must be at least 8 characters"
- Missing required fields → 400 Bad Request with field-specific messages

**3. AI Service Errors:**
- Rate limit exceeded → 429 Too Many Requests, display "Please wait before sending another message"
- API timeout → 504 Gateway Timeout, display "AI service is slow, please retry"
- API unavailable → 503 Service Unavailable, display "AI service is temporarily unavailable"
- Invalid API key → 500 Internal Server Error, log error, display generic message

**4. Database Errors:**
- Connection failure → Retry 3 times with exponential backoff, then display error
- Query timeout → 504 Gateway Timeout
- Duplicate key → 409 Conflict
- Document not found → 404 Not Found

**5. Handoff Errors:**
- No agents available → Create support ticket instead, notify user
- Queue full → 503 Service Unavailable, display "Support queue is full, please try later"
- Ticket already assigned → 409 Conflict
- Invalid ticket ID → 404 Not Found

### Error Response Format

All API errors follow this structure:
```typescript
interface ErrorResponse {
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable message
    details?: any; // Optional additional context
    timestamp: string;
  };
}
```

### Error Recovery Strategies

**Network Failures:**
1. Detect network disconnection
2. Queue unsent messages in localStorage
3. Display offline indicator to user
4. On reconnection, send queued messages
5. Clear queue on successful send

**Database Failures:**
1. Implement connection pooling with auto-reconnect
2. Retry failed operations with exponential backoff (1s, 2s, 4s)
3. Cache critical data in memory during outage
4. Log all failures for monitoring
5. Display user-friendly error after retries exhausted

**AI Service Failures:**
1. Implement circuit breaker pattern
2. After 5 consecutive failures, open circuit for 60 seconds
3. During open circuit, return cached response or error immediately
4. After timeout, attempt half-open state
5. Track failure rate and alert if > 10%

## Testing Strategy

### Dual Testing Approach

This application will use both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** verify specific examples, edge cases, and error conditions:
- Specific authentication scenarios (valid login, invalid password, expired token)
- Edge cases (empty conversations, single message, very long messages)
- Error conditions (database down, AI service unavailable, network timeout)
- Integration points (Socket.io connections, JWT validation, database queries)

**Property-Based Tests** verify universal properties across all inputs:
- Authentication properties (all valid credentials work, all invalid fail)
- Message persistence (all messages are saved and retrievable)
- Queue ordering (FIFO always maintained)
- Conversation management (all operations preserve data integrity)

Both types of tests are necessary and complementary. Unit tests catch specific bugs and validate concrete scenarios, while property tests verify that the system behaves correctly across the entire input space.

### Property-Based Testing Configuration

**Framework:** fast-check (JavaScript/TypeScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test (due to randomization)
- Seed-based reproducibility for failed tests
- Shrinking enabled to find minimal failing examples
- Timeout: 30 seconds per property

**Test Tagging:**
Each property test must reference its design document property using this format:
```typescript
// Feature: ai-chatbot-mern, Property 1: User registration creates valid accounts
test('property: user registration creates valid accounts', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.emailAddress(),
      fc.string({ minLength: 8, maxLength: 50 }),
      async (email, password) => {
        // Test implementation
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Organization

**Backend Tests:**
```
server/
├── tests/
│   ├── unit/
│   │   ├── auth.test.ts
│   │   ├── conversation.test.ts
│   │   ├── handoff.test.ts
│   │   └── ai-service.test.ts
│   ├── property/
│   │   ├── auth.property.test.ts
│   │   ├── conversation.property.test.ts
│   │   ├── handoff.property.test.ts
│   │   └── queue.property.test.ts
│   └── integration/
│       ├── socket.test.ts
│       └── api.test.ts
```

**Frontend Tests:**
```
client/
├── tests/
│   ├── unit/
│   │   ├── components/
│   │   └── hooks/
│   ├── property/
│   │   ├── message-validation.property.test.ts
│   │   └── state-management.property.test.ts
│   └── integration/
│       └── chat-flow.test.ts
```

### Key Test Scenarios

**Authentication Flow:**
- Unit: Test login with specific valid/invalid credentials
- Property: All valid credentials authenticate, all invalid fail
- Integration: Full registration → login → authenticated request flow

**Messaging Flow:**
- Unit: Test sending specific messages, empty message rejection
- Property: All non-empty messages are persisted and retrievable
- Integration: Send message → AI responds → message saved → UI updates

**Handoff Flow:**
- Unit: Test handoff with no agents, with one agent, with multiple agents
- Property: All handoff requests create tickets, queue maintains FIFO order
- Integration: User requests handoff → agent accepts → messages exchanged → resolution

**Error Handling:**
- Unit: Test specific error scenarios (DB down, AI timeout, invalid token)
- Property: All errors return proper error responses, no data loss
- Integration: Error occurs → user sees message → retry succeeds

### Mocking Strategy

**What to Mock:**
- External AI service (Gemini API) - use mock responses
- Email service (if implemented) - verify calls without sending
- Time-dependent functions - use fake timers

**What NOT to Mock:**
- Database - use test database instance (MongoDB Memory Server)
- Socket.io - use real socket connections in tests
- Core business logic - test actual implementation

### Test Data Generation

**For Property Tests:**
```typescript
// Custom generators for domain objects
const userGenerator = fc.record({
  email: fc.emailAddress(),
  password: fc.string({ minLength: 8, maxLength: 50 })
});

const messageGenerator = fc.record({
  role: fc.constantFrom('user', 'ai', 'agent'),
  content: fc.string({ minLength: 1, maxLength: 1000 }),
  timestamp: fc.date()
});

const conversationGenerator = fc.record({
  userId: fc.hexaString({ minLength: 24, maxLength: 24 }), // MongoDB ObjectId
  messages: fc.array(messageGenerator, { minLength: 0, maxLength: 50 })
});
```

### Continuous Integration

**Test Execution:**
1. Run unit tests on every commit (fast feedback)
2. Run property tests on every PR (comprehensive validation)
3. Run integration tests before merge (end-to-end validation)
4. Generate coverage report (target: >80% coverage)

**Quality Gates:**
- All tests must pass
- No decrease in code coverage
- No critical security vulnerabilities (npm audit)
- Linting passes (ESLint)
- Type checking passes (TypeScript)


## Optional/Future Features

### 1. Voice Input/Output (Optional)

**Components:**
- `VoiceInputHandler` - Manages Web Speech API for speech-to-text
- `VoiceOutputHandler` - Manages Speech Synthesis API for text-to-speech

**Interface:**
```typescript
interface VoiceConfig {
  enabled: boolean;
  autoPlay: boolean; // Auto-play AI responses
  language: string; // e.g., 'en-US', 'hi-IN'
  voice: string; // Selected voice name
}

interface VoiceInputResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}
```

**Implementation:**
- Use browser's Web Speech API (100% free, no external API needed)
- Support multiple languages including Hindi, Telugu
- Toggle voice on/off per user preference
- Voice button in chat interface
- Auto-play toggle for AI responses

**Browser Compatibility:**
- Chrome/Edge: Full support
- Safari: Partial support
- Firefox: Limited support

### 2. Sentiment Analysis for Smart Handoff (Optional)

**Components:**
- `SentimentAnalyzer` - Analyzes user message sentiment
- `HandoffTrigger` - Decides when to suggest handoff

**Interface:**
```typescript
interface SentimentScore {
  score: number; // -1 (negative) to 1 (positive)
  magnitude: number; // 0 to infinity (strength of emotion)
  label: 'positive' | 'neutral' | 'negative';
}

interface HandoffTriggerConfig {
  sentimentThreshold: number; // e.g., -0.5
  consecutiveNegativeMessages: number; // e.g., 3
  frustrationKeywords: string[]; // e.g., ['frustrated', 'angry', 'not helpful']
}
```

**Trigger Conditions:**
1. Sentiment score < -0.5 for 3 consecutive messages
2. User types frustration keywords: "frustrated", "not helpful", "speak to human"
3. AI confidence < 0.3 for response
4. Conversation going in circles (same topic, 3+ exchanges)

**Implementation Options:**
- **Free Option:** Simple keyword-based detection (no external API)
- **Paid Option:** Google Cloud Natural Language API (after free tier)

### 3. Intelligent Agent Routing (Optional)

**Components:**
- `IssueClassifier` - Categorizes user issues
- `AgentRouter` - Routes to specialized agents

**Interface:**
```typescript
interface IssueCategory {
  category: 'technical' | 'billing' | 'sales' | 'general';
  confidence: number;
  keywords: string[];
}

interface AgentSpecialization {
  agentId: string;
  specializations: IssueCategory['category'][];
  currentLoad: number; // Number of active tickets
  maxLoad: number; // Max concurrent tickets
}
```

**Routing Logic:**
1. Classify issue based on conversation keywords
2. Find agents with matching specialization
3. Among matching agents, select least loaded
4. If no specialized agent available, route to general agent
5. If all agents busy, add to queue with category tag

**Category Detection:**
- Technical: "error", "bug", "not working", "crash", "broken"
- Billing: "payment", "charge", "refund", "invoice", "subscription"
- Sales: "pricing", "upgrade", "features", "demo", "purchase"
- General: Everything else

### 4. Canned Responses System (Optional)

**Components:**
- `CannedResponseManager` - Manages quick reply templates
- `CannedResponse` model - MongoDB schema

**Interface:**
```typescript
interface CannedResponse {
  _id: string;
  title: string; // e.g., "Greeting"
  content: string; // e.g., "Hello! How can I help you today?"
  category: string; // e.g., "greeting", "closing", "technical"
  agentId?: string; // Personal template, or null for shared
  usageCount: number;
  createdAt: Date;
}
```

**Features:**
- Pre-defined templates for common responses
- Personal templates per agent
- Shared templates for all agents
- Quick insert with keyboard shortcuts (e.g., /greeting)
- Variable substitution: {{userName}}, {{ticketId}}
- Usage tracking to identify most helpful responses

**API Endpoints:**
- `GET /api/agent/canned-responses` - List all available responses
- `POST /api/agent/canned-responses` - Create new response
- `PUT /api/agent/canned-responses/:id` - Update response
- `DELETE /api/agent/canned-responses/:id` - Delete response

### 5. Agent Performance Metrics (Optional)

**Components:**
- `MetricsCollector` - Tracks agent performance
- `MetricsDashboard` - Displays analytics

**Interface:**
```typescript
interface AgentMetrics {
  agentId: string;
  period: 'today' | 'week' | 'month';
  ticketsHandled: number;
  averageHandlingTime: number; // minutes
  averageResponseTime: number; // seconds
  averageRating: number; // 1-5 from user feedback
  totalChatTime: number; // minutes
  firstResponseTime: number; // seconds (time to first message)
  resolutionRate: number; // percentage of tickets resolved
}

interface SystemMetrics {
  period: 'today' | 'week' | 'month';
  totalTickets: number;
  averageWaitTime: number; // minutes
  peakQueueSize: number;
  handoffRate: number; // percentage of conversations that request handoff
  aiResolutionRate: number; // percentage resolved by AI without handoff
}
```

**Metrics Tracked:**
- Tickets handled per agent
- Average handling time (from accept to resolve)
- Average response time (time between user message and agent reply)
- User satisfaction ratings
- First response time
- Resolution rate
- Peak hours for handoff requests

**Dashboard Features:**
- Real-time metrics display
- Historical trends (daily, weekly, monthly)
- Leaderboard (top performing agents)
- Export metrics as CSV

### 6. Email Notification System (Optional)

**Components:**
- `EmailService` - Sends emails via SendGrid/Resend
- `NotificationQueue` - Queues email jobs

**Interface:**
```typescript
interface EmailConfig {
  provider: 'sendgrid' | 'resend' | 'none';
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

interface EmailTemplate {
  type: 'ticket-created' | 'ticket-assigned' | 'ticket-resolved' | 'agent-notification';
  subject: string;
  htmlBody: string;
  textBody: string;
}
```

**Email Triggers:**
1. **Offline Ticket Created** - Send confirmation to user
2. **Ticket Assigned** - Notify agent of new assignment
3. **Ticket Resolved** - Send resolution summary to user
4. **Long Wait Time** - Alert agents when user waits > 10 minutes
5. **Daily Summary** - Send agents their daily metrics

**Free Email Services:**
- SendGrid: 100 emails/day free
- Resend: 100 emails/day free
- Both are sufficient for MVP

**Implementation:**
- Use email templates with variable substitution
- Queue emails to avoid blocking requests
- Retry failed sends with exponential backoff
- Track email delivery status

### 7. Multi-Language Support (Optional)

**Components:**
- `LanguageDetector` - Detects user's language
- `TranslationService` - Translates UI text

**Interface:**
```typescript
interface LanguageConfig {
  supportedLanguages: string[]; // e.g., ['en', 'hi', 'te', 'es']
  defaultLanguage: string; // 'en'
  autoDetect: boolean;
}

interface Translation {
  language: string;
  key: string;
  value: string;
}
```

**Implementation:**
- Use i18next for frontend translations
- Store translations in JSON files
- Detect language from browser settings
- Allow manual language selection
- Translate UI elements (buttons, labels, messages)
- AI responses remain in detected language (Gemini supports multiple languages)

**Supported Languages (Priority):**
1. English (default)
2. Hindi
3. Telugu
4. Spanish
5. French

### 8. File Upload Support (Optional)

**Components:**
- `FileUploadHandler` - Handles file uploads
- `FileStorage` - Stores files (Cloudinary)

**Interface:**
```typescript
interface FileUpload {
  _id: string;
  conversationId: string;
  userId: string;
  fileName: string;
  fileType: string; // 'image', 'document', 'pdf'
  fileSize: number; // bytes
  url: string; // Cloudinary URL
  uploadedAt: Date;
}
```

**Features:**
- Upload images, PDFs, documents
- Store in Cloudinary (25GB free)
- Display images inline in chat
- Download documents
- File size limit: 10MB
- Supported types: jpg, png, pdf, txt, docx

**Use Cases:**
- User shares screenshot of error
- User uploads document for agent review
- Agent shares helpful resources

## Security Considerations

### 1. Authentication Security

**Password Requirements:**
- Minimum 8 characters
- Must include: uppercase, lowercase, number
- Hash using bcrypt with salt rounds = 10
- Never store plaintext passwords

**JWT Security:**
- Use strong secret key (256-bit)
- Set expiration: 24 hours
- Include user ID and email in payload
- Validate on every protected route
- Implement token refresh mechanism

**Session Management:**
- Store JWT in httpOnly cookie (not localStorage)
- Implement CSRF protection
- Clear tokens on logout
- Detect and invalidate compromised tokens

### 2. API Security

**Rate Limiting:**
- Authentication endpoints: 5 requests/minute per IP
- Message endpoints: 20 requests/minute per user
- Handoff requests: 3 requests/minute per user
- Use express-rate-limit middleware

**Input Validation:**
- Validate all user inputs
- Sanitize HTML to prevent XSS
- Use parameterized queries to prevent NoSQL injection
- Limit message length: 5000 characters
- Validate email format with regex

**CORS Configuration:**
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL, // Only allow your frontend
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200
};
```

### 3. Database Security

**MongoDB Security:**
- Use MongoDB Atlas with IP whitelist
- Enable authentication (username/password)
- Use connection string with credentials
- Implement role-based access control
- Regular backups (Atlas handles this)

**Data Encryption:**
- Encrypt sensitive data at rest (Atlas provides this)
- Use TLS for database connections
- Never log sensitive data (passwords, tokens)

### 4. Socket.io Security

**Connection Security:**
- Authenticate socket connections with JWT
- Validate user permissions before emitting events
- Implement room-based isolation (users can't join other rooms)
- Rate limit socket events

**Example Authentication:**
```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.userId = decoded.userId;
    next();
  });
});
```

### 5. Environment Variables

**Required Environment Variables:**
```
# Server
PORT=5000
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=24h

# Database
MONGODB_URI=<mongodb-atlas-connection-string>

# AI Service
GEMINI_API_KEY=<your-gemini-api-key>

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend.vercel.app

# Optional
REDIS_URL=<upstash-redis-url>
EMAIL_API_KEY=<sendgrid-or-resend-key>
EMAIL_FROM=noreply@yourdomain.com
```

**Security Best Practices:**
- Never commit .env files to git
- Use different secrets for dev/staging/production
- Rotate secrets regularly
- Use environment variable management (Vercel, Railway)

### 6. Content Security

**Message Sanitization:**
- Strip HTML tags from user messages
- Prevent script injection
- Limit message length
- Filter profanity (optional)

**File Upload Security:**
- Validate file types (whitelist)
- Scan for malware (if implementing file uploads)
- Limit file size
- Use signed URLs for downloads

## Deployment Architecture

### Development Environment

**Local Setup:**
```
Frontend: http://localhost:5173 (Vite dev server)
Backend: http://localhost:5000 (Express server)
Database: MongoDB Atlas (cloud) or local MongoDB
Redis: Local Redis or Upstash (cloud)
```

**Development Tools:**
- Nodemon for auto-restart
- Vite HMR for instant updates
- MongoDB Compass for database inspection
- Postman for API testing

### Production Deployment

**Frontend Deployment (Vercel):**
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: VITE_API_URL, VITE_SOCKET_URL
- Automatic deployments on git push
- Free tier: Unlimited bandwidth

**Backend Deployment (Render/Railway):**
- Build command: `npm run build` (if using TypeScript)
- Start command: `npm start`
- Environment variables: All secrets from .env
- Free tier: 750 hours/month (Render), $5 credit (Railway)
- Auto-sleep after 15 minutes inactivity (free tier)

**Database (MongoDB Atlas):**
- Free tier: 512MB storage
- Automatic backups
- IP whitelist: Add deployment server IPs
- Connection string in environment variables

**Redis (Upstash - Optional):**
- Free tier: 10K commands/day
- Serverless (no sleep)
- REST API (works with serverless deployments)

### Deployment Checklist

**Before Deployment:**
- [ ] Set all environment variables
- [ ] Update CORS origin to production URL
- [ ] Enable production mode (NODE_ENV=production)
- [ ] Test all API endpoints
- [ ] Run security audit (npm audit)
- [ ] Optimize bundle size
- [ ] Enable compression (gzip)
- [ ] Set up error logging (Sentry)

**After Deployment:**
- [ ] Test authentication flow
- [ ] Test AI chat functionality
- [ ] Test handoff system
- [ ] Test Socket.io connections
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Set up uptime monitoring

### Monitoring and Logging

**Error Tracking:**
- Use Sentry (free tier: 5K errors/month)
- Track frontend and backend errors
- Alert on critical errors
- Group similar errors

**Performance Monitoring:**
- Track API response times
- Monitor database query performance
- Track Socket.io connection issues
- Monitor AI API latency

**Logging Strategy:**
- Log all errors with stack traces
- Log authentication attempts
- Log handoff requests and resolutions
- Don't log sensitive data (passwords, tokens)
- Use structured logging (JSON format)

**Log Levels:**
- ERROR: Critical issues requiring immediate attention
- WARN: Potential issues (rate limits, slow queries)
- INFO: Important events (user registration, handoff)
- DEBUG: Detailed information (development only)


## Critical Implementation Details

### 1. RAG (Retrieval Augmented Generation) System

**Purpose:** Enable the chatbot to answer questions about your specific services, FAQs, and domain knowledge that Gemini doesn't know by default.

**Components:**
- `EmbeddingService` - Generates vector embeddings
- `KnowledgeBaseManager` - Manages knowledge base documents
- `VectorSearchService` - Performs semantic search
- `RAGOrchestrator` - Coordinates RAG pipeline

**Architecture:**

```mermaid
graph LR
    A[User Question] --> B[Generate Query Embedding]
    B --> C[Vector Search in MongoDB]
    C --> D[Retrieve Top 3 Relevant Docs]
    D --> E[Build Context Prompt]
    E --> F[Send to Gemini with Context]
    F --> G[Gemini Response]
    G --> H[Return to User]
```

**Interface:**
```typescript
interface KnowledgeDocument {
  _id: string;
  title: string;
  content: string;
  category: string; // 'faq', 'service', 'policy', 'guide'
  embedding: number[]; // 768-dimensional vector
  metadata: {
    source: string;
    lastUpdated: Date;
    language: string;
  };
  createdAt: Date;
}

interface RAGRequest {
  query: string;
  conversationHistory: Message[];
  topK: number; // Number of documents to retrieve (default: 3)
}

interface RAGResponse {
  answer: string;
  sources: KnowledgeDocument[]; // Documents used to generate answer
  confidence: number;
}
```

**Implementation Steps:**

**Step 1: Create Knowledge Base**
```typescript
// Example knowledge base documents
const knowledgeBase = [
  {
    title: "How to file an RTI request",
    content: "To file an RTI request, visit the RTI portal at...",
    category: "guide",
    language: "en"
  },
  {
    title: "RTI దరఖాస్తు ఎలా దాఖలు చేయాలి",
    content: "RTI దరఖాస్తు దాఖలు చేయడానికి, RTI పోర్టల్‌ను సందర్శించండి...",
    category: "guide",
    language: "te"
  },
  // Add more documents...
];
```

**Step 2: Generate Embeddings**
```typescript
// Use Gemini Embedding API (free)
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        model: 'models/embedding-001',
        content: { parts: [{ text }] }
      })
    }
  );
  
  const data = await response.json();
  return data.embedding.values; // 768-dimensional vector
}
```

**Step 3: Store in MongoDB with Vector Search**
```javascript
// MongoDB Vector Search Index
db.knowledge_documents.createSearchIndex({
  name: "vector_index",
  type: "vectorSearch",
  definition: {
    fields: [{
      type: "vector",
      path: "embedding",
      numDimensions: 768,
      similarity: "cosine"
    }]
  }
});
```

**Step 4: Semantic Search**
```typescript
async function searchKnowledgeBase(
  query: string, 
  topK: number = 3
): Promise<KnowledgeDocument[]> {
  // Generate embedding for user query
  const queryEmbedding = await generateEmbedding(query);
  
  // Vector search in MongoDB
  const results = await KnowledgeDocument.aggregate([
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: topK
      }
    },
    {
      $project: {
        title: 1,
        content: 1,
        category: 1,
        score: { $meta: "vectorSearchScore" }
      }
    }
  ]);
  
  return results;
}
```

**Step 5: RAG Integration with Gemini**
```typescript
async function generateRAGResponse(request: RAGRequest): Promise<RAGResponse> {
  // 1. Search knowledge base
  const relevantDocs = await searchKnowledgeBase(request.query, request.topK);
  
  // 2. Build context from retrieved documents
  const context = relevantDocs
    .map(doc => `[${doc.title}]\n${doc.content}`)
    .join('\n\n');
  
  // 3. Build prompt with context
  const prompt = `
You are a helpful assistant. Use the following context to answer the user's question.
If the context doesn't contain relevant information, say so and provide a general answer.

Context:
${context}

Conversation History:
${request.conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

User Question: ${request.query}

Answer:`;
  
  // 4. Send to Gemini
  const geminiResponse = await callGeminiAPI(prompt);
  
  return {
    answer: geminiResponse.content,
    sources: relevantDocs,
    confidence: geminiResponse.confidence
  };
}
```

**Knowledge Base Management:**
- Admin interface to add/edit/delete knowledge documents
- Bulk import from CSV/JSON
- Automatic re-embedding when content changes
- Version control for documents
- Multi-language support (separate embeddings per language)

**Free Tier Limits:**
- Gemini Embedding API: Free (included in Gemini API quota)
- MongoDB Atlas: 512MB storage (sufficient for ~10,000 documents)
- Vector Search: Free on M10+ clusters (or use M0 with limitations)

### 2. Multi-Language Support Implementation

**Supported Languages:**
1. English (en)
2. Telugu (te)
3. Hindi (hi)

**Components:**
- `LanguageDetector` - Detects user's language from messages
- `TranslationManager` - Manages UI translations
- `LanguageMiddleware` - Sets language context for requests

**Interface:**
```typescript
interface LanguagePreference {
  userId: string;
  preferredLanguage: 'en' | 'te' | 'hi';
  autoDetect: boolean;
  detectedLanguage?: string;
}

interface TranslationKey {
  key: string;
  translations: {
    en: string;
    te: string;
    hi: string;
  };
}
```

**Implementation:**

**Step 1: Language Detection**
```typescript
// Use franc library for language detection (free, offline)
import franc from 'franc';

function detectLanguage(text: string): string {
  const detected = franc(text);
  
  // Map franc codes to our supported languages
  const languageMap: Record<string, string> = {
    'eng': 'en',
    'tel': 'te',
    'hin': 'hi'
  };
  
  return languageMap[detected] || 'en';
}
```

**Step 2: Frontend i18n Setup**
```typescript
// i18n configuration (React)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation files
const resources = {
  en: {
    translation: {
      "chat.placeholder": "Type your message...",
      "chat.send": "Send",
      "chat.newConversation": "New Conversation",
      "handoff.request": "Talk to Human Agent",
      "handoff.waiting": "Waiting for agent...",
      // ... more translations
    }
  },
  te: {
    translation: {
      "chat.placeholder": "మీ సందేశాన్ని టైప్ చేయండి...",
      "chat.send": "పంపండి",
      "chat.newConversation": "కొత్త సంభాషణ",
      "handoff.request": "మానవ ఏజెంట్‌తో మాట్లాడండి",
      "handoff.waiting": "ఏజెంట్ కోసం వేచి ఉంది...",
      // ... more translations
    }
  },
  hi: {
    translation: {
      "chat.placeholder": "अपना संदेश टाइप करें...",
      "chat.send": "भेजें",
      "chat.newConversation": "नई बातचीत",
      "handoff.request": "मानव एजेंट से बात करें",
      "handoff.waiting": "एजेंट की प्रतीक्षा में...",
      // ... more translations
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });
```

**Step 3: Language-Aware Gemini Prompts**
```typescript
function buildLanguageAwarePrompt(
  userMessage: string,
  language: string,
  context: Message[]
): string {
  const languageInstructions = {
    en: "Respond in English.",
    te: "తెలుగులో స్పందించండి. (Respond in Telugu)",
    hi: "हिंदी में जवाब दें। (Respond in Hindi)"
  };
  
  return `
You are a helpful assistant for a government services chatbot.
${languageInstructions[language]}

Conversation History:
${context.map(m => `${m.role}: ${m.content}`).join('\n')}

User: ${userMessage}

Assistant:`;
}

// Store user's language preference
async function saveLanguagePreference(
  userId: string, 
  language: string
): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    preferredLanguage: language
  });
}
```

**Step 4: Language Switcher Component**
```typescript
// React component
function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // Save to backend
    saveLanguagePreference(userId, lng);
  };
  
  return (
    <select onChange={(e) => changeLanguage(e.target.value)}>
      <option value="en">English</option>
      <option value="te">తెలుగు</option>
      <option value="hi">हिंदी</option>
    </select>
  );
}
```

**Step 5: Auto-Detection on First Message**
```typescript
// Detect language from first user message
async function handleFirstMessage(message: string, userId: string) {
  const detectedLang = detectLanguage(message);
  await saveLanguagePreference(userId, detectedLang);
  
  // Update UI language
  return detectedLang;
}
```

### 3. UI/UX Component Specifications

**Chat Interface Components:**

**1. Chat Bubble Component**
```typescript
interface ChatBubbleProps {
  message: Message;
  isUser: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
}

// Styling
const chatBubbleStyles = {
  user: {
    background: 'bg-blue-500',
    text: 'text-white',
    align: 'ml-auto',
    borderRadius: 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl'
  },
  ai: {
    background: 'bg-gray-100',
    text: 'text-gray-900',
    align: 'mr-auto',
    borderRadius: 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl'
  },
  agent: {
    background: 'bg-green-100',
    text: 'text-gray-900',
    align: 'mr-auto',
    borderRadius: 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl'
  }
};
```

**2. Typing Indicator Component**
```typescript
function TypingIndicator({ sender }: { sender: 'ai' | 'agent' }) {
  return (
    <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-2xl">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
      </div>
      <span className="text-sm text-gray-600">
        {sender === 'ai' ? 'AI is typing...' : 'Agent is typing...'}
      </span>
    </div>
  );
}
```

**3. Quick Reply Buttons**
```typescript
interface QuickReply {
  id: string;
  text: string;
  action: string; // 'send_message' | 'trigger_handoff' | 'open_link'
  payload?: any;
}

function QuickReplyButtons({ replies }: { replies: QuickReply[] }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {replies.map(reply => (
        <button
          key={reply.id}
          className="px-4 py-2 bg-white border-2 border-blue-500 text-blue-500 
                     rounded-full hover:bg-blue-500 hover:text-white transition"
          onClick={() => handleQuickReply(reply)}
        >
          {reply.text}
        </button>
      ))}
    </div>
  );
}

// Example quick replies
const quickReplies: QuickReply[] = [
  { id: '1', text: 'File RTI Request', action: 'send_message', payload: 'I want to file an RTI request' },
  { id: '2', text: 'Check Status', action: 'send_message', payload: 'Check my application status' },
  { id: '3', text: 'Talk to Agent', action: 'trigger_handoff' }
];
```

**4. Action Cards Component**
```typescript
interface ActionCard {
  title: string;
  description: string;
  image?: string;
  buttons: Array<{
    text: string;
    action: string;
    url?: string;
  }>;
}

function ActionCard({ card }: { card: ActionCard }) {
  return (
    <div className="max-w-sm bg-white rounded-lg shadow-md overflow-hidden">
      {card.image && (
        <img src={card.image} alt={card.title} className="w-full h-48 object-cover" />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{card.title}</h3>
        <p className="text-gray-600 mt-2">{card.description}</p>
        <div className="mt-4 space-y-2">
          {card.buttons.map((button, idx) => (
            <button
              key={idx}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              onClick={() => handleCardAction(button)}
            >
              {button.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**5. File Preview Component**
```typescript
function FilePreview({ file }: { file: FileUpload }) {
  if (file.fileType === 'image') {
    return (
      <img 
        src={file.url} 
        alt={file.fileName}
        className="max-w-xs rounded-lg cursor-pointer"
        onClick={() => window.open(file.url, '_blank')}
      />
    );
  }
  
  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
      <FileIcon type={file.fileType} />
      <div className="flex-1">
        <p className="font-medium">{file.fileName}</p>
        <p className="text-sm text-gray-500">{formatFileSize(file.fileSize)}</p>
      </div>
      <button
        onClick={() => downloadFile(file.url, file.fileName)}
        className="p-2 hover:bg-gray-200 rounded"
      >
        <DownloadIcon />
      </button>
    </div>
  );
}
```


### 4. Fallback & Error Handling System

**Components:**
- `AIServiceFallback` - Manages fallback between AI providers
- `CircuitBreaker` - Prevents cascading failures
- `RetryManager` - Handles retry logic with exponential backoff

**Interface:**
```typescript
interface AIProviderConfig {
  name: 'gemini' | 'groq';
  apiKey: string;
  endpoint: string;
  priority: number; // 1 = primary, 2 = fallback
  enabled: boolean;
}

interface CircuitBreakerState {
  status: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: Date;
  nextRetryTime: Date;
}
```

**Fallback Strategy:**

```mermaid
graph TD
    A[User Message] --> B{Try Gemini}
    B -->|Success| C[Return Response]
    B -->|Failure| D{Retry Count < 3?}
    D -->|Yes| E[Wait & Retry Gemini]
    E --> B
    D -->|No| F{Try Groq Fallback}
    F -->|Success| C
    F -->|Failure| G[Return Error Message]
    G --> H[Queue for Manual Review]
```

**Implementation:**
```typescript
class AIServiceManager {
  private providers: AIProviderConfig[];
  private circuitBreakers: Map<string, CircuitBreakerState>;
  
  async generateResponse(message: string): Promise<AIResponse> {
    // Try primary provider (Gemini)
    try {
      return await this.tryProvider('gemini', message, 3);
    } catch (error) {
      console.error('Gemini failed:', error);
      
      // Fallback to Groq
      try {
        return await this.tryProvider('groq', message, 2);
      } catch (fallbackError) {
        console.error('Groq fallback failed:', fallbackError);
        
        // Return graceful error message
        return {
          content: "I'm having trouble connecting right now. Please try again in a moment.",
          confidence: 0,
          shouldHandoff: true,
          processingTime: 0
        };
      }
    }
  }
  
  private async tryProvider(
    providerName: string, 
    message: string, 
    maxRetries: number
  ): Promise<AIResponse> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check circuit breaker
        if (this.isCircuitOpen(providerName)) {
          throw new Error(`Circuit breaker open for ${providerName}`);
        }
        
        // Call provider
        const response = await this.callProvider(providerName, message);
        
        // Reset circuit breaker on success
        this.resetCircuitBreaker(providerName);
        
        return response;
      } catch (error) {
        lastError = error;
        
        // Update circuit breaker
        this.recordFailure(providerName);
        
        // Exponential backoff: 1s, 2s, 4s
        if (attempt < maxRetries) {
          await this.sleep(Math.pow(2, attempt - 1) * 1000);
        }
      }
    }
    
    throw lastError;
  }
  
  private isCircuitOpen(provider: string): boolean {
    const breaker = this.circuitBreakers.get(provider);
    if (!breaker) return false;
    
    // Open circuit if 5+ failures in last 60 seconds
    if (breaker.failureCount >= 5 && 
        Date.now() - breaker.lastFailureTime.getTime() < 60000) {
      return true;
    }
    
    return false;
  }
}
```

**Error Messages by Type:**
```typescript
const errorMessages = {
  rateLimit: {
    en: "I'm receiving too many requests. Please wait a moment and try again.",
    te: "నేను చాలా అభ్యర్థనలు స్వీకరిస్తున్నాను. దయచేసి కొంత సమయం వేచి ఉండి మళ్లీ ప్రయత్నించండి.",
    hi: "मुझे बहुत सारे अनुरोध मिल रहे हैं। कृपया एक क्षण प्रतीक्षा करें और पुनः प्रयास करें।"
  },
  networkError: {
    en: "I'm having connection issues. Your message has been saved and I'll respond when I'm back online.",
    te: "నాకు కనెక్షన్ సమస్యలు ఉన్నాయి. మీ సందేశం సేవ్ చేయబడింది మరియు నేను తిరిగి ఆన్‌లైన్‌లో ఉన్నప్పుడు స్పందిస్తాను.",
    hi: "मुझे कनेक्शन समस्याएं हो रही हैं। आपका संदेश सहेजा गया है और मैं वापस ऑनलाइन होने पर जवाब दूंगा।"
  },
  serviceDown: {
    en: "I'm temporarily unavailable. Would you like to speak with a human agent?",
    te: "నేను తాత్కాలికంగా అందుబాటులో లేను. మీరు మానవ ఏజెంట్‌తో మాట్లాడాలనుకుంటున్నారా?",
    hi: "मैं अस्थायी रूप से अनुपलब्ध हूं। क्या आप किसी मानव एजेंट से बात करना चाहेंगे?"
  }
};
```

### 5. Mobile Optimization Features

**PWA (Progressive Web App) Configuration:**

```typescript
// vite.config.ts - Add PWA plugin
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AI Chatbot',
        short_name: 'Chatbot',
        description: 'AI-powered chatbot with human agent support',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300 // 5 minutes
              }
            }
          }
        ]
      }
    })
  ]
});
```

**Mobile-Specific Features:**

**1. Touch Gestures**
```typescript
// Swipe to delete conversation
import { useSwipeable } from 'react-swipeable';

function ConversationItem({ conversation, onDelete }) {
  const handlers = useSwipeable({
    onSwipedLeft: () => setShowDelete(true),
    onSwipedRight: () => setShowDelete(false),
    trackMouse: false
  });
  
  return (
    <div {...handlers} className="relative">
      <div className="conversation-content">
        {conversation.title}
      </div>
      {showDelete && (
        <button 
          onClick={() => onDelete(conversation.id)}
          className="absolute right-0 top-0 bg-red-500 text-white p-4"
        >
          Delete
        </button>
      )}
    </div>
  );
}
```

**2. Camera Integration**
```typescript
// Camera capture for file upload
function CameraCapture({ onCapture }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment" // Use rear camera
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onCapture(file);
        }}
        className="hidden"
      />
      <button onClick={() => fileInputRef.current?.click()}>
        <CameraIcon />
      </button>
    </>
  );
}
```

**3. Share Functionality**
```typescript
// Share conversation via Web Share API
async function shareConversation(conversation: Conversation) {
  if (navigator.share) {
    try {
      await navigator.share({
        title: conversation.title,
        text: formatConversationForSharing(conversation),
        url: window.location.href
      });
    } catch (error) {
      // Fallback to copy to clipboard
      await navigator.clipboard.writeText(
        formatConversationForSharing(conversation)
      );
      toast.success('Copied to clipboard!');
    }
  }
}
```

**4. Install Prompt**
```typescript
// PWA install prompt
function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    });
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  };
  
  if (!showInstall) return null;
  
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg">
      <p>Install our app for a better experience!</p>
      <button onClick={handleInstall} className="mt-2 px-4 py-2 bg-white text-blue-500 rounded">
        Install
      </button>
    </div>
  );
}
```

### 6. Search & Filter System

**Components:**
- `SearchService` - Full-text search in MongoDB
- `FilterManager` - Manages filter state
- `SearchIndex` - MongoDB text indexes

**Interface:**
```typescript
interface SearchQuery {
  query: string;
  filters: {
    dateFrom?: Date;
    dateTo?: Date;
    role?: 'user' | 'ai' | 'agent';
    conversationId?: string;
  };
  limit: number;
  offset: number;
}

interface SearchResult {
  conversationId: string;
  messageId: string;
  content: string;
  role: string;
  timestamp: Date;
  score: number; // Relevance score
  highlights: string[]; // Matched text snippets
}
```

**MongoDB Text Index Setup:**
```javascript
// Create text index for full-text search
db.conversations.createIndex({
  "messages.content": "text",
  "title": "text"
}, {
  weights: {
    "title": 10,
    "messages.content": 5
  },
  name: "conversation_search_index"
});
```

**Search Implementation:**
```typescript
async function searchConversations(
  userId: string,
  searchQuery: SearchQuery
): Promise<SearchResult[]> {
  const pipeline = [
    // Match user's conversations
    { $match: { userId: new ObjectId(userId) } },
    
    // Unwind messages array
    { $unwind: '$messages' },
    
    // Text search
    {
      $match: {
        $text: { $search: searchQuery.query },
        ...(searchQuery.filters.dateFrom && {
          'messages.timestamp': { $gte: searchQuery.filters.dateFrom }
        }),
        ...(searchQuery.filters.dateTo && {
          'messages.timestamp': { $lte: searchQuery.filters.dateTo }
        }),
        ...(searchQuery.filters.role && {
          'messages.role': searchQuery.filters.role
        })
      }
    },
    
    // Add relevance score
    {
      $addFields: {
        score: { $meta: 'textScore' }
      }
    },
    
    // Sort by relevance
    { $sort: { score: -1, 'messages.timestamp': -1 } },
    
    // Limit results
    { $skip: searchQuery.offset },
    { $limit: searchQuery.limit },
    
    // Project fields
    {
      $project: {
        conversationId: '$_id',
        messageId: '$messages._id',
        content: '$messages.content',
        role: '$messages.role',
        timestamp: '$messages.timestamp',
        score: 1
      }
    }
  ];
  
  return await Conversation.aggregate(pipeline);
}
```

**Search UI Component:**
```typescript
function SearchBar() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState<SearchResult[]>([]);
  
  const handleSearch = async () => {
    const searchResults = await searchConversations(userId, {
      query,
      filters,
      limit: 20,
      offset: 0
    });
    setResults(searchResults);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button onClick={handleSearch} className="px-6 py-2 bg-blue-500 text-white rounded-lg">
          Search
        </button>
      </div>
      
      {/* Filters */}
      <div className="flex gap-2">
        <input
          type="date"
          onChange={(e) => setFilters({...filters, dateFrom: new Date(e.target.value)})}
          className="px-3 py-1 border rounded"
        />
        <select
          onChange={(e) => setFilters({...filters, role: e.target.value})}
          className="px-3 py-1 border rounded"
        >
          <option value="">All Messages</option>
          <option value="user">My Messages</option>
          <option value="ai">AI Responses</option>
          <option value="agent">Agent Messages</option>
        </select>
      </div>
      
      {/* Results */}
      <div className="space-y-2">
        {results.map(result => (
          <SearchResultItem key={result.messageId} result={result} />
        ))}
      </div>
    </div>
  );
}
```


### 7. Additional Security Middleware

**helmet.js Configuration:**
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

**CORS Configuration:**
```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

**JWT & bcrypt Setup:**
```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Password hashing
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT token generation
function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

// JWT verification middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthTokenPayload;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

### 8. Notification Systems

**Web Push Notifications:**
```typescript
import webpush from 'web-push';

// Setup VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Send push notification
async function sendPushNotification(
  subscription: PushSubscription,
  payload: any
): Promise<void> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys
      },
      JSON.stringify(payload)
    );
  } catch (error) {
    console.error('Push notification failed:', error);
  }
}

// Frontend: Subscribe to push notifications
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  
  // Send subscription to backend
  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });
}
```

**Twilio SMS Integration (Optional):**
```typescript
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSMS(to: string, message: string): Promise<void> {
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
  } catch (error) {
    console.error('SMS failed:', error);
  }
}

// Use case: Notify user when agent responds to offline ticket
async function notifyUserAgentResponse(ticket: SupportTicket) {
  if (ticket.contactPhone) {
    await sendSMS(
      ticket.contactPhone,
      `Your support ticket has been updated. Agent: ${ticket.followUpNotes}`
    );
  }
}
```

### 9. Analytics & Monitoring

**Custom Analytics System:**
```typescript
interface AnalyticsEvent {
  userId: string;
  eventType: 'message_sent' | 'handoff_requested' | 'conversation_created' | 'user_registered';
  metadata: Record<string, any>;
  timestamp: Date;
}

const analyticsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  eventType: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

// Track event
async function trackEvent(event: AnalyticsEvent): Promise<void> {
  await Analytics.create(event);
}

// Usage
await trackEvent({
  userId: user._id,
  eventType: 'message_sent',
  metadata: {
    messageLength: message.length,
    conversationId: conversation._id,
    aiProvider: 'gemini'
  },
  timestamp: new Date()
});
```

**API Usage Tracking:**
```typescript
interface APIUsageMetrics {
  endpoint: string;
  method: string;
  userId?: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
}

// Middleware to track API usage
function trackAPIUsage(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  res.on('finish', async () => {
    const responseTime = Date.now() - startTime;
    
    await APIUsage.create({
      endpoint: req.path,
      method: req.method,
      userId: req.userId,
      responseTime,
      statusCode: res.statusCode,
      timestamp: new Date()
    });
  });
  
  next();
}

app.use(trackAPIUsage);
```

**Sentry Error Tracking:**
```typescript
import * as Sentry from '@sentry/node';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

// Error handler middleware
app.use(Sentry.Handlers.errorHandler());

// Custom error tracking
function trackError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context
  });
}

// Usage
try {
  await callGeminiAPI(message);
} catch (error) {
  trackError(error, {
    userId: user._id,
    conversationId: conversation._id,
    provider: 'gemini'
  });
  throw error;
}
```

**Analytics Dashboard Queries:**
```typescript
// Get daily active users
async function getDailyActiveUsers(date: Date): Promise<number> {
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  
  return await Analytics.distinct('userId', {
    timestamp: { $gte: startOfDay, $lte: endOfDay }
  }).countDocuments();
}

// Get most used features
async function getFeatureUsage(period: 'day' | 'week' | 'month'): Promise<any[]> {
  const startDate = getStartDate(period);
  
  return await Analytics.aggregate([
    { $match: { timestamp: { $gte: startDate } } },
    { $group: { _id: '$eventType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
}

// Get average response time
async function getAverageResponseTime(): Promise<number> {
  const result = await APIUsage.aggregate([
    { $match: { endpoint: '/api/chat/message' } },
    { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
  ]);
  
  return result[0]?.avgTime || 0;
}
```

### 10. Complete Technology Stack Summary

**Frontend Dependencies (package.json):**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "zustand": "^4.4.0",
    "i18next": "^23.7.0",
    "react-i18next": "^13.5.0",
    "react-markdown": "^9.0.0",
    "react-syntax-highlighter": "^15.5.0",
    "framer-motion": "^10.16.0",
    "socket.io-client": "^4.6.0",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.300.0",
    "date-fns": "^3.0.0",
    "react-swipeable": "^7.0.0",
    "vite-plugin-pwa": "^0.17.0"
  }
}
```

**Backend Dependencies (package.json):**
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "typescript": "^5.0.0",
    "@types/express": "^4.17.0",
    "socket.io": "^4.6.0",
    "mongoose": "^8.0.0",
    "jsonwebtoken": "^9.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "@types/bcryptjs": "^2.4.0",
    "multer": "^1.4.5-lts.1",
    "@types/multer": "^1.4.0",
    "sharp": "^0.33.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "@types/cors": "^2.8.0",
    "express-rate-limit": "^7.1.0",
    "bull": "^4.12.0",
    "@types/bull": "^4.10.0",
    "ioredis": "^5.3.0",
    "dotenv": "^16.3.0",
    "@google/generative-ai": "^0.1.0",
    "groq-sdk": "^0.3.0",
    "cloudinary": "^1.41.0",
    "pdf-parse": "^1.1.1",
    "@sendgrid/mail": "^7.7.0",
    "twilio": "^4.20.0",
    "web-push": "^3.6.0",
    "@sentry/node": "^7.91.0",
    "franc": "^6.1.0",
    "nodemon": "^3.0.0",
    "ts-node": "^10.9.0"
  }
}
```

### 11. Environment Variables Reference

**Complete .env Template:**
```bash
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatbot?retryWrites=true&w=majority
REDIS_URL=redis://default:password@redis-host:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# AI Services
GEMINI_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-api-key

# File Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Optional)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=AI Chatbot

# SMS (Optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Push Notifications (Optional)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Monitoring
SENTRY_DSN=your-sentry-dsn

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 12. Database Optimization

**MongoDB Indexes:**
```javascript
// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

// Conversation indexes
db.conversations.createIndex({ userId: 1, createdAt: -1 });
db.conversations.createIndex({ userId: 1, status: 1 });
db.conversations.createIndex({ "messages.timestamp": -1 });

// Full-text search index
db.conversations.createIndex(
  { "messages.content": "text", "title": "text" },
  { weights: { "title": 10, "messages.content": 5 } }
);

// Handoff ticket indexes
db.handoff_tickets.createIndex({ status: 1, priority: -1, createdAt: 1 });
db.handoff_tickets.createIndex({ userId: 1 });
db.handoff_tickets.createIndex({ assignedAgentId: 1 });
db.handoff_tickets.createIndex({ createdAt: -1 });

// Support ticket indexes
db.support_tickets.createIndex({ status: 1, createdAt: -1 });
db.support_tickets.createIndex({ assignedAgentId: 1 });

// Knowledge base vector index
db.knowledge_documents.createIndex({ category: 1, language: 1 });
db.knowledge_documents.createSearchIndex({
  name: "vector_index",
  type: "vectorSearch",
  definition: {
    fields: [{
      type: "vector",
      path: "embedding",
      numDimensions: 768,
      similarity: "cosine"
    }]
  }
});

// Analytics indexes
db.analytics.createIndex({ userId: 1, timestamp: -1 });
db.analytics.createIndex({ eventType: 1, timestamp: -1 });
db.analytics.createIndex({ timestamp: -1 });

// API usage indexes
db.api_usage.createIndex({ endpoint: 1, timestamp: -1 });
db.api_usage.createIndex({ userId: 1, timestamp: -1 });
db.api_usage.createIndex({ timestamp: -1 });
```

**Query Optimization Tips:**
- Use projection to limit returned fields
- Implement pagination for large result sets
- Use aggregation pipeline for complex queries
- Cache frequently accessed data in Redis
- Use lean() for read-only queries (faster)
- Implement connection pooling (default in Mongoose)

