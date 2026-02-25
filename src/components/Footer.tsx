import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-card text-black dark:text-white py-4 mt-auto">
      <div className="container mx-auto text-center">
        <p>
          &copy; {new Date().getFullYear()} {<Link href="/">Muñoz Dev`s</Link>}.
          Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
