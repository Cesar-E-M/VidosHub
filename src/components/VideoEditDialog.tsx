"use client";

import { useState } from "react";
import { Loader2, Edit } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/Dialog";
import { Button, TextArea } from "@radix-ui/themes";
import * as Select from "@radix-ui/react-select";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";

interface VideoEditDialogProps {
  videoId: string;
  currentTitle: string;
  currentDescription?: string;
  currentCategory?: string;
  onUpdate: (updatedData: {
    title: string;
    description?: string;
    category?: string;
  }) => void;
}

const categories = [
  { value: "gaming", label: "Gaming" },
  { value: "music", label: "Música" },
  { value: "education", label: "Educación" },
  { value: "entertainment", label: "Entretenimiento" },
  { value: "sports", label: "Deportes" },
  { value: "technology", label: "Tecnología" },
  { value: "vlogs", label: "Vlogs" },
  { value: "cooking", label: "Cocina" },
  { value: "travel", label: "Viajes" },
  { value: "other", label: "Otro" },
];

export function VideoEditDialog({
  videoId,
  currentTitle,
  currentDescription = "",
  currentCategory = "other",
  onUpdate,
}: VideoEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription);
  const [category, setCategory] = useState(currentCategory);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "El título no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("videos")
        .update({
          title: title.trim(),
          description: description.trim(),
          category: category,
          updated_at: new Date().toISOString(),
        })
        .eq("id", videoId);

      if (error) throw error;

      toast({
        title: "Video actualizado",
        description: "Los cambios se guardaron correctamente",
      });

      onUpdate({
        title: title.trim(),
        description: description.trim(),
        category,
      });
      setOpen(false);
    } catch (error) {
      console.error("Error updating video:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el video",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white dark:bg-gray-800/30">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="absolute top-2 left-2 p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-sm hover:shadow-md transition-all z-10"
            title="Editar video"
            onClick={(e) => e.stopPropagation()}
          >
            <Edit className="h-4 w-4 text-gray-600 hover:text-blue-500 transition-colors" />
          </button>
        </DialogTrigger>
        <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              Editar video
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Actualiza la información de tu video
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Título *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del video"
                maxLength={100}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-gray-100"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {title.length}/100 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Descripción
              </label>
              <TextArea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu video..."
                maxLength={500}
                rows={4}
                className="w-full min-h-[100px] resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {description.length}/500 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="category"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Categoría
              </label>
              <Select.Root value={category} onValueChange={setCategory}>
                <Select.Trigger className="inline-flex items-center justify-between w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-gray-100">
                  <Select.Value placeholder="Selecciona una categoría" />
                  <Select.Icon>
                    <ChevronDownIcon className="w-4 h-4" />
                  </Select.Icon>
                </Select.Trigger>

                <Select.Portal>
                  <Select.Content className="overflow-hidden bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-white dark:bg-gray-800 cursor-default">
                      <ChevronUpIcon />
                    </Select.ScrollUpButton>

                    <Select.Viewport className="p-1">
                      {categories.map((cat) => (
                        <Select.Item
                          key={cat.value}
                          value={cat.value}
                          className="relative flex items-center px-8 py-2 rounded-md text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none select-none data-[highlighted]:bg-gray-100 data-[highlighted]:dark:bg-gray-700"
                        >
                          <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                            <CheckIcon className="w-4 h-4" />
                          </Select.ItemIndicator>
                          <Select.ItemText>{cat.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>

                    <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-white dark:bg-gray-800 cursor-default">
                      <ChevronDownIcon />
                    </Select.ScrollDownButton>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
