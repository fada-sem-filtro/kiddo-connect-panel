
-- Add 'secretaria' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'secretaria';

-- Add modulo_secretaria_ativo to configuracoes_pedagogicas
ALTER TABLE public.configuracoes_pedagogicas 
ADD COLUMN IF NOT EXISTS modulo_secretaria_ativo boolean NOT NULL DEFAULT false;
