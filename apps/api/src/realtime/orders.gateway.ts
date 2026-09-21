import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export const ORDERS_EVENTS = {
  CREATED: 'order.created',
  UPDATED: 'order.updated',
  READY: 'order.ready',
} as const;

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/orders',
})
export class OrdersGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(OrdersGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket): void {
    this.logger.debug(`Orders socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Orders socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('join.barista')
  joinBarista(@ConnectedSocket() client: Socket) {
    void client.join('role:barista');
    return { joined: 'role:barista' };
  }

  @SubscribeMessage('join.user')
  joinUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { userId: string },
  ) {
    if (!body?.userId) return { error: 'userId required' };
    void client.join(`user:${body.userId}`);
    return { joined: `user:${body.userId}` };
  }

  emitOrderCreated(order: { id: string; userId: string; status: string }) {
    this.server.to('role:barista').emit(ORDERS_EVENTS.CREATED, order);
    this.server.to(`user:${order.userId}`).emit(ORDERS_EVENTS.CREATED, order);
  }

  emitOrderUpdated(order: { id: string; userId: string; status: string }) {
    this.server.to('role:barista').emit(ORDERS_EVENTS.UPDATED, order);
    this.server.to(`user:${order.userId}`).emit(ORDERS_EVENTS.UPDATED, order);
  }

  emitOrderReady(order: { id: string; userId: string; number: string }) {
    this.server.to('role:barista').emit(ORDERS_EVENTS.READY, order);
    this.server.to(`user:${order.userId}`).emit(ORDERS_EVENTS.READY, order);
  }
}
