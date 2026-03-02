import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-background dark:bg-card py-4 mt-auto border-t-2 border-gray-200 dark:border-gray-700">
      <div className="container mx-auto text-center">
        <p className="text-foreground dark:text-foreground/80">
          &copy; {new Date().getFullYear()} {<Link href="/">Muñoz Dev`s</Link>}.
          Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
