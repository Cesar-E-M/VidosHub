import { Video } from "lucide-react";

export const Header = () => {
  return (
    <section className="w-full h-16 bg-white text-black flex items-center px-8 border-b border-gray-200">
      <div className="flex justify-between w-full">
        <div className="flex gap-2 items-center">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-r from-[#ef4343] to-[#ff5724]">
            <Video size={20} strokeWidth={2} className="text-white"></Video>
          </div>
          <h1 className="text-xl font-bold">VideoHub</h1>
        </div>
        <button className="flex items-center rounded-lg px-1 justify-center h-9 w-26 text-white font-medium bg-gradient-to-r from-[#ef4343] to-[#ff5724] text-sm">
          Iniciar Sesión
        </button>
      </div>
    </section>
  );
};
