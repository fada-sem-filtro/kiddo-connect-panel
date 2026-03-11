
-- Replace overly permissive INSERT policy with one restricted to system/trigger use
DROP POLICY "System can insert notifications" ON public.notificacoes;

-- Only allow users to insert notifications for themselves (trigger uses SECURITY DEFINER so bypasses RLS)
CREATE POLICY "Users can insert own notifications"
  ON public.notificacoes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
