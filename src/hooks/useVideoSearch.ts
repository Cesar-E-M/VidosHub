import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/lib/supabase";

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  user_id: string;
  created_at: string;
}

export const useVideoSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const searchVideos = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("videos")
          .select("*")
          .or(
            `title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`
          )
          .limit(10);

        if (error) throw error;

        setResults(data || []);
        setIsOpen(true);
      } catch (error) {
        console.error("Error searching videos:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchVideos();
  }, [debouncedQuery]);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    isOpen,
    setIsOpen,
    clearSearch,
  };
};
