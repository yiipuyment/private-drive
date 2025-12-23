import { useEffect, useState, useRef } from "react";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useRoom, useRoomMessages, useDeleteRoom } from "@/hooks/use-rooms";
import { useWebSocket } from "@/hooks/use-websocket";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import ReactPlayer from "react-player";
import { Send, Play, Pause, Link as LinkIcon, AlertCircle, Loader2, Share2, Trash2, Copy, Check, Volume2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { format } from "date-fns";

// Helper to extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\n\s]+)/,
    /youtube\.com\/embed\/([^?\n\s]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Helper to create iframe embed for YouTube
function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&modestbranding=1`;
}

// Helper to get Vimeo video ID
function getVimeoVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/groups\/[^/]+\/videos\/(\d+)/,
    /^\d+$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Helper to get Vimeo embed URL
function getVimeoEmbedUrl(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}`;
}

// Helper to check if URL is a video file
function isVideoFile(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.mkv', '.avi'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
}

// Helper to get Twitch channel/clip ID
function getTwitchId(url: string): { type: 'channel' | 'video' | 'clip', id: string } | null {
  if (!url) return null;
  
  const patterns = [
    { regex: /twitch\.tv\/([a-zA-Z0-9_]+)(?:\/|$)/, type: 'channel' as const },
    { regex: /twitch\.tv\/videos\/(\d+)/, type: 'video' as const },
    { regex: /clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/, type: 'clip' as const },
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern.regex);
    if (match) {
      return { type: pattern.type, id: match[1] };
    }
  }
  return null;
}

// Helper to create Twitch embed URL
function getTwitchEmbedUrl(id: string, type: 'channel' | 'video' | 'clip'): string {
  const baseUrl = 'https://embed.twitch.tv';
  
  if (type === 'channel') {
    return `${baseUrl}?channel=${id}&parent=${window.location.hostname}`;
  } else if (type === 'video') {
    return `${baseUrl}?video=${id}&parent=${window.location.hostname}`;
  } else {
    return `${baseUrl}?clip=${id}&parent=${window.location.hostname}`;
  }
}

// Helper to get DailyMotion video ID
function getDailyMotionId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /dailymotion\.com\/video\/([a-zA-Z0-9_-]+)/,
    /dai\.ly\/([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]+)$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Helper to create DailyMotion embed URL
function getDailyMotionEmbedUrl(videoId: string): string {
  return `https://www.dailymotion.com/embed/video/${videoId}`;
}

export default function Room() {
  const [, params] = useRoute("/room/:id");
  const roomId = params ? parseInt(params.id) : null;
  const { user, isLoading: authLoading } = useAuth();
  const { data: room, isLoading: roomLoading } = useRoom(roomId || 0);
  const { data: initialMessages } = useRoomMessages(roomId || 0);
  const deleteRoom = useDeleteRoom();
  const { toast } = useToast();

  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [copied, setCopied] = useState(false);

  // Player state
  const playerRef = useRef<ReactPlayer>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // Anti-loop ref: prevent emitting events when update came from socket
  const isRemoteUpdate = useRef(false);
  
  const { sendMessage, subscribe, isConnected } = useWebSocket(roomId);
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync initial data
  useEffect(() => {
    if (room) {
      setVideoUrl(room.currentVideoUrl || "");
      setUrlInput(room.currentVideoUrl || "");
      setIsPlaying(room.isPlaying || false);
    }
  }, [room]);

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle WebSocket messages
  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      console.log("WS Received:", data);

      if (data.type === "chat_message") {
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: data.content,
          userId: data.userId,
          roomId,
          createdAt: data.createdAt,
          user: data.user
        }]);
      }

      if (data.type === "video_update") {
        isRemoteUpdate.current = true;
        
        if (data.url && data.url !== videoUrl) {
          setVideoUrl(data.url);
          setUrlInput(data.url);
        }

        setIsPlaying(data.isPlaying);
        
        if (playerRef.current && Math.abs(playerRef.current.getCurrentTime() - data.timestamp) > 2) {
          playerRef.current.seekTo(data.timestamp, 'seconds');
        }

        // Reset flag after a short delay to allow React to process state
        setTimeout(() => {
          isRemoteUpdate.current = false;
        }, 500);
      }
    });

    return unsubscribe;
  }, [subscribe, videoUrl, roomId, queryClient]);


  const handleSendChat = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || !roomId || !user) return;

    sendMessage({
      type: "chat_message",
      roomId,
      content: chatInput,
      userId: user.id,
    });
    setChatInput("");
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Linki kopyaladı",
      description: "Arkadaşlarınla paylaş!",
    });
  };

  const handleCloseRoom = () => {
    if (window.confirm("Odayı kapatmak istediğine emin misin?")) {
      deleteRoom.mutate(roomId || 0);
    }
  };

  const handleUrlChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput || !roomId) return;
    
    // Validate and normalize URL
    let finalUrl = urlInput.trim();
    
    // Check if it's a YouTube URL and normalize it
    const youtubeId = getYouTubeVideoId(finalUrl);
    if (youtubeId) {
      finalUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    } else if (!finalUrl.startsWith('http')) {
      finalUrl = `https://${finalUrl}`;
    }
    
    setVideoUrl(finalUrl);
    setUrlInput(finalUrl);
    sendMessage({
      type: "video_update",
      roomId,
      isPlaying: true,
      timestamp: 0,
      url: finalUrl
    });
  };

  // Player Callbacks
  const onPlay = () => {
    if (!isRemoteUpdate.current && roomId) {
      setIsPlaying(true);
      sendMessage({
        type: "video_update",
        roomId,
        isPlaying: true,
        timestamp: playerRef.current?.getCurrentTime() || 0,
        url: videoUrl
      });
    }
  };

  const onPause = () => {
    if (!isRemoteUpdate.current && roomId) {
      setIsPlaying(false);
      sendMessage({
        type: "video_update",
        roomId,
        isPlaying: false,
        timestamp: playerRef.current?.getCurrentTime() || 0,
        url: videoUrl
      });
    }
  };

  const onProgress = (state: { playedSeconds: number }) => {
    // Only sync occasionally or on seek? 
    // Usually we don't sync every second via WS to avoid flooding, 
    // but we can rely on play/pause/seek events for major syncs.
    // If you want strict sync, you might emit here throttled.
  };

  if (authLoading || roomLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/api/login";
    return null;
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Oda bulunamadı</h2>
        <Button onClick={() => window.location.href = "/"}>Ana Sayfaya Dön</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto p-4 lg:p-6 grid lg:grid-cols-4 gap-6 h-[calc(100vh-64px)]">
        {/* Left: Video Player */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-card rounded-2xl overflow-hidden shadow-2xl border border-white/5 aspect-video relative group bg-black">
            {videoUrl ? (
              <>
                {getYouTubeVideoId(videoUrl) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(getYouTubeVideoId(videoUrl)!)}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                    className="absolute inset-0"
                    onLoad={() => setIsReady(true)}
                    data-testid="video-player-youtube"
                  />
                ) : getVimeoVideoId(videoUrl) ? (
                  <iframe
                    src={getVimeoEmbedUrl(getVimeoVideoId(videoUrl)!)}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                    className="absolute inset-0"
                    onLoad={() => setIsReady(true)}
                    data-testid="video-player-vimeo"
                  />
                ) : getTwitchId(videoUrl) ? (
                  <iframe
                    src={getTwitchEmbedUrl(getTwitchId(videoUrl)!.id, getTwitchId(videoUrl)!.type)}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    className="absolute inset-0"
                    onLoad={() => setIsReady(true)}
                    data-testid="video-player-twitch"
                  />
                ) : getDailyMotionId(videoUrl) ? (
                  <iframe
                    src={getDailyMotionEmbedUrl(getDailyMotionId(videoUrl)!)}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    className="absolute inset-0"
                    onLoad={() => setIsReady(true)}
                    data-testid="video-player-dailymotion"
                  />
                ) : isVideoFile(videoUrl) ? (
                  <video
                    width="100%"
                    height="100%"
                    controls
                    autoPlay={isPlaying}
                    onPlay={onPlay}
                    onPause={onPause}
                    className="w-full h-full"
                    data-testid="video-player-html5"
                  >
                    <source src={videoUrl} />
                    Tarayıcınız HTML5 video oynatmayı desteklemiyor.
                  </video>
                ) : (
                  <ReactPlayer
                    ref={playerRef}
                    url={videoUrl}
                    width="100%"
                    height="100%"
                    playing={isPlaying}
                    controls
                    progressInterval={500}
                    playsinline={true}
                    pip={false}
                    onPlay={onPlay}
                    onPause={onPause}
                    onProgress={onProgress}
                    onReady={() => setIsReady(true)}
                    onError={(e) => {
                      console.error("Player error:", e);
                      toast({
                        title: "Video Oynatılamadı",
                        description: "Bu URL'deki video oynatılamıyor. Başka bir link dene.",
                        variant: "destructive"
                      });
                    }}
                    onBuffer={() => console.log("Video buffering...")}
                    onBufferEnd={() => console.log("Buffer ready")}
                    config={{
                      youtube: {
                        playerVars: {
                          showinfo: 1,
                          modestbranding: 1,
                          iv_load_policy: 3
                        }
                      },
                      vimeo: {
                        playerOptions: {
                          title: false,
                          byline: false,
                          portrait: false
                        }
                      },
                      dailymotion: {
                        params: {
                          autoplay: isPlaying ? 1 : 0,
                          sharing: 1
                        }
                      },
                      mixcloud: {
                        options: {
                          hide_cover: false
                        }
                      },
                      twitch: {
                        options: {
                          interactive: false
                        }
                      },
                      html5: {
                        attributes: {
                          controlsList: "nodownload",
                          crossOrigin: "anonymous",
                          preload: "auto"
                        }
                      }
                    }}
                  />
                )}
                {!isReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 pointer-events-none">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                    <p className="text-muted-foreground text-sm">Video yükleniyor...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-muted-foreground">
                <Play className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-center">
                  <span className="block mb-2">YouTube, Vimeo, Twitch, DailyMotion</span>
                  <span className="block text-sm text-muted-foreground/70">MP4 ve web videolarını oynat</span>
                </p>
              </div>
            )}
            
            {!isConnected && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                Bağlantı koptu
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-white/5 shadow-lg">
            <div className="flex-1">
              <form onSubmit={handleUrlChange} className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Video URL yapıştır (YouTube, Twitch, Vimeo...)" 
                    className="pl-10 bg-background border-white/10"
                  />
                </div>
                <Button type="submit" variant="secondary" className="hover:bg-primary hover:text-white transition-colors">
                  Yükle
                </Button>
              </form>
            </div>
          </div>
          
          <div className="px-1 flex items-start justify-between">
             <div>
               <h1 className="text-2xl font-bold text-white font-display mb-1">{room.name}</h1>
               <p className="text-muted-foreground text-sm">Oda ID: {room.id} • {isConnected ? <span className="text-green-500">Canlı Bağlantı</span> : <span className="text-red-500">Bağlanıyor...</span>}</p>
             </div>
             {room.hostId === user?.id && (
               <div className="flex gap-2">
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={handleShareLink}
                   data-testid="button-share-room"
                   className="gap-2"
                 >
                   {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                   {copied ? "Kopyalandı" : "Davet Et"}
                 </Button>
                 <Button
                   size="sm"
                   variant="destructive"
                   onClick={handleCloseRoom}
                   data-testid="button-close-room"
                   disabled={deleteRoom.isPending}
                   className="gap-2"
                 >
                   <Trash2 className="w-4 h-4" />
                   {deleteRoom.isPending ? "Kapatılıyor..." : "Kapat"}
                 </Button>
               </div>
             )}
          </div>
        </div>

        {/* Right: Chat */}
        <div className="lg:col-span-1 bg-card rounded-2xl border border-white/5 flex flex-col overflow-hidden h-full shadow-xl">
          <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-sm">
            <h3 className="font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Sohbet
            </h3>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col gap-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.user?.id === user.id ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-bold text-white/80">
                      {msg.user?.email.split('@')[0] || "Anonim"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {msg.createdAt ? format(new Date(msg.createdAt), "HH:mm") : ""}
                    </span>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl max-w-[90%] text-sm ${
                    msg.user?.id === user.id 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-white/10 text-white rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-white/5 bg-background">
            <form onSubmit={handleSendChat} className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Mesaj yaz..."
                className="bg-white/5 border-white/10 focus-visible:ring-primary"
              />
              <Button type="submit" size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
