"use client";
import { useUploadModal } from "@/hooks/useUploadModal";
import { Dialog, TextField, TextArea, Button, Select } from "@radix-ui/themes";
import { Upload, X, Video as VideoIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
import Image from "next/image";

export const UploadModal = () => {
  const { isOpen, onClose } = useUploadModal();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
  });

  const onReset = () => {
    setFormData({ title: "", description: "", category: "general" });
    setVideoFile(null);
    setThumbnailFile(null);
  };

  const categories = [
    "General",
    "Educación",
    "Gaming",
    "Música",
    "Deportes",
    "Tecnología",
    "Entretenimiento",
    "Noticias",
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
      setVideoFile(file);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Imagen muy grande",
          description: "La miniatura no debe superar los 5MB",
          variant: "destructive",
        });
        return;
      }
      setThumbnailFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      // 1. Subir video
      const videoFileName = `${Date.now()}-${videoFile.name}`;
      const { error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoFileName, videoFile);

      if (videoError) throw videoError;

      // 2. Subir miniatura
      const thumbnailFileName = `${Date.now()}-${thumbnailFile.name}`;
      const { error: thumbnailError } = await supabase.storage
        .from("thumbnails")
        .upload(thumbnailFileName, thumbnailFile);

      if (thumbnailError) throw thumbnailError;

      // 3. Obtener URLs públicas
      const { data: videoUrl } = supabase.storage
        .from("videos")
        .getPublicUrl(videoFileName);

      const { data: thumbnailUrl } = supabase.storage
        .from("thumbnails")
        .getPublicUrl(thumbnailFileName);

      // 4. Guardar en la base de datos
      const { error: dbError } = await supabase.from("videos").insert({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        video_url: videoUrl.publicUrl,
        thumbnail_url: thumbnailUrl.publicUrl,
        user_id: "temp-user-id", // Reemplazar con ID real del usuario
        duration: "0:00", // Puedes calcular esto con JavaScript
      });

      if (dbError) throw dbError;

      toast({
        title: "¡Video subido!",
        description: "Tu video ha sido publicado exitosamente",
      });

      // Resetear formulario
      setFormData({ title: "", description: "", category: "general" });
      setVideoFile(null);
      setThumbnailFile(null);
      onClose();
    } catch (error) {
      toast({
        title: "Error al subir",
        description:
          error instanceof Error ? error.message : "Ocurrió un error",
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
              <span className="text-xs text-gray-400 mt-1">Máximo 100MB</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Miniatura <span className="text-red-500">*</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition-colors">
              {thumbnailFile ? (
                <Image
                  src={URL.createObjectURL(thumbnailFile)}
                  alt="Preview"
                  className="h-full w-full object-cover rounded-lg"
                  width={500}
                  height={500}
                />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Haz clic para seleccionar imagen
                  </span>
                  <span className="text-xs text-gray-400 mt-1">Máximo 5MB</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
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
                  <Select.Item key={cat} value={cat.toLowerCase()}>
                    {cat}
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
                onReset();
                onClose();
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-lineal-to-r from-[#ef4343] to-[#ff5724]"
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
