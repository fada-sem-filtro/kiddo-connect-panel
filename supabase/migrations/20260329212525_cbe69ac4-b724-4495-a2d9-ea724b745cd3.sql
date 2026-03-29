
CREATE TABLE public.sidebar_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  perfil text NOT NULL, -- 'diretor', 'educador', 'responsavel'
  config jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(creche_id, perfil)
);

ALTER TABLE public.sidebar_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sidebar_config"
  ON public.sidebar_config FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members can view their school sidebar_config"
  ON public.sidebar_config FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM creche_membros cm
    WHERE cm.creche_id = sidebar_config.creche_id AND cm.user_id = auth.uid()
  ));

CREATE TRIGGER update_sidebar_config_updated_at
  BEFORE UPDATE ON public.sidebar_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
