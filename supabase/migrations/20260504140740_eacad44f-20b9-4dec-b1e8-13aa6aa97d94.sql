-- Make SELECT restriction on orcamentos explicit: only admins can read submitted quote requests.
-- (RLS already denies by default for non-admins; this adds a clear, dedicated SELECT policy.)
DROP POLICY IF EXISTS "Only admins can read orcamentos" ON public.orcamentos;
CREATE POLICY "Only admins can read orcamentos"
ON public.orcamentos
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));