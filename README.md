# MERN Stack Application

A full-stack web application built with MongoDB, Express.js, React, and Node.js.

## Project Structure

```
mern-app/
│
├── backend/                 # Node.js/Express backend
│   ├── config/              # Database and environment configuration
│   ├── controllers/         # Route controllers
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   ├── utils/               # Utility functions
│   ├── server.js           # Main server file
│   └── package.json
│
├── frontend/                # React frontend
│   ├── public/             # Public assets
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── .env                    # Environment variables
├── .gitignore
└── README.md
```

## Features

- **Authentication**: JWT-based user authentication
- **User Management**: User registration, login, and profile management
- **Responsive Design**: Mobile-first responsive UI with Tailwind CSS
- **API Integration**: Axios for HTTP requests
- **Context API**: Global state management
- **Error Handling**: Comprehensive error handling on both frontend and backend
- **Security**: Helmet.js for security headers, bcrypt for password hashing

## Tech Stack

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing

### Frontend
- **React**: JavaScript library for building user interfaces
- **Vite**: Build tool and development server
- **React Router**: Declarative routing
- **Axios**: HTTP client
- **Tailwind CSS**: Utility-first CSS framework
- **Context API**: State management

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mern-app
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   - Copy the `.env` file and update the values:
   ```
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/mern-app
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   PORT=5000
   CLIENT_URL=http://localhost:3000
   ```

5. **Start MongoDB**
   - Make sure MongoDB is running on your system

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (Protected)
- `PUT /api/users/profile` - Update user profile (Protected)

## Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Features

### Authentication System
- User registration and login
- JWT token-based authentication
- Password hashing with bcrypt
- Protected routes

### User Interface
- Modern, responsive design
- Clean and intuitive navigation
- Loading states and error handling
- Mobile-first approach

### Security Features
- Input validation
- Password hashing
- JWT token security
- CORS configuration
- Security headers with Helmet

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email your-email@example.com or create an issue in the repository.
