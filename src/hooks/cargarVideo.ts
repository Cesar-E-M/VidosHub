import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/context/useAuth";

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration: string;
  category: string;
  user_id: string;
  created_at: string;
}

interface VideoWithStats extends Video {
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
  username: string;
}

export const useVideos = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log("📹 Cargando videos...");

      // 1. Obtener todos los videos con información del perfil del usuario
      const { data: videosData, error: videosError } = await supabase
        .from("videos")
        .select(
          `
          *,
          profiles!videos_user_id_fkey (
            full_name,
            email
          )
        `
        )
        .order("created_at", { ascending: false });

      if (videosError) {
        console.error("❌ Error obteniendo videos:", videosError);
        throw videosError;
      }

      console.log("✅ Videos obtenidos:", videosData);

      // 2. Obtener estadísticas para cada video
      const videosWithStats = await Promise.all(
        (videosData || []).map(async (video) => {
          // Contar likes
          const { count: likesCount } = await supabase
            .from("video_likes")
            .select("*", { count: "exact", head: true })
            .eq("video_id", video.id);

          // Contar comentarios
          const { count: commentsCount } = await supabase
            .from("video_comments")
            .select("*", { count: "exact", head: true })
            .eq("video_id", video.id);

          // Verificar si el usuario actual dio like
          let userHasLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from("video_likes")
              .select("id")
              .eq("video_id", video.id)
              .eq("user_id", user.id)
              .maybeSingle();

            userHasLiked = !!likeData;
          }

          // Obtener nombre del usuario desde profiles
          const username =
            video.profiles?.full_name ||
            video.profiles?.email?.split("@")[0] ||
            "Usuario";

          return {
            id: video.id,
            title: video.title,
            description: video.description,
            video_url: video.video_url,
            duration: video.duration || "0:00",
            category: video.category,
            user_id: video.user_id,
            created_at: video.created_at,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            user_has_liked: userHasLiked,
            username,
          };
        })
      );

      console.log("✅ Videos con estadísticas:", videosWithStats);
      setVideos(videosWithStats);
      setError(null);
    } catch (err) {
      console.error("💥 Error fetching videos:", err);
      setError(err instanceof Error ? err.message : "Error al cargar videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [user]);

  return { videos, loading, error, refetch: fetchVideos };
};
