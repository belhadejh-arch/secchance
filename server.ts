import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDb } from './server/db';
import authRoutes from './server/routes/authRoutes';
import caseRoutes from './server/routes/caseRoutes';
import appointmentRoutes from './server/routes/appointmentRoutes';
import specialistRoutes from './server/routes/specialistRoutes';
import messageRoutes from './server/routes/messageRoutes';
import notificationRoutes from './server/routes/notificationRoutes';
import reportRoutes from './server/routes/reportRoutes';
import adminRoutes from './server/routes/adminRoutes';
import aiRoutes from './server/routes/aiRoutes';
import publicRoutes from './server/routes/publicRoutes';
import awarenessRoutes from './server/routes/awarenessRoutes';
import serviceRoutes, { providersRouter, requestsRouter, paymentsRouter } from './server/routes/serviceRoutes';

async function startServer() {
  // Initialize Database Schema & Seeders
  await getDb();
  console.log('✅ PostgreSQL database initialized and seeded successfully.');

  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(origin => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    const normalizedRequestOrigin = requestOrigin?.replace(/\/+$/, '');
    if (
      normalizedRequestOrigin &&
      (allowedOrigins.length === 0 || allowedOrigins.includes(normalizedRequestOrigin))
    ) {
      res.setHeader('Access-Control-Allow-Origin', normalizedRequestOrigin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Body parsers
  app.use(express.json({
    limit: '15mb',
    verify: (req, _res, buffer) => {
      (req as any).rawBody = Buffer.from(buffer);
    },
  }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      platform: 'Second Chance Platform (SCP) — منصة الفرصة الثانية',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Mount REST API v1 Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/cases', caseRoutes);
  app.use('/api/v1/appointments', appointmentRoutes);
  app.use('/api/v1/specialists', specialistRoutes);
  app.use('/api/v1/conversations', messageRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/ai', aiRoutes);
  app.use('/api/v1/public', publicRoutes);
  app.use('/api/v1/awareness', awarenessRoutes);
  app.use('/api/v1/services', serviceRoutes);
  app.use('/api/v1/providers', providersRouter);
  app.use('/api/v1/requests', requestsRouter);
  app.use('/api/v1/payments', paymentsRouter);

  // Vite Middleware for SPA Frontend
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Second Chance Platform server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
