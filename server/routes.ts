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

  // === Proxy Route for Streaming Sites ===
  app.get("/api/proxy", async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) {
        return res.status(400).json({ message: "URL gerekli" });
      }

      // Validate URL
      try {
        new URL(targetUrl);
      } catch {
        return res.status(400).json({ message: "Geçersiz URL" });
      }

      // Fetch content from target URL
      const response = await fetch(targetUrl as string, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://www.google.com/",
        },
      });

      // Get content as buffer
      const buffer = await response.arrayBuffer();

      // Set response headers to allow embedding
      res.set({
        "Content-Type": response.headers.get("content-type") || "text/html; charset=utf-8",
        "X-Frame-Options": "ALLOWALL",
        "Access-Control-Allow-Origin": "*",
      });

      // Send response
      res.send(Buffer.from(buffer));
    } catch (err) {
      console.error("Proxy error:", err);
      res.status(500).json({ message: "Video yüklenemedi" });
    }
  });

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

  app.delete(api.rooms.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Giriş yapmalısınız" });
    }
    const user = req.user as any;
    const id = Number(req.params.id);
    const room = await storage.getRoom(id);
    
    if (!room) {
      return res.status(404).json({ message: "Oda bulunamadı" });
    }
    
    if (room.hostId !== user.claims.sub) {
      return res.status(403).json({ message: "Sadece oda sahibi kapatabilir" });
    }
    
    await storage.deleteRoom(id);
    res.status(200).json({ message: "Oda kapatıldı" });
  });

  // === Seeding ===
  const existingRooms = await storage.getRooms();
  if (existingRooms.length === 0) {
    try {
      const systemUser = await storage.upsertUser({
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

  const clients = new Map<WebSocket, { roomId: number; userId?: string; userName?: string }>();

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection");

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === "join_room") {
          const { roomId, userId, userName } = message;
          clients.set(ws, { roomId, userId, userName });
          console.log(`Client ${userId} joined room ${roomId}`);
          
          // Broadcast user_joined to others in same room
          for (const [client, metadata] of clients.entries()) {
            if (client !== ws && client.readyState === WebSocket.OPEN && metadata.roomId === roomId) {
              client.send(JSON.stringify({
                type: "user_joined",
                userName: userName || "Anonim",
                userId
              }));
            }
          }
        } else if (message.type === "video-update") {
          const { roomId, ...videoState } = message; // playing, time, url
          // Broadcast to others in the same room
          for (const [client, metadata] of clients.entries()) {
            if (client !== ws && client.readyState === WebSocket.OPEN && metadata.roomId === roomId) {
              client.send(JSON.stringify({ type: "video-update", ...videoState }));
            }
          }
        } else if (message.type === "chat_message") {
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
            type: "chat_message",
            content: savedMessage.content,
            userId: savedMessage.userId,
            createdAt: savedMessage.createdAt,
            user: user ? { id: user.id, email: user.email } : null,
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
      const clientMeta = clients.get(ws);
      if (clientMeta) {
        const { roomId, userId, userName } = clientMeta;
        clients.delete(ws);
        
        // Broadcast user_left to others in same room
        for (const [client, metadata] of clients.entries()) {
          if (client.readyState === WebSocket.OPEN && metadata.roomId === roomId) {
            client.send(JSON.stringify({
              type: "user_left",
              userName: userName || "Anonim",
              userId
            }));
          }
        }
      }
    });
  });

  return httpServer;
}
