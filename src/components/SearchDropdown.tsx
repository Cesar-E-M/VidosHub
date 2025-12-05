import Link from "next/link";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
}

interface SearchDropdownProps {
  results: Video[];
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const SearchDropdown = ({
  results,
  isLoading,
  isOpen,
  onClose,
}: SearchDropdownProps) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : results.length > 0 ? (
        <ul className="py-2">
          {results.map((video) => (
            <li key={video.id}>
              <Link
                href={`/video/${video.id}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
              >
                <div className="relative w-24 h-14 rounded overflow-hidden bg-gray-200">
                  {video.thumbnail_url && (
                    <Image
                      src={video.thumbnail_url}
                      alt={video.title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{video.title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {video.description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-4 text-center text-gray-500 text-sm">
          No se encontraron videos
        </div>
      )}
    </div>
  );
};
