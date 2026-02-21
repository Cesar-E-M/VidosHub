"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/context/useAuth";
import { VideoPlayer } from "@/components/VideoPlayer/VideoPlayer";
import {
  Play,
  Heart,
  Share2,
  Eye,
  Clock,
  Loader2,
  Send,
  Edit2,
  X,
  Check,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { Button } from "@radix-ui/themes";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";

interface VideoData {
  id: string;
  title: string;
  description: string;
  video_url: string;
  category: string;
  user_id: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface Comment {
  id: string;
  comment: string;
  content: string;
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
  const [viewsCount, setViewsCount] = useState(0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);

  const toggleComment = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  const updateComment = async (commentId: string) => {
    if (!editingContent.trim() || !user) return;

    setIsUpdatingComment(true);

    try {
      const { error } = await supabase
        .from("video_comments")
        .update({ content: editingContent.trim() })
        .eq("id", commentId)
        .eq("user_id", user.id); // Verificar que sea el dueño

      if (error) throw error;

      // Actualizar estado local
      setComments(
        comments.map((c) =>
          c.id === commentId ? { ...c, content: editingContent.trim() } : c,
        ),
      );

      toast({
        title: "Comentario actualizado",
        description: "Tu comentario ha sido actualizado correctamente",
      });

      setEditingCommentId(null);
      setEditingContent("");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el comentario",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingComment(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) {
      toast({
        title: "Error",
        description: "Por favor escribe un comentario",
        variant: "destructive",
      });
      return;
    }

    // ✅ Verificar si el usuario ya tiene un comentario
    const userHasCommented = comments.some((c) => c.user_id === user.id);

    if (userHasCommented) {
      toast({
        title: "Ya comentaste",
        description:
          "Solo puedes hacer un comentario por video. Puedes editar tu comentario existente.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingComment(true);

    try {
      const { data, error } = await supabase
        .from("video_comments")
        .insert([
          {
            video_id: videoId,
            user_id: user.id,
            content: newComment.trim(),
          },
        ])
        .select(
          `
          *,
          profiles (
            full_name,
            avatar_url
          )
        `,
        )
        .single();

      if (error) throw error;

      setComments([data, ...comments]);
      setNewComment("");

      toast({
        title: "Comentario publicado",
        description: "Tu comentario ha sido publicado correctamente",
      });
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Error",
        description: "No se pudo publicar el comentario",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  useEffect(() => {
    if (!videoId) return;

    let isViewRecorded = false;

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
        `,
          )
          .eq("id", videoId)
          .single();

        if (videoError) throw videoError;
        if (!videoData) throw new Error("Video no encontrado");

        setVideo(videoData);

        const { count: totalViews } = await supabase
          .from("video_views")
          .select("*", { count: "exact", head: true })
          .eq("video_id", videoId);

        setViewsCount(totalViews || 0);

        if (user && !isViewRecorded) {
          isViewRecorded = true;

          try {
            const { error: insertError, status } = await supabase
              .from("video_views")
              .upsert(
                {
                  video_id: videoId,
                  user_id: user.id,
                },
                {
                  onConflict: "video_id,user_id",
                  ignoreDuplicates: true,
                },
              );

            if (!insertError && status === 201) {
              setViewsCount((prev) => prev + 1);
            }
          } catch (error) {
            console.error("❌ Error en registro de vista:", error);
          }
        }

        const { count: likesCount } = await supabase
          .from("video_likes")
          .select("*", { count: "exact", head: true })
          .eq("video_id", videoId);

        setLikesCount(likesCount || 0);

        const { data: commentsData, error: commentsError } = await supabase
          .from("video_comments")
          .select(
            `
          *,
          profiles!video_comments_user_id_fkey (
            full_name,
            email
          )
        `,
          )
          .eq("video_id", videoId)
          .order("created_at", { ascending: false });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, user?.id]);

  useEffect(() => {
    if (!videoId || !user) {
      setIsLiked(false);
      return;
    }

    const checkUserLike = async () => {
      const { data: likeData } = await supabase
        .from("video_likes")
        .select("id")
        .eq("video_id", videoId)
        .eq("user_id", user.id)
        .maybeSingle();

      setIsLiked(!!likeData);
    };

    checkUserLike();
  }, [videoId, user]);

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
        setLikesCount(likesCount - 1);
        toast({
          title: "Like eliminado",
          description: "Ya no te gusta este video",
        });
      } else {
        await supabase
          .from("video_likes")
          .insert({ video_id: videoId, user_id: user.id });

        setIsLiked(true);
        setLikesCount(likesCount + 1);
        toast({
          title: "Like agregado",
          description: "Te gusta este video",
        });
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
          content: newComment.trim(),
        })
        .select(
          `
          *,
          profiles!video_comments_user_id_fkey (
            full_name,
            email
          )
        `,
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

  const handleShare = async () => {
    const shareData = {
      title: video?.title,
      text: video?.description || `Mira este video: ${video?.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Compartido",
          description: "Video compartido exitosamente",
          variant: "success",
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Enlace copiado",
          description: "El enlace se copió al portapapeles",
          variant: "success",
        });
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error al compartir:", error);
        toast({
          title: "Error",
          description: "No se pudo compartir el video",
          variant: "destructive",
        });
      }
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
    <div className="px-8 min-h-screen bg-gray-50">
      <div className="mx-auto py-4">
        <Link href="/" className="inline-block">
          <button className="flex items-center gap-2 text-red-500 cursor-pointer hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </Link>
      </div>

      <div className=" mx-auto py-6">
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
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {video.title}
              </h1>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="flex flex-col items-center mb-4 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-linear-to-r from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
                    {video.profiles?.full_name?.charAt(0) || "U"}
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

                <div className="flex gap-2 mt-2 sm:mt-0">
                  <Button
                    variant={isLiked ? "solid" : "soft"}
                    color={isLiked ? "red" : "gray"}
                    onClick={handleLike}
                  >
                    <Heart
                      className={`h-4 w-4 cursor-pointer ${
                        isLiked ? "fill-current" : ""
                      }`}
                    />
                    {likesCount}
                  </Button>

                  <Button variant="soft" color="gray" onClick={handleShare}>
                    <Share2 className="h-4 w-4 cursor-pointer" />
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {viewsCount} vistas
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
                <form onSubmit={submitComment} className="mb-6">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-linear-to-r from-red-500 to-orange-500 flex items-center justify-center text-white font-bold shrink-0">
                      {user.user_metadata?.name?.charAt(0) ||
                        user.email?.charAt(0) ||
                        "U"}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Añade un comentario..."
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={3}
                        disabled={
                          isSubmittingComment ||
                          comments.some((c) => c.user_id === user.id)
                        }
                      />
                      {comments.some((c) => c.user_id === user.id) && (
                        <p className="text-xs text-gray-500 mt-1">
                          Ya has comentado en este video. Puedes editar tu
                          comentario existente.
                        </p>
                      )}
                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          disabled={
                            isSubmittingComment ||
                            !newComment.trim() ||
                            comments.some((c) => c.user_id === user.id)
                          }
                          className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isSubmittingComment ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Publicando...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Comentar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay comentarios aún. ¡Sé el primero en comentar!
                  </p>
                ) : (
                  comments.map((comment) => {
                    const isExpanded = expandedComments.has(comment.id);
                    const isEditing = editingCommentId === comment.id;
                    const isOwner = user?.id === comment.user_id;
                    const lines = comment.content.split("\n");
                    const isTooLong =
                      lines.length > 4 || comment.content.length > 200;

                    const displayContent =
                      !isExpanded && isTooLong && !isEditing
                        ? lines.slice(0, 4).join("\n") +
                          (lines.length > 4 ? "..." : "")
                        : comment.content;

                    return (
                      <div key={comment.id} className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-linear-to-r from-red-500 to-orange-500 flex items-center justify-center text-white font-bold shrink-0">
                          {comment.profiles.full_name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-100 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">
                                  {comment.profiles.full_name || "Usuario"}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {formatDate(comment.created_at)}
                                </span>
                              </div>
                              {isOwner && !isEditing && (
                                <button
                                  onClick={() => startEditComment(comment)}
                                  className="text-gray-500 hover:text-blue-600 p-1"
                                  title="Editar comentario"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingContent}
                                  onChange={(e) =>
                                    setEditingContent(e.target.value)
                                  }
                                  className="w-full border border-gray-300 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  rows={4}
                                  disabled={isUpdatingComment}
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={cancelEditComment}
                                    disabled={isUpdatingComment}
                                    className="text-gray-600 hover:text-gray-800 px-3 py-1 rounded text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                                  >
                                    <X className="w-4 h-4" />
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => updateComment(comment.id)}
                                    disabled={
                                      isUpdatingComment ||
                                      !editingContent.trim()
                                    }
                                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {isUpdatingComment ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Guardando...
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-4 h-4" />
                                        Guardar
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                  {displayContent}
                                </p>
                                {isTooLong && (
                                  <button
                                    onClick={() => toggleComment(comment.id)}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                                  >
                                    {isExpanded ? "Mostrar menos" : "Leer más"}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 border border-gray-200 rounded-md h-fit">
            <div className="bg-white rounded-lg p-4">
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
