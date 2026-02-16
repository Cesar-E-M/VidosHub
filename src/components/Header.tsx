"use client";
import { Video, Upload, LogOut, Search, X, User } from "lucide-react";
import Link from "next/link";
import { useUploadModal } from "@/hooks/useUploadModal";
import { useAuth } from "@/hooks/context/useAuth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useVideoSearch } from "@/hooks/useVideoSearch";
import { SearchDropdown } from "@/components/SearchDropdown";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";

export const Header = () => {
  const { user, profile, signOut } = useAuth();
  const { onOpen } = useUploadModal();
  const router = useRouter();
  const { toast } = useToast();

  const {
    query,
    setQuery,
    results,
    isLoading,
    isOpen,
    setIsOpen,
    clearSearch,
  } = useVideoSearch();

  const searchRef = useRef<HTMLDivElement>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node) &&
        searchButtonRef.current &&
        !searchButtonRef.current.contains(event.target as Node)
      ) {
        setShowMobileSearch(false);
      }
    };

    if (showMobileSearch) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMobileSearch]);

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
  // Avatar menu state
  const [isAbierto, setIsAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleMenu = () => setIsAbierto(!isAbierto);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAbierto(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <>
      <section className="px-8 sticky top-0 z-50 w-full border-b border-gray-300 bg-white shadow-sm">
        <div className=" flex h-16 items-center justify-between mx-auto">
          <Link
            href="/"
            className="flex gap-2 items-center hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-linear-to-r from-[#ef4343] to-[#ff5724]">
              <Video size={20} strokeWidth={2} className="text-white"></Video>
            </div>
            <h1 className="text-xl font-bold">VideoHub</h1>
          </Link>
          <div
            ref={searchRef}
            className="mx-4 hidden max-w-lg grow px-2 sm:flex relative"
          >
            <div className="bg-secondary relative flex grow items-center rounded-lg">
              <Search className="absolute left-0 size-8 p-2 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar videos..."
                className="w-full rounded-md bg-transparent border border-gray-200 py-2 pl-10 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>

            <SearchDropdown
              results={results}
              isLoading={isLoading}
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
            />
          </div>

          <section className="flex items-center gap-3">
            <button
              ref={searchButtonRef}
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="sm:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Search className="h-5 w-5 text-gray-700" />
            </button>

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
                  className="hidden sm:flex cursor-pointer  items-center rounded-xl px-4 justify-center gap-2 h-10 text-white font-medium bg-linear-to-r from-[#ef4343] to-[#ff5724] text-sm hover:opacity-90 transition-opacity"
                >
                  <Upload className="h-5 w-5" />
                  Subir Video
                </button>

                <div className="flex relative" ref={menuRef}>
                  <button
                    onClick={toggleMenu}
                    className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-gray-200 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        width={500}
                        height={500}
                      />
                    ) : (
                      <User className="h-5 w-5 text-gray-600" />
                    )}
                  </button>

                  {isAbierto && (
                    <div className="absolute right-0 top-full mt-3 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-100">
                      <Link
                        href="/profile/me"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsAbierto(false)}
                      >
                        Mi Perfil
                      </Link>

                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={onOpen}
                        className="sm:hidden flex cursor-pointer  items-center rounded-xl px-4 justify-center gap-2 h-10 text-white font-medium bg-linear-to-r from-[#ef4343] to-[#ff5724] text-sm hover:opacity-90 transition-opacity"
                      >
                        <Upload className="h-5 w-5" />
                        Subir Video
                      </button>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                      >
                        <LogOut className="inline-block mr-2 h-4 w-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        {showMobileSearch && (
          <div className="sm:hidden pb-4" ref={mobileSearchRef}>
            <div ref={searchRef} className="relative">
              <div className="bg-secondary relative flex items-center rounded-lg">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar videos..."
                  className="w-full rounded-md bg-transparent border border-gray-200 py-2 pl-10 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>

              <SearchDropdown
                results={results}
                isLoading={isLoading}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
              />
            </div>
          </div>
        )}
      </section>
    </>
  );
};
