# Previewer Platform - Deployment Guide

This guide covers deploying the Previewer platform to production environments.

## 🏗️ Architecture Overview

The Previewer platform consists of three main components:
- **Backend API**: Node.js/Express server with PostgreSQL database
- **User Frontend**: Next.js application for content creators
- **Worker Frontend**: Next.js application for content evaluators

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Solana wallet with SOL for transactions
- Domain names for each component (optional but recommended)

### 1. Clone and Setup
```bash
git clone https://github.com/your-username/previewer.git
cd previewer
npm run setup
```

### 2. Environment Configuration
Copy and configure environment files for each component:

```bash
# Backend
cp backend/.env.example backend/.env

# User Frontend
cp user-frontend/.env.local.example user-frontend/.env.local

# Worker Frontend
cp worker-frontend/.env.local.example worker-frontend/.env.local
```

### 3. Database Setup
```bash
npm run db:generate
npm run db:push
```

### 4. Development
```bash
npm run dev
```

## 🌐 Production Deployment

### Backend Deployment (Railway/Heroku)

#### Railway Deployment
1. **Create Railway Project**
```bash
npm install -g @railway/cli
railway login
railway init
```

2. **Configure Environment Variables**
```bash
railway variables set DATABASE_URL="your_postgresql_url"
railway variables set JWT_SECRET="your_jwt_secret"
railway variables set SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
railway variables set ADMIN_WALLET_ADDRESS="your_mainnet_wallet"
# ... add all other environment variables
```

3. **Deploy**
```bash
cd backend
railway up
```

#### Heroku Deployment
1. **Create Heroku App**
```bash
heroku create previewer-api
heroku addons:create heroku-postgresql:mini
```

2. **Configure Environment**
```bash
heroku config:set JWT_SECRET="your_jwt_secret"
heroku config:set SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
# ... add all environment variables
```

3. **Deploy**
```bash
cd backend
git init
heroku git:remote -a previewer-api
git add .
git commit -m "Initial deployment"
git push heroku main
```

### Frontend Deployment (Vercel)

#### User Frontend
1. **Deploy to Vercel**
```bash
cd user-frontend
npx vercel --prod
```

2. **Configure Environment Variables in Vercel Dashboard**
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet
NEXT_PUBLIC_ADMIN_WALLET=your_mainnet_wallet_address
```

#### Worker Frontend
1. **Deploy to Vercel**
```bash
cd worker-frontend
npx vercel --prod
```

2. **Configure Environment Variables**
Same as user frontend but with worker-specific settings.

### Alternative: Docker Deployment

#### Docker Compose Setup
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: previewer
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/previewer
      JWT_SECRET: your_jwt_secret
      SOLANA_RPC_URL: https://api.mainnet-beta.solana.com
    depends_on:
      - postgres

  user-frontend:
    build: ./user-frontend
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000

  worker-frontend:
    build: ./worker-frontend
    ports:
      - "3002:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000

volumes:
  postgres_data:
```

#### Deploy with Docker
```bash
docker-compose up -d
```

## 🔧 Production Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/previewer"

# JWT
JWT_SECRET="your-super-secure-jwt-secret"
WORKER_JWT_SECRET="your-super-secure-worker-jwt-secret"

# Solana (MAINNET)
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
SOLANA_NETWORK="mainnet"
ADMIN_WALLET_ADDRESS="your_mainnet_wallet_address"
ADMIN_PRIVATE_KEY="your_mainnet_private_key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# IPFS
IPFS_API_URL="https://ipfs.infura.io:5001"
IPFS_PROJECT_ID="your_infura_project_id"
IPFS_PROJECT_SECRET="your_infura_project_secret"

# Production Settings
NODE_ENV="production"
PORT="3000"
LOG_LEVEL="info"
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="https://api.previewer.app"
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
NEXT_PUBLIC_SOLANA_NETWORK="mainnet"
NEXT_PUBLIC_ADMIN_WALLET="your_mainnet_wallet_address"
```

### Database Migration
```bash
# Run migrations in production
cd backend
npx prisma migrate deploy
```

### SSL/HTTPS Setup
Ensure all components use HTTPS in production:
- Use Vercel's automatic HTTPS for frontends
- Configure SSL certificates for custom backend domains
- Update CORS settings to allow HTTPS origins only

## 📊 Monitoring & Analytics

### Error Monitoring (Sentry)
1. **Install Sentry**
```bash
npm install @sentry/node @sentry/nextjs
```

2. **Configure Backend**
```javascript
// backend/src/index.js
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

3. **Configure Frontend**
```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Performance Monitoring
- Use Vercel Analytics for frontend performance
- Implement custom metrics for API response times
- Monitor database query performance
- Track Solana transaction success rates

## 🔐 Security Checklist

### Backend Security
- [ ] Use HTTPS only in production
- [ ] Implement rate limiting on all endpoints
- [ ] Validate all input with Zod schemas
- [ ] Use secure JWT secrets (256-bit minimum)
- [ ] Enable CORS only for trusted domains
- [ ] Implement proper error handling (no sensitive data leaks)
- [ ] Use environment variables for all secrets
- [ ] Enable database connection pooling
- [ ] Implement request logging and monitoring

### Frontend Security
- [ ] Use HTTPS only
- [ ] Implement Content Security Policy (CSP)
- [ ] Validate all user inputs
- [ ] Sanitize displayed data
- [ ] Use secure wallet connections
- [ ] Implement proper session management
- [ ] Enable security headers

### Blockchain Security
- [ ] Use mainnet RPC endpoints
- [ ] Verify all transaction signatures
- [ ] Implement transaction confirmation checks
- [ ] Use secure private key storage
- [ ] Monitor wallet balances
- [ ] Implement transaction retry logic

## 🚨 Backup & Recovery

### Database Backups
```bash
# Automated daily backups
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup_20240101.sql
```

### File Storage Backups
- IPFS files are distributed and persistent
- Cloudinary provides automatic backups
- Consider additional backup to AWS S3 or similar

### Configuration Backups
- Store environment variables securely
- Backup deployment configurations
- Document all third-party service configurations

## 📈 Scaling Considerations

### Database Scaling
- Implement read replicas for heavy read operations
- Use connection pooling (PgBouncer)
- Consider database sharding for large datasets
- Implement caching with Redis

### API Scaling
- Use load balancers for multiple backend instances
- Implement horizontal scaling with container orchestration
- Use CDN for static assets
- Implement API caching strategies

### Frontend Scaling
- Vercel automatically handles frontend scaling
- Use CDN for global content delivery
- Implement code splitting and lazy loading
- Optimize images and assets

## 🔍 Health Checks

### Backend Health Check
```javascript
// GET /health
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "solana": "connected",
  "ipfs": "connected"
}
```

### Monitoring Endpoints
- `/health` - Basic health check
- `/metrics` - Prometheus metrics
- `/admin/stats` - System statistics

## 🚀 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm run install:all
      - run: npm run test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: railway up --service backend

  deploy-frontends:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          cd user-frontend && vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
          cd worker-frontend && vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Update dependencies monthly
- [ ] Monitor error rates and performance
- [ ] Review and rotate API keys quarterly
- [ ] Backup database weekly
- [ ] Update documentation as needed
- [ ] Monitor Solana network status
- [ ] Review worker consensus accuracy

### Emergency Procedures
1. **API Downtime**: Switch to backup server or maintenance mode
2. **Database Issues**: Restore from latest backup
3. **Payment Issues**: Pause new task creation, investigate transactions
4. **Security Breach**: Rotate all keys, audit logs, notify users

### Contact Information
- **Technical Issues**: tech@previewer.app
- **Security Issues**: security@previewer.app
- **General Support**: support@previewer.app

---

For additional help, refer to the main [README.md](README.md) or create an issue in the GitHub repository.