"use client";

import { useState } from "react";
import { useUploadModal } from "@/hooks/useUploadModal";
import { Dialog, TextField, TextArea, Button, Select } from "@radix-ui/themes";
import {
  Upload,
  X,
  Video as VideoIcon,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/context/useAuth";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";

interface FormData {
  title: string;
  description: string;
  category: string;
  video: FileList;
  thumbnail: FileList;
}

export const UploadModal = () => {
  const { isOpen, onClose } = useUploadModal();
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      title: "",
      description: "",
      category: "general",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Observar archivos seleccionados
  const videoFile = watch("video")?.[0];

  const categories = [
    "general",
    "educación",
    "gaming",
    "música",
    "deportes",
    "tecnología",
    "entretenimiento",
    "noticias",
  ];

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    }
  };

  const resetForm = () => {
    reset();
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview(null);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "No autenticado",
        description: "Debes iniciar sesión para subir videos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const video = data.video[0];
      const thumbnail = data.thumbnail[0];

      // 1. Subir video
      const videoFileName = `${user.id}/${Date.now()}-${video.name.replace(
        /\s+/g,
        "-",
      )}`;

      const { error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoFileName, video, {
          cacheControl: "3600",
          upsert: false,
        });

      if (videoError) {
        console.error("❌ Error subiendo video:", videoError);
        throw new Error(`Error al subir video: ${videoError.message}`);
      }

      // 2. Subir miniatura
      const thumbnailFileName = `${user.id}/${Date.now()}-${thumbnail.name
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      const { error: thumbnailError, data: thumbnailData } =
        await supabase.storage
          .from("thumbnails")
          .upload(thumbnailFileName, thumbnail, {
            cacheControl: "3600",
            upsert: false,
            contentType: thumbnail.type,
          });

      if (thumbnailError) {
        console.error("❌ Error al subir thumbnail:", thumbnailError);
        await supabase.storage.from("videos").remove([videoFileName]);
        throw new Error(`Error al subir miniatura: ${thumbnailError.message}`);
      }

      console.log("✅ Thumbnail subido exitosamente:", thumbnailData);

      // 3. Obtener URLs públicas
      const { data: videoUrl } = supabase.storage
        .from("videos")
        .getPublicUrl(videoFileName);

      const { data: thumbnailUrl } = supabase.storage
        .from("thumbnails")
        .getPublicUrl(thumbnailFileName);

      console.log("🔗 URLs generadas:", {
        video: videoUrl.publicUrl,
        thumbnail: thumbnailUrl.publicUrl,
      });

      const { error: dbError, data: dbData } = await supabase
        .from("videos")
        .insert({
          title: data.title.trim(),
          description: data.description.trim() || null,
          category: data.category,
          video_url: videoUrl.publicUrl,
          thumbnail_url: thumbnailUrl.publicUrl,
          user_id: user.id,
          duration: "0:00",
        })
        .select()
        .single();

      if (dbError) {
        console.error("❌ Error en BD:", dbError);
        await supabase.storage.from("videos").remove([videoFileName]);
        await supabase.storage.from("thumbnails").remove([thumbnailFileName]);
        throw new Error(`Error al guardar: ${dbError.message}`);
      }

      console.log("✅ Video guardado en BD:", dbData);

      toast({
        title: "¡Video subido!",
        description: "Tu video ha sido publicado exitosamente",
        variant: "success",
      });

      resetForm();
      onClose();

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("💥 Error general:", error);
      toast({
        title: "Error al subir",
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content
        style={{ maxWidth: 600 }}
        aria-describedby="upload-dialog-description"
      >
        <Dialog.Title className="flex items-center gap-2">
          <VideoIcon className="h-5 w-5 text-red-500" />
          Subir Video
        </Dialog.Title>
        <Dialog.Description id="upload-dialog-description" className="sr-only">
          Completa el formulario para subir un nuevo video a la plataforma.
        </Dialog.Description>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Video <span className="text-red-500">*</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition-colors">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600 text-center px-4">
                {videoFile ? (
                  <span className="text-green-600 font-medium">
                    {videoFile.name}
                  </span>
                ) : (
                  "Haz clic para seleccionar video"
                )}
              </span>
              <span className="text-xs text-gray-400 mt-1">
                Máximo 100MB - MP4, WebM, OGG
              </span>
              <input
                type="file"
                accept="video/mp4,video/webm,video/ogg"
                {...register("video", {
                  required: "El video es obligatorio",
                  validate: {
                    fileSize: (files) => {
                      if (!files?.[0]) return true;
                      const maxSize = 100 * 1024 * 1024; // 100MB
                      return (
                        files[0].size <= maxSize ||
                        "El video no debe superar los 100MB"
                      );
                    },
                    fileType: (files) => {
                      if (!files?.[0]) return true;
                      return (
                        files[0].type.startsWith("video/") ||
                        "Debe ser un archivo de video válido"
                      );
                    },
                  },
                })}
                className="hidden"
                disabled={isLoading}
              />
            </label>
            {errors.video && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.video.message}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Miniatura <span className="text-red-500">*</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition-colors overflow-hidden">
              {thumbnailPreview ? (
                <div className="relative w-full h-full group">
                  <Image
                    src={thumbnailPreview}
                    alt="Preview miniatura"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-sm font-medium">
                      Cambiar imagen
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Haz clic para seleccionar imagen
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    Máximo 5MB - JPG, PNG, WebP
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                {...register("thumbnail", {
                  required: "La miniatura es obligatoria",
                  validate: {
                    fileSize: (files) => {
                      if (!files?.[0]) return true;
                      const maxSize = 5 * 1024 * 1024; // 5MB
                      return (
                        files[0].size <= maxSize ||
                        "La imagen no debe superar los 5MB"
                      );
                    },
                    fileType: (files) => {
                      if (!files?.[0]) return true;
                      return (
                        files[0].type.startsWith("image/") ||
                        "Debe ser una imagen válida (JPG, PNG, WebP)"
                      );
                    },
                  },
                  onChange: handleThumbnailChange,
                })}
                className="hidden"
                disabled={isLoading}
              />
            </label>
            {errors.thumbnail && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.thumbnail.message}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <TextField.Root
              placeholder="Título del video"
              {...register("title", {
                required: "El título es obligatorio",
                minLength: {
                  value: 3,
                  message: "El título debe tener al menos 3 caracteres",
                },
                maxLength: {
                  value: 100,
                  message: "El título no debe superar los 100 caracteres",
                },
              })}
              disabled={isLoading}
            />
            {errors.title && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.title.message}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Descripción
            </label>
            <TextArea
              placeholder="Describe tu video..."
              {...register("description", {
                maxLength: {
                  value: 500,
                  message: "La descripción no debe superar los 500 caracteres",
                },
              })}
              disabled={isLoading}
              rows={4}
            />
            {errors.description && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.description.message}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Categoría</label>
            <Controller
              name="category"
              control={control}
              rules={{ required: "La categoría es obligatoria" }}
              render={({ field }) => (
                <Select.Root
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading}
                >
                  <Select.Trigger className="w-full" />
                  <Select.Content>
                    {categories.map((cat) => (
                      <Select.Item key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              )}
            />
            {errors.category && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.category.message}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="soft"
              color="gray"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-linear-to-r from-[#ef4343] to-[#ff5724] text-white"
            >
              {isLoading ? "Subiendo..." : "Publicar Video"}
            </Button>
          </div>
        </form>

        <Dialog.Close>
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            disabled={isLoading}
            onClick={resetForm}
          >
            <X className="h-5 w-5" />
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
};
