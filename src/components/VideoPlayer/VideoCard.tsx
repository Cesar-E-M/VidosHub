"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Play, Clock, Heart, MessageCircle, Trash2 } from "lucide-react";
import { Box, Card, Inset } from "@radix-ui/themes";
import { Button } from "@radix-ui/themes";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import { VideoPlayer } from "./VideoPlayer";

interface VideoCardProps {
  id: string;
  title: string;
  description: string;
  duration?: string;
  category: string;
  likesCount: number;
  commentsCount: number;
  userHasLiked: boolean;
  username: string;
  userId: string;
  currentUserId?: string;
  videoUrl?: string;
  onDelete?: () => void;
  onLikeToggle?: () => void;
}

export const VideoCard = ({
  id,
  title,
  description,
  duration,
  category,
  likesCount,
  commentsCount,
  userHasLiked,
  username,
  userId,
  currentUserId,
  videoUrl,
  onDelete,
  onLikeToggle,
}: VideoCardProps) => {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(userHasLiked);
  const [likes, setLikes] = useState(likesCount);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!currentUserId) {
      toast({
        title: "Debes iniciar sesión",
        description: "Inicia sesión para dar like a los videos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isLiked) {
        const { error } = await supabase
          .from("video_likes")
          .delete()
          .eq("video_id", id)
          .eq("user_id", currentUserId);

        if (error) throw error;

        setIsLiked(false);
        setLikes((prev) => prev - 1);
      } else {
        const { error } = await supabase
          .from("video_likes")
          .insert({ video_id: id, user_id: currentUserId });

        if (error) throw error;

        setIsLiked(true);
        setLikes((prev) => prev + 1);
      }

      onLikeToggle?.();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Ocurrió un error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("¿Estás seguro de que quieres eliminar este video?")) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from("videos").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Video eliminado",
        description: "El video ha sido eliminado exitosamente",
      });

      onDelete?.();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Ocurrió un error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Función para navegar a la página del video
  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/video/${id}`);
  };

  // ✅ También navegar al hacer click en toda la card
  const handleCardClick = () => {
    router.push(`/video/${id}`);
  };

  return (
    <Box>
      <Card
        className="rounded-lg text-card-foreground group overflow-hidden border-0 shadow-card transition-all hover:shadow-card-hover cursor-pointer"
        onClick={handleCardClick}
      >
        <Inset clip="padding-box" side="top" pb="current">
          <div className="relative aspect-video overflow-hidden bg-muted rounded-t-lg">
            <VideoPlayer
              src={videoUrl || ""}
              autoPlay={false}
              showControls={false}
            />

            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:scale-110 transition-transform"
                onClick={handlePlayClick}
              >
                <Play className="h-6 w-6 text-primary fill-primary ml-1" />
              </div>
            </div>

            <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              <Clock className="inline h-3 w-3 mr-1" />
              {duration}
            </div>

            <div className="absolute top-2 left-2 rounded-full bg-black/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {category}
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-gray-400 font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors flex-1">
                {title}
              </h3>
              {currentUserId === userId && (
                <Button
                  variant="ghost"
                  size="1"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-2">@{username}</p>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {description}
            </p>

            <div className="flex items-center gap-4 text-sm">
              <Button
                variant="ghost"
                size="1"
                className={`gap-1 h-8 ${
                  isLiked ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={handleLike}
                disabled={isLoading}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                <span>{likes}</span>
              </Button>

              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>{commentsCount}</span>
              </div>
            </div>
          </div>
        </Inset>
      </Card>
    </Box>
  );
};
