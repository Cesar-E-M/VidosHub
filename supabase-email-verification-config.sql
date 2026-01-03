-- Configurar políticas de seguridad para verificación de email
-- Ejecuta esto en el SQL Editor de Supabase Dashboard

-- Solo permitir acceso a usuarios con email confirmado
CREATE POLICY "Users must verify email"
ON auth.users
FOR ALL
USING (email_confirmed_at IS NOT NULL);

-- Política para la tabla de videos (si la tienes)
-- Asegura que solo usuarios verificados puedan subir videos
CREATE POLICY "Only verified users can upload"
ON public.videos
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE email_confirmed_at IS NOT NULL
  )
);

-- Configuración adicional: establecer tiempo de expiración para tokens
-- Estos son valores sugeridos (en segundos)
-- MAILER_OTP_EXPIRY=3600 (1 hora)
-- EMAIL_CONFIRMATION_TOKEN_VALIDITY=86400 (24 horas)
