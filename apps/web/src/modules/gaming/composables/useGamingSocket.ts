import { onMounted, onUnmounted, ref } from 'vue';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/modules/auth/stores/auth.store';

const WS_BASE = import.meta.env.VITE_WS_URL ?? '';

export function useGamingSocket(options?: {
  asSupervisor?: boolean;
  roomId?: string;
  onEvent?: (event: string, payload: unknown) => void;
}) {
  const connected = ref(false);
  let socket: Socket | null = null;

  onMounted(() => {
    const auth = useAuthStore();
    socket = io(`${WS_BASE}/gaming`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      connected.value = true;
      if (options?.asSupervisor) {
        socket?.emit('join.supervisor');
      }
      if (options?.roomId) {
        socket?.emit('join.room', { roomId: options.roomId });
      }
      if (auth.user?.id) {
        socket?.emit('join.user', { userId: auth.user.id });
      }
    });

    socket.on('disconnect', () => {
      connected.value = false;
    });

    const events = ['reservation.updated', 'queue.updated'] as const;
    for (const event of events) {
      socket.on(event, (payload) => options?.onEvent?.(event, payload));
    }
  });

  onUnmounted(() => {
    socket?.disconnect();
    socket = null;
  });

  return { connected };
}
