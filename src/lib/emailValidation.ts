/**
 * Validación avanzada de correos electrónicos
 */

// Expresión regular RFC 5322 para validar el formato del email
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Expresión regular específica para Gmail
const GMAIL_REGEX = /^[a-zA-Z0-9](\.?[a-zA-Z0-9_-]){0,}@gmail\.com$/i;

/**
 * Valida que el correo tenga un formato válido según RFC 5322
 */
export const isValidEmailFormat = (email: string): boolean => {
  if (!email || email.length > 254) return false;
  return EMAIL_REGEX.test(email);
};

/**
 * Valida que sea un correo de Gmail válido
 */
export const isValidGmailFormat = (email: string): boolean => {
  if (!email) return false;
  const trimmedEmail = email.trim().toLowerCase();

  // Verificar formato básico
  if (!GMAIL_REGEX.test(trimmedEmail)) return false;

  // Extraer la parte local (antes del @)
  const localPart = trimmedEmail.split("@")[0];

  // Reglas específicas de Gmail:
  // 1. Debe tener entre 6 y 30 caracteres
  if (localPart.length < 6 || localPart.length > 30) return false;

  // 2. No puede comenzar o terminar con punto
  if (localPart.startsWith(".") || localPart.endsWith(".")) return false;

  // 3. No puede tener puntos consecutivos
  if (localPart.includes("..")) return false;

  return true;
};

/**
 * Verifica si el dominio del correo tiene registros MX válidos
 * Esta función requiere una API externa o backend
 */
export const verifyEmailDomain = async (
  email: string
): Promise<{
  valid: boolean;
  message: string;
}> => {
  try {
    const domain = email.split("@")[1];

    if (!domain) {
      return { valid: false, message: "Formato de correo inválido" };
    }

    // Verificar que el dominio sea gmail.com
    if (domain.toLowerCase() !== "gmail.com") {
      return { valid: false, message: "Solo se permiten correos de Gmail" };
    }

    // Gmail siempre tiene registros MX válidos, pero podríamos verificar conectividad
    // Para una verificación más robusta, podrías implementar una API de backend
    // que use dns.resolveMx() en Node.js

    return { valid: true, message: "Dominio válido" };
  } catch (error) {
    console.error("Error verificando dominio:", error);
    return { valid: false, message: "No se pudo verificar el dominio" };
  }
};

/**
 * Lista negra de patrones comunes de correos temporales o falsos
 */
const DISPOSABLE_DOMAINS = [
  "tempmail.com",
  "throwaway.email",
  "guerrillamail.com",
  "10minutemail.com",
  "mailinator.com",
  "trashmail.com",
  "maildrop.cc",
  "sharklasers.com",
];

/**
 * Verifica si el correo pertenece a un servicio de correo temporal
 */
export const isDisposableEmail = (email: string): boolean => {
  const domain = email.split("@")[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.some((disposable) => domain === disposable);
};

/**
 * Validación completa del correo
 */
export const validateEmail = async (
  email: string
): Promise<{
  valid: boolean;
  errors: string[];
}> => {
  const errors: string[] = [];

  // 1. Verificar formato básico
  if (!isValidEmailFormat(email)) {
    errors.push("El formato del correo no es válido");
  }

  // 2. Verificar que sea Gmail
  if (!email.toLowerCase().endsWith("@gmail.com")) {
    errors.push("Solo se permiten correos de Gmail (@gmail.com)");
  }

  // 3. Verificar formato específico de Gmail
  if (!isValidGmailFormat(email)) {
    errors.push(
      "El formato del correo de Gmail no es válido (6-30 caracteres, sin puntos al inicio/final)"
    );
  }

  // 4. Verificar que no sea correo temporal
  if (isDisposableEmail(email)) {
    errors.push("No se permiten correos temporales");
  }

  // 5. Verificar dominio
  const domainCheck = await verifyEmailDomain(email);
  if (!domainCheck.valid) {
    errors.push(domainCheck.message);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Normaliza el correo (quita espacios, convierte a minúsculas)
 */
export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};
