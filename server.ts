import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { authRouter } from './server/routes/authRoutes.js';
import { fdrRouter } from './server/routes/fdrRoutes.js';
import { reviewRouter } from './server/routes/reviewRoutes.js';
import { lifecycleRouter } from './server/routes/lifecycleRoutes.js';
import { documentRouter } from './server/routes/documentRoutes.js';
import { maturityRouter } from './server/routes/maturityRoutes.js';
import { reportRouter } from './server/routes/reportRoutes.js';
import { adminRouter } from './server/routes/adminRoutes.js';
import { runAutomatedTests } from './server/testRunner.js';
import { evaluateMaturityStatuses } from './server/maturityEngine.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Basic security & parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// AICTE Portal Header info middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Run maturity check on startup and periodically (every 10 minutes)
try {
  evaluateMaturityStatuses();
  setInterval(() => {
    evaluateMaturityStatuses();
  }, 10 * 60 * 1000);
} catch (e) {
  console.error('Initial maturity check warning:', e);
}

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/fdr', fdrRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/lifecycle', lifecycleRouter);
app.use('/api/documents', documentRouter);
app.use('/api/maturity', maturityRouter);
app.use('/api/reports', reportRouter);
app.use('/api/admin', adminRouter);

// Automated Test Suite endpoint (Section 11 & 14)
app.get('/api/test-suite/run', (req: Request, res: Response) => {
  const result = runAutomatedTests();
  return res.json(result);
});

// Centralized API Error Handler
app.use('/api', (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[API Error] ${req.method} ${req.url}:`, err.message || err);
  const status = err.status || 500;
  return res.status(status).json({
    error: err.message || 'Internal server processing error. Please contact system administrator.',
  });
});

// Mount Vite in dev or serve dist in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AICTE FDR Management Portal] Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
