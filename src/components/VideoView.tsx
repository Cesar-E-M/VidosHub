"use client";

import { VideoCard } from "@/components/VideoPlayer/VideoCard";
import { useVideos } from "@/hooks/cargarVideo";
import { useAuth } from "@/hooks/context/useAuth";
import { Loader2 } from "lucide-react";

export const VideoView = () => {
  const { videos, loading, error, refetch } = useVideos();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error al cargar videos</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No hay videos disponibles</p>
          <p className="text-sm text-gray-400">
            ¡Sé el primero en subir un video!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pb-5 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 items-center gap-6">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            id={video.id}
            title={video.title}
            description={video.description}
            videoUrl={video.video_url}
            thumbnail_url={video.thumbnail_url}
            duration={parseFloat(video.duration)}
            category={video.category}
            likesCount={video.likes_count}
            commentsCount={video.comments_count}
            userHasLiked={video.user_has_liked}
            username={video.username}
            userId={video.user_id}
            currentUserId={user?.id}
            onDelete={refetch}
            onLikeToggle={refetch}
          />
        ))}
      </div>
    </div>
  );
};
