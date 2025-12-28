import { users, rooms, messages, type User, type InsertUser, type Room, type InsertRoom, type Message, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { authStorage, type IAuthStorage } from "./replit_integrations/auth/storage";

export interface IStorage extends IAuthStorage {
  // Rooms
  createRoom(room: InsertRoom): Promise<Room>;
  getRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<void>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(roomId: number): Promise<(Message & { user: User })[]>;
  updateRoom(id: number, update: Partial<Room>): Promise<Room>;
}

export class DatabaseStorage implements IStorage {
  // Auth methods (delegated or re-implemented if needed, but we can reuse the mixin pattern or just implement)
  // Since we are using the blueprint's authStorage, we can just use it or implement the methods.
  // Ideally, we extend or compose.
  
  async getUser(id: string): Promise<User | undefined> {
    return authStorage.getUser(id);
  }

  async upsertUser(user: InsertUser): Promise<User> {
    return authStorage.upsertUser(user);
  }

  // Room methods
  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(room).returning();
    return newRoom;
  }

  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms).orderBy(desc(rooms.createdAt));
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async updateRoom(id: number, update: Partial<Room>): Promise<Room> {
    const [updatedRoom] = await db
      .update(rooms)
      .set(update)
      .where(eq(rooms.id, id))
      .returning();
    
    if (!updatedRoom) {
      throw new Error(`Room ${id} not found`);
    }
    return updatedRoom;
  }

  async deleteRoom(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.roomId, id));
    await db.delete(rooms).where(eq(rooms.id, id));
  }

  // Message methods
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessages(roomId: number): Promise<(Message & { user: User })[]> {
    const results = await db
      .select({
        message: messages,
        user: users,
      })
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .leftJoin(users, eq(messages.userId, users.id))
      .orderBy(messages.createdAt);

    // Filter out null users if any (shouldn't happen with proper constraints) and flatten
    return results
      .filter(r => r.user !== null)
      .map(r => ({ ...r.message, user: r.user! }));
  }
}

export const storage = new DatabaseStorage();
