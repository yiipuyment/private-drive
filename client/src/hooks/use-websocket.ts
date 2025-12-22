import { useEffect, useRef, useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type WebSocketMessage = 
  | { type: "join_room"; roomId: number }
  | { type: "chat_message"; roomId: number; content: string }
  | { type: "video_update"; roomId: number; isPlaying: boolean; timestamp: number; url?: string }
  | { type: "error"; message: string };

export function useWebSocket(roomId: number | null) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  
  // Handlers
  const messageHandlers = useRef<((data: any) => void)[]>([]);

  useEffect(() => {
    if (!roomId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log("Connecting to WS:", wsUrl);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WS Connected");
      setIsConnected(true);
      // Join the specific room upon connection
      ws.send(JSON.stringify({ type: "join_room", roomId }));
    };

    ws.onclose = () => {
      console.log("WS Disconnected");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WS Error:", error);
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        messageHandlers.current.forEach(handler => handler(data));
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [roomId]);

  const sendMessage = useCallback((msg: Omit<WebSocketMessage, "error">) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn("WS not ready, message dropped", msg);
      toast({
        title: "Bağlantı Hatası",
        description: "Sunucu ile bağlantı koptu. Tekrar deneniyor...",
        variant: "destructive",
      });
    }
  }, [toast]);

  const subscribe = useCallback((handler: (data: any) => void) => {
    messageHandlers.current.push(handler);
    return () => {
      messageHandlers.current = messageHandlers.current.filter(h => h !== handler);
    };
  }, []);

  return { sendMessage, subscribe, isConnected };
}
