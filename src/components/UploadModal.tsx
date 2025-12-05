"use client";

import { useState } from "react";
import { useUploadModal } from "@/hooks/useUploadModal";
import { Dialog, TextField, TextArea, Button, Select } from "@radix-ui/themes";
import {
  Upload,
  X,
  Video as VideoIcon,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/context/useAuth"; // ✅ Importar useAuth
import Image from "next/image"; // ✅ Importación correcta

export const UploadModal = () => {
  const { isOpen, onClose } = useUploadModal();
  const { toast } = useToast();
  const { user } = useAuth(); // ✅ Obtener usuario autenticado

  const [isLoading, setIsLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null); // ✅ Preview separado
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
  });

  const categories = [
    "general",
    "educacion",
    "gaming",
    "musica",
    "deportes",
    "tecnologia",
    "entretenimiento",
    "noticias",
  ];

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El video no debe superar los 100MB",
          variant: "destructive",
        });
        return;
      }

      // ✅ Validar tipo
      if (!file.type.startsWith("video/")) {
        toast({
          title: "Tipo incorrecto",
          description: "Debes seleccionar un archivo de video",
          variant: "destructive",
        });
        return;
      }

      setVideoFile(file);
      console.log("✅ Video seleccionado:", file.name);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Imagen muy grande",
          description: "La miniatura no debe superar los 5MB",
          variant: "destructive",
        });
        return;
      }

      // ✅ Validar tipo de imagen
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Tipo incorrecto",
          description: "Debes seleccionar una imagen (JPG, PNG, WebP)",
          variant: "destructive",
        });
        return;
      }

      // ✅ Limpiar preview anterior
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }

      // ✅ Crear nuevo preview
      const previewUrl = URL.createObjectURL(file);
      setThumbnailFile(file);
      setThumbnailPreview(previewUrl);
      console.log("✅ Thumbnail seleccionado:", file.name);
    }
  };

  // ✅ Limpiar preview al cerrar
  const resetForm = () => {
    setFormData({ title: "", description: "", category: "general" });
    setVideoFile(null);
    setThumbnailFile(null);

    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validar usuario autenticado
    if (!user) {
      toast({
        title: "No autenticado",
        description: "Debes iniciar sesión para subir videos",
        variant: "destructive",
      });
      return;
    }

    if (!videoFile || !thumbnailFile) {
      toast({
        title: "Faltan archivos",
        description: "Debes seleccionar un video y una miniatura",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Título requerido",
        description: "El video debe tener un título",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("🚀 Iniciando subida...");

      // 1. Subir video
      const videoFileName = `${user.id}/${Date.now()}-${videoFile.name.replace(
        /\s+/g,
        "-"
      )}`;
      console.log("📹 Subiendo video:", videoFileName);

      const { error: videoError, data: videoData } = await supabase.storage
        .from("videos")
        .upload(videoFileName, videoFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (videoError) {
        console.error("❌ Error subiendo video:", videoError);
        throw new Error(`Error al subir video: ${videoError.message}`);
      }

      console.log("✅ Video subido:", videoData);

      // 2. Subir miniatura
      const thumbnailFileName = `${user.id}/${Date.now()}-${thumbnailFile.name
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9.-]/g, "_")}`; // ✅ Sanitizar nombre

      console.log("🖼️ Subiendo miniatura a:", thumbnailFileName);
      console.log("📦 Bucket: thumbnails");
      console.log(
        "📄 Archivo:",
        thumbnailFile.name,
        `(${(thumbnailFile.size / 1024).toFixed(2)}KB)`
      );

      const { error: thumbnailError, data: thumbnailData } =
        await supabase.storage
          .from("thumbnails")
          .upload(thumbnailFileName, thumbnailFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: thumbnailFile.type, // ✅ Especificar content type
          });

      if (thumbnailError) {
        console.error("❌ Error completo al subir thumbnail:", thumbnailError);
        console.error("❌ Detalles:", {
          message: thumbnailError.message,
        });

        // ✅ Si falla el thumbnail, eliminar el video ya subido
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

      // 4. Guardar en la base de datos
      console.log("💾 Guardando en BD...");

      const { error: dbError, data: dbData } = await supabase
        .from("videos")
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          video_url: videoUrl.publicUrl,
          thumbnail_url: thumbnailUrl.publicUrl,
          user_id: user.id,
          duration: "0:00",
        })
        .select()
        .single();

      if (dbError) {
        console.error("❌ Error en BD:", dbError);

        // ✅ Limpiar archivos si falla la BD
        await supabase.storage.from("videos").remove([videoFileName]);
        await supabase.storage.from("thumbnails").remove([thumbnailFileName]);

        throw new Error(`Error al guardar: ${dbError.message}`);
      }

      console.log("✅ Video guardado en BD:", dbData);

      toast({
        title: "¡Video subido!",
        description: "Tu video ha sido publicado exitosamente",
      });

      resetForm();
      onClose();

      // Recargar para mostrar el nuevo video
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
      <Dialog.Content style={{ maxWidth: 600 }}>
        <Dialog.Title className="flex items-center gap-2">
          <VideoIcon className="h-5 w-5 text-red-500" />
          Subir Video
        </Dialog.Title>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                onChange={handleVideoChange}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          </div>

          {/* Thumbnail Upload */}
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
                    unoptimized // ✅ Necesario para URLs blob
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
                onChange={handleThumbnailChange}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <TextField.Root
              placeholder="Título del video"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Descripción
            </label>
            <TextArea
              placeholder="Describe tu video..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={isLoading}
              rows={4}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Categoría</label>
            <Select.Root
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
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
          </div>

          {/* Actions */}
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
              className="bg-linear-to-r from-[#ef4343] to-[#ff5724] text-white" // ✅ Clase corregida
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
