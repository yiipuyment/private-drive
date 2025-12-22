import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertRoom } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function useRooms() {
  return useQuery({
    queryKey: [api.rooms.list.path],
    queryFn: async () => {
      const res = await fetch(api.rooms.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Odalar yüklenemedi");
      return api.rooms.list.responses[200].parse(await res.json());
    },
  });
}

export function useRoom(id: number) {
  return useQuery({
    queryKey: [api.rooms.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.rooms.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Oda bilgisi alınamadı");
      return api.rooms.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useRoomMessages(roomId: number) {
  return useQuery({
    queryKey: [api.rooms.getMessages.path, roomId],
    queryFn: async () => {
      const url = buildUrl(api.rooms.getMessages.path, { id: roomId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Mesajlar yüklenemedi");
      return api.rooms.getMessages.responses[200].parse(await res.json());
    },
    enabled: !!roomId,
    refetchInterval: 3000, // Fallback pooling in case WS misses something, though WS should drive this
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (data: InsertRoom) => {
      const res = await fetch(api.rooms.create.path, {
        method: api.rooms.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Oda oluşturulamadı");
      }
      
      return api.rooms.create.responses[201].parse(await res.json());
    },
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: [api.rooms.list.path] });
      toast({
        title: "Oda Oluşturuldu! 🎉",
        description: `${room.name} odasına yönlendiriliyorsunuz.`,
      });
      setLocation(`/room/${room.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
