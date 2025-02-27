# Gaming Cafe Management System

## Overview

https://github.com/user-attachments/assets/d5d4f21e-b091-4fe7-af9f-4773287756f8


Gaming Cafe is a comprehensive management system designed for gaming centers to track and manage user sessions, machine usage, and billing in a seamless, user-friendly interface.

## Table of Contents
- [Tech Stack](#tech-stack)
- [Features](#features)
- [User Flow](#user-flow)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Contributing](#contributing)
- [License](#license)

## Tech Stack
### Frontend
- **Framework**: React.js
- **UI Library**: Chakra UI
- **State Management**: React Hooks
- **Routing**: React Router
- **HTTP Client**: Fetch API

### Backend
- **Framework**: Flask
- **ORM**: SQLAlchemy
- **Database**: SQLite
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Werkzeug Security

## Features

### User Management
- User registration with automatic admin privileges
- Profile management
- Balance tracking and top-up system

### Session Management
- Start and end gaming sessions
- Real-time session tracking
- Automatic billing based on machine usage
- Time remaining calculation

### Machine Management
- Machine status tracking (Available, In Use, Maintenance)
- Different machine types with varying hourly rates
- Admin control for machine configuration

### Dashboard
- Admin dashboard with comprehensive statistics
- User dashboard for personal session history
- Real-time updates and refreshing

## User Flow

1. **Sign Up**
   - New users can create an account
   - All users are automatically assigned admin rights
   - Profile avatar generated based on gender

2. **Authentication**
   - Login with username and password
   - JWT token-based authentication
   - Role-based access control

3. **Session Management**
   - Admins can start sessions for users
   - Users can view their active and past sessions
   - Automatic billing based on session duration

4. **Balance Management**
   - Admins can add balance to user accounts
   - Real-time balance tracking
   - Session costs automatically deducted

## Project Structure
```
gaming-cafe/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   ├── pages/
│   │   └── App.js
│   │
│   └── package.json
│
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── routes.py
│   ├── services/
│   └── requirements.txt
│
└── README.md
```

## Installation

### Backend Setup
```bash
# Run backend
flask run 
```

### Frontend Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Database Schema

### User Model
- `id`: Unique identifier
- `username`: Unique username
- `password`: Hashed password
- `is_admin`: Admin privileges flag
- `balance`: User account balance
- `gender`: User gender
- `img_url`: Profile avatar URL

### Machine Model
- `id`: Unique identifier
- `name`: Machine name
- `machine_type`: Machine category
- `hourly_rate`: Cost per hour
- `status`: Current machine status

### Session Model
- `id`: Unique identifier
- `user_id`: Associated user
- `machine_id`: Used machine
- `start_time`: Session start timestamp
- `end_time`: Session end timestamp
- `duration`: Total session hours
- `amount_charged`: Total session cost
- `is_active`: Current session status

## API Endpoints

### Authentication
- `POST /api/login`: User login
- `POST /api/signup`: User registration

### Users
- `GET /api/users`: List all users (admin only)
- `POST /api/users/{id}/add-balance`: Add balance to user account

### Machines
- `GET /api/machines`: List all machines
- `POST /api/machines`: Create new machine (admin only)
- `PATCH /api/machines/{id}`: Update machine details

### Sessions
- `GET /api/sessions`: List sessions
- `GET /api/sessions/active`: List active sessions
- `POST /api/sessions`: Start new session
- `POST /api/sessions/{id}/end`: End active session

## Authentication
- JWT-based authentication
- Tokens include user ID and admin status
- Role-based access control
- Secure password hashing

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is open-source and available under the MIT License.

## Future Roadmap
- Deploying the app to Render!
```

## Contact
For any inquiries, please contact [Your Contact Information]
