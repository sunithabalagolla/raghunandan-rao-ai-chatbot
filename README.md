# AI Chatbot with Agent Dashboard

A complete multi-language AI chatbot system with real-time agent dashboard for customer support operations.

## 🚀 Features

### Core Features
- **Multi-language Support**: English, Hindi, Telugu with automatic language detection
- **Real-time Communication**: Socket.io powered chat with typing indicators
- **Human Handoff System**: Seamless escalation from AI to human agents
- **Agent Dashboard**: Complete ticket management and performance monitoring
- **Emergency Handling**: Priority-based ticket routing and SLA tracking
- **Authentication**: JWT-based auth with role-based access control

### AI Capabilities
- **Smart Responses**: Powered by Google Gemini and Groq AI models
- **Context Awareness**: Maintains conversation history and context
- **Handoff Detection**: Automatic detection of requests for human assistance
- **Rate Limiting**: Prevents abuse with intelligent rate limiting

### Agent Features
- **Ticket Queue**: Real-time ticket management with priority sorting
- **Performance Analytics**: Detailed metrics and performance tracking
- **Multi-language Support**: Handle tickets in multiple languages
- **SLA Monitoring**: Track response times and resolution deadlines
- **Emergency Alerts**: Instant notifications for urgent tickets

## 🏗️ Architecture

### Applications
1. **Client App** (React + Vite) - Port 5174
   - Customer-facing chatbot interface
   - Multi-language support
   - Real-time chat functionality

2. **Server** (Node.js + Express + Socket.io) - Port 5001
   - API backend with authentication
   - Real-time Socket.io communication
   - AI integration and handoff logic

3. **Agent Dashboard** (React + Vite) - Port 3002
   - Agent interface for ticket management
   - Performance monitoring
   - Real-time notifications

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Socket.io, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for session management
- **AI**: Google Gemini, Groq API
- **Authentication**: JWT tokens
- **Real-time**: Socket.io

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Redis
- AI API keys (Google Gemini, Groq)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ai-chatbot
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Install agent dashboard dependencies
cd ../agent-dashboard && npm install
```

3. **Environment Setup**

Copy the example environment files and configure:

```bash
# Server environment
cp server/.env.example server/.env

# Client environment
cp client/.env.example client/.env

# Agent dashboard environment
cp agent-dashboard/.env.example agent-dashboard/.env
```

4. **Configure Environment Variables**

**Server (.env)**:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/ai-chatbot

# Redis
REDIS_URL=redis://localhost:6379

# AI APIs
GOOGLE_AI_API_KEY=your_google_ai_key
GROQ_API_KEY=your_groq_api_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Server
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5174,http://localhost:3002
```

**Client (.env)**:
```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

**Agent Dashboard (.env)**:
```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

### Running the Applications

1. **Start the server**
```bash
cd server
npm run dev
```

2. **Start the client app**
```bash
cd client
npm run dev
```

3. **Start the agent dashboard**
```bash
cd agent-dashboard
npm run dev
```

### Access the Applications
- **Client App**: http://localhost:5174
- **Agent Dashboard**: http://localhost:3002
- **Server API**: http://localhost:5001
- **Health Check**: http://localhost:5001/health

## 👥 User Accounts

### Test Users
The system includes pre-configured test users:

**Agent Account**:
- Email: `agent@test.com`
- Password: `password@123`
- Role: Agent

**Supervisor Account**:
- Email: `supervisor@test.com`
- Password: `password@123`
- Role: Supervisor

## 🔄 Workflow

### Customer Journey
1. Customer visits the client app
2. Interacts with AI chatbot
3. Requests human help ("escalate to human")
4. System creates support ticket automatically
5. Agent accepts ticket from dashboard
6. Real-time chat begins between customer and agent

### Agent Workflow
1. Agent logs into dashboard
2. Views pending tickets in queue
3. Accepts tickets based on priority
4. Handles customer inquiries
5. Resolves tickets with feedback collection

## 📊 Features in Detail

### Multi-language Support
- **Automatic Detection**: Detects user language from input
- **Unicode Support**: Full support for Hindi and Telugu scripts
- **Translation**: Real-time translation capabilities
- **Localized UI**: Interface adapts to user language

### Emergency Handling
- **Keyword Detection**: Automatic priority escalation
- **SLA Tracking**: Response time monitoring
- **Alert System**: Instant notifications for urgent cases
- **Escalation Rules**: Automatic supervisor notification

### Performance Analytics
- **Response Times**: Track agent performance metrics
- **Resolution Rates**: Monitor ticket resolution efficiency
- **Customer Satisfaction**: Feedback collection and analysis
- **Team Performance**: Supervisor dashboard with team metrics

## 🔧 Development

### Project Structure
```
ai-chatbot/
├── client/                 # Customer-facing React app
├── server/                 # Node.js backend
├── agent-dashboard/        # Agent interface React app
├── .kiro/                  # Kiro AI specifications
└── docs/                   # Documentation
```

### Key Components

**Server**:
- `src/socket/handlers/chatHandler.ts` - Real-time chat logic
- `src/controllers/agent.controller.ts` - Agent API endpoints
- `src/core/controllers/chatbot.controller.ts` - AI chatbot logic
- `src/shared/models/` - MongoDB models

**Client**:
- `src/components/ChatbotWidget.tsx` - Main chatbot interface
- `src/services/socketService.ts` - Socket.io client
- `src/components/chatbot/` - Chatbot components

**Agent Dashboard**:
- `src/components/tickets/TicketQueue.tsx` - Ticket management
- `src/components/dashboard/Dashboard.tsx` - Main dashboard
- `src/components/performance/` - Analytics components

## 🚀 Production Deployment

See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for detailed deployment instructions including:
- Docker configuration
- Environment setup
- Database migration
- SSL configuration
- Monitoring setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the production deployment guide

## 🔮 Future Enhancements

- Voice chat integration
- Advanced AI training
- Mobile app development
- Advanced analytics dashboard
- Integration with CRM systems
- Automated testing suite