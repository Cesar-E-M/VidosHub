"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Eye, Clock, Loader2, Mail, User, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/context/useAuth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: number;
  createdAt: string;
  userId: string;
}

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
}

const ProfilePage = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [perfile, setPerfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      if (authLoading) return;

      if (!user) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        const { data: videosData, error: videosError } = await supabase
          .from("videos")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (videosError) throw videosError;

        const userProfile: UserProfile = {
          id: profileData.id,
          username: profileData.username || user.email?.split("@")[0] || "user",
          displayName:
            profileData.full_name || user.user_metadata?.name || "Usuario",
          email: user.email || "",
          avatar:
            profileData.avatar_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.full_name || user.email || "User")}&size=400&background=ef4343&color=fff`,
        };

        setPerfile(userProfile);

        const formattedVideos: Video[] =
          videosData?.map((video) => ({
            id: video.id,
            title: video.title,
            thumbnail:
              video.thumbnail_url ||
              "https://images.unsplash.com/photo-1574267432644-f86ede5aed05?w=640&h=360&fit=crop",
            duration: formatDuration(video.duration || 0),
            views: video.views || 0,
            createdAt: formatTimeAgo(new Date(video.created_at)),
            userId: video.user_id,
          })) || [];

        setVideos(formattedVideos);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, authLoading, router]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Hoy";
    if (days === 1) return "Ayer";
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
    if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;
    return `Hace ${Math.floor(days / 365)} años`;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const handleDelete = async (videoId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("¿Estás seguro de eliminar este video?")) {
      return;
    }
    try {
      const { data: videoData, error: fetchError } = await supabase
        .from("videos")
        .select("video_url, thumbnail_url")
        .eq("id", videoId)
        .single();

      if (fetchError) {
        console.error("❌ Error al obtener video:", fetchError);
        throw new Error("No se pudo obtener la información del video");
      }

      const storageErrors = [];

      if (videoData?.video_url) {
        const urlParts = videoData.video_url.split("/videos/");
        const videoPath = urlParts[1];

        if (videoPath) {
          const { error: videoStorageError } = await supabase.storage
            .from("videos")
            .remove([videoPath]);

          if (videoStorageError) {
            console.error("❌ Error al eliminar video:", videoStorageError);
            storageErrors.push(`Video: ${videoStorageError.message}`);
          }
        }
      }

      if (videoData?.thumbnail_url) {
        const urlParts = videoData.thumbnail_url.split("/thumbnails/");
        const thumbnailPath = urlParts[1];

        if (thumbnailPath) {
          const { error: thumbnailStorageError } = await supabase.storage
            .from("thumbnails")
            .remove([thumbnailPath]);

          if (thumbnailStorageError) {
            console.error(
              "❌ Error al eliminar thumbnail:",
              thumbnailStorageError,
            );
            storageErrors.push(`Thumbnail: ${thumbnailStorageError.message}`);
          }
        }
      }

      const { error: deleteError } = await supabase
        .from("videos")
        .delete()
        .eq("id", videoId)
        .eq("user_id", user?.id);

      if (deleteError) {
        console.error("❌ Error al eliminar de BD:", deleteError);
        throw deleteError;
      }

      // 4. Mostrar resultado
      if (storageErrors.length > 0) {
        toast({
          title: "Video eliminado parcialmente",
          description: `El video fue eliminado pero hubo errores con archivos: ${storageErrors.join(", ")}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Video eliminado",
          description: "El video fue eliminado correctamente.",
        });
      }

      // 5. Actualizar UI
      setVideos(videos.filter((v) => v.id !== videoId));
    } catch (error) {
      console.error("💥 Error general al eliminar:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el video",
        variant: "destructive",
      });
    }
  };

  if (!perfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 text-lg font-semibold mb-2">
            No se pudo cargar el perfil
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-primary hover:underline"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-12 pb-8 border-b border-gray-200">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-100 shadow-md shrink-0">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
                width={500}
                height={500}
              />
            ) : (
              <User className="h-5 w-5 text-gray-600" />
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {perfile.displayName}
            </h1>

            <div className="space-y-2">
              <p className="flex items-center justify-center sm:justify-start gap-2 text-gray-600">
                <User size={16} />
                <span>@{perfile.username}</span>
              </p>

              <p className="flex items-center justify-center sm:justify-start gap-2 text-gray-600">
                <Mail size={16} />
                <span>{perfile.email}</span>
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Historial de Videos ({videos.length})
          </h2>

          {videos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No has subido videos aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <Link
                  key={video.id}
                  href={`/video/${video.id}`}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow mb-3">
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/0 group-hover:bg-white/95 flex items-center justify-center transition-all">
                        <Play className="w-6 h-6 text-transparent group-hover:text-gray-900 transition-all fill-current" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <div className="flex-col">
                      <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors mb-2">
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye size={14} />
                          {video.views} vistas
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {video.createdAt}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(video.id, e)}
                      className="p-2 hover:bg-red-50 rounded-full transition-colors group cursor-pointer"
                      title="Eliminar video"
                    >
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
