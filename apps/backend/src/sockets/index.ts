import { Server } from 'socket.io';
import type http from 'http';
import { ENV } from '../config/env.js';

export function attachSockets(server: http.Server) {
  const io = new Server(server, {
    cors: { origin: ENV.CLIENT_ORIGIN, credentials: true }
  });
  // No custom events yet
  return io;
}
