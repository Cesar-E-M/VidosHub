-- ==========================================
-- CONFIGURACIÓN DE VERIFICACIÓN DE EMAIL
-- ==========================================
-- Ejecuta esto en el SQL Editor de Supabase Dashboard
-- para asegurar que solo usuarios verificados puedan acceder

-- 1. POLÍTICA: Solo usuarios con email confirmado pueden acceder
CREATE POLICY "users_must_verify_email"
ON auth.users
FOR ALL
USING (email_confirmed_at IS NOT NULL);

-- 2. POLÍTICA: Solo usuarios verificados pueden subir videos
-- (Ajusta el nombre de tu tabla si es diferente)
DROP POLICY IF EXISTS "verified_users_only" ON public.videos;

CREATE POLICY "verified_users_only"
ON public.videos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email_confirmed_at IS NOT NULL
  )
);

-- 3. POLÍTICA: Solo usuarios verificados pueden actualizar datos
CREATE POLICY "verified_users_can_update"
ON public.videos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email_confirmed_at IS NOT NULL
  )
);

-- 4. Crear función para verificar email en cualquier tabla
CREATE OR REPLACE FUNCTION is_email_verified()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email_confirmed_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER: Prevenir creación de perfiles sin email verificado
-- (Si tienes una tabla de perfiles/profiles)
CREATE OR REPLACE FUNCTION check_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_email_verified() THEN
    RAISE EXCEPTION 'Debes verificar tu email antes de crear un perfil';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tabla de perfiles (ajusta el nombre si es diferente)
-- DROP TRIGGER IF EXISTS enforce_email_verification ON public.profiles;
-- CREATE TRIGGER enforce_email_verification
--   BEFORE INSERT ON public.profiles
--   FOR EACH ROW
--   EXECUTE FUNCTION check_email_verified();

-- ==========================================
-- CONFIGURACIÓN ADICIONAL
-- ==========================================

-- Tiempo de expiración de tokens (valores en segundos)
-- Configura estas variables en tu Dashboard de Supabase:
-- Authentication → Settings → Auth

-- MAILER_OTP_EXPIRY=3600 (1 hora)
-- EMAIL_CONFIRMATION_TOKEN_VALIDITY=86400 (24 horas)
-- PASSWORD_RECOVERY_TOKEN_VALIDITY=3600 (1 hora)

-- ==========================================
-- CONSULTAS ÚTILES PARA ADMINISTRACIÓN
-- ==========================================

-- Ver usuarios sin verificar (para limpieza manual)
-- SELECT id, email, created_at, email_confirmed_at
-- FROM auth.users
-- WHERE email_confirmed_at IS NULL
-- AND created_at < NOW() - INTERVAL '7 days';

-- Eliminar usuarios antiguos sin verificar (más de 7 días)
-- DELETE FROM auth.users
-- WHERE email_confirmed_at IS NULL
-- AND created_at < NOW() - INTERVAL '7 days';

-- Ver estadísticas de verificación
-- SELECT 
--   COUNT(*) as total_users,
--   COUNT(email_confirmed_at) as verified_users,
--   COUNT(*) - COUNT(email_confirmed_at) as unverified_users,
--   ROUND(100.0 * COUNT(email_confirmed_at) / COUNT(*), 2) as verification_rate
-- FROM auth.users;
