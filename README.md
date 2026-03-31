# ecommerce-fullstack-design

A full-stack ecommerce app with live catalog browsing, authentication, cart management, checkout, order history, and admin product and order management.

## Stack
- Frontend: Next.js 14, React, TypeScript, CSS Modules
- Backend: Node.js, Express, JWT
- Data: MongoDB with Mongoose

## Folder structure
```txt
ecommerce-fullstack-design/
  client/                  # Next.js frontend
  server/                  # Express backend
```

## Environment setup

Copy the example env files and fill in your own values:

```bash
cp client/.env.example client/.env.local
cp server/.env.example server/.env
```

## Run it

### 1) Backend
```bash
cd server
npm install
npm run seed
npm run dev
```

Backend runs on `http://localhost:5000`

`npm run seed` resets demo orders and loads sample products, users, CMS defaults, and blog/content data for a fresh review-ready database.

### 2) Frontend
Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## Seeded accounts
`npm run seed` creates one admin account and one user account for local testing.

- Set optional environment variables before seeding if you want fixed credentials:
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_USER_EMAIL`
- `SEED_USER_PASSWORD`

If you do not provide seed passwords, the script generates fresh passwords and prints the login details in the terminal after seeding.

## What is included
- Home page with working catalog search entry points
- Product listing with search, category, price, rating, sort, and pagination
- Product details page with inventory-aware add to cart
- Cart page with pricing summary
- Checkout flow that creates orders in MongoDB
- Order history page for customers
- Admin order status management
- Admin product CRUD page
- JWT auth with login, signup, and protected flows
- Responsive layout for desktop and mobile
- Local cart and auth persistence with `localStorage`
- Seed script for sample products, seeded accounts, and CMS defaults

## Notes
- `server/.env` in the current workspace contains live-looking secrets and should be rotated before any public deployment.
- The client scripts were updated to give Next.js more heap space during `dev` and `build`, which helps on memory-constrained machines.
