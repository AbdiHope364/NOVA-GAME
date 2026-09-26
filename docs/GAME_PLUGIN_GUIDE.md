# How to Create a New Game Plug-in

Creating a new game on NOVA Gaming requires 3 simple steps:

## Step 1: Create a new directory in `games/`
Create `games/your-game` with `package.json`, `tsconfig.json`, and `src/`.

## Step 2: Extend `BaseGameEngine`
```typescript
import { BaseGameEngine } from '@nova/game-engine';
import { ProvablyFair } from '@nova/fairness';

export class YourGameEngine extends BaseGameEngine<Params, Outcome> {
  protected validateParams(params: Params) { ... }
  public evaluate(input: GameExecutionInput<Params>) { ... }
}
```

## Step 3: Register in API & Web App
1. Register engine in `apps/api/src/services/game.service.ts`.
2. Export React UI component from `games/your-game` and add route in `apps/web/src/routes/AppRoutes.tsx`.
