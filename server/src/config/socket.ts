import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server | null = null;

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map<string, Set<string>>();

export const getIO = (): Server | null => {
  return io;
};

export const isUserOnline = (userId: string): boolean => {
  const sockets = onlineUsers.get(userId);
  return !!sockets && sockets.size > 0;
};

export const getOnlineUserIds = (): string[] => {
  return Array.from(onlineUsers.entries())
    .filter(([, sockets]) => sockets.size > 0)
    .map(([userId]) => userId);
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
    console.log('Socket connected:', socket.id);

    const handshakeUserId = (socket.handshake.auth?.userId || socket.handshake.query?.userId)?.toString();
    if (handshakeUserId) {
      socket.join(handshakeUserId);
      // Track online status
      if (!onlineUsers.has(handshakeUserId)) {
        onlineUsers.set(handshakeUserId, new Set());
      }
      onlineUsers.get(handshakeUserId)!.add(socket.id);
      // Broadcast online status to all connected clients
      io!.emit('userOnline', { userId: handshakeUserId });
      console.log(`User ${handshakeUserId} is online (${onlineUsers.get(handshakeUserId)!.size} connections)`);
    }

    // Join user's personal room
    socket.on('joinUser', (userId: string) => {
      if (userId && typeof userId === 'string') {
        socket.join(userId);
        // Track online status
        if (!onlineUsers.has(userId)) {
          onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId)!.add(socket.id);
        io!.emit('userOnline', { userId });
        console.log('Socket user room joined:', userId);
      }
    });

    // Join a conversation-specific room
    socket.on('joinConversation', (conversationId: string) => {
      if (conversationId && typeof conversationId === 'string') {
        socket.join(`conv_${conversationId}`);
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Socket joined conversation room: conv_${conversationId}`);
        }
      }
    });

    // Leave a conversation-specific room
    socket.on('leaveConversation', (conversationId: string) => {
      if (conversationId && typeof conversationId === 'string') {
        socket.leave(`conv_${conversationId}`);
      }
    });

    // Legacy order room support
    socket.on('joinOrder', (orderId: string) => {
      if (orderId && typeof orderId === 'string') {
        socket.join(`order_${orderId}`);
        if (process.env.NODE_ENV !== 'production') {
          console.log(`User joined order room: ${orderId}`);
        }
      }
    });

    socket.on('leaveOrder', (orderId: string) => {
      if (orderId && typeof orderId === 'string') {
        socket.leave(`order_${orderId}`);
        if (process.env.NODE_ENV !== 'production') {
          console.log(`User left order room: ${orderId}`);
        }
      }
    });

    // Typing indicators
    socket.on('typing', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      if (conversationId && userId) {
        socket.to(`conv_${conversationId}`).emit('userTyping', { conversationId, userId });
      }
    });

    socket.on('stopTyping', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      if (conversationId && userId) {
        socket.to(`conv_${conversationId}`).emit('userStopTyping', { conversationId, userId });
      }
    });

    // Get online users list (client can request this on connect)
    socket.on('getOnlineUsers', () => {
      socket.emit('onlineUsersList', getOnlineUserIds());
    });

    socket.on('disconnect', () => {
      // Remove from online tracking
      const userId = handshakeUserId;
      if (userId && onlineUsers.has(userId)) {
        onlineUsers.get(userId)!.delete(socket.id);
        if (onlineUsers.get(userId)!.size === 0) {
          onlineUsers.delete(userId);
          io!.emit('userOffline', { userId });
          console.log(`User ${userId} is now offline`);
        }
      }
      if (process.env.NODE_ENV !== 'production') {
        console.log('User disconnected:', socket.id);
      }
    });
  });

  return io;
};
