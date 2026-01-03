"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Verificar el estado de autenticación
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.email_confirmed_at) {
          setStatus("success");
          setTimeout(() => {
            router.push("/");
          }, 3000);
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Error confirmando email:", error);
        setStatus("error");
      }
    };

    confirmEmail();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Confirmando tu email...</h2>
            <p className="text-gray-600">Por favor espera un momento</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">¡Email confirmado!</h2>
            <p className="text-gray-600 mb-4">
              Tu cuenta ha sido verificada correctamente
            </p>
            <p className="text-sm text-gray-500">
              Serás redirigido en unos segundos...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error de verificación</h2>
            <p className="text-gray-600 mb-6">
              No pudimos verificar tu email. El enlace puede haber expirado.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
}
