"use client";
import { Video, Upload, LogOut, Search } from "lucide-react";
import Link from "next/link";
import { useUploadModal } from "@/hooks/useUploadModal";
import { useAuth } from "@/hooks/context/useAuth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

export const Header = () => {
  const { user, signOut } = useAuth();
  const { onOpen } = useUploadModal();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Sesión cerrada",
        description: "Hasta pronto!",
      });
      router.push("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <section className="px-8 sticky top-0 z-50 w-full border-b border-gray-300 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/0">
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

          <li className="mx-4 hidden max-w-lg grow px-2 md:flex">
            <div className="bg-secondary relative flex grow items-center rounded-lg">
              <Search className="absolute left-0 size-8 p-2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar calzado... "
                className="w-full rounded-md bg-transparent border border-gray-200 py-2 pl-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              />
            </div>
          </li>

          <section className="flex items-center gap-3">
            {!user && (
              <Link href="/login">
                <button
                  onClick={() => router.push("/login")}
                  className="cursor-pointer flex items-center rounded-xl px-4 justify-center h-10 text-white font-medium bg-linear-to-r from-[#ef4343] to-[#ff5724] text-sm hover:opacity-90 transition-opacity"
                >
                  Iniciar Sesión
                </button>
              </Link>
            )}
            {user && (
              <>
                <button
                  onClick={onOpen}
                  className="cursor-pointer flex items-center rounded-xl px-4 justify-center gap-2 h-10 text-white font-medium bg-linear-to-r from-[#ef4343] to-[#ff5724] text-sm hover:opacity-90 transition-opacity"
                >
                  <Upload className="h-5 w-5" />
                  Subir Video
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">
                      {user.user_metadata?.full_name || "Usuario"}
                    </span>
                    <span className="text-xs text-gray-500">{user.email}</span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </>
  );
};
