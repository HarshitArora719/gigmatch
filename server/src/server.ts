import app from './app';
import { connectDB } from './config/db';
import { initializeSocket } from './config/socket';
import http from 'http';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    const httpServer = http.createServer(app);
    initializeSocket(httpServer);   // ← Add this

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();