export default function Footer() {
  return (
    <footer className="bg-gray-800 dark:bg-gray-950 text-white py-4 mt-auto">
      <div className="container mx-auto text-center">
        <p>
          &copy; {new Date().getFullYear()} VEXO. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
