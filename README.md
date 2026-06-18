# EarnersMatter

A Nigerian investment platform built with Next.js, Express, and MongoDB — featuring daily earning tasks, referral commissions, and curated investment products.

## Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS, Recharts
- **Backend:** Express.js, Mongoose, JWT auth
- **Database:** MongoDB
- **Deployment:** Vercel (frontend), dedicated VPS (backend — planned)

## Features

- User registration with ₦1,000 welcome bonus
- Investment products with daily earnings (15% per day, 30-day cycles)
- Daily task system — 5 tasks/day, uses admin's default ad link
- Auto-logout after 15 minutes of inactivity
- Referral program — 30% one-time commission on referred user's first investment
- Wallet management — deposits, withdrawals, transaction history
- Admin dashboard — manage users, products, deposits, withdrawals, settings
- Admin task management — create, edit, delete tasks; reset today's tasks (reverts user balances)
- Admin withdrawal revert — revert single or bulk withdrawals
- Leaderboard — top investors & weekly growers
- Withdrawal system with bank account management

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Cloudinary account (for payment proof uploads — optional)

### Environment Variables

Create a `.env` file in the root:

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=EarnersMatter
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset
UPLOAD_DIR=./tmp/uploads
```

### Install & Run

```bash
# Install dependencies
npm install

# Seed the database with defaults
npm run seed

# Start backend (port 5000)
npm run backend

# Start frontend (port 3000) in another terminal
npm run dev
```

### Default Admin

- Email: `admin@earnersmatter.com`
- Password: `Admin@12345`

### Product Prices (Seeded)

| Product | Price | Daily Earnings |
|---------|-------|---------------|
| iPhone 14 Pro Max | ₦3,000 | ₦450 (15%) |
| iPhone 13 Pro Max | ₦4,000 | ₦600 (15%) |
| iPhone 12 Pro Max | ₦5,000 | ₦750 (15%) |
| Samsung Galaxy S24 | ₦3,000 | ₦450 (15%) |
| Samsung Galaxy S23 | ₦4,000 | ₦600 (15%) |
| MacBook Pro M3 | ₦7,000 | ₦1,050 (15%) |
| PS5 | ₦5,000 | ₦750 (15%) |
| Apple Watch | ₦3,000 | ₦450 (15%) |
| iPhone 7 | ₦4,000 | ₦600 (15%) |
| iPhone 8 | ₦8,000 | ₦1,200 (15%) |

## Project Structure

```
├── api/                  # Vercel serverless entry
├── backend/
│   ├── config/           # DB connection
│   ├── controllers/      # Route handlers
│   │   └── admin/        # Admin-only controllers
│   ├── cron/             # Scheduled tasks & earnings
│   ├── database/         # Seed script
│   ├── middleware/       # Auth, sanitize, rate limiting
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routes
│   │   └── admin/        # Admin-only routes
│   └── utils/            # Helpers, audit logger
├── components/           # React components
│   ├── layout/           # Dashboard/admin layouts
│   └── shared/           # Reusable UI components
├── context/              # React context providers (AuthContext with auto-logout)
├── pages/                # Next.js pages
│   ├── admin/            # Admin panel pages
│   └── user/             # User dashboard pages
└── public/               # Static assets
```

## API Endpoints

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Register, login, profile |
| `/api/dashboard` | User dashboard stats |
| `/api/wallet` | Wallet balance |
| `/api/deposits` | Deposit management |
| `/api/withdrawals` | Withdrawal requests |
| `/api/investments` | Investment products & purchases |
| `/api/tasks` | Daily task system |
| `/api/earnings` | Earnings history |
| `/api/referrals` | Referral info |
| `/api/leaderboard` | Top investors |
| `/api/settings` | Public settings (deposit, withdrawal, contact) |
| `/api/admin` | Admin management APIs |
| `/api/admin/tasks/reset` | Reset today's tasks (reverts user balances) |
| `/api/admin/withdrawals/:id/revert` | Revert a single withdrawal |
| `/api/admin/withdrawals/revert-all` | Revert all withdrawals by status |
