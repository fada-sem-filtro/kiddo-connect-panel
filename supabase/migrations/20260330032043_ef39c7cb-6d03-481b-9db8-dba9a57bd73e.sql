
-- Allow admins to update suporte_mensagens (status changes)
CREATE POLICY "Admins can update suporte_mensagens"
ON public.suporte_mensagens FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
