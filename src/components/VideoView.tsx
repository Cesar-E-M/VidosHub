import { VideoCard } from "@/components/VideoCard";

export const VideoView = () => {
  return (
    <div className="px-8 pb-5 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3  items-center gap-6">
        <VideoCard
          id="1"
          title="Video de ejemplo"
          description="Este es un video de ejemplo para mostrar cómo se ve el VideoCard."
          thumbnail="https://via.placeholder.com/300x200.png?text=Thumbnail"
          duration="5:30"
          category="Deportes"
          likesCount={120}
          commentsCount={45}
          userHasLiked={false}
          username="UsuarioEjemplo"
          userId="123"
          currentUserId="123"
        />
        <VideoCard
          id="2"
          title="Otro video de ejemplo"
          description="Este es otro video de ejemplo para mostrar cómo se ve el VideoCard."
          thumbnail="https://via.placeholder.com/300x200.png?text=Thumbnail"
          duration="3:45"
          category="Educación"
          likesCount={80}
          commentsCount={20}
          userHasLiked={true}
          username="OtroUsuario"
          userId="456"
          currentUserId="456"
        />
        <VideoCard
          id="3"
          title="Tercer video de ejemplo"
          description="Este es el tercer video de ejemplo para mostrar cómo se ve el VideoCard."
          thumbnail="https://via.placeholder.com/300x200.png?text=Thumbnail"
          duration="10:15"
          category="Música"
          likesCount={200}
          commentsCount={60}
          userHasLiked={false}
          username="TercerUsuario"
          userId="789"
          currentUserId="789"
        />
        <VideoCard
          id="4"
          title="Cuarto video de ejemplo"
          description="Este es el cuarto video de ejemplo para mostrar cómo se ve el VideoCard."
          thumbnail="https://via.placeholder.com/300x200.png?text=Thumbnail"
          duration="7:20"
          category="Deportes"
          likesCount={150}
          commentsCount={30}
          userHasLiked={true}
          username="CuartoUsuario"
          userId="101"
          currentUserId="101"
        />
        <VideoCard
          id="5"
          title="Quinto video de ejemplo"
          description="Este es el quinto video de ejemplo para mostrar cómo se ve el VideoCard."
          thumbnail="https://via.placeholder.com/300x200.png?text=Thumbnail"
          duration="6:10"
          category="Tecnología"
          likesCount={90}
          commentsCount={25}
          userHasLiked={false}
          username="QuintoUsuario"
          userId="102"
          currentUserId="102"
        />
        <VideoCard
          id="6"
          title="Sexto video de ejemplo"
          description="Este es el sexto video de ejemplo para mostrar cómo se ve el VideoCard."
          thumbnail="https://via.placeholder.com/300x200.png?text=Thumbnail"
          duration="8:45"
          category="Ciencia"
          likesCount={110}
          commentsCount={40}
          userHasLiked={true}
          username="SextoUsuario"
          userId="103"
          currentUserId="103"
        />
      </div>
    </div>
  );
};
