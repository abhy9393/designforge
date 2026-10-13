# DesignForge

DesignForge is a low-level design (LLD) practice MVP for the CipherSchools assignment. Learners can browse prompts, edit and save class-based designs, submit designs for deterministic feedback, and revisit drafts and reports through attempt history.

## Features in this implementation

- Registration, login, logout, cookie-based authentication, and protected application routes.
- Three sample challenges: Parking Lot, Elevator, and Vending Machine.
- A practice workspace for classes, responsibilities, attributes, methods, parameters, interfaces, relationships, and design notes.
- User-scoped draft and submission history. Drafts remain editable; submissions have their own saved design and evaluation report.
- A rule-based evaluator that reports a score, structural criteria, observed strengths, and recommendations. It is deterministic and does not call an LLM.
- MongoDB persistence when configured, with an in-memory development fallback.

The score and feedback are structural heuristics, not a substitute for expert review. The dashboard currently has limited aggregate/progress behavior; see [docs/design-note.md](./docs/design-note.md#limitations-and-trade-offs).

## Requirements

- Node.js and npm compatible with the versions required by the installed Vite, TypeScript, and package manifests.
- MongoDB is optional for an in-memory local demo. MongoDB is required if local data must persist across backend restarts.

## Setup and run

From the repository root:

```powershell
npm install
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
npm run dev
```

Open `http://localhost:5173`. The backend listens on the port configured by `PORT` (the sample is 5001).

To use MongoDB, set `MONGO_URI` in `backend/.env` to a database dedicated to this local application. Do not commit `.env` files. If `MONGO_URI` is empty, the backend uses memory and data is lost when it restarts. The frontend API URL is controlled by `VITE_API_URL`.

Environment variable names used by the application/templates: `PORT`, `NODE_ENV`, `CLIENT_ORIGIN`, `FRONTEND_URL`, `MONGO_URI`, `JWT_SECRET`, `COOKIE_NAME`, `CSRF_COOKIE_NAME`, `AI_API_KEY`, `AI_PROVIDER`, `AI_MODEL`, `VITE_API_URL`, and `VITE_APP_NAME`. AI variables are not needed for the current rule-based evaluator.

## Verified package commands

Run from the repository root:

```powershell
npm run dev
npm run build
npm test
```

`npm test` runs the backend API, evaluator, evaluation-persistence, and Mongo-target-safety tests. Routine API tests explicitly use in-memory persistence.

The MongoDB integration test is deliberately separate:

```powershell
$env:DESIGNFORGE_TEST_MONGO_URI = "mongodb://127.0.0.1:27017/designforge_test_local"
npm run test:mongo
```

Use only a disposable database whose name starts with `designforge_test_`. Before connecting, the test verifies that this variable is present, the database name is explicitly test-designated, and the target differs from the configured application database. Never point it at the application database. Unset the variable after use with `Remove-Item Env:DESIGNFORGE_TEST_MONGO_URI`.

## Repository layout

- `frontend/`: React, Vite, route pages, components, and browser-side API client.
- `backend/`: Express routes, Zod validation, services, Mongoose models, and tests.
- `docs/`: assignment research and design notes.
- `AI_USAGE.md`: AI-assisted decision disclosure and items requiring author confirmation.

## Limitations

- Without MongoDB, accounts, attempts, and reports are process-local and do not survive restart.
- The evaluation is rule-based and cannot reliably infer every equivalent domain model, trade-off, or nuanced design pattern.
- There is no external AI evaluation call, production deployment configuration, or full analytics/progress dashboard.
- MongoDB test isolation checks the configured URI target string; operators must still provision and protect a genuinely disposable test database.
