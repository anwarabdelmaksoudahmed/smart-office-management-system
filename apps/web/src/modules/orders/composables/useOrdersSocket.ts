import { onMounted, onUnmounted, ref } from 'vue';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/modules/auth/stores/auth.store';

const WS_BASE = import.meta.env.VITE_WS_URL ?? '';

export function useOrdersSocket(options?: {
  asBarista?: boolean;
  onEvent?: (event: string, payload: unknown) => void;
}) {
  const connected = ref(false);
  let socket: Socket | null = null;

  onMounted(() => {
    // Skip socket on hosts that only serve HTTP serverless (no Engine.IO upgrade)
    if (typeof window !== 'undefined' && !WS_BASE) {
      const host = window.location.hostname;
      if (host.endsWith('.vercel.app')) {
        return;
      }
    }

    const auth = useAuthStore();
    socket = io(`${WS_BASE}/orders`, {
      // Prefer polling first — works better behind proxies; websocket may 200-fail on Vercel
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnectionAttempts: 3,
      timeout: 8000,
    });

    socket.on('connect', () => {
      connected.value = true;
      if (options?.asBarista) {
        socket?.emit('join.barista');
      }
      if (auth.user?.id) {
        socket?.emit('join.user', { userId: auth.user.id });
      }
    });

    socket.on('disconnect', () => {
      connected.value = false;
    });

    socket.on('connect_error', () => {
      connected.value = false;
    });

    const events = ['order.created', 'order.updated', 'order.ready'] as const;
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
