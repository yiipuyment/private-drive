import { z } from 'zod';
import { insertRoomSchema, rooms, messages } from './schema';

export const api = {
  rooms: {
    list: {
      method: 'GET' as const,
      path: '/api/rooms',
      responses: {
        200: z.array(z.custom<typeof rooms.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/rooms',
      input: insertRoomSchema,
      responses: {
        201: z.custom<typeof rooms.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/rooms/:id',
      responses: {
        200: z.custom<typeof rooms.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
    getMessages: {
      method: 'GET' as const,
      path: '/api/rooms/:id/messages',
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect & { user: { id: string, email: string } }>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
