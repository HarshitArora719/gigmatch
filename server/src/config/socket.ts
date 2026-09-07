import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server | null = null;

export const getIO = (): Server | null => {
  return io;
};

export const initializeSocket = (server: HttpServer) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];

  if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL.trim());
  }
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL.trim());
  }

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.some(o => origin.startsWith(o) || o.startsWith(origin)) || origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        callback(null, true);
      },
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('User connected:', socket.id);
    }

    socket.on('joinOrder', (orderId: string) => {
      if (orderId && typeof orderId === 'string') {
        socket.join(`order_${orderId}`);
        if (process.env.NODE_ENV !== 'production') {
          console.log(`User joined order room: ${orderId}`);
        }
      }
    });

    socket.on('disconnect', () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('User disconnected:', socket.id);
      }
    });
  });

  return io;
};
