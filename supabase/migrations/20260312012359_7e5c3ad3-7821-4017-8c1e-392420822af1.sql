
-- Add remetente_nome column to recados for denormalized name display
ALTER TABLE public.recados ADD COLUMN IF NOT EXISTS remetente_nome text;

-- Backfill existing recados with sender names
UPDATE public.recados r
SET remetente_nome = p.nome
FROM public.profiles p
WHERE p.user_id = r.remetente_user_id AND r.remetente_nome IS NULL;
