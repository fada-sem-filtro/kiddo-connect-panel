
-- Drop the existing responsavel insert policy that only allows replies
DROP POLICY IF EXISTS "Responsáveis can insert replies" ON public.recados;

-- Allow responsáveis to insert recados for their own children (not just replies)
CREATE POLICY "Responsáveis can insert recados for their crianças"
  ON public.recados FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'responsavel') 
    AND remetente_user_id = auth.uid()
    AND (
      -- Can send recados about their children
      (crianca_id IS NOT NULL AND is_responsavel_of_crianca(auth.uid(), crianca_id))
      OR
      -- Can reply to existing threads
      (parent_id IS NOT NULL)
    )
  );
