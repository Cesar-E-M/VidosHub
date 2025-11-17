import { Video } from "lucide-react";
import Link from "next/link";

export const Header = () => {
  return (
    <section className="px-8 sticky top-0 z-50 w-full border-b border-gray-200 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/0">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex gap-2 items-center hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-linear-to-r from-[#ef4343] to-[#ff5724]">
            <Video size={20} strokeWidth={2} className="text-white"></Video>
          </div>
          <h1 className="text-xl font-bold">VideoHub</h1>
        </Link>
        <div className="flex items-center gap-3">
          <button className="flex items-center rounded-xl px-1 justify-center h-10 w-28 text-white font-medium bg-linear-to-r from-[#ef4343] to-[#ff5724] text-sm">
            Iniciar Sesión
          </button>
        </div>
      </div>
    </section>
  );
};
