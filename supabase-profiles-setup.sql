-- ==========================================
-- CONFIGURACIÓN DE LA TABLA DE PERFILES
-- ==========================================
-- Ejecuta esto en el SQL Editor de Supabase Dashboard

-- Crear tabla de perfiles si no existe
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  cover_image TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede ver perfiles
CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
USING (true);

-- Política: Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Política: Los usuarios pueden insertar su propio perfil
CREATE POLICY "profiles_insert_policy"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Función para crear perfil automáticamente cuando un usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- ==========================================
-- AGREGAR COLUMNAS A LA TABLA DE VIDEOS
-- ==========================================

-- Agregar columnas de estadísticas si no existen
ALTER TABLE public.videos 
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0; -- duración en segundos

-- Función para incrementar vistas
CREATE OR REPLACE FUNCTION public.increment_video_views(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.videos 
  SET views = COALESCE(views, 0) + 1 
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- DATOS INICIALES PARA TESTING (OPCIONAL)
-- ==========================================

-- Insertar perfiles para usuarios existentes que no tengan perfil
-- INSERT INTO public.profiles (id, full_name, email, username)
-- SELECT 
--   au.id,
--   au.raw_user_meta_data->>'name' as full_name,
--   au.email,
--   COALESCE(au.raw_user_meta_data->>'username', SPLIT_PART(au.email, '@', 1)) as username
-- FROM auth.users au
-- LEFT JOIN public.profiles p ON au.id = p.id
-- WHERE p.id IS NULL
-- ON CONFLICT (id) DO NOTHING;
