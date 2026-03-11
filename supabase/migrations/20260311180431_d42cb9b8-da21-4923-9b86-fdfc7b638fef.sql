
CREATE TABLE public.creches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  endereco text,
  telefone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on creches"
  ON public.creches FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_creches_updated_at
  BEFORE UPDATE ON public.creches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
