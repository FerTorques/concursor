-- =========================================================================
-- ESQUEMA SQL PARA SUPABASE
-- Concurso de Traslados y Reincorporaciones N° 55 e Ingreso N° 47
-- Cargos Bibliotecarios (Ley 647-E Art. 266) - Ministerio de Educación Chaco
-- =========================================================================

-- 1. Crear tipo de estado para los cargos
DO $$ BEGIN
    CREATE TYPE estado_cargo AS ENUM ('no_habilitada', 'disponible', 'asignada', 'reservada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Crear tabla principal 'cargos'
CREATE TABLE IF NOT EXISTS public.cargos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden INTEGER NOT NULL UNIQUE,
    region TEXT NOT NULL,
    nombre TEXT NOT NULL,
    bp TEXT DEFAULT '',
    cat TEXT DEFAULT '',
    mod TEXT DEFAULT '',
    zona TEXT DEFAULT '',
    jornada TEXT DEFAULT '',
    localidad TEXT NOT NULL,
    origen TEXT DEFAULT '',
    estado estado_cargo NOT NULL DEFAULT 'disponible',
    
    -- Datos del 1° aspirante (Titular de la vacante)
    titular_nombre TEXT DEFAULT '',
    titular_dni TEXT DEFAULT '',
    titular_puntaje NUMERIC DEFAULT NULL,
    titular_fecha TIMESTAMPTZ DEFAULT NULL,
    
    -- Datos del 2° aspirante (Reserva)
    reserva_nombre TEXT DEFAULT '',
    reserva_dni TEXT DEFAULT '',
    reserva_puntaje NUMERIC DEFAULT NULL,
    reserva_fecha TIMESTAMPTZ DEFAULT NULL,
    
    -- Etiquetas / Resoluciones normativas aplicadas
    etiqueta_normativa TEXT DEFAULT '', -- ej: 'Desafectada por RES-2026-4798', 'Incluida por RES-2026-4409'
    observaciones TEXT DEFAULT '',
    
    -- Metadatos de auditoría y tiempo real
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Crear tabla de historial de auditoría / deshacer
CREATE TABLE IF NOT EXISTS public.historial_cambios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cargo_id UUID REFERENCES public.cargos(id) ON DELETE CASCADE,
    orden INTEGER NOT NULL,
    estado_anterior estado_cargo NOT NULL,
    estado_nuevo estado_cargo NOT NULL,
    datos_anteriores JSONB NOT NULL,
    datos_nuevos JSONB NOT NULL,
    usuario TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Índices para consultas ultra rápidas durante el concurso en vivo
CREATE INDEX IF NOT EXISTS idx_cargos_orden ON public.cargos(orden);
CREATE INDEX IF NOT EXISTS idx_cargos_estado ON public.cargos(estado);
CREATE INDEX IF NOT EXISTS idx_cargos_region ON public.cargos(region);
CREATE INDEX IF NOT EXISTS idx_cargos_localidad ON public.cargos(localidad);
CREATE INDEX IF NOT EXISTS idx_cargos_updated_at ON public.cargos(updated_at DESC);

-- 5. Trigger para actualizar automaticamente 'updated_at'
CREATE OR REPLACE FUNCTION update_cargos_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cargos_timestamp ON public.cargos;
CREATE TRIGGER trg_cargos_timestamp
BEFORE UPDATE ON public.cargos
FOR EACH ROW EXECUTE FUNCTION update_cargos_timestamp();

-- 6. Habilitar Row Level Security (RLS)
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_cambios ENABLE ROW LEVEL SECURITY;

-- 6.1 Permisos de tabla para roles de Supabase (anon y authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.cargos TO anon;
GRANT ALL ON public.cargos TO authenticated;
GRANT ALL ON public.historial_cambios TO authenticated;

-- 7. Políticas de Seguridad (RLS)
-- Lectura pública para la pizarra interactiva (Pizarra en vivo de solo lectura sin login)
DROP POLICY IF EXISTS "Permitir lectura publica de cargos" ON public.cargos;
CREATE POLICY "Permitir lectura publica de cargos"
    ON public.cargos FOR SELECT
    USING (true);

-- Modificación solo para usuarios autenticados (Admin) o rol autorizado
DROP POLICY IF EXISTS "Permitir modificacion a administradores autenticados" ON public.cargos;
CREATE POLICY "Permitir modificacion a administradores autenticados"
    ON public.cargos FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Historial accesible para lectura y registro
DROP POLICY IF EXISTS "Permitir lectura y registro de historial a autenticados" ON public.historial_cambios;
CREATE POLICY "Permitir lectura y registro de historial a autenticados"
    ON public.historial_cambios FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 8. Habilitar Replicación en Tiempo Real (Realtime)
-- Permite que los cambios se transmitan inmediatamente vía websockets a la Vista Pública y Admin
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cargos;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
