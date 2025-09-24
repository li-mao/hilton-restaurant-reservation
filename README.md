# 🏨 Hilton Restaurant Reservation System

A comprehensive online table reservation system for Hilton restaurants, allowing guests to book tables and restaurant staff to manage reservations efficiently.

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Couchbase](https://img.shields.io/badge/Couchbase-Database-orange?logo=couchbase)](https://www.couchbase.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

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

## 🚀 Quick Start

### One-Click Deployment with Docker

```bash
# Clone the repository
git clone <repository-url>
cd hilton-restaurant-reservation

# Start all services with one command
./deploy.sh
```

**Access the application:**
- 🌐 Frontend: http://localhost:3000
- 🔧 Backend API: http://localhost:5000
- 🗄️ Database Admin: http://localhost:8091

**Default Admin Account:**
- Email: admin@hilton.com
- Password: admin123

## 🛠️ Technology Stack

### Backend
- **Node.js 20+** with Express.js
- **GraphQL** with Apollo Server
- **Couchbase** for data persistence
- **JWT** for authentication
- **Winston** for logging
- **Joi** for input validation
- **Docker** for containerization

### Frontend
- **Vue.js 3** with TypeScript
- **Vue Router** for navigation
- **Pinia** for state management
- **Apollo Client** for GraphQL
- **Axios** for REST API calls
- **Vite** for build tooling

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

## 📦 Installation

### Prerequisites
- **Docker** and **Docker Compose** (recommended)
- **Node.js** (v20 or higher) for manual setup
- **npm** or **yarn**

### 🐳 Docker Installation (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd hilton-restaurant-reservation
   ```

2. **Start all services:**
   ```bash
   ./deploy.sh
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database Admin: http://localhost:8091

### 🔧 Manual Installation

#### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables:**
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

5. **Start the development server:**
   ```bash
   npm run dev
   ```

#### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
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

## 🐳 Docker Management

### Common Docker Commands

```bash
# Start all services
./deploy.sh

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart backend

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Check service status
docker-compose ps

# Enter container shell
docker-compose exec backend bash
```

### Database Management

```bash
# Reset database (⚠️ This will delete all data)
docker-compose exec backend node reset-db.js

# Check database status
docker-compose exec backend node check-data.js

# View database admin interface
# Open http://localhost:8091 in browser
# Username: Administrator
# Password: password
```

## 🚀 Deployment

### Docker Deployment (Production)

1. **Update environment variables for production:**
   ```bash
   # Edit docker-compose.yml for production settings
   # Update JWT_SECRET, database credentials, etc.
   ```

2. **Deploy with Docker Compose:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Set up reverse proxy (Nginx):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
       }
   }
   ```

### Manual Deployment

#### Backend Deployment
1. Set production environment variables
2. Run `npm install --production`
3. Use a process manager like PM2
4. Set up Couchbase Server or production Couchbase

#### Frontend Deployment
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

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000

# Kill the process
sudo kill -9 <PID>
```

#### 2. Database Connection Issues

**Symptoms**: Authentication failure, "Database not connected" errors

**Solutions**:
```bash
# Check Couchbase status
docker-compose logs couchbase

# Manual cluster initialization
docker-compose exec couchbase couchbase-cli cluster-init -c localhost:8091 \
  --cluster-username Administrator --cluster-password password \
  --services data,query,index,fts,eventing,analytics --cluster-ramsize 1024

# Create bucket manually
docker-compose exec couchbase couchbase-cli bucket-create -c localhost:8091 \
  -u Administrator -p password --bucket hilton-reservations \
  --bucket-type couchbase --bucket-ramsize 100 --enable-flush 1

# Restart initialization
docker-compose up -d couchbase-init

# Restart backend service
docker-compose restart backend
```

#### 3. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Fix Docker permissions
sudo chmod +x deploy.sh
```

#### 4. Memory Issues
```bash
# Check Docker resource usage
docker stats

# Clean up Docker resources
docker system prune -a
```

### Health Checks

```bash
# Check backend health
curl -s http://localhost:5000/api/health

# Check frontend
curl -s http://localhost:3000

# Check database
curl -s http://localhost:8091/pools/default
```

## 📊 Monitoring

### Log Management
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f couchbase

# Save logs to file
docker-compose logs > logs.txt
```

### Performance Monitoring
```bash
# Monitor resource usage
docker stats

# Check container health
docker-compose ps

# Monitor database performance
# Access Couchbase admin at http://localhost:8091
```

## 🧪 Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm run test:unit

# Integration tests
npm run test:integration
```

### Code Quality
```bash
# Lint backend code
cd backend && npm run lint

# Lint frontend code
cd frontend && npm run lint

# Format code
npm run format
```

## 📚 Additional Resources

- [Docker Restart Guide](DOCKER_RESTART_GUIDE.md) - Complete Docker management guide
- [API Documentation](docs/api.md) - Detailed API documentation
- [Database Schema](docs/database.md) - Database design and relationships
- [Deployment Guide](docs/deployment.md) - Production deployment instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Submit a pull request

### Development Guidelines
- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Docker containerization for easy deployment
- Couchbase for scalable data storage
- Vue.js 3 for reactive frontend
- Node.js for robust backend services

---

## 🔧 Advanced Troubleshooting

### Couchbase Initialization Issues

If you encounter authentication failures or connection issues:

```bash
# 1. Check Couchbase service status
docker-compose logs couchbase

# 2. Manual cluster initialization
docker-compose exec couchbase couchbase-cli cluster-init -c localhost:8091 \
  --cluster-username Administrator --cluster-password password \
  --services data,query,index,fts,eventing,analytics --cluster-ramsize 1024

# 3. Create bucket manually
docker-compose exec couchbase couchbase-cli bucket-create -c localhost:8091 \
  -u Administrator -p password --bucket hilton-reservations \
  --bucket-type couchbase --bucket-ramsize 100 --enable-flush 1

# 4. Restart initialization
docker-compose up -d couchbase-init

# 5. Wait for completion
sleep 60

# 6. Check logs
docker-compose logs couchbase-init
```

### Complete System Reset

If you need to completely reset the system:

```bash
# Stop all services
docker-compose down

# Remove data volume
docker volume rm hilton-restaurant-reservation_couchbase_data

# Clean Docker resources
docker system prune -f

# Restart with deploy script
./deploy.sh
```

**Need help?** Check the [troubleshooting section](#-troubleshooting) or open an issue on GitHub.