"use client";

import { useState } from "react";
import { useUploadModal } from "@/hooks/useUploadModal";
import { Dialog, TextField, TextArea, Button, Select } from "@radix-ui/themes";
import { Upload, X, Video as VideoIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/context/useAuth";

export const UploadModal = () => {
  const { isOpen, onClose } = useUploadModal();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
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
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El video no debe superar los 100MB",
          variant: "destructive",
        });
        return;
      }
      // Validar tipo de archivo
      if (!file.type.startsWith("video/")) {
        toast({
          title: "Tipo de archivo incorrecto",
          description: "Por favor selecciona un archivo de video",
          variant: "destructive",
        });
        return;
      }

      setVideoFile(file);
      console.log("✅ Video seleccionado:", file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "No autenticado",
        description: "Debes iniciar sesión para subir videos",
        variant: "destructive",
      });
      return;
    }
    if (!videoFile) {
      toast({
        title: "Video requerido",
        description: "Debes seleccionar un video",
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
      console.log("🚀 Iniciando subida de video...");

      // 1. Subir video a Supabase Storage
      const videoFileName = `${user.id}/${Date.now()}-${videoFile.name.replace(
        /\s+/g,
        "-"
      )}`;
      console.log("📹 Subiendo video:", videoFileName);

      const { error: videoError, data: uploadData } = await supabase.storage
        .from("videos")
        .upload(videoFileName, videoFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (videoError) {
        console.error("❌ Error al subir video:", videoError);
        throw new Error(`Error al subir video: ${videoError.message}`);
      }

      console.log("✅ Video subido exitosamente:", uploadData);

      // 2. Obtener URL pública del video
      const { data: videoUrlData } = supabase.storage
        .from("videos")
        .getPublicUrl(videoFileName);

      console.log("🔗 URL del video:", videoUrlData.publicUrl);

      // 3. Guardar metadata en la base de datos
      console.log("💾 Guardando en base de datos...");

      const videoData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        video_url: videoUrlData.publicUrl,
        user_id: user.id,
      };

      console.log("📝 Datos a insertar:", videoData);

      const { error: dbError, data: dbData } = await supabase
        .from("videos")
        .insert(videoData)
        .select()
        .single();

      if (dbError) {
        console.error("❌ Error en base de datos:", dbError);
        // Limpiar el video subido si falla la BD
        await supabase.storage.from("videos").remove([videoFileName]);
        throw new Error(`Error al guardar: ${dbError.message}`);
      }

      console.log("✅ Video guardado en BD:", dbData);

      toast({
        title: "¡Video subido!",
        description: "Tu video ha sido publicado exitosamente",
      });

      // Resetear formulario
      setFormData({ title: "", description: "", category: "general" });
      setVideoFile(null);
      onClose();

      // Recargar después de un pequeño delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("💥 Error general:", error);
      toast({
        title: "Error al subir video",
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
          <div>
            <label className="block text-sm font-medium mb-2">
              Video <span className="text-red-500">*</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition-colors">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                {videoFile ? videoFile.name : "Haz clic para seleccionar video"}
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

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="soft"
              color="gray"
              onClick={() => {
                setFormData({
                  title: "",
                  description: "",
                  category: "general",
                });
                setVideoFile(null);
                onClose();
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-linear-to-r from-[#ef4343] to-[#ff5724]"
            >
              {isLoading ? "Subiendo..." : "Publicar Video"}
            </Button>
          </div>
        </form>

        <Dialog.Close>
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
};
