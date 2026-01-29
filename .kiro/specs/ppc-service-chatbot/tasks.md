# Implementation Plan: PPC Service Chatbot

## Overview

This implementation plan breaks down the PPC Service Chatbot into incremental, actionable tasks. The plan follows a phased approach: Socket.io migration, Redis integration, multilingual support, enhanced UI features, agent dashboard, and admin enhancements.

## Tasks

- [x] 1. Install dependencies and set up Socket.io infrastructure
  - Install Socket.io server and client libraries
  - Install Redis and ioredis for queue management
  - Install i18next and react-i18next for internationalization
  - Update package.json files for both client and server
  - _Requirements: 0.1, 0.2, 29.1, 34.2, 38.1_ 

- [x] 2. Set up Redis service and connection
  - [x] 2.1 Create Redis service with connection management
    - Implement Redis client initialization with ioredis
    - Add connection error handling and reconnection logic
    - Create methods for basic Redis operations (get, set, delete)
    - _Requirements: 29.1, 29.8_
  
  - [x] 2.2 Create queue service for message processing
    - Implement FIFO queue using Redis lists
    - Add methods to enqueue and dequeue messages
    - Implement queue size limits (max 1000 messages)
    - _Requirements: 29.2, 29.3, 29.10_
  
  - [x] 2.3 Create rate limiting service
    - Implement sliding window rate limiting with Redis
    - Add per-user rate tracking (10/minute, 100/hour)
    - Create rate limit check and increment methods
    - _Requirements: 30.1, 30.2, 30.3, 30.10_

- [x] 3. Implement Socket.io server infrastructure
  - [x] 3.1 Set up Socket.io server in server.ts
    - Initialize Socket.io server with CORS configuration
    - Configure Socket.io to use Redis adapter for multi-server support
    - Set up connection event handlers
    - _Requirements: 0.1, 0.2, 29.7_
  
  - [x] 3.2 Create socket event definitions and types
    - Define TypeScript interfaces for all socket events
    - Create event name constants (chat:message, chat:response, etc.)
    - Document event payloads
    - _Requirements: 28.1_
  
  - [x] 3.3 Implement chat socket handlers
    - Handle 'chat:connect' event with session creation
    - Handle 'chat:message' event with queue integration
    - Handle 'chat:typing' event
    - Handle 'chat:disconnect' event with cleanup
    - Implement automatic reconnection logic
    - _Requirements: 0.1, 0.3, 0.4, 0.5, 0.9, 0.10_
  
  - [x] 3.4 Implement socket authentication middleware
    - Verify JWT tokens on socket connection
    - Extract user information from tokens
    - Handle authentication failures
    - _Requirements: 0.1, 0.9_

- [x] 4. Create Socket.io client service
  - [x] 4.1 Create socket service for client
    - Initialize Socket.io client connection
    - Implement connection state management
    - Add automatic reconnection handling
    - Create event emission methods
    - _Requirements: 0.1, 0.2, 0.3_
  
  - [x] 4.2 Create useSocket custom hook
    - Implement React hook for socket connection
    - Add connection status tracking
    - Provide methods to emit and listen to events
    - Handle cleanup on unmount
    - _Requirements: 0.1, 0.3_

- [x] 5. Migrate ChatbotWidget to Socket.io
  - [x] 5.1 Update ChatbotWidget to use socket service
    - Replace HTTP calls with socket events
    - Implement 'chat:message' emission on send
    - Listen for 'chat:response' events
    - Add typing indicator support
    - _Requirements: 0.4, 0.5, 0.6_
  
  - [x] 5.2 Implement streaming response display
    - Listen for 'chat:stream' events
    - Display AI responses word-by-word
    - Handle stream completion
    - _Requirements: 0.8_
  
  - [x] 5.3 Add real-time status updates
    - Listen for 'status:update' events
    - Update UI when RTI/case/petition status changes
    - Display notifications for status changes
    - _Requirements: 0.7, 5.4_

- [x] 6. Checkpoint - Test Socket.io integration
  - Verify socket connection establishes successfully
  - Test message sending and receiving
  - Test automatic reconnection
  - Ensure all tests pass, ask the user if questions arise

- [-] 7. Implement session and context management
  - [x] 7.1 Create session storage in Redis
    - Store session data with user ID and session ID
    - Implement 30-minute TTL for sessions
    - Add methods to get and update session context
    - _Requirements: 17.1, 17.2, 33.5_
  
  - [x] 7.2 Implement conversation context tracking
    - Store last 10 messages in session
    - Maintain context across category switches
    - Clear context on session end
    - Limit context to 2000 tokens
    - _Requirements: 17.2, 17.4, 17.5, 33.1, 33.9_
  
  - [x] 7.3 Update AI service to use conversation context
    - Pass conversation history to Gemini AI
    - Include context in RAG retrieval
    - Handle context references in queries
    - _Requirements: 17.3, 33.2, 33.3, 33.4_

- [x] 8. Implement rate limiting middleware
  - [x] 8.1 Create rate limit middleware for socket events
    - Check rate limits before processing messages
    - Emit 'rate_limit_exceeded' error when limit reached
    - Log rate limit violations
    - _Requirements: 30.4, 30.8_
  
  - [x] 8.2 Update ChatbotWidget to handle rate limits
    - Display friendly message when rate limited
    - Show countdown timer until limit resets
    - Disable send button when rate limited
    - _Requirements: 30.5_

- [x] 9. Set up i18next configuration
  - [x] 9.1 Create i18next configuration file
    - Configure i18next with language detector
    - Set up fallback language (English)
    - Configure lazy loading for translations
    - _Requirements: 34.2, 38.1, 38.7_
    - **COMPLETED:** Created `client/src/i18n/init.ts` with i18next configuration
  
  - [x] 9.2 Create translation JSON files
    - Create en.json with all English translations
    - Create te.json with Telugu translations
    - Create hi.json with Hindi translations
    - Include all UI strings (buttons, labels, placeholders, errors)
    - _Requirements: 34.1, 38.2, 38.3_
    - **COMPLETED:** Created translation files for all 3 languages with chatbot UI strings
  
  - [x] 9.3 Initialize i18next in main.tsx
    - Import and initialize i18next configuration
    - Wrap app with I18nextProvider
    - Set up language detection from browser
    - _Requirements: 34.4, 38.1_
    - **COMPLETED:** Imported `./i18n/init` in main.tsx, App.tsx, and socketService.ts

- [x] 10. Create language selector component
  - [x] 10.1 Create LanguageSelector component
    - Display language options (Telugu, Hindi, English)
    - Show current selected language
    - Handle language change events
    - Emit socket event on language change
    - _Requirements: 34.3, 34.5, 39.9_
    - **COMPLETED:** Created `client/src/components/LanguageSwitcher.tsx` with dropdown selector
  
  - [x] 10.2 Create useLanguage custom hook
    - Provide current language state
    - Provide method to change language
    - Update i18next when language changes
    - Store preference in localStorage for guests
    - _Requirements: 34.5, 39.4_
    - **COMPLETED:** Using `useTranslation()` hook from react-i18next directly (built-in functionality)
  
  - [x] 10.3 Add LanguageSelector to ChatbotWidget header
    - Position selector in header with icons
    - Style with proper Telugu/Hindi fonts
    - Test language switching
    - _Requirements: 34.3, 36.8_
    - **COMPLETED:** Integrated LanguageSwitcher into ChatbotHeader using children pattern

- [ ] 11. Implement language detection service
  - [ ] 11.1 Create language detection service
    - Implement Unicode range detection for Telugu and Hindi
    - Add language detection for incoming messages
    - Support mixed-language queries (code-switching)
    - Default to English if detection fails
    - _Requirements: 35.1, 35.2, 35.5, 35.9, 35.10_
  
  - [ ] 11.2 Add language detection middleware
    - Detect language from incoming socket messages
    - Auto-switch UI language based on detection
    - Send detected language to AI service
    - _Requirements: 35.3, 35.4, 35.6, 35.7_

- [ ] 12. Update AI service for multilingual support
  - [ ] 12.1 Enhance AI service with language-aware prompts
    - Include language instruction in system prompt
    - Add language-specific context and terminology
    - Provide Telugu/Hindi translations of key terms
    - _Requirements: 34.7, 37.1, 37.2, 37.3, 37.4_
  
  - [ ] 12.2 Implement language validation and retry
    - Validate Gemini response is in requested language
    - Retry with stronger instruction if wrong language
    - Log language mismatches
    - _Requirements: 37.7, 37.8, 37.10_
  
  - [ ] 12.3 Handle code-switching in conversations
    - Maintain context when user switches languages
    - Update system prompt with new language
    - _Requirements: 37.6_

- [ ] 13. Implement language preference storage
  - [ ] 13.1 Add language preference to User model
    - Add languagePreference field (ISO 639-1 code)
    - Set default to browser language or English
    - _Requirements: 39.1, 39.2, 39.8_
  
  - [ ] 13.2 Create API endpoint for language preference
    - Implement PUT /api/user/language endpoint
    - Update user's language preference in MongoDB
    - Emit socket event on preference change
    - _Requirements: 39.6, 39.10_
  
  - [ ] 13.3 Load saved language preference on login
    - Retrieve language preference from user profile
    - Set i18next language on login
    - Sync preference across devices
    - _Requirements: 39.3, 39.5_

- [ ] 14. Checkpoint - Test multilingual functionality
  - Test language selector switching
  - Test automatic language detection
  - Test AI responses in all three languages
  - Verify language preference persistence
  - Ensure all tests pass, ask the user if questions arise

- [ ] 15. Create multilingual knowledge base structure
  - [ ] 15.1 Create KnowledgeBase model
    - Define schema with multilingual fields (title, content, keywords)
    - Support all categories (Services, FAQs, Centers, Events, etc.)
    - Add metadata fields (priority, isActive, usageCount)
    - _Requirements: 32.1, 32.2, 36.1_
  
  - [ ] 15.2 Implement knowledge base CRUD operations
    - Create methods to add/update/delete entries
    - Support bulk import/export
    - Validate entries for completeness
    - Auto-index new entries within 1 minute
    - _Requirements: 32.8, 32.9, 32.10_

- [ ] 16. Enhance RAG service for multilingual support
  - [ ] 16.1 Update RAG service to retrieve language-specific content
    - Query knowledge base by user's language
    - Fall back to English if content unavailable
    - Include language-specific keywords in search
    - _Requirements: 36.3, 36.4, 36.9_
  
  - [ ] 16.2 Implement semantic search with language awareness
    - Use keyword matching and semantic search
    - Score and rank by relevance
    - Return top 3 entries as context window
    - _Requirements: 31.2, 31.3, 31.4_
  
  - [ ] 16.3 Add multi-category search support
    - Search across all 6+ categories
    - Include FAQs, services, locations, events, petitions, emergency contacts
    - Log which entries were used for responses
    - _Requirements: 31.5, 31.8, 31.10_

- [ ] 17. Create welcome screen components
  - [ ] 17.1 Create WelcomeScreen component
    - Display welcome message with chatbot name
    - Show 6 main service categories
    - Use translated strings from i18next
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 17.2 Create CategoryCard component
    - Display category icon, name, and description
    - Handle click to expand category
    - Show services within category
    - Use distinct colors for each category
    - _Requirements: 1.4, 1.5, 12.2, 12.3_
  
  - [ ] 17.3 Integrate WelcomeScreen into ChatbotWidget
    - Show welcome screen on first open
    - Hide when user starts conversation
    - Provide way to return to welcome screen
    - _Requirements: 1.1_

- [ ] 18. Create quick action buttons
  - [ ] 18.1 Create QuickActions component
    - Display 3 quick action buttons (Track Status, File Report, Find Center)
    - Position above message input field
    - Use translated button labels
    - _Requirements: 2.1, 2.2_
  
  - [ ] 18.2 Implement quick action handlers
    - Handle "Track Status" click with type prompt
    - Handle "File Report" click with report type prompt
    - Handle "Find Center" click with location request
    - _Requirements: 2.3, 2.4, 2.5_

- [ ] 19. Create "What I Can Do" menu
  - [ ] 19.1 Create WhatICanDo component
    - Display expandable panel with capabilities
    - Organize into 5 sections (Track & Check, Submit & Apply, etc.)
    - Show at least 20 specific capabilities
    - _Requirements: 3.2, 3.3, 3.5_
  
  - [ ] 19.2 Add "What I Can Do" button to header
    - Position button in ChatbotWidget header
    - Toggle panel visibility on click
    - Provide "Back to Chat" button
    - _Requirements: 3.1, 3.4_

- [ ] 20. Implement contextual smart suggestions
  - [ ] 20.1 Create suggestion generation logic
    - Analyze user query for intent and context
    - Generate 3-4 relevant action buttons
    - Update suggestions dynamically based on conversation
    - _Requirements: 8.1, 8.2, 8.5_
  
  - [ ] 20.2 Add suggestion display to ChatbotWidget
    - Display suggestion buttons below AI responses
    - Handle suggestion button clicks
    - Show context-specific suggestions (RTI, volunteering, etc.)
    - _Requirements: 8.3, 8.4_

- [ ] 21. Checkpoint - Test enhanced UI features
  - Test welcome screen display and navigation
  - Test category cards and service display
  - Test quick action buttons
  - Test "What I Can Do" menu
  - Test contextual suggestions
  - Ensure all tests pass, ask the user if questions arise

- [ ] 22. Create Agent model and authentication
  - [ ] 22.1 Create Agent model
    - Define schema with name, email, password, role, languages
    - Add status field (available, busy, away, offline)
    - Add metrics fields (chats handled, response time, satisfaction)
    - _Requirements: 40.3, 40.4, 40.8_
  
  - [ ] 22.2 Implement agent authentication
    - Create POST /api/agent/login endpoint
    - Verify agent credentials
    - Generate JWT token for agents
    - _Requirements: 40.2_
  
  - [ ] 22.3 Create agent authentication middleware
    - Verify agent JWT tokens
    - Check agent role permissions
    - _Requirements: 40.3_

- [ ] 23. Create ChatSession model
  - [ ] 23.1 Create ChatSession model
    - Define schema with userId, sessionId, messages, status
    - Add language and assignedAgent fields
    - Add handoffReason and timestamps
    - _Requirements: 0.9, 17.1_
  
  - [ ] 23.2 Implement chat session CRUD operations
    - Create methods to create/update/close sessions
    - Store messages with role (user/bot/agent)
    - Track session status (active, waiting_agent, with_agent, closed)
    - _Requirements: 17.1, 42.1_

- [ ] 24. Implement handoff service
  - [ ] 24.1 Create handoff service
    - Implement handoff trigger logic (low confidence, user request, frustration)
    - Add chat to agent queue when handoff triggered
    - Estimate wait time based on queue length
    - _Requirements: 44.1, 44.2, 44.3, 44.4, 44.5, 44.7_
  
  - [ ] 24.2 Implement automatic handoff triggers
    - Trigger on AI confidence below 50%
    - Trigger on frustration keywords
    - Trigger on emergency queries
    - Trigger after 10 messages without resolution
    - _Requirements: 44.1, 44.3, 44.4, 44.5_
  
  - [ ] 24.3 Add handoff UI to ChatbotWidget
    - Display "Connecting to human agent..." message
    - Show estimated wait time
    - Allow user to cancel handoff
    - _Requirements: 44.6, 44.7, 44.8_

- [ ] 25. Implement agent socket handlers
  - [ ] 25.1 Create agent socket event handlers
    - Handle 'agent:connect' with status update
    - Handle 'agent:acceptChat' with chat assignment
    - Handle 'agent:sendMessage' with message delivery
    - Handle 'agent:closeChat' with session closure
    - _Requirements: 42.1, 42.4, 42.10_
  
  - [ ] 25.2 Implement agent queue management
    - Add chats to queue on handoff
    - Prevent multiple agents from accepting same chat
    - Notify agents when new chat enters queue
    - _Requirements: 41.1, 41.7, 41.10, 44.9_
  
  - [ ] 25.3 Implement agent-user message routing
    - Route agent messages to correct user socket
    - Route user messages to assigned agent socket
    - Show typing indicators between agent and user
    - _Requirements: 42.4, 42.6_

- [ ] 26. Create Agent Dashboard page
  - [ ] 26.1 Create AgentDashboardPage component
    - Set up route at /agent-dashboard
    - Require agent authentication
    - Initialize socket connection for agent
    - _Requirements: 40.1, 40.2_
  
  - [ ] 26.2 Create AgentDashboard layout
    - Create header with agent info and status selector
    - Create sidebar for queue and active chats
    - Create main area for chat window
    - Support desktop and tablet (min 1024px)
    - _Requirements: 40.4, 40.6, 40.7_
  
  - [ ] 26.3 Implement agent status management
    - Allow agents to set status (Available, Busy, Away)
    - Update status in real-time via socket
    - Auto-logout after 30 minutes of inactivity
    - _Requirements: 40.9, 40.10_

- [ ] 27. Create chat queue component
  - [ ] 27.1 Create ChatQueue component
    - Display all chats waiting for agent
    - Show user name/ID, wait time, language, preview, priority
    - Sort by wait time (longest first)
    - Highlight urgent chats with visual indicators
    - _Requirements: 41.1, 41.2, 41.3, 41.4_
  
  - [ ] 27.2 Add queue filtering and notifications
    - Filter by language (Telugu, Hindi, English)
    - Filter by category (Legal, Emergency, Services, etc.)
    - Play notification sound for new chats
    - Show real-time count of waiting chats
    - _Requirements: 41.5, 41.6, 41.8, 41.9_

- [ ] 28. Create active chats component
  - [ ] 28.1 Create ActiveChats component
    - Display all chats assigned to agent (max 5)
    - Show unread message counts
    - Highlight chats with new messages
    - Show conversation preview and last message
    - _Requirements: 43.1, 43.2, 43.3, 43.5_
  
  - [ ] 28.2 Add multi-chat management features
    - Allow switching between chats with keyboard shortcuts
    - Minimize/maximize chat windows
    - Track response time per conversation
    - Warn if user waiting > 2 minutes
    - Auto-close after 10 minutes of user inactivity
    - _Requirements: 43.4, 43.6, 43.7, 43.8, 43.9, 43.10_

- [ ] 29. Create chat window component
  - [ ] 29.1 Create ChatWindow component
    - Display full conversation history
    - Show user profile information
    - Show message input for agent
    - Display typing indicators
    - _Requirements: 42.2, 42.3, 42.6_
  
  - [ ] 29.2 Add agent message features
    - Send messages in real-time via socket
    - Support quick replies and canned responses
    - Support file attachments (images, PDFs)
    - Label agent messages with "Human Agent"
    - _Requirements: 42.4, 42.5, 42.7, 42.8_
  
  - [ ] 29.3 Add chat management actions
    - Transfer chat to another agent or supervisor
    - Mark chat as resolved
    - Close conversation
    - _Requirements: 42.9, 42.10_

- [ ] 30. Implement agent analytics
  - [ ] 30.1 Create analytics display for supervisors
    - Show real-time metrics (total chats, active agents, queue length, avg wait time)
    - Show individual agent metrics (chats handled, response time, satisfaction)
    - Display chat volume trends by hour and day
    - _Requirements: 45.1, 45.2, 45.3_
  
  - [ ] 30.2 Add analytics breakdowns
    - Show handoff reasons breakdown
    - Display language distribution (Telugu, Hindi, English %)
    - Show category distribution
    - Display agent availability schedule
    - _Requirements: 45.4, 45.5, 45.6, 45.8_
  
  - [ ] 30.3 Add reporting features
    - Export reports as CSV or PDF
    - Show customer satisfaction ratings
    - Highlight agents needing support or training
    - _Requirements: 45.7, 45.9, 45.10_

- [ ] 31. Checkpoint - Test agent dashboard
  - Test agent authentication and login
  - Test chat queue display and filtering
  - Test accepting and handling chats
  - Test multi-chat management
  - Test agent-user messaging
  - Test analytics display
  - Ensure all tests pass, ask the user if questions arise

- [ ] 32. Implement admin knowledge base management
  - [ ] 32.1 Create admin API endpoints for knowledge base
    - POST /api/admin/knowledge - Add entry
    - PUT /api/admin/knowledge/:id - Update entry
    - DELETE /api/admin/knowledge/:id - Delete entry
    - GET /api/admin/knowledge - List entries
    - _Requirements: 21.1, 21.2, 21.3_
  
  - [ ] 32.2 Add multilingual content support to admin UI
    - Provide fields for Telugu, Hindi, English content
    - Support adding keywords in all languages
    - Validate completeness before saving
    - _Requirements: 36.2, 36.5_
  
  - [ ] 32.3 Implement real-time knowledge base updates
    - Clear Redis cache when content updated
    - Update RAG service index immediately
    - Notify chatbot of changes via socket
    - _Requirements: 16.1, 21.4, 21.5, 31.7_

- [ ] 33. Implement admin FAQ management
  - [ ] 33.1 Create FAQ management interface
    - Add interface to create/edit FAQs
    - Support categorization (Legal, Emergency, Education, etc.)
    - Add multilingual FAQ content
    - _Requirements: 22.1, 22.2, 22.3_
  
  - [ ] 33.2 Add FAQ analytics
    - Display usage statistics for each FAQ
    - Show most searched questions
    - Track FAQ effectiveness
    - _Requirements: 22.5_
  
  - [ ] 33.3 Implement real-time FAQ updates
    - Include new FAQs in search within 1 minute
    - Clear FAQ cache in Redis
    - _Requirements: 22.4_

- [ ] 34. Implement admin center management
  - [ ] 34.1 Create PPC center management interface
    - Add interface to create/edit centers
    - Include fields for name, address, GPS, phone, timings
    - Support marking centers as active or closed
    - _Requirements: 23.1, 23.2, 23.3_
  
  - [ ] 34.2 Add map visualization
    - Display centers on interactive map
    - Allow visual verification of locations
    - _Requirements: 23.5_
  
  - [ ] 34.3 Implement real-time center updates
    - Update location search immediately
    - Sync changes to chatbot
    - _Requirements: 23.4_

- [ ] 35. Implement admin application status management
  - [ ] 35.1 Create RTI/case status management interface
    - Display all pending applications
    - Allow status updates (Pending, Under Review, Approved, Rejected)
    - Add status notes and expected completion dates
    - _Requirements: 24.1, 24.2, 24.3_
  
  - [ ] 35.2 Implement real-time status updates
    - Update chatbot tracking immediately
    - Emit socket event for status changes
    - _Requirements: 24.4_
  
  - [ ] 35.3 Add bulk update support
    - Support bulk status updates for multiple applications
    - _Requirements: 24.5_

- [ ] 36. Implement admin event and petition management
  - [ ] 36.1 Create event management interface
    - Add interface to create/edit events
    - Include fields for title, date, time, location, description
    - Mark events as upcoming, ongoing, or completed
    - Show registration counts
    - _Requirements: 25.1, 25.2, 25.3, 25.5_
  
  - [ ] 36.2 Create petition management interface
    - Add interface to create/edit petitions
    - Display real-time signature counts
    - Mark petitions as active, closed, or successful
    - Support exporting signatures
    - _Requirements: 26.1, 26.2, 26.3, 26.5_
  
  - [ ] 36.3 Implement real-time event/petition updates
    - Update chatbot displays immediately
    - Sync signature counts in real-time
    - _Requirements: 25.4, 26.4_

- [ ] 37. Implement admin emergency contact management
  - [ ] 37.1 Create emergency contact management interface
    - Add interface to create/edit emergency contacts
    - Support categorization (Crisis, Healthcare, Mental Health, Legal, Police)
    - Mark contacts as 24/7 or with specific hours
    - Prioritize for quick access
    - _Requirements: 27.1, 27.2, 27.3, 27.5_
  
  - [ ] 37.2 Implement real-time contact updates
    - Update chatbot emergency displays immediately
    - _Requirements: 27.4_

- [ ] 38. Implement analytics and usage tracking
  - [ ] 38.1 Create analytics logging service
    - Log all user queries with timestamps and intent
    - Track feature usage frequency
    - Record conversation completion rates
    - Anonymize personal data
    - _Requirements: 20.1, 20.2, 20.3, 20.5_
  
  - [ ] 38.2 Create analytics dashboard for admins
    - Display daily usage reports
    - Show feature usage statistics
    - Display user satisfaction metrics
    - _Requirements: 20.4_

- [ ] 39. Implement additional chatbot features
  - [ ] 39.1 Implement search with autocomplete
    - Display autocomplete suggestions after 2 characters
    - Return top 5 matching queries from history and FAQs
    - Update suggestions in real-time
    - Support fuzzy matching for typos
    - _Requirements: 18.1, 18.2, 18.3, 18.5_
  
  - [ ] 39.2 Implement feature discovery tips
    - Display tips after 3+ interactions
    - Rotate through different features
    - Show in non-intrusive card format
    - Track shown tips to avoid repetition
    - _Requirements: 13.1, 13.2, 13.3, 13.5_
  
  - [ ] 39.3 Implement user activity dashboard
    - Display activity summary for logged-in users
    - Show counts for RTI, petitions, appointments, volunteer apps
    - Show status for pending applications
    - Update in real-time
    - _Requirements: 15.1, 15.2, 15.3, 15.5_

- [ ] 40. Final checkpoint and integration testing
  - Test complete user journey from chat to agent handoff
  - Test multilingual functionality across all features
  - Test admin content management and real-time updates
  - Test analytics and reporting
  - Verify all socket events working correctly
  - Test rate limiting and queue management
  - Ensure all tests pass, ask the user if questions arise

- [ ] 41. Production deployment preparation
  - [ ] 41.1 Configure environment variables
    - Set up production environment variables
    - Configure Redis URL and MongoDB URI
    - Set Socket.io CORS origins
    - Configure rate limits
    - _Requirements: 29.8, 30.9_
  
  - [ ] 41.2 Set up PM2 for process management
    - Create PM2 ecosystem file
    - Configure clustering for load balancing
    - Set up automatic restarts
    - _Requirements: 0.2_
  
  - [ ] 41.3 Configure Nginx reverse proxy
    - Set up Nginx configuration
    - Enable SSL/TLS
    - Configure WebSocket proxying for Socket.io
    - Enable sticky sessions for load balancing
    - _Requirements: 0.2_
  
  - [ ] 41.4 Set up Redis persistence
    - Configure Redis persistence (RDB + AOF)
    - Set up Redis backup strategy
    - _Requirements: 29.1_
  
  - [ ] 41.5 Optimize for production
    - Enable gzip compression
    - Set up CDN for static assets
    - Configure MongoDB connection pooling
    - Enable Redis connection pooling
    - _Requirements: Performance optimization_

## Notes

- Each task builds incrementally on previous tasks
- Tasks reference specific requirements for traceability
- Checkpoints ensure validation at key milestones
- Focus on coding tasks only - no deployment or user testing
- All socket events must be tested for reliability
- Multilingual support is critical - test thoroughly in all three languages
- Agent dashboard is a separate application - ensure proper isolation
- Real-time updates are essential - verify socket events work correctly
