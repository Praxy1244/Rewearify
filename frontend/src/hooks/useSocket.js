import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useSocket = (onNotification) => {
  const socketRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      // Clean up connection if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 4,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected');
      // Immediately join user room for targeted notifications
      socket.emit('authenticate', {
        userId: user._id || user.id,
        role: user.role,
      });
    });

    socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
    });
    socket.on('disconnect', reason => {
      console.log('🔌 Socket.IO disconnected:', reason);
    });
    socket.on('notification', (notification) => {
      if (onNotification) onNotification(notification);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, onNotification]);

  const joinRoom = useCallback((roomName) => {
    socketRef.current?.emit('join-room', roomName);
  }, []);
  const leaveRoom = useCallback((roomName) => {
    socketRef.current?.emit('leave-room', roomName);
  }, []);

  return {
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    isConnected: socketRef.current?.connected || false,
  };
};
