import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/database';
import { deleteExpiredPastes } from './models/paste';
import routes from './routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
  });
}

// Initialize database
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized');

    // Routes
    app.use('/', routes);

    // 404 handler for API routes
    app.use('/api/*', (req, res) => {
      res.status(404).json({ error: 'Not found' });
    });

    // Error handling middleware
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Internal server error' });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/healthz`);
      console.log(`🌐 Web interface: http://localhost:${PORT}`);
    });

    // Schedule cleanup of expired pastes every hour
    setInterval(async () => {
      try {
        const deleted = await deleteExpiredPastes();
        console.log('🧹 Cleaned up expired pastes');
      } catch (error) {
        console.error('Error cleaning expired pastes:', error);
      }
    }, 60 * 60 * 1000); // Every hour

    // Initial cleanup
    deleteExpiredPastes().then(() => {
      console.log('🧹 Initial cleanup completed');
    }).catch(console.error);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();
