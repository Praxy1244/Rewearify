Rewearify Project - Complete Development Prompt Template
Project Overview
Rewearify is a comprehensive donation platform that connects donors with recipient organizations (NGOs/charities) through AI-powered matching. The platform includes fraud detection, analytics, and real-time notifications.

Current Tech Stack
Frontend: React 18.3.1 + Tailwind CSS + Radix UI components + React Router
Backend: Node.js + Express + MongoDB + Socket.IO + JWT authentication
AI Components: Python FastAPI service with machine learning models
Database: MongoDB with Mongoose ODM
Real-time: Socket.IO for notifications
Authentication: JWT tokens with role-based access control
Project Structure
Rewearify/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components (auth, donor, recipient, admin, ai)
│   │   ├── contexts/       # React contexts (Auth, App)
│   │   ├── hooks/          # Custom React hooks
│   │   └── services/       # API service functions
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── models/         # MongoDB models (User, Donation, Request, etc.)
│   │   ├── routes/         # API routes (auth, users, donations, etc.)
│   │   ├── middleware/     # Auth and error handling middleware
│   │   ├── config/         # Database configuration
│   │   └── utils/          # Utility functions and seed data
└── scdp_ai/                # Python AI service
    ├── models/             # ML models (matching, fraud, clustering, forecasting)
    ├── api/               # FastAPI endpoints
    ├── data/              # Data generation and processing
    └── tests/             # AI component tests
User Roles & Dashboards
Admin Dashboard:

User management, donation oversight, analytics
AI insights: fraud detection alerts, platform analytics, NGO clustering
Donor Dashboard:

Create donations, view donation history
AI features: smart matching suggestions, impact analytics
Recipient Dashboard:

Browse available items, create requests
AI features: need-based matching, demand forecasting
Key Features Implemented
✅ Role-based authentication (admin, donor, recipient)
✅ Donation lifecycle management
✅ Request matching system
✅ Real-time notifications via Socket.IO
✅ Comprehensive user profiles
✅ Admin analytics and management
✅ AI models for matching, fraud detection, clustering, forecasting
Current Issues & Requirements
Database Integration: Replace mock data with real database calls
AI Integration: Connect Python AI service with Node.js backend
Frontend Enhancement: Improve UI to showcase AI features
Testing: Need comprehensive test cases for all components
Documentation: Complete project documentation needed
Development Environment Setup
# Backend setup
cd backend
npm install
npm run dev

# Frontend setup  
cd frontend
npm install
npm start

# AI service setup
cd scdp_ai
pip install -r requirements.txt
python api/main.py
Database Models
User: Admin, donor, recipient with detailed profiles
Donation: Items with categories, conditions, pickup details
Request: Organization needs with urgency levels
Notification: Real-time updates for users
Match: AI-generated donation-request matches
API Endpoints Structure
/api/auth/* - Authentication (login, register, reset password)
/api/users/* - User profile management
/api/donations/* - Donation CRUD operations
/api/requests/* - Request management
/api/admin/* - Admin-only operations
/api/ai/* - AI service integration endpoints
/api/analytics/* - Platform analytics
AI Components
Matching Algorithm: Content-based filtering for donation-request matching
Fraud Detection: Logistic regression + Random Forest for suspicious activity
NGO Clustering: DBSCAN + KMeans for organization categorization
Time Series Forecasting: Prophet model for demand prediction
Login Credentials (Test Data)
Admin: admin@rewearify.com / admin123
Donor: john.smith@email.com / password123
Recipient: contact@hopefoundation.org / password123
PROMPT TO USE IN NEW CHAT:
"Hi Alex! I’m working on my Rewearify donation platform project. Here’s what I need help with:

Project Context: Rewearify is a donation platform with React frontend, Node.js backend, MongoDB database, and Python AI components. The platform connects donors with recipient organizations through AI-powered matching.

Current Status: [Describe current state - e.g., “Database is seeded with realistic data, but frontend still uses mock data”]

What I need help with: [Specify your exact requirements - e.g., “Integrate AI matching system with frontend”, “Fix authentication flow”, “Add test cases”, etc.]

Priority Level: [High/Medium/Low]

My coding level: Beginner - please provide step-by-step instructions

The complete project structure and technical details are in the repository at: https://github.com/Praxy1244/Rewearify

Please start by examining the current codebase and then help me with the specific task I mentioned above."

Quick Reference Commands
# Start all services
npm run dev          # Backend (from /backend)
npm start           # Frontend (from /frontend)  
python api/main.py  # AI service (from /scdp_ai)

# Database operations
npm run seed        # Populate with test data
npm run test        # Run backend tests

# Build for production
npm run build       # Frontend build
npm run start       # Production backend
Common Development Tasks
Adding new API endpoint: Create route in /backend/src/routes/, add to server.js
Adding new page: Create component in /frontend/src/pages/, add route to App.js
Database changes: Update models in /backend/src/models/, run migration if needed
AI integration: Add endpoint in /scdp_ai/api/, create corresponding backend route
UI components: Use existing Radix UI components, follow Tailwind CSS patterns
This template should help you quickly onboard any developer or AI assistant to work on your Rewearify project efficiently!