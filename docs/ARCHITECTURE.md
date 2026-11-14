# NOVA GAMING - Architecture & System Blueprint

Full documentation is available in [PROJECT_DOCUMENTATION.md](file:///home/hope/NOVA-GAME/docs/PROJECT_DOCUMENTATION.md).

## Quick Architecture Summary
- **Frontend Layer**:
  - `apps/web`: Player Web Application (React 18 + Vite + Tailwind CSS + Socket.IO) on Port 3000.
  - `apps/admin`: Risk Management & Payment Approval Dashboard on Port 3001.
- **Backend & Real-time Layer**:
  - `apps/api`: REST API Gateway & continuous WebSocket Crash Loop on Port 5000.
- **Modular Game Plug-ins**:
  - `games/crash`: Aviator continuous exponential rocket flight with real-time multi-player sync.
  - `games/roulette`: European Roulette 37-slot wheel with physics.
  - `games/coin-flip`: 3D interactive coin flip.
  - `games/dice`: High/Low roll slider with dynamic odds.
  - `games/bingo`: Automated bingo caller.
  - `games/mines`: Minefield grid.
- **Core Platform Packages**:
  - `@nova/fairness`: Provably Fair HMAC-SHA256 outcome verification engine.
  - `@nova/database`: Prisma ORM schema & client.
  - `@nova/wallet`: Double-entry ledger logic & deposit verification.
  - `@nova/game-engine`: Abstract BaseGameEngine contract.
  - `@nova/i18n`: Multi-language translations (English, Amharic - አማርኛ, Afaan Oromoo).
  - `@nova/types` & `@nova/ui`: Shared domain types & Tailwind component system.
