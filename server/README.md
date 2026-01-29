# PPC Server - Clean Architecture

## 📁 **Folder Structure**

```
server/
├── src/
│   ├── core/                    # 🎯 Core PPC Functionality
│   │   ├── services/           # AI, RAG, Session services
│   │   ├── controllers/        # Chatbot controller
│   │   └── routes/            # Chatbot routes
│   ├── auth/                   # 🔐 Authentication Module
│   │   ├── services/          # Auth, OAuth, Token services
│   │   ├── controllers/       # Auth controller
│   │   ├── middleware/        # Auth middleware
│   │   └── routes/           # Auth routes
│   ├── shared/                # 🔧 Shared Components
│   │   ├── config/           # Database, environment config
│   │   ├── models/           # MongoDB models
│   │   ├── types/            # TypeScript type definitions
│   │   └── utils/            # Utility functions
│   ├── socket/               # 🔌 WebSocket handling
│   ├── middleware/           # 🛡️ Global middleware
│   ├── routes/              # 🛤️ Other routes (admin, etc.)
│   ├── controllers/         # 🎮 Other controllers
│   ├── services/           # 🔧 Other services
│   └── repositories/       # 📊 Data access layer
├── tests/                   # 🧪 Organized Tests
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/               # End-to-end tests
└── scripts/               # 🔨 Utility scripts
```

## 🎯 **Core PPC Services**

- **AI Service**: Gemini & Groq integration
- **RAG Service**: Knowledge base & context retrieval
- **Session Service**: Chat session management
- **Chatbot Controller**: Main chat endpoint

## 🔐 **Authentication Module**

- **Google OAuth**: Social login
- **JWT Tokens**: Session management
- **OTP Service**: Two-factor authentication
- **Password Service**: Secure password handling

## 🔧 **Shared Components**

- **Models**: MongoDB schemas
- **Config**: Environment & database setup
- **Types**: TypeScript definitions
- **Utils**: Common utilities

## 🚀 **Getting Started**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📝 **Key Features**

✅ **Clean Architecture** - Modular, maintainable code
✅ **PPC Focus** - Core chatbot functionality prioritized
✅ **Future Ready** - Admin & advanced features preserved
✅ **Type Safe** - Full TypeScript support
✅ **Test Ready** - Organized test structure