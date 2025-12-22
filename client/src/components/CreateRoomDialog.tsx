import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRoomSchema, type InsertRoom } from "@shared/schema";
import { useCreateRoom } from "@/hooks/use-rooms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";

export function CreateRoomDialog() {
  const [open, setOpen] = useState(false);
  const createRoom = useCreateRoom();

  const form = useForm<InsertRoom>({
    resolver: zodResolver(insertRoomSchema),
    defaultValues: {
      name: "",
      currentVideoUrl: "", // Optional initial URL
    },
  });

  const onSubmit = (data: InsertRoom) => {
    createRoom.mutate(data, {
      onSuccess: () => setOpen(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/25 rounded-full px-8 py-6 text-lg transition-all hover:scale-105 active:scale-95">
          <PlusCircle className="mr-2 h-5 w-5" />
          Oda Oluştur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-display tracking-tight">Yeni Video Odası</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Arkadaşlarınla video izlemek için yeni bir oda kur.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Oda Adı</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Örn: Hafta Sonu Film Gecesi 🍿" 
                      className="bg-background border-white/10 focus:border-primary focus:ring-primary/20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="currentVideoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Başlangıç Videosu (İsteğe Bağlı)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://youtube.com/..." 
                      className="bg-background border-white/10 focus:border-primary focus:ring-primary/20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={createRoom.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-12 rounded-xl shadow-lg shadow-primary/20"
              >
                {createRoom.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  "Odayı Kur"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
