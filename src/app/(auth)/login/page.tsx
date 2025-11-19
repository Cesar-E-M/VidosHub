"use client";

import { useState } from "react";
import { Tabs } from "@radix-ui/themes";
import { useAuth } from "@/hooks/context/useAuth";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      toast({
        title: "Campos vacíos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await signIn(loginData.email, loginData.password);

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
      });

      router.push("/");
    } catch (error) {
      toast({
        title: "Error al iniciar sesión",
        description:
          error instanceof Error ? error.message : "Credenciales inválidas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerData.name || !registerData.email || !registerData.password) {
      toast({
        title: "Campos vacíos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "Por favor verifica tu contraseña",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await signUp(
        registerData.email,
        registerData.password,
        registerData.name
      );

      toast({
        title: "¡Cuenta creada!",
        description: "Bienvenido a VideoHub",
      });

      router.push("/");
    } catch (error) {
      toast({
        title: "Error al registrarse",
        description:
          error instanceof Error ? error.message : "No se pudo crear la cuenta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Bienvenido a VideoHub</h2>
          <p className="mt-2 text-sm text-gray-600">
            Inicia sesión o crea tu cuenta
          </p>
        </div>

        <Tabs.Root defaultValue="login">
          <Tabs.List className="flex gap-2 border-b border-gray-200 mb-6">
            <Tabs.Trigger
              value="login"
              className="flex-1 pb-3 px-4 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:text-red-600 hover:text-red-500 transition-colors"
              disabled={isLoading}
            >
              Iniciar Sesión
            </Tabs.Trigger>
            <Tabs.Trigger
              value="register"
              className="flex-1 pb-3 px-4 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:text-red-600 hover:text-red-500 transition-colors"
              disabled={isLoading}
            >
              Registrarse
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-linear-to-r from-[#ef4343] to-[#ff5724] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600">
              ¿Olvidaste tu contraseña?{" "}
              <a href="#" className="text-red-500 hover:text-red-600">
                Recupérala aquí
              </a>
            </p>
          </Tabs.Content>

          <Tabs.Content value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nombre completo
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Juan Pérez"
                  value={registerData.name}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, name: e.target.value })
                  }
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Correo electrónico
                </label>
                <input
                  id="register-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, email: e.target.value })
                  }
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Contraseña
                </label>
                <input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      password: e.target.value,
                    })
                  }
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirmar contraseña
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      confirmPassword: e.target.value,
                    })
                  }
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-linear-to-r from-[#ef4343] to-[#ff5724] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600">
              Al registrarte, aceptas nuestros{" "}
              <a href="#" className="text-red-500 hover:text-red-600">
                Términos y Condiciones
              </a>
            </p>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
