# Hilton Restaurant Reservation System

A comprehensive online table reservation system for Hilton restaurants, allowing guests to book tables and restaurant staff to manage reservations.

## Features

### For Guests
- Easy online table booking
- Manage personal reservations
- Update or cancel bookings
- View reservation status

### For Restaurant Staff
- Manage all reservations
- Approve, cancel, or complete reservations
- Filter reservations by date and status
- View guest contact information
- Dashboard with reservation overview

## Technology Stack

### Backend
- **Node.js** with Express.js
- **GraphQL** with Apollo Server
- **MongoDB** for data persistence
- **JWT** for authentication
- **Winston** for logging
- **Joi** for input validation

### Frontend
- **Vue.js 3** with TypeScript
- **Vue Router** for navigation
- **Pinia** for state management
- **Apollo Client** for GraphQL
- **Axios** for REST API calls

## Project Structure

```
hilton-restaurant-reservation/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # REST API controllers
│   │   ├── graphql/         # GraphQL schema and resolvers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # REST API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── server.js        # Main server file
│   ├── tests/               # Backend tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Vue components
│   │   ├── views/           # Page components
│   │   ├── stores/          # Pinia stores
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── tests/               # Frontend tests
│   └── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- Couchbase Server (local or cloud)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   COUCHBASE_CONNECTION_STRING=couchbase://localhost:8091
   COUCHBASE_USERNAME=Administrator
   COUCHBASE_PASSWORD=password
   COUCHBASE_BUCKET=hilton-reservations
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   LOG_LEVEL=info
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

### REST Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### GraphQL Schema

#### Queries
- `me` - Get current user
- `reservations(filter: ReservationFilter)` - Get all reservations (with filters)
- `reservation(id: ID!)` - Get specific reservation
- `myReservations` - Get current user's reservations

#### Mutations
- `register` - Register new user
- `login` - User login
- `createReservation` - Create new reservation
- `updateReservation` - Update reservation
- `cancelReservation` - Cancel reservation
- `approveReservation` - Approve reservation (employee only)
- `completeReservation` - Complete reservation (employee only)

## Testing

### Backend Tests
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### Frontend Tests
```bash
cd frontend
npm run test:unit     # Run unit tests
npm run lint          # Run linter
```

## Environment Variables

### Backend (.env)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRE` - JWT expiration time
- `LOG_LEVEL` - Logging level

## Deployment

### Backend Deployment
1. Set production environment variables
2. Run `npm install --production`
3. Use a process manager like PM2
4. Set up MongoDB Atlas or production MongoDB

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure environment variables for production API URLs

## Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Input validation with Joi
- CORS protection
- Error handling middleware
- Request logging

## Data Models

### User
- Name, email, password, phone, role (guest/employee/admin)
- JWT authentication
- Password hashing

### Reservation
- Guest information (name, contact info)
- Expected arrival time
- Table size/number of guests
- Status (requested/approved/cancelled/completed)
- Special requests
- Creation and update timestamps

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License
ISC License