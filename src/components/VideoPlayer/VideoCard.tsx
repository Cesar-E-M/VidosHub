"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";

interface VideoCardProps {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail_url: string;
  duration?: number;
  category?: string;
  likesCount: number;
  commentsCount: number;
  userHasLiked: boolean;
  username?: string;
  userId: string;
  currentUserId?: string;
  onDelete?: () => void;
}

export const VideoCard = ({
  id,
  title,
  description,
  thumbnail_url,
  category,
  likesCount,
  commentsCount,
  userHasLiked,
  username,
  userId,
  currentUserId,
  onDelete,
}: VideoCardProps) => {
  const [isLiked, setIsLiked] = useState(userHasLiked);
  const [likes, setLikes] = useState(likesCount);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsLiked(userHasLiked);
  }, [userHasLiked]);

  useEffect(() => {
    setLikes(likesCount);
  }, [likesCount]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUserId) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para dar like",
        variant: "destructive",
      });
      return;
    }

    if (isLoading) return;
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
        setLikes(likes - 1);

        toast({
          title: "Like eliminado",
          description: "Ya no te gusta este video",
        });
      } else {
        const { error } = await supabase.from("video_likes").insert({
          video_id: id,
          user_id: currentUserId,
        });

        if (error) throw error;

        setIsLiked(true);
        setLikes(likes + 1);

        toast({
          title: "Like agregado",
          description: "Te gusta este video",
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el like",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("¿Estás seguro de eliminar este video?")) {
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      await supabase.from("video_likes").delete().eq("video_id", id);
      await supabase.from("video_comments").delete().eq("video_id", id);

      const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUserId);

      if (error) throw error;

      toast({
        title: "Video eliminado",
        description: "El video se eliminó correctamente",
      });

      onDelete?.();
    } catch (error) {
      console.error("Error deleting video:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el video",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link href={`/video/${id}`} className="group">
      <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
        <div className="relative aspect-video bg-gray-200 overflow-hidden">
          {thumbnail_url ? (
            <Image
              src={thumbnail_url}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300">
              <span className="text-gray-500 text-sm">Sin miniatura</span>
            </div>
          )}

          {category && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              {category}
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-red-500 transition-colors">
            {title}
          </h3>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {description}
          </p>

          {username && (
            <p className="text-xs text-gray-500 mb-3">
              Por: <span className="font-medium">{username}</span>
            </p>
          )}

          <div
            className="flex items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleLike}
                disabled={isLoading}
                className="flex items-center gap-1 text-sm hover:text-red-500 transition-colors cursor-pointer"
              >
                <Heart
                  className={`h-5 w-5 ${
                    isLiked ? "fill-red-500 text-red-500" : ""
                  }`}
                />
                <span>{likes}</span>
              </button>

              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MessageCircle className="h-5 w-5" />
                <span>{commentsCount}</span>
              </div>
            </div>

            {currentUserId === userId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="p-2 hover:bg-red-50 rounded-full transition-colors group cursor-pointer"
                title="Eliminar video"
              >
                <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
