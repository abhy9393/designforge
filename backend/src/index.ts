import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import { pathToFileURL } from 'node:url';
import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';
import { authRouter } from './routes/authRoutes.js';
import { problemRouter } from './routes/problemRoutes.js';
import { attemptRouter } from './routes/attemptRoutes.js';
import { userRouter } from './routes/userRoutes.js';
import { dashboardRouter } from './routes/dashboardRoutes.js';
import { healthRouter } from './routes/healthRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { ensureSeededProblems } from './services/problemService.js';
import { ensureRepeatSubmissionIndex } from './services/attemptService.js';

const app = express();

const allowedOrigins = new Set(env.ALLOWED_ORIGINS);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
);
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use(csrf({ cookie: true }));
app.use((req, _res, next) => {
  app.locals.csrfToken = req.csrfToken();
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'DesignForge API', time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/problems', problemRouter);
app.use('/api/attempts', attemptRouter);
app.use('/api/users', userRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/healthz', healthRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export async function start() {
  await connectDatabase();
  await ensureRepeatSubmissionIndex();
  await ensureSeededProblems();
  return app.listen(env.PORT, () => {
    console.log(`DesignForge API listening on http://localhost:${env.PORT}`);
  });
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  start().catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });
}

export { app };
