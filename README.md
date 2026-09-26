# 🎰 NOVA Gaming - Modular Multi-Game Platform Architecture

A modern, scalable multi-game platform monorepo built around the core architectural rule:

> **Build the platform once, then make each game a plug-in/module.**

Authentication, wallet ledger, payments, user accounts, provably fair engine, admin analytics, notifications, and security are shared by every game.

---

## 🛠 Tech Stack

- **Frontend (`apps/web`, `apps/admin`)**: React 18, Vite, Tailwind CSS, TanStack Query, Axios, Zustand, React Hook Form, Zod, Lucide Icons.
- **Backend (`apps/api`)**: Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL, Redis, Socket.IO, Zod, Winston Logger.
- **Packages (`packages/*`)**:
  - `@nova/types`: Shared TypeScript interface definitions
  - `@nova/fairness`: Provably Fair HMAC-SHA256 seed & verification engine
  - `@nova/game-engine`: Base abstract game engine class & math helpers
  - `@nova/wallet`: Double-entry ledger logic & balance validation
  - `@nova/validation`: Shared Zod validation schemas
  - `@nova/auth`: Password hashing & JWT token management
  - `@nova/database`: Prisma database schema & ORM client
  - `@nova/ui`: Shared React Tailwind UI components (Button, Card, Input, Badge, Modal)
  - `@nova/logger`: Structured loggers
  - `@nova/config`: TSConfig and Tailwind configuration presets
- **Games (`games/*`)**:
  - `@nova/game-coin-flip`: Coin Flip plug-in game module (UI + Engine)
  - `@nova/game-dice`: Provably Fair Dice plug-in game module (UI + Engine)
  - `@nova/game-crash`: Crash Rocket multiplier game module (UI + Engine)
  - `@nova/game-roulette`: European Roulette 37-slot game module (UI + Engine)
- **Infrastructure (`infrastructure/*`)**: Dockerfiles, Docker Compose, Nginx Reverse Proxy, PostgreSQL setup.

---

## 📂 Monorepo Structure

```text
nova-gaming/
├── apps/
│   ├── web/        # Player web application (Port 3000)
│   ├── admin/      # Administrator dashboard (Port 3001)
│   └── api/        # REST & WebSocket API backend (Port 5000)
├── games/
│   ├── coin-flip/  # Coin Flip plug-in module
│   ├── dice/       # Dice plug-in module
│   ├── crash/      # Crash Rocket plug-in module
│   └── roulette/   # European Roulette plug-in module
├── packages/
│   ├── database/   # Prisma database schema & exports
│   ├── auth/       # JWT & password security
│   ├── wallet/     # Ledger logic
│   ├── fairness/   # HMAC-SHA256 Provably Fair engine
│   ├── game-engine/# Abstract GameEngine contract
│   ├── validation/ # Zod schemas
│   ├── types/      # Shared TypeScript types
│   ├── ui/         # Shared Tailwind UI components
│   ├── config/     # Shared configs
│   └── logger/     # Logger module
├── infrastructure/
│   ├── docker/     # Dockerfiles for api, web, admin
│   ├── nginx/      # Nginx reverse proxy configuration
│   └── postgres/   # Postgres init scripts
├── docs/           # Architecture & Provably Fair documentation
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Generate Database Client & Seed
```bash
pnpm db:generate
```

### 4. Run Development Servers
```bash
pnpm dev
```

---

## 🐳 Docker Deployment

Start all platform services (Postgres, Redis, API, Player Web, Admin Web) with Docker Compose:

```bash
docker-compose up -d --build
```

---

## 🔐 Provably Fair Engine

Every bet evaluated by any game plug-in follows standard HMAC-SHA256 cryptography:

$$\text{HMAC-SHA256}(\text{serverSeed}, \text{clientSeed} : \text{nonce})$$

Players can inspect and verify past seeds at any time via the `/history` audit page.