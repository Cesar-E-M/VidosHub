"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/context/useAuth";
import { VideoPlayer } from "@/components/VideoPlayer/VideoPlayer";
import {
  Heart,
  MessageCircle,
  Share2,
  ThumbsDown,
  Clock,
  Eye,
  Calendar,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@radix-ui/themes";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";

interface VideoData {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration: string;
  category: string;
  user_id: string;
  created_at: string;
  views_count: number;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function VideoPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const videoId = params.id as string;

  const [video, setVideo] = useState<VideoData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (!videoId) return;

    const fetchVideoData = async () => {
      try {
        setLoading(true);

        const { data: videoData, error: videoError } = await supabase
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
          .eq("id", videoId)
          .single();

        if (videoError) throw videoError;
        if (!videoData) throw new Error("Video no encontrado");

        setVideo(videoData);

        await supabase.rpc("increment_video_views", { video_id: videoId });

        const { count: likesCount } = await supabase
          .from("video_likes")
          .select("*", { count: "exact", head: true })
          .eq("video_id", videoId);

        setLikesCount(likesCount || 0);

        if (user) {
          const { data: likeData } = await supabase
            .from("video_likes")
            .select("id")
            .eq("video_id", videoId)
            .eq("user_id", user.id)
            .single();

          setIsLiked(!!likeData);
        }

        const { data: commentsData, error: commentsError } = await supabase
          .from("video_comments")
          .select(
            `
            *,
            profiles!video_comments_user_id_fkey (
              full_name,
              email
            )
          `
          )
          .eq("video_id", videoId)
          .order("created_at", { ascending: false });
        console.log("Comments data:", commentsData, "Error:", commentsError);
        if (!commentsError && commentsData) {
          setComments(commentsData);
        }
      } catch (error) {
        console.error("Error cargando video:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar el video",
          variant: "destructive",
        });
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, []);

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Debes iniciar sesión",
        description: "Inicia sesión para dar like",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from("video_likes")
          .delete()
          .eq("video_id", videoId)
          .eq("user_id", user.id);

        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
      } else {
        await supabase
          .from("video_likes")
          .insert({ video_id: videoId, user_id: user.id });

        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error al dar like:", error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Debes iniciar sesión",
        description: "Inicia sesión para comentar",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmittingComment(true);

    try {
      const { data: commentData, error } = await supabase
        .from("video_comments")
        .insert({
          video_id: videoId,
          user_id: user.id,
          comment: newComment.trim(),
        })
        .select(
          `
          *,
          profiles!video_comments_user_id_fkey (
            full_name,
            email
          )
        `
        )
        .single();

      if (error) throw error;

      setComments([commentData, ...comments]);
      setNewComment("");

      toast({
        title: "Comentario publicado",
        description: "Tu comentario ha sido agregado",
      });
    } catch (error) {
      console.error("Error al comentar:", error);
      toast({
        title: "Error",
        description: "No se pudo publicar el comentario",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-500">Video no encontrado</p>
          <Link href="/">
            <Button className="mt-4">Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-black rounded-lg overflow-hidden aspect-video">
              <VideoPlayer
                src={video.video_url}
                autoPlay={false}
                showControls={true}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                  {video.category}
                </span>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  {video.duration}
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {video.title}
              </h1>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-linear-to-r from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
                    {video.profiles.full_name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {video.profiles.full_name || "Usuario"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {video.profiles.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={isLiked ? "solid" : "soft"}
                    color={isLiked ? "red" : "gray"}
                    className="gap-2"
                    onClick={handleLike}
                  >
                    <Heart
                      className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`}
                    />
                    {likesCount}
                  </Button>

                  <Button variant="soft" color="gray">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {video.views_count || 0} vistas
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(video.created_at)}
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {video.description || "Sin descripción"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4">
                Comentarios ({comments.length})
              </h2>

              {user && (
                <form onSubmit={handleSubmitComment} className="mb-6">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-linear-to-r from-red-500 to-orange-500 flex items-center justify-center text-white font-bold shrink-0">
                      {user.user_metadata?.full_name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Agrega un comentario..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        rows={3}
                        disabled={isSubmittingComment}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          type="button"
                          variant="soft"
                          color="gray"
                          onClick={() => setNewComment("")}
                          disabled={isSubmittingComment}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={!newComment.trim() || isSubmittingComment}
                          className="bg-linear-to-r from-red-500 to-orange-500 text-white"
                        >
                          {isSubmittingComment ? "Publicando..." : "Comentar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {!user && (
                <div className="mb-6 p-4 bg-gray-100 rounded-lg text-center">
                  <p className="text-gray-600">
                    <Link
                      href="/login"
                      className="text-red-500 hover:underline"
                    >
                      Inicia sesión
                    </Link>{" "}
                    para comentar
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay comentarios aún. ¡Sé el primero en comentar!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-linear-to-r from-red-500 to-orange-500 flex items-center justify-center text-white font-bold shrink-0">
                        {comment.profiles.full_name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">
                              {comment.profiles.full_name || "Usuario"}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">
                            {comment.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-4 sticky top-4">
              <h3 className="font-bold text-lg mb-4">Videos relacionados</h3>
              <p className="text-sm text-gray-500 text-center py-8">
                Próximamente...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
