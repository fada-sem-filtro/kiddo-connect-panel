ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;
ALTER TABLE public.criancas ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;