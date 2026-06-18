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
- Daily task system — 5 tasks/day, earn your daily quota
- Referral program — 30% one-time commission on referred user's first investment
- Wallet management — deposits, withdrawals, transaction history
- Admin dashboard — manage users, products, deposits, withdrawals, settings
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

## Project Structure

```
├── api/                  # Vercel serverless entry
├── backend/
│   ├── config/           # DB connection
│   ├── controllers/      # Route handlers
│   ├── cron/             # Scheduled tasks & earnings
│   ├── database/         # Seed script
│   ├── middleware/       # Auth, sanitize, rate limiting
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routes
│   └── utils/            # Helpers, audit logger
├── components/           # React components
│   ├── layout/           # Dashboard/admin layouts
│   └── shared/           # Reusable UI components
├── lib/                  # API client (Axios)
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
