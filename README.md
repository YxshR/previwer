<<<<<<< HEAD
# Previewer - Content Evaluation Platform

A comprehensive web application that connects content creators with real human evaluators through blockchain-secured payments. Users pay in Solana to get their marketing content (images, thumbnails, videos) evaluated by workers for clickability assessment.

## 🌟 Features

### For Content Creators (Users)
- **Multi-wallet Support**: Connect with Phantom, Solflare, MetaMask, and 20+ other wallets
- **Service Selection**: Choose from Marketing Images, YouTube Thumbnails, or Video Content evaluation
- **Flexible Pricing**: Multiple review packages (200/500 reviews for images, 100/300 for videos)
- **Drag & Drop Upload**: Easy file upload with progress tracking (up to 5 files, 50MB each)
- **Solana Payments**: Secure blockchain payments to admin wallet
- **Real-time Results**: Live progress tracking and instant results when consensus is reached
- **Visual Analytics**: Comprehensive results dashboard with charts and insights
- **IPFS Storage**: Decentralized file storage with Cloudinary backup

### For Workers (Evaluators)
- **Instant Earnings**: Get paid immediately in SOL after each completed evaluation
- **Flexible Work**: Work anytime, anywhere with no minimum commitments
- **Fair Compensation**: Earn $0.059 for images/thumbnails, $0.10 for videos (majority consensus)
- **Performance Tracking**: Accuracy scores, completion rates, and earnings history
- **Real-time Tasks**: Automatic task assignment with live updates
- **Video Requirements**: Mandatory viewing time for video content evaluation
- **Instant Withdrawals**: Direct SOL payments to connected wallet

### Platform Features
- **Consensus Algorithm**: Advanced worker consensus with ranked rewards (1st, 2nd, 3rd place)
- **Real-time Updates**: WebSocket connections for live data synchronization
- **Blockchain Security**: All transactions secured by Solana blockchain
- **Responsive Design**: Mobile-first design with dark/light mode support
- **Admin Dashboard**: Platform oversight and analytics
- **Automated Processing**: Scheduled task completion and reward distribution

## 🏗️ Architecture

### Backend (`/backend`)
- **Framework**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: Solana Web3.js integration
- **File Storage**: IPFS with Cloudinary backup
- **Real-time**: Socket.io WebSocket server
- **Authentication**: JWT with wallet signature verification
- **Validation**: Zod schema validation
- **Logging**: Winston with comprehensive error tracking

### User Frontend (`/user-frontend`)
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with custom design system
- **Wallet Integration**: Solana Wallet Adapter with multi-wallet support
- **State Management**: React Query for server state
- **Animations**: Framer Motion
- **File Upload**: React Dropzone with progress tracking
- **Charts**: Recharts for analytics visualization
- **Notifications**: React Hot Toast

### Worker Frontend (`/worker-frontend`)
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with worker-specific branding
- **Real-time**: Socket.io client for live updates
- **Task Interface**: Specialized evaluation UI with video support
- **Earnings Tracking**: Live balance updates and withdrawal interface
- **Performance Metrics**: Accuracy tracking and statistics

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Solana wallet (Phantom, Solflare, etc.)
- Cloudinary account (optional)
- IPFS node or Infura account (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/previewer.git
cd previewer
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# User Frontend
cd ../user-frontend
npm install

# Worker Frontend
cd ../worker-frontend
npm install
```

3. **Environment Setup**

**Backend** (`backend/.env`):
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/previewer"

# JWT Secrets
JWT_SECRET=your_jwt_secret_here
WORKER_JWT_SECRET=your_worker_jwt_secret_here

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
ADMIN_WALLET_ADDRESS=your_admin_wallet_address
ADMIN_PRIVATE_KEY=your_admin_private_key

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# IPFS (Optional)
IPFS_API_URL=https://ipfs.infura.io:5001
IPFS_PROJECT_ID=your_project_id
IPFS_PROJECT_SECRET=your_project_secret

# Server
PORT=3000
NODE_ENV=development
```

**Frontend** (`.env.local` in both frontend directories):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_ADMIN_WALLET=your_admin_wallet_address
```

4. **Database Setup**
```bash
cd backend
npx prisma generate
npx prisma db push
```

5. **Start the Application**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - User Frontend:**
```bash
cd user-frontend
npm run dev
```

**Terminal 3 - Worker Frontend:**
```bash
cd worker-frontend
npm run dev
```

The applications will be available at:
- Backend API: http://localhost:3000
- User Frontend: http://localhost:3001
- Worker Frontend: http://localhost:3002

## 📊 Database Schema

### Core Models
- **User**: Content creators with wallet addresses and task history
- **Worker**: Evaluators with earnings, statistics, and performance metrics
- **Task**: Evaluation jobs with service type, pricing, and completion status
- **Option**: Individual files/content within tasks
- **Submission**: Worker evaluations linking workers to options
- **TaskResult**: Consensus results with ranked options
- **Payouts**: Payment records for both users and workers

### Key Relationships
- Users create Tasks with multiple Options
- Workers submit Submissions for Task Options
- Consensus algorithm generates TaskResults with OptionResults
- Real-time statistics tracked in SystemStats

## 💰 Pricing Structure

### User Pricing (USD equivalent in SOL)
- **Marketing Images**: $25 (200 reviews) / $50 (500 reviews)
- **YouTube Thumbnails**: $25 (200 reviews) / $50 (500 reviews)
- **Video Content**: $20 (100 reviews) / $50 (300 reviews)

### Worker Rewards (SOL)
- **Images/Thumbnails**: 0.00059 SOL (majority consensus)
- **Videos**: 0.0010 SOL (majority consensus)
- **Ranking System**: 1st place (100%), 2nd place (70%), 3rd place (40%)

## 🔧 API Endpoints

### User Routes (`/v1/user`)
- `POST /signin` - Wallet authentication
- `GET /profile` - User profile and statistics
- `POST /upload` - File upload and task creation
- `GET /task` - Task details and results
- `GET /tasks` - Task history with pagination
- `GET /pricing` - Current pricing information
- `GET /stats` - System statistics

### Worker Routes (`/v1/worker`)
- `POST /signin` - Worker authentication
- `GET /profile` - Worker profile and performance
- `GET /nextTask` - Get next available task
- `POST /submission` - Submit task evaluation
- `GET /balance` - Current earnings and balance
- `POST /payout` - Request withdrawal
- `GET /history` - Submission history
- `GET /stats` - Detailed worker statistics

## 🔄 Consensus Algorithm

The platform uses a sophisticated consensus mechanism:

1. **Task Distribution**: Tasks distributed to workers who haven't evaluated them
2. **Submission Collection**: Workers submit evaluations until threshold reached (80% of required reviews)
3. **Consensus Calculation**: Options ranked by vote count with percentage calculations
4. **Reward Distribution**: 
   - 1st place voters: Full reward
   - 2nd place voters: 70% of full reward
   - 3rd place voters: 40% of full reward
5. **Automatic Processing**: Scheduled job processes completed tasks every 5 minutes

## 🔐 Security Features

- **Wallet Authentication**: Cryptographic signature verification
- **Transaction Verification**: On-chain payment confirmation
- **Session Management**: JWT tokens with expiration
- **Input Validation**: Comprehensive Zod schema validation
- **Rate Limiting**: API endpoint protection
- **CORS Configuration**: Secure cross-origin requests
- **Error Handling**: Comprehensive error logging and user feedback

## 🎨 Design System

### Brand Colors
- **Primary**: Blue (#0ea5e9) - Trust and reliability
- **Secondary**: Purple (#d946ef) - Creativity and innovation
- **Accent**: Orange (#f97316) - Energy and action
- **Success**: Green (#22c55e) - Completion and earnings
- **Warning**: Yellow (#f59e0b) - Attention and progress
- **Error**: Red (#ef4444) - Issues and alerts

### Typography
- **Display**: Poppins (headings and branding)
- **Body**: Inter (content and UI)
- **Mono**: JetBrains Mono (code and addresses)

### Components
- Custom button variants with hover states
- Responsive card layouts with shadows
- Progress bars and loading states
- Modal dialogs and notifications
- Form inputs with validation states

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch Friendly**: Large tap targets and gesture support
- **Performance**: Optimized images and lazy loading
- **Accessibility**: WCAG 2.1 AA compliance

## 🚀 Deployment

### Backend Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy to cloud provider (Heroku, Railway, etc.)

### Frontend Deployment
1. Build applications: `npm run build`
2. Deploy to Vercel, Netlify, or similar
3. Configure environment variables
4. Set up custom domains

### Production Considerations
- Use mainnet Solana RPC endpoints
- Implement proper error monitoring (Sentry)
- Set up SSL certificates
- Configure CDN for static assets
- Implement database backups
- Set up monitoring and alerts

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd user-frontend
npm test

cd worker-frontend
npm test
```

### Manual Testing Checklist
- [ ] Wallet connection and authentication
- [ ] File upload and task creation
- [ ] Payment processing and verification
- [ ] Task evaluation and submission
- [ ] Consensus calculation and rewards
- [ ] Real-time updates and notifications
- [ ] Withdrawal and payout functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow ESLint and Prettier configurations
- Write comprehensive tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure responsive design compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs and feature requests
- **Community**: Join our Discord server for discussions
- **Email**: Contact support@previewer.app for urgent issues

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Core platform functionality
- [x] Solana payment integration
- [x] Basic consensus algorithm
- [x] User and worker interfaces

### Phase 2 (Next)
- [ ] Mobile applications (React Native)
- [ ] Advanced analytics and insights
- [ ] Multi-language support
- [ ] API for third-party integrations

### Phase 3 (Future)
- [ ] AI-powered content analysis
- [ ] NFT integration for premium content
- [ ] Governance token and DAO
- [ ] Cross-chain payment support

## 📈 Analytics

The platform tracks comprehensive metrics:
- User engagement and retention
- Task completion rates and times
- Worker performance and accuracy
- Revenue and payment processing
- System performance and uptime

## 🔧 Troubleshooting

### Common Issues

**Wallet Connection Issues:**
- Ensure wallet extension is installed and unlocked
- Check network settings (devnet vs mainnet)
- Clear browser cache and cookies

**Payment Failures:**
- Verify sufficient SOL balance for transaction fees
- Check transaction signatures on Solana Explorer
- Ensure correct admin wallet address

**File Upload Problems:**
- Check file size limits (50MB max)
- Verify supported file types
- Ensure stable internet connection

**Task Loading Issues:**
- Refresh the page or reconnect wallet
- Check browser console for errors
- Verify backend API connectivity

---

Built with ❤️ by the Previewer team. Empowering creators and workers through blockchain technology.
=======
# previwer
>>>>>>> d7cdd8c242ad05f93d2c42ef3f2430539abb6cca
