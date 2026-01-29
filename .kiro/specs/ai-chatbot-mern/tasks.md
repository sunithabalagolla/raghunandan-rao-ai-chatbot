# Implementation Plan: AI Chatbot with Human Agent Handoff

## Overview

This implementation plan builds an AI chatbot with human agent handoff on top of your existing authentication system. Tasks are organized to build features incrementally, with core functionality first and optional features later.

## Tasks

- [ ] 1. Project Setup and Dependencies
  - Install required npm packages for server and client
  - Configure environment variables
  - Setup Tailwind CSS and shadcn/ui
  - _Requirements: All_

- [ ] 1.1 Install server dependencies
  - Run: `npm install socket.io @google/generative-ai groq-sdk bull ioredis helmet multer sharp cloudinary franc`
  - Run: `npm install --save-dev @types/multer`
  - _Requirements: 2.1, 6.1, 10.1_

- [ ] 1.2 Install client dependencies
  - Run: `npm install socket.io-client zustand i18next react-i18next react-markdown framer-motion react-hot-toast date-fns`
  - Run: `npx tailwindcss init -p`
  - _Requirements: 5.1, 6.1_

- [x] 1.3 Update environment variables
  - Add Gemini API key, Redis URL, Cloudinary credentials to server/.env
  - Add Socket URL to client/.env
  - _Requirements: 9.1_

- [ ] 2. Extend User Model for Chatbot Features
  - [x] 2.1 Add chatbot-specific fields to User model
    - Add `preferredLanguage` field (en, te, hi)
    - Add `role` field (user, agent, admin)
    - Add `agentStatus` field (available, busy, offline)
    - _Requirements: 1.1_

- [ ] 3. Create Database Models
  - [x] 3.1 Create Conversation model
    - Define schema with userId, title, messages array, status
    - Add indexes for userId and createdAt
    - _Requirements: 3.1, 3.2, 4.1_

  - [x] 3.2 Create HandoffTicket model
    - Define schema with userId, conversationId, status, priority, reason
    - Add conversationContext array for last 10 messages
    - Add indexes for status, priority, createdAt
    - _Requirements: 10.1, 10.3_

  - [x] 3.3 Create SupportTicket model
    - Define schema for offline handoff tickets
    - Include contactEmail, contactPhone, issueDescription
    - _Requirements: 10.4_

- [ ] 4. Implement AI Service (Gemini Integration)
  - [x] 4.1 Create AIService class
    - Implement Gemini API integration
    - Add context management (last 10 messages)
    - Add rate limiting logic
    - _Requirements: 2.1, 2.5, 9.2_

  - [x] 4.2 Add Groq fallback service
    - Implement Groq API as backup
    - Add circuit breaker pattern
    - Add retry logic with exponential backoff
    - _Requirements: 2.4, 8.2_

  - [ ]* 4.3 Write property test for AI service
    - **Property 6: AI responses include conversation context**
    - **Validates: Requirements 2.5**

- [ ] 5. Setup Socket.io Server
  - [x] 5.1 Create Socket.io server configuration
    - Initialize Socket.io with CORS settings
    - Add JWT authentication middleware for sockets
    - _Requirements: 6.1, 12.1_

  - [x] 5.2 Create chat socket handlers
    - Handle 'user:message' event
    - Handle 'user:typing' event
    - Emit 'ai:message' and 'ai:typing' events
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 5.3 Create handoff socket handlers
    - Handle 'user:request-handoff' event
    - Handle 'agent:connect' event
    - Handle 'agent:accept-ticket' event
    - Handle 'agent:message' event
    - _Requirements: 10.1, 11.1, 12.1_

- [ ] 6. Create Backend API Routes and Controllers
  - [x] 6.1 Create conversation routes and controller
    - GET /api/conversations - List user's conversations
    - POST /api/conversations - Create new conversation
    - GET /api/conversations/:id - Get conversation with messages
    - DELETE /api/conversations/:id - Delete conversation
    - POST /api/conversations/:id/export - Export conversation
    - _Requirements: 3.3, 3.4, 4.1, 4.3, 7.2_

  - [ ]* 6.2 Write property tests for conversation management
    - **Property 11: New conversations start empty**
    - **Property 12: Conversation deletion removes all data**
    - **Validates: Requirements 4.1, 4.3, 7.1**

  - [ ] 6.3 Create chat routes and controller
    - POST /api/chat/message - Send message to AI
    - Handle message persistence
    - Handle AI response generation
    - _Requirements: 2.1, 3.1, 3.2_

  - [ ]* 6.4 Write property tests for messaging
    - **Property 5: Empty messages are rejected**
    - **Property 7: Messages are immediately persisted**
    - **Validates: Requirements 2.3, 3.1, 3.2**

  - [x] 6.5 Create handoff routes and controller
    - POST /api/handoff/request - Create handoff request
    - GET /api/handoff/queue-status - Get queue position
    - POST /api/handoff/:id/cancel - Cancel handoff
    - _Requirements: 10.1, 10.2_

  - [x] 6.6 Create agent routes and controller
    - GET /api/agent/tickets - List pending tickets
    - POST /api/agent/tickets/:id/accept - Accept ticket
    - POST /api/agent/tickets/:id/resolve - Resolve ticket
    - _Requirements: 11.2, 12.1, 13.1_

- [ ] 7. Implement Queue Management System
  - [ ] 7.1 Create QueueManager service
    - Implement FIFO queue logic
    - Calculate wait time estimates
    - Handle agent availability tracking
    - _Requirements: 14.1, 14.2_

  - [ ]* 7.2 Write property tests for queue management
    - **Property 24: Queue processes in FIFO order**
    - **Property 34: Wait time calculation is consistent**
    - **Validates: Requirements 10.5, 14.1, 14.2**

- [ ] 8. Checkpoint - Backend Core Complete
  - Ensure all backend tests pass
  - Test API endpoints with Postman/Thunder Client
  - Verify Socket.io connections work
  - Ask user if questions arise

- [ ] 9. Setup Client Infrastructure
  - [ ] 9.1 Configure Tailwind CSS
    - Setup tailwind.config.js
    - Add Tailwind directives to index.css
    - _Requirements: 5.1, 5.2_

  - [ ] 9.2 Setup i18n for multi-language support
    - Create i18n config
    - Add translation files (en.json, te.json, hi.json)
    - Wrap App with I18nextProvider
    - _Requirements: Multi-language support_

  - [ ] 9.3 Create Zustand stores
    - Create chatStore for chat state
    - Create conversationStore for conversation list
    - Create agentStore for agent dashboard state
    - _Requirements: 3.3, 4.2, 6.1_

  - [ ] 9.4 Create Socket.io client service
    - Initialize socket connection with JWT auth
    - Create event listeners and emitters
    - Handle reconnection logic
    - _Requirements: 6.1, 12.1_

- [ ] 10. Build Chat Interface Components
  - [ ] 10.1 Create ChatInterface component
    - Main chat container with message list
    - Message input with send button
    - Conversation switcher
    - _Requirements: 2.1, 5.3, 6.1_

  - [ ] 10.2 Create MessageBubble component
    - Display user, AI, and agent messages
    - Show timestamps
    - Different styling for each role
    - _Requirements: 5.5, 6.1_

  - [ ] 10.3 Create TypingIndicator component
    - Animated typing dots
    - Show when AI or agent is typing
    - _Requirements: 5.4, 6.2_

  - [ ] 10.4 Create MessageInput component
    - Text input with validation
    - Send button
    - Handle empty message prevention
    - _Requirements: 2.3, 6.1_

  - [ ]* 10.5 Write unit tests for chat components
    - Test message rendering
    - Test input validation
    - Test typing indicator display
    - _Requirements: 2.3, 5.4, 6.1_

  - [ ] 10.6 Create ConversationList component
    - List all user conversations
    - Show recent message preview
    - Show timestamps
    - Handle conversation selection
    - _Requirements: 3.3, 4.2, 4.4_

  - [ ] 10.7 Create QuickReplies component
    - Display quick action buttons
    - Handle "Talk to Human Agent" button
    - _Requirements: 10.1_

- [ ] 11. Create ChatPage
  - [ ] 11.1 Integrate all chat components
    - Combine ChatInterface, ConversationList, QuickReplies
    - Connect to Socket.io
    - Connect to Zustand stores
    - _Requirements: 2.1, 3.3, 4.2, 6.1_

  - [ ] 11.2 Implement message sending flow
    - Send message via Socket.io
    - Display user message immediately
    - Show typing indicator
    - Display AI response
    - _Requirements: 2.1, 6.1, 6.2, 6.3_

  - [ ] 11.3 Implement conversation management
    - Create new conversation
    - Switch between conversations
    - Delete conversations
    - Export conversations
    - _Requirements: 4.1, 4.2, 4.3, 7.2_

- [ ] 12. Checkpoint - Basic Chat Complete
  - Test chat interface end-to-end
  - Verify messages are sent and received
  - Verify conversations are saved
  - Ask user if questions arise

- [ ] 13. Build Agent Dashboard
  - [ ] 13.1 Create TicketList component
    - Display pending handoff tickets
    - Show user info and wait time
    - Show conversation context preview
    - _Requirements: 11.2, 11.4_

  - [ ] 13.2 Create ActiveChat component
    - Real-time chat interface for agents
    - Display conversation history
    - Message input for agent responses
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ] 13.3 Create AgentStatus component
    - Toggle agent availability (available/busy/offline)
    - Show current ticket count
    - _Requirements: 13.4_

  - [ ] 13.4 Create TicketDetails component
    - Display full conversation history
    - Show user information
    - Resolution notes input
    - _Requirements: 11.3, 13.5_

  - [ ] 13.5 Create AgentDashboardPage
    - Integrate all agent components
    - Connect to Socket.io for real-time updates
    - Handle ticket acceptance and resolution
    - _Requirements: 11.1, 11.2, 12.1, 13.1_

- [ ] 14. Implement Handoff Flow
  - [ ] 14.1 Add handoff request button to chat
    - "Talk to Human Agent" button
    - Show queue position and wait time
    - _Requirements: 10.1, 10.2_

  - [ ] 14.2 Implement queue notifications
    - Notify agents of new tickets
    - Update queue position for users
    - _Requirements: 10.5, 11.1_

  - [ ] 14.3 Implement agent-user chat
    - Connect agent and user via Socket.io
    - Forward messages between agent and user
    - Persist all messages
    - _Requirements: 12.1, 12.2, 12.3, 12.5_

  - [ ]* 14.4 Write property tests for handoff system
    - **Property 22: Handoff creates ticket with context**
    - **Property 27: Ticket assignment is exclusive**
    - **Property 29: Agent-user messages are persisted**
    - **Validates: Requirements 10.1, 10.3, 11.5, 12.4, 12.5**

  - [ ] 14.5 Implement ticket resolution
    - Agent marks ticket as resolved
    - Request user feedback
    - Return user to AI mode
    - Update agent status
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 15. Checkpoint - Handoff System Complete
  - Test handoff request flow
  - Test agent dashboard
  - Test agent-user chat
  - Test ticket resolution
  - Ask user if questions arise

- [ ] 16. Add Error Handling and Recovery
  - [ ] 16.1 Implement network failure handling
    - Queue unsent messages in localStorage
    - Retry on reconnection
    - Display offline indicator
    - _Requirements: 8.3_

  - [ ] 16.2 Implement AI service error handling
    - Handle rate limits
    - Handle API timeouts
    - Display user-friendly error messages
    - _Requirements: 2.4, 8.2, 9.2_

  - [ ] 16.3 Implement database error handling
    - Retry with exponential backoff
    - Cache data during outages
    - Display error messages
    - _Requirements: 3.5, 8.1_

- [ ] 17. Optional: Implement RAG System
  - [ ] 17.1 Create KnowledgeDocument model
    - Schema with title, content, category, embedding
    - Vector search index setup
    - _Requirements: RAG feature_

  - [ ] 17.2 Implement embedding generation
    - Use Gemini Embeddings API
    - Generate embeddings for knowledge base
    - _Requirements: RAG feature_

  - [ ] 17.3 Implement vector search
    - MongoDB vector search queries
    - Retrieve top K relevant documents
    - _Requirements: RAG feature_

  - [ ] 17.4 Integrate RAG with AI service
    - Build context from retrieved documents
    - Include in Gemini prompt
    - _Requirements: RAG feature_

- [ ] 18. Optional: Add Multi-Language Support
  - [ ] 18.1 Implement language detection
    - Use franc library to detect language
    - Save user preference
    - _Requirements: Multi-language_

  - [ ] 18.2 Add language switcher UI
    - Dropdown for English, Telugu, Hindi
    - Update i18n on selection
    - _Requirements: Multi-language_

  - [ ] 18.3 Add language-aware AI prompts
    - Instruct Gemini to respond in user's language
    - _Requirements: Multi-language_

- [ ] 19. Optional: Add Search Functionality
  - [ ] 19.1 Create search API endpoint
    - Full-text search in MongoDB
    - Filter by date, role, conversation
    - _Requirements: Search feature_

  - [ ] 19.2 Create SearchBar component
    - Search input with filters
    - Display search results
    - _Requirements: Search feature_

- [ ] 20. Optional: Add File Upload Support
  - [ ] 20.1 Setup Cloudinary integration
    - Configure Cloudinary SDK
    - Create upload endpoint
    - _Requirements: File upload feature_

  - [ ] 20.2 Add file upload UI
    - File input button
    - Image preview
    - Upload progress indicator
    - _Requirements: File upload feature_

- [ ] 21. Testing and Quality Assurance
  - [ ] 21.1 Run all unit tests
    - Backend unit tests
    - Frontend component tests
    - _Requirements: All_

  - [ ] 21.2 Run all property tests
    - Authentication properties
    - Messaging properties
    - Conversation management properties
    - Handoff system properties
    - _Requirements: All_

  - [ ] 21.3 Manual end-to-end testing
    - Test complete user flow
    - Test agent dashboard flow
    - Test error scenarios
    - _Requirements: All_

- [ ] 22. Deployment Preparation
  - [ ] 22.1 Update environment variables for production
    - Set NODE_ENV=production
    - Use production MongoDB URI
    - Use production CORS origins
    - _Requirements: Deployment_

  - [ ] 22.2 Build and deploy backend
    - Deploy to Render/Railway
    - Configure environment variables
    - Test deployed API
    - _Requirements: Deployment_

  - [ ] 22.3 Build and deploy frontend
    - Deploy to Vercel/Netlify
    - Configure environment variables
    - Test deployed app
    - _Requirements: Deployment_

- [ ] 23. Final Checkpoint
  - All features working in production
  - All tests passing
  - Documentation complete
  - User acceptance testing complete

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Start with tasks 1-12 for basic chat functionality
- Add tasks 13-15 for agent handoff
- Add tasks 16+ for optional features and polish

