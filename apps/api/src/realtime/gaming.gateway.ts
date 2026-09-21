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

export const GAMING_EVENTS = {
  RESERVATION_UPDATED: 'reservation.updated',
  QUEUE_UPDATED: 'queue.updated',
  SESSION_TICK: 'session.tick',
} as const;

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/gaming',
})
export class GamingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(GamingGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket): void {
    this.logger.debug(`Gaming socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Gaming socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('join.supervisor')
  joinSupervisor(@ConnectedSocket() client: Socket) {
    void client.join('role:gaming');
    return { joined: 'role:gaming' };
  }

  @SubscribeMessage('join.room')
  joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    if (!body?.roomId) return { error: 'roomId required' };
    void client.join(`gaming:room:${body.roomId}`);
    return { joined: `gaming:room:${body.roomId}` };
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

  emitReservationUpdated(booking: {
    id: string;
    userId: string;
    roomId: string;
    status: string;
  }) {
    this.server
      .to('role:gaming')
      .emit(GAMING_EVENTS.RESERVATION_UPDATED, booking);
    this.server
      .to(`user:${booking.userId}`)
      .emit(GAMING_EVENTS.RESERVATION_UPDATED, booking);
    this.server
      .to(`gaming:room:${booking.roomId}`)
      .emit(GAMING_EVENTS.RESERVATION_UPDATED, booking);
  }

  emitQueueUpdated(roomId: string, entries: unknown[]) {
    const payload = { roomId, entries };
    this.server.to('role:gaming').emit(GAMING_EVENTS.QUEUE_UPDATED, payload);
    this.server
      .to(`gaming:room:${roomId}`)
      .emit(GAMING_EVENTS.QUEUE_UPDATED, payload);
  }
}
