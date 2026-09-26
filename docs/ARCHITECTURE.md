# NOVA Gaming Platform Architecture Documentation

## Core Architectural Principle
> **Build the platform once, then make each game a plug-in module.**

Shared services (Authentication, Wallet Ledger, Provably Fair Verification, Admin Dashboard, WebSockets, Audit Logging) are implemented as shared packages in `packages/`.
Every game (`coin-flip`, `dice`, `crash`, `roulette`) lives as an isolated plug-in module inside `games/`.

```
                    PLATFORM
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      Users          Wallet          Games
        │              │              │
        │              │       ┌──────┼──────┐
        │              │       │      │      │
        │              │      Game1  Game2  Game3
        │              │
        └──────────────┴──────────────┘
```

## Monorepo Layout
```text
nova-gaming/
├── apps/
│   ├── web/        -> Player React + Vite + Tailwind CSS frontend
│   ├── admin/      -> Admin React + Vite dashboard
│   └── api/        -> Express + TypeScript + Prisma API
├── games/
│   ├── coin-flip/  -> Coin Flip plug-in module
│   ├── dice/       -> Dice plug-in module
│   ├── crash/      -> Crash plug-in module
│   └── roulette/   -> Roulette plug-in module
├── packages/
│   ├── database/   -> Prisma schema & DB client
│   ├── auth/       -> JWT & Bcrypt auth logic
│   ├── wallet/     -> Ledger transaction calculations
│   ├── fairness/   -> HMAC-SHA256 provably fair engine
│   ├── game-engine/-> Base game engine abstract class
│   ├── validation/ -> Zod schemas
│   ├── types/      -> Shared TypeScript types
│   ├── ui/         -> Shared React Tailwind components
│   ├── config/     -> Shared TSConfig/Tailwind presets
│   └── logger/     -> Logging module
└── infrastructure/ -> Docker, Nginx, Postgres configs
```
