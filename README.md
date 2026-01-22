# 💰 AI Personal Finance Advisor

A comprehensive AI-powered personal finance management application built with the MERN stack. This application helps users track expenses, analyze spending patterns, and receive personalized financial advice using OpenAI's GPT API.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.2.0-blue)
![MongoDB](https://img.shields.io/badge/mongodb-6.0-green)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Sample Data](#-sample-data)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Future Enhancements](#-future-enhancements)
- [Author](#-author)

## ✨ Features

### 📊 Dashboard & Analytics
- **Real-time financial overview** with income, expenses, and savings summary
- **Interactive charts** using Chart.js (Line, Bar, Doughnut, Pie charts)
- **Monthly trend analysis** to track spending over time
- **Category-wise breakdown** with percentage distribution
- **Budget tracking** with visual progress indicators

### 💳 Transaction Management
- **Manual transaction entry** with category selection
- **CSV file upload** with auto-categorization
- **Advanced filtering** by date, category, type, and amount
- **Bulk operations** for efficient transaction management
- **Pagination** for handling large datasets

### 🤖 AI-Powered Insights (OpenAI Integration)
- **Interactive chat interface** - Ask anything about your finances
- **Spending analysis** - AI analyzes your patterns and habits
- **Budget suggestions** - Get optimal budget recommendations per category
- **Savings tips** - Personalized tips based on your spending behavior
- **Financial health assessment** - Overall evaluation of your finances

### 🔐 Security Features
- **JWT authentication** with secure token handling
- **Password hashing** using bcryptjs (12 salt rounds)
- **Rate limiting** to prevent abuse (100 requests/15 min)
- **Input validation** using express-validator
- **Helmet.js** for security headers
- **CORS** configuration for cross-origin requests

### 📱 User Experience
- **Responsive design** - Works seamlessly on desktop, tablet, and mobile
- **Dark theme** - Modern, eye-friendly interface
- **Smooth animations** using Framer Motion
- **Toast notifications** for user feedback
- **Intuitive navigation** with sidebar layout

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| OpenAI SDK | AI integration |
| Multer | File upload handling |
| csv-parser | CSV file parsing |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI library |
| React Router DOM | Client-side routing |
| Chart.js | Data visualization |
| Framer Motion | Animations |
| Axios | HTTP client |
| react-hot-toast | Notifications |
| react-dropzone | File upload UI |
| react-icons | Icon library |

## 🏗 Architecture

```
FinanceAI/
├── client/                     # React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout/         # Layout components
│   │   ├── context/
│   │   │   └── AuthContext.js  # Authentication state
│   │   ├── pages/
│   │   │   ├── Dashboard.js    # Main dashboard
│   │   │   ├── Transactions.js # Transaction management
│   │   │   ├── Analytics.js    # Charts & analytics
│   │   │   ├── AIAdvisor.js    # AI chat & insights
│   │   │   ├── Upload.js       # CSV upload
│   │   │   ├── Settings.js     # User settings
│   │   │   ├── Login.js        # Login page
│   │   │   └── Register.js     # Registration page
│   │   ├── services/
│   │   │   └── api.js          # API service layer
│   │   ├── App.js              # Main App component
│   │   └── index.js            # Entry point
│   └── package.json
│
├── server/                     # Express Backend
│   ├── models/
│   │   ├── User.js             # User model
│   │   ├── Transaction.js      # Transaction model
│   │   ├── Budget.js           # Budget model
│   │   └── Analysis.js         # AI analysis cache
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   └── validation.js       # Input validation rules
│   ├── routes/
│   │   ├── auth.js             # Auth endpoints
│   │   ├── transactions.js     # Transaction CRUD
│   │   ├── upload.js           # CSV upload
│   │   ├── analysis.js         # AI analysis endpoints
│   │   └── dashboard.js        # Dashboard data
│   ├── seed/
│   │   └── seedData.js         # Demo data generator
│   └── index.js                # Server entry point
│
├── .env.example                # Environment variables template
├── .gitignore
├── package.json                # Root package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- OpenAI API Key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/FinanceAI.git
cd FinanceAI
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

3. **Set up environment variables**
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your credentials
nano .env
```

4. **Start MongoDB** (if running locally)
```bash
mongod
```

5. **Seed the database with demo data**
```bash
cd server
npm run seed
```

6. **Run the application**
```bash
# From root directory
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Demo Account
After seeding, you can login with:
- **Email:** demo@financeai.com
- **Password:** demo123

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/financeai

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# JWT Expiration
JWT_EXPIRES_IN=7d

# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/password` | Change password |

### Transaction Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | Get all transactions (paginated) |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/stats` | Get transaction statistics |
| DELETE | `/api/transactions/bulk` | Bulk delete transactions |

### Upload Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/csv` | Upload CSV file |
| GET | `/api/upload/template` | Download CSV template |

### AI Analysis Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/spending` | Analyze spending patterns |
| GET | `/api/analysis/budget-suggestions` | Get budget suggestions |
| GET | `/api/analysis/savings-tips` | Get savings tips |
| POST | `/api/analysis/chat` | Chat with AI advisor |

### Dashboard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Get financial summary |
| GET | `/api/dashboard/category-breakdown` | Get category breakdown |
| GET | `/api/dashboard/monthly-trend` | Get monthly trends |
| GET | `/api/dashboard/budget-status` | Get budget status |

### Request/Response Examples

#### Create Transaction
```bash
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Grocery shopping at BigBasket",
  "amount": 2500,
  "category": "Groceries",
  "type": "expense",
  "date": "2024-01-15"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "transaction": {
      "_id": "65a1234567890abcdef12345",
      "description": "Grocery shopping at BigBasket",
      "amount": 2500,
      "category": "Groceries",
      "type": "expense",
      "date": "2024-01-15T00:00:00.000Z",
      "user": "65a0987654321fedcba09876",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## 📊 Sample Data

The seed script (`server/seed/seedData.js`) generates:

- **Demo User Account** with pre-configured settings
- **100+ Transactions** spanning the last 6 months including:
  - 🍔 Food & Dining expenses
  - 🛒 Grocery purchases
  - 🚗 Transportation costs
  - 💡 Utility bills
  - 🎬 Entertainment expenses
  - 💰 Salary income
  - 💸 Freelance income
  - 📈 Investment returns

Run the seed script:
```bash
cd server
npm run seed
```

## 🌐 Deployment

### Deploy to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure build settings:
   - **Build Command:** `npm install && cd client && npm install && npm run build`
   - **Start Command:** `cd server && node index.js`
4. Add environment variables in Render dashboard
5. Deploy!

### Deploy to Railway

1. Create a new project on Railway
2. Add MongoDB plugin or use MongoDB Atlas
3. Connect your GitHub repository
4. Add environment variables
5. Deploy!

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
OPENAI_API_KEY=your-openai-api-key
CLIENT_URL=https://your-frontend-domain.com
```

## 📸 Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)
*Real-time financial overview with charts and summaries*

### AI Advisor
![AI Advisor](screenshots/ai-advisor.png)
*Interactive chat with AI-powered financial advisor*

### Transaction Management
![Transactions](screenshots/transactions.png)
*Full CRUD operations with filtering and pagination*

### Analytics
![Analytics](screenshots/analytics.png)
*Detailed charts and spending analysis*

### CSV Upload
![Upload](screenshots/upload-csv.png)
*Drag-and-drop CSV upload with auto-categorization*

## 🔮 Future Enhancements

- [ ] **Bill Reminders** - Automatic payment reminders
- [ ] **Goal Tracking** - Set and track financial goals
- [ ] **Bank Integration** - Connect bank accounts via Plaid
- [ ] **Multi-Currency** - Support for multiple currencies
- [ ] **Receipt Scanning** - OCR for receipt uploads
- [ ] **Export Reports** - Generate PDF/Excel reports
- [ ] **Family Accounts** - Shared household budgets
- [ ] **Investment Tracking** - Portfolio management
- [ ] **Dark/Light Theme Toggle** - Theme preference
- [ ] **Push Notifications** - Mobile notifications

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Use environment variables
2. **Use HTTPS in production** - Enable SSL certificates
3. **Rotate JWT secrets** - Change secrets periodically
4. **Monitor API usage** - Set up rate limiting alerts
5. **Regular dependency updates** - Keep packages updated
6. **Input sanitization** - Validate all user inputs

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run both client & server in development |
| `npm run server` | Run only the server |
| `npm run client` | Run only the client |
| `npm run build` | Build client for production |
| `npm run seed` | Seed database with demo data |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**ROHIT GAUTAM**

- GitHub: [@Rohitgautam02](https://github.com/Rohitgautam02)
- LinkedIn: [Rohit Gautam ](https://www.linkedin.com/in/rohit-gautam-67136b24b/)
- Email: gautamrohit73699@gmail.com

---

⭐ If you found this project helpful, please give it a star!

Made with ❤️ for the Reaidy.io Assessment
