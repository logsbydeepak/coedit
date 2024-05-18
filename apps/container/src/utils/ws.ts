import { createBunWebSocket } from 'hono/bun'
import { BunWebSocketData } from 'hono/dist/types/adapter/bun/websocket'
import { UpgradeWebSocket } from 'hono/ws'

interface BunServerWebSocket<T> {
  send(data: string | ArrayBufferLike, compress?: boolean): void
  close(code?: number, reason?: string): void
  data: T
  readyState: 0 | 1 | 2 | 3
}

interface BunWebSocketHandler<T> {
  open(ws: BunServerWebSocket<T>): void
  close(ws: BunServerWebSocket<T>, code?: number, reason?: string): void
  message(ws: BunServerWebSocket<T>, message: string | Buffer): void
}

interface CreateWebSocket {
  upgradeWebSocket: UpgradeWebSocket
  websocket: BunWebSocketHandler<BunWebSocketData>
}

export const { websocket, upgradeWebSocket } =
  createBunWebSocket() as CreateWebSocket
