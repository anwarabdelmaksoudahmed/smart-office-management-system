import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { InventoryAlert } from '../modules/inventory/types/inventory.types';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/inventory',
})
export class InventoryGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(InventoryGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket): void {
    this.logger.debug(`Inventory socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Inventory socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('join.inventory')
  joinInventory(@ConnectedSocket() client: Socket) {
    void client.join('role:inventory');
    return { joined: 'role:inventory' };
  }

  emitAlert(alert: InventoryAlert): void {
    this.server.to('role:inventory').emit('inventory.alert', alert);
  }
}
