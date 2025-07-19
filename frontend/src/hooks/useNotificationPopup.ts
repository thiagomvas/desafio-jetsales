import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface NotificationData {
  userId: number;
  taskId: number;
  title: string;
  dueDate: string;
}

export function useNotificationPopup(userId: string) {
  useEffect(() => {
    if (!userId) return;

    const socket: Socket = io('http://localhost:3000', {
      query: { userId },
    });

    // Request notification permission once
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    socket.on('notification', (data: NotificationData) => {
      console.log('Notification received:', data);

      if (Notification.permission === 'granted') {
        new Notification('Task Reminder', {
          body: `${data.title} is due at ${new Date(data.dueDate).toLocaleString()}`,
          // icon: '/path/to/icon.png', // optional
        });
      } else {
        alert(`Task Reminder: ${data.title} due at ${new Date(data.dueDate).toLocaleString()}`);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);
}
