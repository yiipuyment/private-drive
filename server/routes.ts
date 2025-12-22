import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // === Room Routes ===
  app.get(api.rooms.list.path, async (req, res) => {
    const rooms = await storage.getRooms();
    res.json(rooms);
  });

  app.post(api.rooms.create.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Giriş yapmalısınız" });
    }
    const user = req.user as any;
    try {
      const input = api.rooms.create.input.parse(req.body);
      // Force hostId from session
      const room = await storage.createRoom({ ...input, hostId: user.claims.sub });
      res.status(201).json(room);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Sunucu hatası" });
    }
  });

  app.get(api.rooms.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const room = await storage.getRoom(id);
    if (!room) {
      return res.status(404).json({ message: "Oda bulunamadı" });
    }
    res.json(room);
  });

  app.get(api.rooms.getMessages.path, async (req, res) => {
    const id = Number(req.params.id);
    const messages = await storage.getMessages(id);
    res.json(messages);
  });

  // === Seeding ===
  const existingRooms = await storage.getRooms();
  if (existingRooms.length === 0) {
    try {
      const systemUser = await authStorage.upsertUser({
        id: "system",
        email: "system@video.party",
        firstName: "Sistem",
        lastName: "Admin",
        profileImageUrl: "",
      });
      
      await storage.createRoom({
        name: "Müzik Odası (Lofi)",
        hostId: systemUser.id,
        currentVideoUrl: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        isPlaying: true,
      });
      
      await storage.createRoom({
        name: "Eğlence Odası",
        hostId: systemUser.id,
        currentVideoUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
        isPlaying: false,
      });
      console.log("Database seeded!");
    } catch (e) {
      console.error("Seeding error:", e);
    }
  }

  // === WebSocket Server ===
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    if (request.url?.startsWith("/ws")) {
      // TODO: Handle auth in upgrade if strictly needed, 
      // but for now we'll handle identity via message payload or just let it be open for the room
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  const clients = new Map<WebSocket, { roomId: number }>();

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection");

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === "join") {
          const roomId = message.roomId;
          clients.set(ws, { roomId });
          console.log(`Client joined room ${roomId}`);
        } else if (message.type === "video-update") {
          const { roomId, ...videoState } = message; // playing, time, url
          // Broadcast to others in the same room
          for (const [client, metadata] of clients.entries()) {
            if (client !== ws && client.readyState === WebSocket.OPEN && metadata.roomId === roomId) {
              client.send(JSON.stringify({ type: "video-update", ...videoState }));
            }
          }
        } else if (message.type === "chat-message") {
          const { roomId, content, userId } = message;
          // Save to DB
          const savedMessage = await storage.createMessage({
            roomId,
            userId,
            content,
          });
          
          // Get user details for the broadcast
          const user = await storage.getUser(userId);
          
          // Broadcast
          const broadcastMsg = JSON.stringify({
            type: "chat-message",
            message: { ...savedMessage, user },
          });
          
          for (const [client, metadata] of clients.entries()) {
            if (client.readyState === WebSocket.OPEN && metadata.roomId === roomId) {
              client.send(broadcastMsg);
            }
          }
        }
      } catch (e) {
        console.error("WebSocket message error:", e);
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  return httpServer;
}
