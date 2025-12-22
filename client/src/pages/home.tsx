import { useAuth } from "@/hooks/use-auth";
import { useRooms } from "@/hooks/use-rooms";
import { Navbar } from "@/components/Navbar";
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play, Users, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

function HeroSection() {
  const { user } = useAuth();
  
  return (
    <div className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]" />
      </div>
      
      <div className="container relative z-10 px-4 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-bold font-display tracking-tight mb-6 text-white"
        >
          Birlikte İzlemenin <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
            En Keyifli Hali
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Arkadaşlarınla senkronize video izle, sohbet et ve anın tadını çıkar. 
          YouTube videolarını anlık olarak paylaş.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {user ? (
            <CreateRoomDialog />
          ) : (
            <a href="/api/login" data-testid="link-login">
              <Button size="lg" className="bg-white text-black hover:bg-gray-200 font-bold px-8 rounded-full text-lg shadow-xl shadow-white/10" data-testid="button-start-free">
                Hemen Başla — Ücretsiz
              </Button>
            </a>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function RoomCard({ room }: { room: any }) {
  return (
    <Link href={`/room/${room.id}`} data-testid={`link-room-${room.id}`}>
      <motion.div 
        whileHover={{ y: -4 }}
        className="group relative bg-card border border-white/5 rounded-2xl overflow-hidden shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
        
        <div className="h-40 bg-secondary relative overflow-hidden">
          {/* Placeholder or dynamic thumbnail could go here */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-900/20" />
          <Play className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 w-12 h-12 group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
          
          <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1.5 border border-white/10">
            <Users className="w-3 h-3 text-primary" />
            <span>Aktif</span>
          </div>
        </div>

        <div className="p-6 relative z-20 flex flex-col flex-1">
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors" data-testid={`text-room-name-${room.id}`}>
            {room.name}
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-auto">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {formatDistanceToNow(new Date(room.createdAt), { addSuffix: true, locale: tr })}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-sm font-medium text-primary-foreground/80">Odaya Katıl</span>
            <ArrowRight className="w-4 h-4 text-primary -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function Home() {
  const { data: rooms, isLoading } = useRooms();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        <HeroSection />

        <div className="container mx-auto px-4 pb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white font-display">Aktif Odalar</h2>
            <div className="h-px bg-white/10 flex-1 ml-6" />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : rooms?.length === 0 ? (
            <div className="text-center py-20 bg-card/30 rounded-3xl border border-white/5 border-dashed">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Henüz hiç oda yok</h3>
              <p className="text-muted-foreground">İlk odayı sen oluştur ve partiyi başlat!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms?.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
