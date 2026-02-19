/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Tabs } from "@radix-ui/themes";
import { useAuth } from "@/hooks/context/useAuth";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  validateEmail,
  normalizeEmail,
  isValidGmailFormat,
} from "@/lib/emailValidation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
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

  // Estados para validación de campos vacíos
  const [loginErrors, setLoginErrors] = useState({
    email: false,
    password: false,
  });
  const [registerErrors, setRegisterErrors] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const errors = {
    email: !loginData.email,
    password: !loginData.password,
  };
  setLoginErrors(errors);

  // Validación en tiempo real
  const isLoginEmailInvalid =
    loginData.email.length > 0 && !isValidGmailFormat(loginData.email);
  const isRegisterEmailInvalid =
    registerData.email.length > 0 && !isValidGmailFormat(registerData.email);

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

    // Normalizar el email
    const normalizedEmail = normalizeEmail(loginData.email);

    // Validación completa del correo
    setIsValidatingEmail(true);
    const validation = await validateEmail(normalizedEmail);
    setIsValidatingEmail(false);

    if (!validation.valid) {
      toast({
        title: "Correo inválido",
        description: validation.errors[0] || "El correo no es válido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await signIn(normalizedEmail, loginData.password);

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

    const errors = {
      name: !registerData.name,
      email: !registerData.email,
      password: !registerData.password,
      confirmPassword: !registerData.confirmPassword,
    };
    setRegisterErrors(errors);

    if (
      !registerData.name ||
      !registerData.email ||
      !registerData.password ||
      !registerData.confirmPassword
    ) {
      toast({
        title: "Campos vacíos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    // Normalizar el email
    const normalizedEmail = normalizeEmail(registerData.email);

    // Validación completa del correo
    setIsValidatingEmail(true);
    const validation = await validateEmail(normalizedEmail);
    setIsValidatingEmail(false);

    if (!validation.valid) {
      toast({
        title: "Correo inválido",
        description: validation.errors.join(". "),
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
      // Verificar si el correo ya está registrado ANTES de intentar registrarse
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existingUser) {
        toast({
          title: "Correo ya registrado",
          description:
            "Este correo ya está en uso. Por favor inicia sesión o usa otro correo.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      await signUp(normalizedEmail, registerData.password, registerData.name);

      toast({
        title: "¡Cuenta creada!",
        description:
          "Por favor revisa tu correo para confirmar tu cuenta. Solo podrás usar la cuenta después de verificar tu email.",
      });

      // Limpiar campos
      setRegisterData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setRegisterErrors({
        name: false,
        email: false,
        password: false,
        confirmPassword: false,
      });
    } catch (error: any) {
      // Manejar diferentes tipos de errores
      let errorMessage = "No se pudo crear la cuenta";

      if (error?.message?.includes("User already registered")) {
        errorMessage =
          "Este correo ya está registrado. Por favor inicia sesión.";
      } else if (error?.message?.includes("duplicate")) {
        errorMessage = "Este correo ya está en uso.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Error al registrarse",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // La redirección la maneja Supabase automáticamente
    } catch (err) {
      console.error("Error en autenticación con Google:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "No se pudo iniciar sesión con Google",
        variant: "destructive",
      });
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
                  placeholder="tu@gmail.com"
                  value={loginData.email}
                  onChange={(e) => {
                    setLoginData({ ...loginData, email: e.target.value });
                    setLoginErrors({ ...loginErrors, email: false });
                  }}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 disabled:opacity-50 transition-colors ${
                    loginErrors.email
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : isLoginEmailInvalid
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-red-500 focus:border-transparent"
                  }`}
                />
                {loginErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    Debe llenar este campo
                  </p>
                )}
                {isLoginEmailInvalid && (
                  <p className="mt-1 text-sm text-red-600">
                    Solo se permiten correos de Gmail (@gmail.com)
                  </p>
                )}
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
                  onChange={(e) => {
                    setLoginData({ ...loginData, password: e.target.value });
                    setLoginErrors({ ...loginErrors, password: false });
                  }}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 disabled:opacity-50 transition-colors ${
                    loginErrors.password
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-red-500 focus:border-transparent"
                  }`}
                />
                {loginErrors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    Debe llenar este campo
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || isValidatingEmail}
                className="w-full py-3 px-4 bg-linear-to-r from-[#ef4343] to-[#ff5724] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(isLoading || isValidatingEmail) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isValidatingEmail
                  ? "Validando correo..."
                  : isLoading
                    ? "Iniciando sesión..."
                    : "Iniciar Sesión"}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  O continúa con
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="cursor-pointer w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </button>

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
                  onChange={(e) => {
                    setRegisterData({ ...registerData, name: e.target.value });
                    setRegisterErrors({ ...registerErrors, name: false });
                  }}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 disabled:opacity-50 transition-colors ${
                    registerErrors.name
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-red-500 focus:border-transparent"
                  }`}
                />
                {registerErrors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    Debe llenar este campo
                  </p>
                )}
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
                  placeholder="tu@gmail.com"
                  value={registerData.email}
                  onChange={(e) => {
                    setRegisterData({ ...registerData, email: e.target.value });
                    setRegisterErrors({ ...registerErrors, email: false });
                  }}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 disabled:opacity-50 transition-colors ${
                    registerErrors.email
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : isRegisterEmailInvalid
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-red-500 focus:border-transparent"
                  }`}
                />
                {registerErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    Debe llenar este campo
                  </p>
                )}
                {isRegisterEmailInvalid && !registerErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    Solo se permiten correos de Gmail (@gmail.com)
                  </p>
                )}
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
                  onChange={(e) => {
                    setRegisterData({
                      ...registerData,
                      password: e.target.value,
                    });
                    setRegisterErrors({ ...registerErrors, password: false });
                  }}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 disabled:opacity-50 transition-colors ${
                    registerErrors.password
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-red-500 focus:border-transparent"
                  }`}
                />
                {registerErrors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    Debe llenar este campo
                  </p>
                )}
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
                  onChange={(e) => {
                    setRegisterData({
                      ...registerData,
                      confirmPassword: e.target.value,
                    });
                    setRegisterErrors({
                      ...registerErrors,
                      confirmPassword: false,
                    });
                  }}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 disabled:opacity-50 transition-colors ${
                    registerErrors.confirmPassword
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-red-500 focus:border-transparent"
                  }`}
                />
                {registerErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    Debe llenar este campo
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || isValidatingEmail}
                className="w-full py-3 px-4 bg-linear-to-r from-[#ef4343] to-[#ff5724] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(isLoading || isValidatingEmail) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isValidatingEmail
                  ? "Validando correo..."
                  : isLoading
                    ? "Creando cuenta..."
                    : "Crear Cuenta"}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  O continúa con
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="cursor-pointer w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </button>

            {/* <p className="text-center text-sm text-gray-600">
              Al registrarte, aceptas nuestros{" "}
              <a href="#" className="text-red-500 hover:text-red-600">
                Términos y Condiciones
              </a>
            </p> */}
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
