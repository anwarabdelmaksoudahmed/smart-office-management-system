import { onMounted, onUnmounted, ref } from 'vue';
import { io, type Socket } from 'socket.io-client';

const WS_BASE = import.meta.env.VITE_WS_URL ?? '';

export function useInventorySocket(onAlert?: (payload: unknown) => void) {
  const connected = ref(false);
  let socket: Socket | null = null;

  onMounted(() => {
    socket = io(`${WS_BASE}/inventory`, {
      transports: ['websocket', 'polling'],
    });
    socket.on('connect', () => {
      connected.value = true;
      socket?.emit('join.inventory');
    });
    socket.on('disconnect', () => {
      connected.value = false;
    });
    socket.on('inventory.alert', (payload) => onAlert?.(payload));
  });

  onUnmounted(() => {
    socket?.disconnect();
    socket = null;
  });

  return { connected };
}
