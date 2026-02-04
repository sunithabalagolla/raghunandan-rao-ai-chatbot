# AI Chatbot Project - Complete Folder Structure

This document contains the complete folder structure of the AI Chatbot project as of the current state.

```
ai-chatbot/
├── .git/
├── .gitignore
├── .kiro/
│   └── specs/
│       ├── agent-dashboard/
│       ├── ai-chatbot-mern/
│       └── ppc-service-chatbot/
├── .vscode/
├── agent-dashboard/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── dist/
│   ├── eslint.config.js
│   ├── index.html
│   ├── node_modules/
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── public/
│   │   ├── icons/
│   │   │   ├── notification-default.png
│   │   │   ├── notification-high.png
│   │   │   ├── notification-low.png
│   │   │   └── notification-urgent.png
│   │   ├── sounds/
│   │   │   ├── notification-default.mp3
│   │   │   ├── notification-error.mp3
│   │   │   ├── notification-success.mp3
│   │   │   ├── notification-urgent.mp3
│   │   │   └── notification-warning.mp3
│   │   └── vite.svg
│   ├── README.md
│   ├── src/
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── assets/
│   │   │   └── react.svg
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── PasswordReset.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatTab.tsx
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── ChatWorkspace.tsx
│   │   │   │   ├── CustomerInfo.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   └── MessageInput.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── AgentStatusToggle.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── DashboardLayout.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── emergency/
│   │   │   │   ├── EmergencyAlert.tsx
│   │   │   │   ├── EmergencyContacts.tsx
│   │   │   │   ├── EmergencyDashboard.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── PriorityBadge.tsx
│   │   │   │   └── SLATimer.tsx
│   │   │   ├── feedback/
│   │   │   │   └── FeedbackDisplay.tsx
│   │   │   ├── language/
│   │   │   │   ├── index.ts
│   │   │   │   ├── LanguageBadge.tsx
│   │   │   │   ├── LanguageDashboard.tsx
│   │   │   │   ├── LanguageSelector.tsx
│   │   │   │   ├── LanguageStatistics.tsx
│   │   │   │   └── TranslationAssistant.tsx
│   │   │   ├── notifications/
│   │   │   │   ├── NotificationBell.tsx
│   │   │   │   ├── NotificationPanel.tsx
│   │   │   │   ├── NotificationSettings.tsx
│   │   │   │   └── NotificationToast.tsx
│   │   │   ├── performance/
│   │   │   │   ├── AgentStats.tsx
│   │   │   │   └── PerformanceDashboard.tsx
│   │   │   ├── sla/
│   │   │   │   ├── SLADashboard.tsx
│   │   │   │   └── SLATimer.tsx
│   │   │   ├── supervisor/
│   │   │   │   ├── index.ts
│   │   │   │   ├── SupervisorDashboard.tsx
│   │   │   │   ├── TeamPerformance.tsx
│   │   │   │   └── WorkloadDistribution.tsx
│   │   │   ├── templates/
│   │   │   │   ├── TemplateCard.tsx
│   │   │   │   ├── TemplateEditor.tsx
│   │   │   │   ├── TemplateLibrary.tsx
│   │   │   │   └── TemplateSearch.tsx
│   │   │   └── tickets/
│   │   │       ├── TicketCard.tsx
│   │   │       ├── TicketFilters.tsx
│   │   │       └── TicketQueue.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── emergencyService.ts
│   │   │   ├── languageService.ts
│   │   │   ├── notificationService.ts
│   │   │   ├── performanceService.ts
│   │   │   ├── slaService.ts
│   │   │   └── socketService.ts
│   │   └── types/
│   │       └── auth.types.ts
│   ├── tailwind.config.js
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── client/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── dist/
│   ├── eslint.config.js
│   ├── index.html
│   ├── node_modules/
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── public/
│   │   └── vite.svg
│   ├── README.md
│   ├── src/
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── assets/
│   │   │   └── react.svg
│   │   ├── components/
│   │   │   ├── Button.tsx
│   │   │   ├── chat/
│   │   │   ├── chatbot/
│   │   │   │   ├── ActionButton.tsx
│   │   │   │   ├── chatbot.constants.ts
│   │   │   │   ├── chatbot.types.ts
│   │   │   │   ├── ChatbotButton.tsx
│   │   │   │   ├── ChatbotHeader.tsx
│   │   │   │   ├── ChatbotInput.tsx
│   │   │   │   ├── ChatbotWelcome.tsx
│   │   │   │   ├── constants/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── HelpScreen.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── Message.tsx
│   │   │   │   ├── ServicesScreen.tsx
│   │   │   │   ├── types/
│   │   │   │   │   └── index.ts
│   │   │   │   └── TypingIndicator.tsx
│   │   │   ├── ChatbotWidget.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── feedback/
│   │   │   │   └── CustomerFeedbackForm.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── LanguageSwitcher.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── OTPInput.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useSocket.ts
│   │   ├── i18n/
│   │   │   ├── init.ts
│   │   │   └── locales/
│   │   │       ├── en.json
│   │   │       ├── hi.json
│   │   │       └── te.json
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── pages/
│   │   │   ├── FeedbackPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── HomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── chatbot.service.ts
│   │   │   ├── chatService.ts
│   │   │   ├── feedbackService.ts
│   │   │   └── socketService.ts
│   │   ├── stores/
│   │   │   ├── chatStore.ts
│   │   │   └── conversationStore.ts
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   └── chat.types.ts
│   │   └── utils/
│   │       ├── storage.ts
│   │       └── validation.ts
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── verify-dependencies.ts
│   └── vite.config.ts
├── docs/
│   └── FOLDER_STRUCTURE.md
├── server/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── check-tickets.js
│   ├── debug-recent-ticket.js
│   ├── debug-socket-rooms.js
│   ├── debug-tickets.js
│   ├── debug-waiting-tickets.js
│   ├── dist/
│   ├── node_modules/
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── scripts/
│   │   ├── convert-agent-to-supervisor.ts
│   │   ├── convert-user-to-agent.ts
│   │   ├── create-multiple-test-tickets.ts
│   │   ├── create-proper-test-users.ts
│   │   ├── create-supervisor-simple.ts
│   │   ├── create-supervisor-user.ts
│   │   ├── create-test-agent.ts
│   │   ├── create-test-ticket.ts
│   │   ├── create-working-token.ts
│   │   ├── decode-jwt.ts
│   │   ├── fix-agent-profile.ts
│   │   ├── force-update-agent.ts
│   │   ├── initialize-agent-profile.ts
│   │   └── set-user-password.ts
│   ├── src/
│   │   ├── app-fresh.ts
│   │   ├── app-test.ts
│   │   ├── app.ts
│   │   ├── auth/
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.fresh.ts
│   │   │   │   └── auth.controller.ts
│   │   │   ├── middleware/
│   │   │   │   └── auth.middleware.ts
│   │   │   ├── routes/
│   │   │   └── services/
│   │   │       ├── auth.service.ts
│   │   │       ├── googleOAuth.service.ts
│   │   │       ├── otp.service.ts
│   │   │       ├── password.service.ts
│   │   │       └── token.service.ts
│   │   ├── controllers/
│   │   │   ├── admin.controller.ts
│   │   │   ├── agent.controller.ts
│   │   │   ├── agent.controller.ts.broken
│   │   │   ├── conversation.controller.ts
│   │   │   ├── emergency.controller.ts
│   │   │   ├── handoff.controller.ts
│   │   │   ├── language.controller.ts
│   │   │   └── supervisor.controller.ts
│   │   ├── core/
│   │   │   ├── controllers/
│   │   │   │   └── chatbot.controller.ts
│   │   │   ├── routes/
│   │   │   └── services/
│   │   │       ├── ai.service.ts
│   │   │       ├── aiManager.service.ts
│   │   │       ├── rag.service.ts
│   │   │       └── session.service.ts
│   │   ├── middleware/
│   │   │   ├── adminAuth.middleware.ts
│   │   │   ├── errorHandler.middleware.ts
│   │   │   └── rateLimit.middleware.ts
│   │   ├── repositories/
│   │   │   └── user.repository.ts
│   │   ├── routes/
│   │   ├── scripts/
│   │   │   └── createAdmin.ts
│   │   ├── server.ts
│   │   ├── services/
│   │   │   ├── admin.service.ts
│   │   │   ├── context.service.ts
│   │   │   ├── conversation.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── emergency.service.ts
│   │   │   ├── facebookOAuth.service.ts
│   │   │   ├── language.service.ts
│   │   │   ├── queue.service.ts
│   │   │   ├── rateLimit.service.ts
│   │   │   ├── redis.service.ts
│   │   │   ├── session.types.ts
│   │   │   ├── ticketManager.service.ts
│   │   │   └── validation.service.ts
│   │   ├── shared/
│   │   │   ├── config/
│   │   │   │   ├── database.ts
│   │   │   │   └── env.config.ts
│   │   │   ├── models/
│   │   │   │   ├── Admin.model.ts
│   │   │   │   ├── AgentSession.model.ts
│   │   │   │   ├── BlacklistedToken.model.ts
│   │   │   │   ├── CannedResponse.model.ts
│   │   │   │   ├── Conversation.model.ts
│   │   │   │   ├── HandoffTicket.model.ts
│   │   │   │   ├── OTP.model.ts
│   │   │   │   ├── RateLimit.model.ts
│   │   │   │   ├── SupportTicket.model.ts
│   │   │   │   └── User.model.ts
│   │   │   ├── types/
│   │   │   │   ├── admin.types.ts
│   │   │   │   ├── agent.types.ts
│   │   │   │   ├── google.types.ts
│   │   │   │   ├── otp.types.ts
│   │   │   │   ├── rateLimit.types.ts
│   │   │   │   ├── token.types.ts
│   │   │   │   ├── user.types.ts
│   │   │   │   └── validation.types.ts
│   │   │   └── utils/
│   │   │       ├── errorFormatter.ts
│   │   │       └── errors.ts
│   │   ├── socket/
│   │   │   ├── events.ts
│   │   │   ├── handlers/
│   │   │   │   ├── agentHandler.ts
│   │   │   │   ├── chatHandler.ts
│   │   │   │   └── handoffHandler.ts
│   │   │   └── socketServer.ts
│   │   └── tests/
│   │       ├── api.test.ts
│   │       ├── health.test.ts
│   │       └── services.test.ts
│   ├── tests/
│   │   ├── e2e/
│   │   ├── integration/
│   │   │   ├── test-chatbot.js
│   │   │   ├── test-email.js
│   │   │   ├── test-otp-flow.js
│   │   │   ├── test-redis.ts
│   │   │   ├── test-socket-integration.ts
│   │   │   └── test-upstash-connection.ts
│   │   └── unit/
│   ├── tsconfig.json
│   ├── tsconfig.server.json
│   └── vitest.config.ts
├── node_modules/
├── package-lock.json
├── package.json
├── CLIENT_HANDOVER.md
├── debug-auth.html
├── EMERGENCY_FIX.md
├── HANDOFF_FIXED_PROOF.md
├── PRODUCTION_DEPLOYMENT.md
├── README.md
├── test-accept-ticket.html
├── test-agent-api-direct.html
├── test-agent-customer-chat.js
├── test-auth-roles.html
├── test-complete-flow.html
├── test-create-handoff.html
├── test-handoff-detection.js
├── test-handoff-direct.js
├── test-handoff-flow.html
├── test-handoff-flow.js
├── test-handoff-real.js
├── test-multiple-handoff-phrases.js
├── test-realtime-communication.html
├── test-socket-connection.html
├── test-socket-handoff.js
├── test-tickets-api.html
├── test-ui-handoff.html
├── test-user-agent-chat.html
├── verify-production-ready.js
└── WORKING_TEST.html
```

## Project Structure Overview

### Main Directories:
- **agent-dashboard/**: React frontend for agents to manage tickets and chat with customers
- **client/**: React frontend for customers to interact with the chatbot
- **server/**: Node.js backend with Express, Socket.IO, and MongoDB
- **docs/**: Project documentation
- **.kiro/**: Kiro AI assistant specifications and configurations

### Key Components:
- **Socket Handlers**: Real-time communication between agents and customers
- **Models**: MongoDB schemas for users, tickets, conversations
- **Services**: Business logic for AI, authentication, ticket management
- **Controllers**: API endpoints and request handling
- **Tests**: Integration and unit tests

### Test Files:
Various HTML and JavaScript test files for debugging and testing different components of the system.

Last Updated: January 30, 2026