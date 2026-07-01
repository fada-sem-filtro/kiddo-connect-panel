-- ==========================================================================
-- Agenda Fleur — Schema consolidado (Supabase / PostgreSQL)
-- Gerado a partir das 85 migrations do projeto.
-- Data de geração: 2026-07-01 13:23:21Z
--
-- Aplique no SQL Editor do Supabase (ou psql) em um banco LIMPO.
-- Migrations foram concatenadas em ordem cronológica; utilitários como
-- CREATE EXTENSION, CREATE OR REPLACE FUNCTION, DROP POLICY IF EXISTS e
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY já são idempotentes.
-- ==========================================================================

-- Extensões base recomendadas
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;


-- ------------------------------------------------------------------------
-- Migration: 20260311174651_eb722247-d66b-4a13-b073-2567b8014123.sql
-- ------------------------------------------------------------------------
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'educador', 'responsavel');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS policies
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------------------
-- Migration: 20260311180431_d42cb9b8-da21-4923-9b86-fdfc7b638fef.sql
-- ------------------------------------------------------------------------

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


-- ------------------------------------------------------------------------
-- Migration: 20260311180447_9670823b-f509-4e77-94cf-433b40da6f5a.sql
-- ------------------------------------------------------------------------

CREATE TABLE public.creche_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_diretor boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(creche_id, user_id)
);

ALTER TABLE public.creche_membros ENABLE ROW LEVEL SECURITY;

-- Members can view their creches
CREATE POLICY "Members can view their creches"
  ON public.creches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.creche_membros cm
      WHERE cm.creche_id = id AND cm.user_id = auth.uid()
    )
  );

-- Security definer function to check diretor status (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_diretor_of_creche(_user_id uuid, _creche_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.creche_membros
    WHERE user_id = _user_id
      AND creche_id = _creche_id
      AND is_diretor = true
  )
$$;

-- Admins can manage all membros
CREATE POLICY "Admins can manage all membros"
  ON public.creche_membros FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Diretores can manage membros of their creche
CREATE POLICY "Diretores can manage membros of their creche"
  ON public.creche_membros FOR ALL
  TO authenticated
  USING (public.is_diretor_of_creche(auth.uid(), creche_id))
  WITH CHECK (public.is_diretor_of_creche(auth.uid(), creche_id));

-- Users can view their own membership
CREATE POLICY "Users can view own membership"
  ON public.creche_membros FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());


-- ------------------------------------------------------------------------
-- Migration: 20260311181719_8269b3ce-9dd2-4ecc-8f69-db4db8593d68.sql
-- ------------------------------------------------------------------------
-- Allow directors to view profiles of members in their creche
CREATE POLICY "Directors can view profiles of creche members"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.creche_membros my_membership
    JOIN public.creche_membros their_membership ON my_membership.creche_id = their_membership.creche_id
    WHERE my_membership.user_id = auth.uid()
      AND my_membership.is_diretor = true
      AND their_membership.user_id = profiles.user_id
  )
);

-- Allow directors to view roles of members in their creche (excluding admins)
CREATE POLICY "Directors can view roles of creche members"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.creche_membros my_membership
    JOIN public.creche_membros their_membership ON my_membership.creche_id = their_membership.creche_id
    WHERE my_membership.user_id = auth.uid()
      AND my_membership.is_diretor = true
      AND their_membership.user_id = user_roles.user_id
  )
  AND role != 'admin'
);

-- ------------------------------------------------------------------------
-- Migration: 20260311182105_0eb53036-7188-424d-97b8-de7f6bb39145.sql
-- ------------------------------------------------------------------------

-- Turmas table linked to creche
CREATE TABLE public.turmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Crianças table linked to turma
CREATE TABLE public.criancas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  data_nascimento date NOT NULL,
  turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  observacoes text,
  foto_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Link educadores to turmas
CREATE TABLE public.turma_educadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  educador_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(turma_id, educador_user_id)
);

-- Link crianças to responsáveis
CREATE TABLE public.crianca_responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crianca_id uuid NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  responsavel_user_id uuid NOT NULL,
  parentesco text NOT NULL DEFAULT 'Responsável',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(crianca_id, responsavel_user_id)
);

-- Updated_at triggers
CREATE TRIGGER update_turmas_updated_at BEFORE UPDATE ON public.turmas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_criancas_updated_at BEFORE UPDATE ON public.criancas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turma_educadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crianca_responsaveis ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is member of the creche that owns a turma
CREATE OR REPLACE FUNCTION public.is_member_of_turma_creche(_user_id uuid, _turma_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.turmas t
    JOIN public.creche_membros cm ON cm.creche_id = t.creche_id
    WHERE t.id = _turma_id AND cm.user_id = _user_id
  )
$$;

-- Helper: check if user is educador of a turma
CREATE OR REPLACE FUNCTION public.is_educador_of_turma(_user_id uuid, _turma_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.turma_educadores
    WHERE turma_id = _turma_id AND educador_user_id = _user_id
  )
$$;

-- Helper: get creche_id from turma
CREATE OR REPLACE FUNCTION public.get_creche_id_from_turma(_turma_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT creche_id FROM public.turmas WHERE id = _turma_id LIMIT 1
$$;

-- ===== TURMAS RLS =====
CREATE POLICY "Admins can manage all turmas"
ON public.turmas FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage turmas of their creche"
ON public.turmas FOR ALL TO authenticated
USING (is_diretor_of_creche(auth.uid(), creche_id))
WITH CHECK (is_diretor_of_creche(auth.uid(), creche_id));

CREATE POLICY "Educadores can view turmas they are assigned to"
ON public.turmas FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.turma_educadores te
    WHERE te.turma_id = turmas.id AND te.educador_user_id = auth.uid()
  )
);

CREATE POLICY "Responsáveis can view turmas of their crianças"
ON public.turmas FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crianca_responsaveis cr
    JOIN public.criancas c ON c.id = cr.crianca_id
    WHERE c.turma_id = turmas.id AND cr.responsavel_user_id = auth.uid()
  )
);

-- ===== CRIANÇAS RLS =====
CREATE POLICY "Admins can manage all criancas"
ON public.criancas FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage criancas of their creche turmas"
ON public.criancas FOR ALL TO authenticated
USING (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)))
WITH CHECK (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)));

CREATE POLICY "Educadores can view criancas in their turmas"
ON public.criancas FOR SELECT TO authenticated
USING (is_educador_of_turma(auth.uid(), turma_id));

CREATE POLICY "Responsáveis can view their own criancas"
ON public.criancas FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crianca_responsaveis cr
    WHERE cr.crianca_id = criancas.id AND cr.responsavel_user_id = auth.uid()
  )
);

-- ===== TURMA_EDUCADORES RLS =====
CREATE POLICY "Admins can manage turma_educadores"
ON public.turma_educadores FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage turma_educadores of their creche"
ON public.turma_educadores FOR ALL TO authenticated
USING (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)))
WITH CHECK (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)));

CREATE POLICY "Educadores can view their own turma assignments"
ON public.turma_educadores FOR SELECT TO authenticated
USING (educador_user_id = auth.uid());

-- ===== CRIANCA_RESPONSAVEIS RLS =====
CREATE POLICY "Admins can manage crianca_responsaveis"
ON public.crianca_responsaveis FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage crianca_responsaveis of their creche"
ON public.crianca_responsaveis FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    WHERE c.id = crianca_responsaveis.crianca_id
    AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(c.turma_id))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.criancas c
    WHERE c.id = crianca_responsaveis.crianca_id
    AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(c.turma_id))
  )
);

CREATE POLICY "Responsáveis can view their own links"
ON public.crianca_responsaveis FOR SELECT TO authenticated
USING (responsavel_user_id = auth.uid());


-- ------------------------------------------------------------------------
-- Migration: 20260311183328_5a3f11f3-1285-4857-8c2c-daea9f51aeee.sql
-- ------------------------------------------------------------------------

-- Eventos table linked to crianças
CREATE TABLE public.eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  crianca_id uuid NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  observacao text,
  data_inicio timestamptz NOT NULL DEFAULT now(),
  data_fim timestamptz,
  educador_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage all eventos"
ON public.eventos FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Directors can manage eventos of their creche
CREATE POLICY "Directors can manage eventos of their creche"
ON public.eventos FOR ALL TO authenticated
USING (
  is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(
    (SELECT turma_id FROM public.criancas WHERE id = eventos.crianca_id)
  ))
)
WITH CHECK (
  is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(
    (SELECT turma_id FROM public.criancas WHERE id = eventos.crianca_id)
  ))
);

-- Educadores can manage eventos for crianças in their turmas
CREATE POLICY "Educadores can manage eventos in their turmas"
ON public.eventos FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    JOIN public.turma_educadores te ON te.turma_id = c.turma_id
    WHERE c.id = eventos.crianca_id AND te.educador_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.criancas c
    JOIN public.turma_educadores te ON te.turma_id = c.turma_id
    WHERE c.id = eventos.crianca_id AND te.educador_user_id = auth.uid()
  )
);

-- Responsáveis can only VIEW eventos of their crianças
CREATE POLICY "Responsáveis can view eventos of their crianças"
ON public.eventos FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crianca_responsaveis cr
    WHERE cr.crianca_id = eventos.crianca_id AND cr.responsavel_user_id = auth.uid()
  )
);


-- ------------------------------------------------------------------------
-- Migration: 20260311184102_3caa4b9f-3572-4bd0-926a-3fdf72013f63.sql
-- ------------------------------------------------------------------------

-- Function to check if user is a responsavel of a crianca (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_responsavel_of_crianca(_user_id uuid, _crianca_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crianca_responsaveis
    WHERE responsavel_user_id = _user_id AND crianca_id = _crianca_id
  )
$$;

-- Function to get crianca_ids for a responsavel (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_crianca_ids_for_responsavel(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT crianca_id FROM public.crianca_responsaveis
  WHERE responsavel_user_id = _user_id
$$;

-- Function to get turma_ids for a responsavel's crianças (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_turma_ids_for_responsavel(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT DISTINCT c.turma_id
  FROM public.crianca_responsaveis cr
  JOIN public.criancas c ON c.id = cr.crianca_id
  WHERE cr.responsavel_user_id = _user_id
$$;

-- Fix turmas: Responsáveis can view turmas of their crianças (no recursion)
DROP POLICY IF EXISTS "Responsáveis can view turmas of their crianças" ON public.turmas;
CREATE POLICY "Responsáveis can view turmas of their crianças"
ON public.turmas FOR SELECT TO authenticated
USING (id IN (SELECT get_turma_ids_for_responsavel(auth.uid())));

-- Fix criancas: Responsáveis can view their own criancas (no recursion)
DROP POLICY IF EXISTS "Responsáveis can view their own criancas" ON public.criancas;
CREATE POLICY "Responsáveis can view their own criancas"
ON public.criancas FOR SELECT TO authenticated
USING (id IN (SELECT get_crianca_ids_for_responsavel(auth.uid())));

-- Fix crianca_responsaveis: Responsáveis can view their own links (no recursion)
DROP POLICY IF EXISTS "Responsáveis can view their own links" ON public.crianca_responsaveis;
CREATE POLICY "Responsáveis can view their own links"
ON public.crianca_responsaveis FOR SELECT TO authenticated
USING (responsavel_user_id = auth.uid());

-- Fix eventos: Responsáveis can view eventos of their crianças (no recursion)
DROP POLICY IF EXISTS "Responsáveis can view eventos of their crianças" ON public.eventos;
CREATE POLICY "Responsáveis can view eventos of their crianças"
ON public.eventos FOR SELECT TO authenticated
USING (crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid())));

-- Fix creches: Members can view their creches (was using wrong column reference)
DROP POLICY IF EXISTS "Members can view their creches" ON public.creches;
CREATE POLICY "Members can view their creches"
ON public.creches FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.creche_membros cm
  WHERE cm.creche_id = creches.id AND cm.user_id = auth.uid()
));


-- ------------------------------------------------------------------------
-- Migration: 20260311185018_da3ed76e-57a5-485f-b62b-72bc1109bbd3.sql
-- ------------------------------------------------------------------------

-- Tabela de notificações
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  tipo text NOT NULL DEFAULT 'evento',
  lida boolean NOT NULL DEFAULT false,
  crianca_id uuid REFERENCES public.criancas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notificacoes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notificacoes FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notificacoes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- System (trigger) inserts via SECURITY DEFINER function
CREATE POLICY "System can insert notifications"
  ON public.notificacoes FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;

-- Function to auto-create notifications for responsáveis when evento is inserted
CREATE OR REPLACE FUNCTION public.notify_responsaveis_on_evento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _crianca_nome text;
  _tipo_label text;
  _resp record;
BEGIN
  SELECT nome INTO _crianca_nome FROM public.criancas WHERE id = NEW.crianca_id;
  
  _tipo_label := CASE NEW.tipo
    WHEN 'ALIMENTACAO' THEN 'Alimentação'
    WHEN 'SONECA' THEN 'Soneca'
    WHEN 'BRINCADEIRA' THEN 'Brincadeira'
    WHEN 'ATIVIDADE' THEN 'Atividade'
    WHEN 'HIGIENE' THEN 'Higiene'
    ELSE 'Evento'
  END;

  FOR _resp IN
    SELECT responsavel_user_id FROM public.crianca_responsaveis WHERE crianca_id = NEW.crianca_id
  LOOP
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, crianca_id)
    VALUES (
      _resp.responsavel_user_id,
      _tipo_label || ' - ' || COALESCE(_crianca_nome, 'Criança'),
      COALESCE(NEW.observacao, _tipo_label || ' registrado(a) para ' || COALESCE(_crianca_nome, 'sua criança')),
      'evento',
      NEW.crianca_id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_evento_insert_notify
  AFTER INSERT ON public.eventos
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_responsaveis_on_evento();


-- ------------------------------------------------------------------------
-- Migration: 20260311185033_a24b07e9-0cf6-4aa5-84de-19be87a99dfc.sql
-- ------------------------------------------------------------------------

-- Replace overly permissive INSERT policy with one restricted to system/trigger use
DROP POLICY "System can insert notifications" ON public.notificacoes;

-- Only allow users to insert notifications for themselves (trigger uses SECURITY DEFINER so bypasses RLS)
CREATE POLICY "Users can insert own notifications"
  ON public.notificacoes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());


-- ------------------------------------------------------------------------
-- Migration: 20260311185332_ae64806a-33f6-4978-afe3-69e4bc228ef8.sql
-- ------------------------------------------------------------------------

-- Tabela de feriados
CREATE TABLE public.feriados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  data date NOT NULL,
  recorrente boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feriados" ON public.feriados FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view feriados" ON public.feriados FOR SELECT TO authenticated
  USING (true);

-- Tabela de eventos futuros (calendário escolar)
CREATE TABLE public.eventos_futuros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  data_inicio date NOT NULL,
  data_fim date,
  turma_id uuid REFERENCES public.turmas(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.eventos_futuros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage eventos_futuros" ON public.eventos_futuros FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view eventos_futuros" ON public.eventos_futuros FOR SELECT TO authenticated
  USING (true);

-- Tabela de recados (com respostas hierárquicas via parent_id)
CREATE TABLE public.recados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL DEFAULT '',
  conteudo text NOT NULL,
  crianca_id uuid REFERENCES public.criancas(id) ON DELETE CASCADE,
  turma_id uuid REFERENCES public.turmas(id) ON DELETE CASCADE,
  remetente_user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.recados(id) ON DELETE CASCADE,
  lido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.recados ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage recados" ON public.recados FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Educadores can manage recados in their turmas
CREATE POLICY "Educadores can manage recados in their turmas" ON public.recados FOR ALL TO authenticated
  USING (
    remetente_user_id = auth.uid()
    OR (turma_id IS NOT NULL AND is_educador_of_turma(auth.uid(), turma_id))
    OR (crianca_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM criancas c WHERE c.id = recados.crianca_id AND is_educador_of_turma(auth.uid(), c.turma_id)
    ))
  )
  WITH CHECK (
    remetente_user_id = auth.uid()
  );

-- Responsáveis can view recados for their crianças and reply
CREATE POLICY "Responsáveis can view recados for their crianças" ON public.recados FOR SELECT TO authenticated
  USING (
    crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid()))
    OR turma_id IN (SELECT get_turma_ids_for_responsavel(auth.uid()))
  );

CREATE POLICY "Responsáveis can insert replies" ON public.recados FOR INSERT TO authenticated
  WITH CHECK (
    remetente_user_id = auth.uid()
    AND parent_id IS NOT NULL
  );

-- Trigger for updated_at
CREATE TRIGGER update_recados_updated_at
  BEFORE UPDATE ON public.recados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ------------------------------------------------------------------------
-- Migration: 20260311194256_d00f3d94-2fe1-42e6-835f-3494c11de919.sql
-- ------------------------------------------------------------------------
-- Email infrastructure tables
-- Runs during email domain setup to ensure all email tables exist
-- before any email templates are scaffolded.

-- Extensions required for queue processing
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create email queues (auth = high priority, transactional = normal)
-- Wrapped in DO blocks to handle "queue already exists" errors idempotently.
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Dead-letter queues for messages that exceed max retries
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Email send log table (audit trail for all send attempts)
-- UPDATE is allowed for the service role so the suppression edge function
-- can update a log record's status when a bounce/complaint/unsubscribe occurs.
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read send log"
    ON public.email_send_log FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert send log"
    ON public.email_send_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update send log"
    ON public.email_send_log FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

-- Backfill: add message_id column to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_log ADD COLUMN message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

-- Prevent duplicate sends: only one 'sent' row per message_id.
-- If VT expires and another worker picks up the same message, the pre-send
-- check catches it. This index is a DB-level safety net for race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

-- Backfill: update status CHECK constraint for existing tables that predate new statuses
DO $$ BEGIN
  ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
  ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
    CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq'));
END $$;

-- Rate-limit state and queue config (single row, tracks Retry-After cooldown + throughput settings)
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until TIMESTAMPTZ,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Backfill: add config columns to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN batch_size INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN send_delay_ms INTEGER NOT NULL DEFAULT 200;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage send state"
    ON public.email_send_state FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Suppressed emails table (tracks unsubscribes, bounces, complaints)
-- Append-only: no DELETE or UPDATE policies to prevent bypassing suppression.
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read suppressed emails"
    ON public.suppressed_emails FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert suppressed emails"
    ON public.suppressed_emails FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

-- Email unsubscribe tokens table (one token per email address for unsubscribe links)
-- No DELETE policy to prevent removing tokens. UPDATE allowed only to mark tokens as used.
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read tokens"
    ON public.email_unsubscribe_tokens FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert tokens"
    ON public.email_unsubscribe_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can mark tokens as used"
    ON public.email_unsubscribe_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- RPC wrappers so Edge Functions can interact with pgmq via supabase.rpc()
-- (PostgREST only exposes functions in the public schema; pgmq functions are in the pgmq schema)
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE sql SECURITY DEFINER
AS $$ SELECT pgmq.send(queue_name, payload); $$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE sql SECURITY DEFINER
AS $$ SELECT msg_id, read_ct, message FROM pgmq.read(queue_name, vt, batch_size); $$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$ SELECT pgmq.delete(queue_name, message_id); $$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
END;
$$;

-- Restrict queue RPC wrappers to service_role only (SECURITY DEFINER runs as owner,
-- so without this any authenticated user could manipulate the email queues)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;


-- ------------------------------------------------------------------------
-- Migration: 20260311201146_861e987e-0fc0-4a7e-b645-3fc659c8f7cf.sql
-- ------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('email-assets', 'email-assets', true) ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------
-- Migration: 20260311202520_fbb706f9-7d27-405b-8717-eda4826f5ea7.sql
-- ------------------------------------------------------------------------
-- Email infrastructure tables
-- Runs during email domain setup to ensure all email tables exist
-- before any email templates are scaffolded.

-- Extensions required for queue processing
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create email queues (auth = high priority, transactional = normal)
-- Wrapped in DO blocks to handle "queue already exists" errors idempotently.
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Dead-letter queues for messages that exceed max retries
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Email send log table (audit trail for all send attempts)
-- UPDATE is allowed for the service role so the suppression edge function
-- can update a log record's status when a bounce/complaint/unsubscribe occurs.
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read send log"
    ON public.email_send_log FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert send log"
    ON public.email_send_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update send log"
    ON public.email_send_log FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

-- Backfill: add message_id column to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_log ADD COLUMN message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

-- Prevent duplicate sends: only one 'sent' row per message_id.
-- If VT expires and another worker picks up the same message, the pre-send
-- check catches it. This index is a DB-level safety net for race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

-- Backfill: update status CHECK constraint for existing tables that predate new statuses
DO $$ BEGIN
  ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
  ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
    CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq'));
END $$;

-- Rate-limit state and queue config (single row, tracks Retry-After cooldown + throughput settings)
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until TIMESTAMPTZ,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Backfill: add config columns to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN batch_size INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN send_delay_ms INTEGER NOT NULL DEFAULT 200;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage send state"
    ON public.email_send_state FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Suppressed emails table (tracks unsubscribes, bounces, complaints)
-- Append-only: no DELETE or UPDATE policies to prevent bypassing suppression.
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read suppressed emails"
    ON public.suppressed_emails FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert suppressed emails"
    ON public.suppressed_emails FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

-- Email unsubscribe tokens table (one token per email address for unsubscribe links)
-- No DELETE policy to prevent removing tokens. UPDATE allowed only to mark tokens as used.
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read tokens"
    ON public.email_unsubscribe_tokens FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert tokens"
    ON public.email_unsubscribe_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can mark tokens as used"
    ON public.email_unsubscribe_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- RPC wrappers so Edge Functions can interact with pgmq via supabase.rpc()
-- (PostgREST only exposes functions in the public schema; pgmq functions are in the pgmq schema)
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE sql SECURITY DEFINER
AS $$ SELECT pgmq.send(queue_name, payload); $$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE sql SECURITY DEFINER
AS $$ SELECT msg_id, read_ct, message FROM pgmq.read(queue_name, vt, batch_size); $$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$ SELECT pgmq.delete(queue_name, message_id); $$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
END;
$$;

-- Restrict queue RPC wrappers to service_role only (SECURITY DEFINER runs as owner,
-- so without this any authenticated user could manipulate the email queues)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;


-- ------------------------------------------------------------------------
-- Migration: 20260311212322_05cc0daa-34dd-467e-b1f6-2c5e794ec542.sql
-- ------------------------------------------------------------------------
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'diretor';

-- ------------------------------------------------------------------------
-- Migration: 20260311212338_124c91b3-ae0f-45a3-984f-e990966e5d3f.sql
-- ------------------------------------------------------------------------
-- Update is_diretor_of_creche to check user_roles instead of is_diretor flag
CREATE OR REPLACE FUNCTION public.is_diretor_of_creche(_user_id uuid, _creche_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.creche_membros cm
    JOIN public.user_roles ur ON ur.user_id = cm.user_id
    WHERE cm.user_id = _user_id
      AND cm.creche_id = _creche_id
      AND ur.role = 'diretor'
  )
$$;

-- ------------------------------------------------------------------------
-- Migration: 20260311212737_8efa83bb-b3ba-4e77-b01b-5146d4115e89.sql
-- ------------------------------------------------------------------------
-- Update profiles RLS for directors to use role instead of is_diretor flag
DROP POLICY IF EXISTS "Directors can view profiles of creche members" ON public.profiles;
CREATE POLICY "Directors can view profiles of creche members"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM creche_membros my_membership
    JOIN creche_membros their_membership ON my_membership.creche_id = their_membership.creche_id
    JOIN user_roles ur ON ur.user_id = my_membership.user_id
    WHERE my_membership.user_id = auth.uid()
      AND ur.role = 'diretor'
      AND their_membership.user_id = profiles.user_id
  )
);

-- Update user_roles RLS for directors to use role instead of is_diretor flag
DROP POLICY IF EXISTS "Directors can view roles of creche members" ON public.user_roles;
CREATE POLICY "Directors can view roles of creche members"
ON public.user_roles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM creche_membros my_membership
    JOIN creche_membros their_membership ON my_membership.creche_id = their_membership.creche_id
    JOIN user_roles my_role ON my_role.user_id = my_membership.user_id
    WHERE my_membership.user_id = auth.uid()
      AND my_role.role = 'diretor'
      AND their_membership.user_id = user_roles.user_id
  )
  AND role <> 'admin'
);

-- ------------------------------------------------------------------------
-- Migration: 20260311235237_2766dd58-6f6f-4d4c-8dbb-496057479909.sql
-- ------------------------------------------------------------------------
-- Create a SECURITY DEFINER function to check if two users share a creche
CREATE OR REPLACE FUNCTION public.is_in_same_creche(_user_id uuid, _other_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM creche_membros a
    JOIN creche_membros b ON a.creche_id = b.creche_id
    WHERE a.user_id = _user_id AND b.user_id = _other_user_id
  )
$$;

-- Fix profiles: Drop and recreate the director policy using SECURITY DEFINER functions
DROP POLICY IF EXISTS "Directors can view profiles of creche members" ON public.profiles;
CREATE POLICY "Directors can view profiles of creche members"
ON public.profiles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'diretor'::app_role)
  AND is_in_same_creche(auth.uid(), profiles.user_id)
);

-- Fix user_roles: Drop and recreate the director policy using SECURITY DEFINER functions
DROP POLICY IF EXISTS "Directors can view roles of creche members" ON public.user_roles;
CREATE POLICY "Directors can view roles of creche members"
ON public.user_roles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'diretor'::app_role)
  AND is_in_same_creche(auth.uid(), user_roles.user_id)
  AND role <> 'admin'::app_role
);

-- ------------------------------------------------------------------------
-- Migration: 20260312005637_4b2b2ab4-ece9-4624-a37c-13a534799d33.sql
-- ------------------------------------------------------------------------

-- Create presencas table for daily attendance tracking
CREATE TABLE public.presencas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crianca_id UUID NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'ausente' CHECK (status IN ('ausente', 'presente', 'saiu')),
  hora_chegada TIMESTAMP WITH TIME ZONE,
  hora_saida TIMESTAMP WITH TIME ZONE,
  educador_user_id UUID,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(crianca_id, data)
);

-- Enable RLS
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all presencas"
  ON public.presencas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage presencas of their creche"
  ON public.presencas FOR ALL TO authenticated
  USING (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma((SELECT turma_id FROM criancas WHERE id = presencas.crianca_id))))
  WITH CHECK (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma((SELECT turma_id FROM criancas WHERE id = presencas.crianca_id))));

CREATE POLICY "Educadores can manage presencas in their turmas"
  ON public.presencas FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM criancas c
    JOIN turma_educadores te ON te.turma_id = c.turma_id
    WHERE c.id = presencas.crianca_id AND te.educador_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM criancas c
    JOIN turma_educadores te ON te.turma_id = c.turma_id
    WHERE c.id = presencas.crianca_id AND te.educador_user_id = auth.uid()
  ));

CREATE POLICY "Responsáveis can view presencas of their crianças"
  ON public.presencas FOR SELECT TO authenticated
  USING (crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid())));

-- Enable realtime for presencas
ALTER PUBLICATION supabase_realtime ADD TABLE public.presencas;

-- Add updated_at trigger
CREATE TRIGGER update_presencas_updated_at
  BEFORE UPDATE ON public.presencas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ------------------------------------------------------------------------
-- Migration: 20260312010556_74ae033c-6f54-4576-97bb-ec0a54b28045.sql
-- ------------------------------------------------------------------------

-- Allow directors to view all recados from their creche (turma-based or crianca-based)
CREATE POLICY "Directors can view recados of their creche"
  ON public.recados FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'diretor') AND (
      -- Recados linked to a turma in their creche
      (turma_id IS NOT NULL AND is_member_of_turma_creche(auth.uid(), turma_id))
      OR
      -- Recados linked to a crianca in their creche
      (crianca_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM criancas c
        WHERE c.id = recados.crianca_id
        AND is_member_of_turma_creche(auth.uid(), c.turma_id)
      ))
      OR
      -- Recados sent by members of same creche (general recados)
      (turma_id IS NULL AND crianca_id IS NULL AND is_in_same_creche(auth.uid(), remetente_user_id))
    )
  );

-- Allow directors to create recados
CREATE POLICY "Directors can insert recados"
  ON public.recados FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'diretor') AND remetente_user_id = auth.uid()
  );

-- Allow directors to update recados in their creche
CREATE POLICY "Directors can update recados of their creche"
  ON public.recados FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'diretor') AND (
      remetente_user_id = auth.uid()
      OR (turma_id IS NOT NULL AND is_member_of_turma_creche(auth.uid(), turma_id))
      OR (crianca_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM criancas c WHERE c.id = recados.crianca_id AND is_member_of_turma_creche(auth.uid(), c.turma_id)
      ))
    )
  );


-- ------------------------------------------------------------------------
-- Migration: 20260312011741_0dc34a61-f88a-43da-b633-9db7fc4e8485.sql
-- ------------------------------------------------------------------------

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


-- ------------------------------------------------------------------------
-- Migration: 20260312012127_3baea6a2-eb07-4c83-99e2-88639d9029b6.sql
-- ------------------------------------------------------------------------

-- Allow educadores to view profiles of people in their turmas (responsáveis of children in their turmas)
CREATE POLICY "Educadores can view profiles of turma members"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'educador') AND (
      -- Same user
      user_id = auth.uid()
      OR
      -- Responsáveis of children in educador's turmas
      EXISTS (
        SELECT 1 FROM crianca_responsaveis cr
        JOIN criancas c ON c.id = cr.crianca_id
        JOIN turma_educadores te ON te.turma_id = c.turma_id
        WHERE te.educador_user_id = auth.uid() AND cr.responsavel_user_id = profiles.user_id
      )
      OR
      -- Other educadores in same turmas
      EXISTS (
        SELECT 1 FROM turma_educadores te1
        JOIN turma_educadores te2 ON te1.turma_id = te2.turma_id
        WHERE te1.educador_user_id = auth.uid() AND te2.educador_user_id = profiles.user_id
      )
    )
  );

-- Allow responsáveis to view profiles of educadores of their children's turmas
CREATE POLICY "Responsáveis can view profiles of their children educadores"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'responsavel') AND (
      user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM crianca_responsaveis cr
        JOIN criancas c ON c.id = cr.crianca_id
        JOIN turma_educadores te ON te.turma_id = c.turma_id
        WHERE cr.responsavel_user_id = auth.uid() AND te.educador_user_id = profiles.user_id
      )
    )
  );

-- Trigger: notify educadores when responsável sends recado, and notify responsáveis when educador sends recado
CREATE OR REPLACE FUNCTION public.notify_on_recado()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  _remetente_nome text;
  _remetente_role app_role;
  _crianca_nome text;
  _target_user_id uuid;
  _rec record;
BEGIN
  -- Get sender info
  SELECT nome INTO _remetente_nome FROM public.profiles WHERE user_id = NEW.remetente_user_id;
  SELECT role INTO _remetente_role FROM public.user_roles WHERE user_id = NEW.remetente_user_id LIMIT 1;
  
  _remetente_nome := COALESCE(_remetente_nome, 'Usuário');

  -- Get crianca name if applicable
  IF NEW.crianca_id IS NOT NULL THEN
    SELECT nome INTO _crianca_nome FROM public.criancas WHERE id = NEW.crianca_id;
  END IF;

  -- If sender is responsável, notify educadores of the child's turma
  IF _remetente_role = 'responsavel' AND NEW.crianca_id IS NOT NULL THEN
    FOR _rec IN
      SELECT te.educador_user_id
      FROM criancas c
      JOIN turma_educadores te ON te.turma_id = c.turma_id
      WHERE c.id = NEW.crianca_id
    LOOP
      INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, crianca_id)
      VALUES (
        _rec.educador_user_id,
        'Recado de ' || _remetente_nome,
        COALESCE(NEW.titulo, '') || ' - ' || LEFT(NEW.conteudo, 100),
        'recado',
        NEW.crianca_id
      );
    END LOOP;
  END IF;

  -- If sender is educador/diretor, notify responsáveis of the child
  IF (_remetente_role IN ('educador', 'diretor')) AND NEW.crianca_id IS NOT NULL THEN
    FOR _rec IN
      SELECT responsavel_user_id FROM crianca_responsaveis WHERE crianca_id = NEW.crianca_id
    LOOP
      INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, crianca_id)
      VALUES (
        _rec.responsavel_user_id,
        'Recado de ' || _remetente_nome,
        COALESCE(NEW.titulo, '') || ' - ' || LEFT(NEW.conteudo, 100),
        'recado',
        NEW.crianca_id
      );
    END LOOP;
  END IF;

  -- If sender is educador/diretor and turma-wide recado, notify all responsáveis of that turma
  IF (_remetente_role IN ('educador', 'diretor')) AND NEW.turma_id IS NOT NULL AND NEW.crianca_id IS NULL THEN
    FOR _rec IN
      SELECT DISTINCT cr.responsavel_user_id
      FROM criancas c
      JOIN crianca_responsaveis cr ON cr.crianca_id = c.id
      WHERE c.turma_id = NEW.turma_id
    LOOP
      INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo)
      VALUES (
        _rec.responsavel_user_id,
        'Recado para turma - ' || _remetente_nome,
        COALESCE(NEW.titulo, '') || ' - ' || LEFT(NEW.conteudo, 100),
        'recado'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_on_recado
  AFTER INSERT ON public.recados
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_recado();


-- ------------------------------------------------------------------------
-- Migration: 20260312012317_9fc3ebc2-bdbd-42d6-81da-d7cc11fe0f99.sql
-- ------------------------------------------------------------------------

-- Drop the narrow educador policy and replace with a broader one covering all creche members
DROP POLICY IF EXISTS "Educadores can view profiles of turma members" ON public.profiles;

-- Educadores can view profiles of all members of creches they belong to
CREATE POLICY "Educadores can view profiles of creche members"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'educador') AND (
      user_id = auth.uid()
      OR is_in_same_creche(auth.uid(), user_id)
    )
  );

-- Also update responsáveis policy to cover directors and other responsáveis in same creche
DROP POLICY IF EXISTS "Responsáveis can view profiles of their children educadores" ON public.profiles;

CREATE POLICY "Responsáveis can view profiles of creche members"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'responsavel') AND (
      user_id = auth.uid()
      OR
      -- Educadores and directors of their children's creches
      EXISTS (
        SELECT 1 FROM crianca_responsaveis cr
        JOIN criancas c ON c.id = cr.crianca_id
        JOIN creche_membros cm ON cm.creche_id = c.turma_id
        WHERE cr.responsavel_user_id = auth.uid() AND cm.user_id = profiles.user_id
      )
      OR
      EXISTS (
        SELECT 1 FROM crianca_responsaveis cr
        JOIN criancas c ON c.id = cr.crianca_id
        JOIN turma_educadores te ON te.turma_id = c.turma_id
        WHERE cr.responsavel_user_id = auth.uid() AND te.educador_user_id = profiles.user_id
      )
    )
  );


-- ------------------------------------------------------------------------
-- Migration: 20260312012359_7e5c3ad3-7821-4017-8c1e-392420822af1.sql
-- ------------------------------------------------------------------------

-- Add remetente_nome column to recados for denormalized name display
ALTER TABLE public.recados ADD COLUMN IF NOT EXISTS remetente_nome text;

-- Backfill existing recados with sender names
UPDATE public.recados r
SET remetente_nome = p.nome
FROM public.profiles p
WHERE p.user_id = r.remetente_user_id AND r.remetente_nome IS NULL;


-- ------------------------------------------------------------------------
-- Migration: 20260312013122_c8de9d5e-b0ec-4acc-b93a-ab9c847aec2e.sql
-- ------------------------------------------------------------------------
-- Add logo_url column to creches
ALTER TABLE public.creches ADD COLUMN IF NOT EXISTS logo_url text;

-- Create storage bucket for creche logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('creche-logos', 'creche-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to creche-logos bucket
CREATE POLICY "Authenticated users can upload creche logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'creche-logos');

-- Allow public to view creche logos
CREATE POLICY "Public can view creche logos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'creche-logos');

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "Authenticated users can update creche logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'creche-logos');

CREATE POLICY "Authenticated users can delete creche logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'creche-logos');


-- ------------------------------------------------------------------------
-- Migration: 20260312013536_d9ab1037-49cf-4af0-8930-00426eb5e20d.sql
-- ------------------------------------------------------------------------
-- Drop and recreate directors profile viewing policy to include responsáveis
DROP POLICY IF EXISTS "Directors can view profiles of creche members" ON public.profiles;

CREATE POLICY "Directors can view profiles of creche members"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'diretor') AND (
      user_id = auth.uid()
      OR is_in_same_creche(auth.uid(), user_id)
      OR EXISTS (
        SELECT 1 FROM crianca_responsaveis cr
        JOIN criancas c ON c.id = cr.crianca_id
        JOIN turmas t ON t.id = c.turma_id
        JOIN creche_membros cm ON cm.creche_id = t.creche_id
        WHERE cm.user_id = auth.uid() AND cr.responsavel_user_id = profiles.user_id
      )
    )
  );


-- ------------------------------------------------------------------------
-- Migration: 20260312130207_a1334e84-6b06-4d92-ae80-272b4f4a92a9.sql
-- ------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;
ALTER TABLE public.criancas ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

-- ------------------------------------------------------------------------
-- Migration: 20260312143603_8a4c006a-40f6-4553-a2c7-c7d37966a67d.sql
-- ------------------------------------------------------------------------
-- Email infrastructure tables
-- Runs during email domain setup to ensure all email tables exist
-- before any email templates are scaffolded.

-- Extensions required for queue processing
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create email queues (auth = high priority, transactional = normal)
-- Wrapped in DO blocks to handle "queue already exists" errors idempotently.
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Dead-letter queues for messages that exceed max retries
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Email send log table (audit trail for all send attempts)
-- UPDATE is allowed for the service role so the suppression edge function
-- can update a log record's status when a bounce/complaint/unsubscribe occurs.
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read send log"
    ON public.email_send_log FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert send log"
    ON public.email_send_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update send log"
    ON public.email_send_log FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

-- Backfill: add message_id column to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_log ADD COLUMN message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

-- Prevent duplicate sends: only one 'sent' row per message_id.
-- If VT expires and another worker picks up the same message, the pre-send
-- check catches it. This index is a DB-level safety net for race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

-- Backfill: update status CHECK constraint for existing tables that predate new statuses
DO $$ BEGIN
  ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
  ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
    CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq'));
END $$;

-- Rate-limit state and queue config (single row, tracks Retry-After cooldown + throughput settings)
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until TIMESTAMPTZ,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Backfill: add config columns to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN batch_size INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN send_delay_ms INTEGER NOT NULL DEFAULT 200;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage send state"
    ON public.email_send_state FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Suppressed emails table (tracks unsubscribes, bounces, complaints)
-- Append-only: no DELETE or UPDATE policies to prevent bypassing suppression.
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read suppressed emails"
    ON public.suppressed_emails FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert suppressed emails"
    ON public.suppressed_emails FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

-- Email unsubscribe tokens table (one token per email address for unsubscribe links)
-- No DELETE policy to prevent removing tokens. UPDATE allowed only to mark tokens as used.
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read tokens"
    ON public.email_unsubscribe_tokens FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert tokens"
    ON public.email_unsubscribe_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can mark tokens as used"
    ON public.email_unsubscribe_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- RPC wrappers so Edge Functions can interact with pgmq via supabase.rpc()
-- (PostgREST only exposes functions in the public schema; pgmq functions are in the pgmq schema)
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE sql SECURITY DEFINER
AS $$ SELECT pgmq.send(queue_name, payload); $$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE sql SECURITY DEFINER
AS $$ SELECT msg_id, read_ct, message FROM pgmq.read(queue_name, vt, batch_size); $$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$ SELECT pgmq.delete(queue_name, message_id); $$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
END;
$$;

-- Restrict queue RPC wrappers to service_role only (SECURITY DEFINER runs as owner,
-- so without this any authenticated user could manipulate the email queues)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;


-- ------------------------------------------------------------------------
-- Migration: 20260312150052_08e6a0ea-8b47-40d7-8b4a-bfcf5e58eb83.sql
-- ------------------------------------------------------------------------
CREATE POLICY "Directors can update managed profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'diretor'::app_role)
  AND (
    (
      has_role(user_id, 'educador'::app_role)
      AND is_in_same_creche(auth.uid(), user_id)
    )
    OR (
      has_role(user_id, 'responsavel'::app_role)
      AND EXISTS (
        SELECT 1
        FROM public.crianca_responsaveis cr
        JOIN public.criancas c ON c.id = cr.crianca_id
        JOIN public.turmas t ON t.id = c.turma_id
        JOIN public.creche_membros cm ON cm.creche_id = t.creche_id
        WHERE cm.user_id = auth.uid()
          AND cr.responsavel_user_id = profiles.user_id
      )
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'diretor'::app_role)
  AND (
    (
      has_role(user_id, 'educador'::app_role)
      AND is_in_same_creche(auth.uid(), user_id)
    )
    OR (
      has_role(user_id, 'responsavel'::app_role)
      AND EXISTS (
        SELECT 1
        FROM public.crianca_responsaveis cr
        JOIN public.criancas c ON c.id = cr.crianca_id
        JOIN public.turmas t ON t.id = c.turma_id
        JOIN public.creche_membros cm ON cm.creche_id = t.creche_id
        WHERE cm.user_id = auth.uid()
          AND cr.responsavel_user_id = profiles.user_id
      )
    )
  )
);

-- ------------------------------------------------------------------------
-- Migration: 20260313041500_b227e25d-804f-4bdb-a094-cc8e2eaa9a17.sql
-- ------------------------------------------------------------------------

-- 1. Add new columns to eventos table for alimentação, higiene, medicamento, saída
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS tipo_refeicao text,
  ADD COLUMN IF NOT EXISTS resultado_refeicao text,
  ADD COLUMN IF NOT EXISTS tipo_higiene text,
  ADD COLUMN IF NOT EXISTS nome_medicamento text,
  ADD COLUMN IF NOT EXISTS dosagem text,
  ADD COLUMN IF NOT EXISTS horario_administracao timestamp with time zone,
  ADD COLUMN IF NOT EXISTS administrado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS horario_administrado timestamp with time zone,
  ADD COLUMN IF NOT EXISTS authorized_person_id uuid;

-- 2. Add faixa_etaria to turmas
ALTER TABLE public.turmas
  ADD COLUMN IF NOT EXISTS faixa_etaria text;

-- 3. Create authorized_pickups table
CREATE TABLE public.authorized_pickups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crianca_id uuid NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  parentesco text NOT NULL DEFAULT 'Outro',
  telefone text,
  foto_url text,
  documento text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.authorized_pickups ENABLE ROW LEVEL SECURITY;

-- RLS policies for authorized_pickups
CREATE POLICY "Admins can manage authorized_pickups"
ON public.authorized_pickups FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Directors can manage authorized_pickups of their creche"
ON public.authorized_pickups FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    WHERE c.id = authorized_pickups.crianca_id
    AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(c.turma_id))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.criancas c
    WHERE c.id = authorized_pickups.crianca_id
    AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(c.turma_id))
  )
);

CREATE POLICY "Educadores can manage authorized_pickups in their turmas"
ON public.authorized_pickups FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    JOIN public.turma_educadores te ON te.turma_id = c.turma_id
    WHERE c.id = authorized_pickups.crianca_id AND te.educador_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.criancas c
    JOIN public.turma_educadores te ON te.turma_id = c.turma_id
    WHERE c.id = authorized_pickups.crianca_id AND te.educador_user_id = auth.uid()
  )
);

CREATE POLICY "Responsáveis can view authorized_pickups of their crianças"
ON public.authorized_pickups FOR SELECT TO authenticated
USING (
  crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid()))
);

-- 4. Add foreign key from eventos to authorized_pickups
ALTER TABLE public.eventos
  ADD CONSTRAINT eventos_authorized_person_id_fkey
  FOREIGN KEY (authorized_person_id) REFERENCES public.authorized_pickups(id);

-- 5. Notification trigger for medication reminders
CREATE OR REPLACE FUNCTION public.notify_medication_reminder()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _crianca record;
  _educador record;
BEGIN
  IF NEW.tipo = 'MEDICAMENTO' AND NEW.horario_administracao IS NOT NULL AND NEW.administrado = false THEN
    SELECT c.nome, c.turma_id INTO _crianca FROM public.criancas c WHERE c.id = NEW.crianca_id;
    
    FOR _educador IN
      SELECT te.educador_user_id FROM public.turma_educadores te WHERE te.turma_id = _crianca.turma_id
    LOOP
      INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, crianca_id)
      VALUES (
        _educador.educador_user_id,
        '💊 Medicamento - ' || COALESCE(_crianca.nome, 'Criança'),
        'Administrar ' || COALESCE(NEW.nome_medicamento, 'medicamento') || ' (' || COALESCE(NEW.dosagem, '') || ') às ' || to_char(NEW.horario_administracao AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI'),
        'evento',
        NEW.crianca_id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_medication
AFTER INSERT ON public.eventos
FOR EACH ROW
EXECUTE FUNCTION public.notify_medication_reminder();


-- ------------------------------------------------------------------------
-- Migration: 20260313220342_7931c205-8521-4356-b0cf-c87c8ca32e85.sql
-- ------------------------------------------------------------------------

-- Allow directors to manage eventos_futuros for turmas in their creche
CREATE POLICY "Directors can manage eventos_futuros"
ON public.eventos_futuros
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'diretor'::app_role)
  AND (
    turma_id IS NULL
    OR is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id))
  )
)
WITH CHECK (
  has_role(auth.uid(), 'diretor'::app_role)
  AND (
    turma_id IS NULL
    OR is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id))
  )
);

-- Allow directors to manage feriados
CREATE POLICY "Directors can manage feriados"
ON public.feriados
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'diretor'::app_role))
WITH CHECK (has_role(auth.uid(), 'diretor'::app_role));


-- ------------------------------------------------------------------------
-- Migration: 20260323003227_ecad19d0-7759-4bbb-940a-4e8e28369f58.sql
-- ------------------------------------------------------------------------

-- Configurações pedagógicas por escola
CREATE TABLE public.configuracoes_pedagogicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  boletim_ativo boolean NOT NULL DEFAULT false,
  relatorio_desempenho_ativo boolean NOT NULL DEFAULT false,
  gestao_materias_ativo boolean NOT NULL DEFAULT false,
  grade_aulas_ativo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(creche_id)
);

ALTER TABLE public.configuracoes_pedagogicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage configuracoes_pedagogicas" ON public.configuracoes_pedagogicas
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage their school config" ON public.configuracoes_pedagogicas
  FOR ALL TO authenticated
  USING (is_diretor_of_creche(auth.uid(), creche_id))
  WITH CHECK (is_diretor_of_creche(auth.uid(), creche_id));

CREATE POLICY "Members can view their school config" ON public.configuracoes_pedagogicas
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.creche_membros cm
    WHERE cm.creche_id = configuracoes_pedagogicas.creche_id AND cm.user_id = auth.uid()
  ));

-- Matérias (disciplinas) por escola
CREATE TABLE public.materias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage materias" ON public.materias
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage their school materias" ON public.materias
  FOR ALL TO authenticated
  USING (is_diretor_of_creche(auth.uid(), creche_id))
  WITH CHECK (is_diretor_of_creche(auth.uid(), creche_id));

CREATE POLICY "Members can view their school materias" ON public.materias
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.creche_membros cm
    WHERE cm.creche_id = materias.creche_id AND cm.user_id = auth.uid()
  ));

-- Boletins escolares
CREATE TABLE public.boletins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crianca_id uuid NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  turma_id uuid NOT NULL REFERENCES public.turmas(id),
  materia_id uuid NOT NULL REFERENCES public.materias(id),
  educador_user_id uuid NOT NULL,
  periodo_letivo text NOT NULL,
  avaliacao numeric(4,1),
  observacoes text,
  data_registro date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.boletins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage boletins" ON public.boletins
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage boletins of their creche" ON public.boletins
  FOR ALL TO authenticated
  USING (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)))
  WITH CHECK (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)));

CREATE POLICY "Educadores can manage boletins in their turmas" ON public.boletins
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.turma_educadores te
    WHERE te.turma_id = boletins.turma_id AND te.educador_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.turma_educadores te
    WHERE te.turma_id = boletins.turma_id AND te.educador_user_id = auth.uid()
  ));

CREATE POLICY "Responsáveis can view boletins of their crianças" ON public.boletins
  FOR SELECT TO authenticated
  USING (crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid())));

-- Triggers for updated_at
CREATE TRIGGER update_configuracoes_pedagogicas_updated_at
  BEFORE UPDATE ON public.configuracoes_pedagogicas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materias_updated_at
  BEFORE UPDATE ON public.materias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boletins_updated_at
  BEFORE UPDATE ON public.boletins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ------------------------------------------------------------------------
-- Migration: 20260323004738_ba462a67-b50d-44e2-ab09-748279879aa4.sql
-- ------------------------------------------------------------------------

-- Grade de Aulas table
CREATE TABLE public.grade_aulas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  materia_id uuid NOT NULL REFERENCES public.materias(id) ON DELETE CASCADE,
  educador_user_id uuid NOT NULL,
  dia_semana integer NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  horario_inicio time NOT NULL,
  horario_fim time NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_aulas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage grade_aulas" ON public.grade_aulas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage grade_aulas of their creche" ON public.grade_aulas
  FOR ALL TO authenticated
  USING (public.is_diretor_of_creche(auth.uid(), public.get_creche_id_from_turma(turma_id)))
  WITH CHECK (public.is_diretor_of_creche(auth.uid(), public.get_creche_id_from_turma(turma_id)));

CREATE POLICY "Educadores can view grade_aulas in their turmas" ON public.grade_aulas
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.turma_educadores te
    WHERE te.turma_id = grade_aulas.turma_id AND te.educador_user_id = auth.uid()
  ));

CREATE POLICY "Members can view grade_aulas of their school" ON public.grade_aulas
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.turmas t
    JOIN public.creche_membros cm ON cm.creche_id = t.creche_id
    WHERE t.id = grade_aulas.turma_id AND cm.user_id = auth.uid()
  ));


-- ------------------------------------------------------------------------
-- Migration: 20260323010335_0bac57ed-927c-4d9d-932c-494fd1ad732d.sql
-- ------------------------------------------------------------------------

-- Modelos de relatório pedagógico por escola
CREATE TABLE public.relatorio_modelos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seções dentro de um modelo
CREATE TABLE public.relatorio_secoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id uuid NOT NULL REFERENCES public.relatorio_modelos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Campos dentro de uma seção
CREATE TABLE public.relatorio_campos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  secao_id uuid NOT NULL REFERENCES public.relatorio_secoes(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  tipo text NOT NULL DEFAULT 'texto_longo',
  opcoes jsonb,
  ordem integer NOT NULL DEFAULT 0,
  obrigatorio boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Relatório preenchido por aluno
CREATE TABLE public.relatorio_alunos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id uuid NOT NULL REFERENCES public.relatorio_modelos(id) ON DELETE CASCADE,
  crianca_id uuid NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  educador_user_id uuid NOT NULL,
  periodo_letivo text NOT NULL,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Respostas dos campos
CREATE TABLE public.relatorio_respostas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_aluno_id uuid NOT NULL REFERENCES public.relatorio_alunos(id) ON DELETE CASCADE,
  campo_id uuid NOT NULL REFERENCES public.relatorio_campos(id) ON DELETE CASCADE,
  valor text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Triggers updated_at
CREATE TRIGGER update_relatorio_modelos_updated_at BEFORE UPDATE ON public.relatorio_modelos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_relatorio_alunos_updated_at BEFORE UPDATE ON public.relatorio_alunos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_relatorio_respostas_updated_at BEFORE UPDATE ON public.relatorio_respostas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.relatorio_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorio_secoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorio_campos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorio_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorio_respostas ENABLE ROW LEVEL SECURITY;

-- relatorio_modelos policies
CREATE POLICY "Admins can manage relatorio_modelos" ON public.relatorio_modelos FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Directors can manage their school models" ON public.relatorio_modelos FOR ALL TO authenticated USING (is_diretor_of_creche(auth.uid(), creche_id)) WITH CHECK (is_diretor_of_creche(auth.uid(), creche_id));
CREATE POLICY "Members can view their school models" ON public.relatorio_modelos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM creche_membros cm WHERE cm.creche_id = relatorio_modelos.creche_id AND cm.user_id = auth.uid()));

-- relatorio_secoes policies (via modelo)
CREATE POLICY "Admins can manage relatorio_secoes" ON public.relatorio_secoes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Directors can manage secoes of their models" ON public.relatorio_secoes FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM relatorio_modelos rm WHERE rm.id = relatorio_secoes.modelo_id AND is_diretor_of_creche(auth.uid(), rm.creche_id))) WITH CHECK (EXISTS (SELECT 1 FROM relatorio_modelos rm WHERE rm.id = relatorio_secoes.modelo_id AND is_diretor_of_creche(auth.uid(), rm.creche_id)));
CREATE POLICY "Members can view secoes of their school" ON public.relatorio_secoes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM relatorio_modelos rm JOIN creche_membros cm ON cm.creche_id = rm.creche_id WHERE rm.id = relatorio_secoes.modelo_id AND cm.user_id = auth.uid()));

-- relatorio_campos policies (via secao -> modelo)
CREATE POLICY "Admins can manage relatorio_campos" ON public.relatorio_campos FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Directors can manage campos of their models" ON public.relatorio_campos FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM relatorio_secoes rs JOIN relatorio_modelos rm ON rm.id = rs.modelo_id WHERE rs.id = relatorio_campos.secao_id AND is_diretor_of_creche(auth.uid(), rm.creche_id))) WITH CHECK (EXISTS (SELECT 1 FROM relatorio_secoes rs JOIN relatorio_modelos rm ON rm.id = rs.modelo_id WHERE rs.id = relatorio_campos.secao_id AND is_diretor_of_creche(auth.uid(), rm.creche_id)));
CREATE POLICY "Members can view campos of their school" ON public.relatorio_campos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM relatorio_secoes rs JOIN relatorio_modelos rm ON rm.id = rs.modelo_id JOIN creche_membros cm ON cm.creche_id = rm.creche_id WHERE rs.id = relatorio_campos.secao_id AND cm.user_id = auth.uid()));

-- relatorio_alunos policies
CREATE POLICY "Admins can manage relatorio_alunos" ON public.relatorio_alunos FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Directors can manage relatorio_alunos of their creche" ON public.relatorio_alunos FOR ALL TO authenticated USING (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id))) WITH CHECK (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)));
CREATE POLICY "Educadores can manage their relatorio_alunos" ON public.relatorio_alunos FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM turma_educadores te WHERE te.turma_id = relatorio_alunos.turma_id AND te.educador_user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM turma_educadores te WHERE te.turma_id = relatorio_alunos.turma_id AND te.educador_user_id = auth.uid()));
CREATE POLICY "Responsaveis can view relatorio_alunos of their criancas" ON public.relatorio_alunos FOR SELECT TO authenticated USING (crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid())));

-- relatorio_respostas policies
CREATE POLICY "Admins can manage relatorio_respostas" ON public.relatorio_respostas FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Directors can manage respostas of their creche" ON public.relatorio_respostas FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM relatorio_alunos ra WHERE ra.id = relatorio_respostas.relatorio_aluno_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ra.turma_id)))) WITH CHECK (EXISTS (SELECT 1 FROM relatorio_alunos ra WHERE ra.id = relatorio_respostas.relatorio_aluno_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ra.turma_id))));
CREATE POLICY "Educadores can manage respostas of their reports" ON public.relatorio_respostas FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM relatorio_alunos ra JOIN turma_educadores te ON te.turma_id = ra.turma_id WHERE ra.id = relatorio_respostas.relatorio_aluno_id AND te.educador_user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM relatorio_alunos ra JOIN turma_educadores te ON te.turma_id = ra.turma_id WHERE ra.id = relatorio_respostas.relatorio_aluno_id AND te.educador_user_id = auth.uid()));
CREATE POLICY "Responsaveis can view respostas of their criancas" ON public.relatorio_respostas FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM relatorio_alunos ra WHERE ra.id = relatorio_respostas.relatorio_aluno_id AND ra.crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid()))));


-- ------------------------------------------------------------------------
-- Migration: 20260323011907_2e3c863e-f148-4b9c-bbeb-4927b197093c.sql
-- ------------------------------------------------------------------------
ALTER TABLE public.creches ADD COLUMN tipo_periodo text NOT NULL DEFAULT 'bimestral';

-- ------------------------------------------------------------------------
-- Migration: 20260323015024_f3b8dc22-4159-4d7a-9400-455aaff3e3a0.sql
-- ------------------------------------------------------------------------

-- Table to store per-school, per-role feature visibility and action permissions
CREATE TABLE public.permissoes_perfil (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  perfil text NOT NULL, -- 'diretor', 'educador', 'responsavel'
  modulo text NOT NULL, -- e.g. 'boletim', 'materias', 'grade_aulas', 'relatorio_desempenho', 'recados', 'presencas', 'eventos', 'turmas', 'alunos', 'calendario'
  pode_visualizar boolean NOT NULL DEFAULT true,
  pode_criar boolean NOT NULL DEFAULT false,
  pode_editar boolean NOT NULL DEFAULT false,
  pode_excluir boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(creche_id, perfil, modulo)
);

ALTER TABLE public.permissoes_perfil ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can manage permissoes_perfil"
  ON public.permissoes_perfil FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Directors can view their school permissions
CREATE POLICY "Directors can view their school permissoes"
  ON public.permissoes_perfil FOR SELECT
  TO authenticated
  USING (is_diretor_of_creche(auth.uid(), creche_id));

-- Members can view their school permissions
CREATE POLICY "Members can view their school permissoes"
  ON public.permissoes_perfil FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM creche_membros cm
    WHERE cm.creche_id = permissoes_perfil.creche_id AND cm.user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_permissoes_perfil_updated_at
  BEFORE UPDATE ON public.permissoes_perfil
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ------------------------------------------------------------------------
-- Migration: 20260327002136_9db9c4fd-6cd6-469a-929d-4e621e090ced.sql
-- ------------------------------------------------------------------------

-- Table for quote requests from landing page
CREATE TABLE public.orcamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  escola TEXT NOT NULL,
  cidade TEXT NOT NULL,
  telefone TEXT,
  email TEXT NOT NULL,
  num_alunos TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for admin responses to quotes
CREATE TABLE public.orcamento_respostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS on orcamentos
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert (from landing page, user is not authenticated)
CREATE POLICY "Anyone can insert orcamentos" ON public.orcamentos
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view/update/delete
CREATE POLICY "Admins can manage orcamentos" ON public.orcamentos
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS on orcamento_respostas
ALTER TABLE public.orcamento_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage orcamento_respostas" ON public.orcamento_respostas
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_orcamentos_updated_at
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ------------------------------------------------------------------------
-- Migration: 20260329205228_9d0b37ad-c62a-4d59-9f27-f66edbd43f13.sql
-- ------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public) VALUES ('authorized-pickups-photos', 'authorized-pickups-photos', true);

CREATE POLICY "Authenticated users can upload pickup photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'authorized-pickups-photos');

CREATE POLICY "Authenticated users can update pickup photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'authorized-pickups-photos');

CREATE POLICY "Anyone can view pickup photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'authorized-pickups-photos');

CREATE POLICY "Authenticated users can delete pickup photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'authorized-pickups-photos');


-- ------------------------------------------------------------------------
-- Migration: 20260329210208_0bb9d5bf-1904-409d-b4c5-fc1690d862c5.sql
-- ------------------------------------------------------------------------

ALTER TABLE public.presencas
ADD COLUMN pickup_person_id uuid NULL,
ADD COLUMN pickup_person_name text NULL,
ADD COLUMN pickup_person_type text NULL,
ADD COLUMN pickup_registered_by text NULL;


-- ------------------------------------------------------------------------
-- Migration: 20260329210849_8cd48a09-2290-4de4-b76b-db9e98b6e403.sql
-- ------------------------------------------------------------------------

CREATE POLICY "Educadores can view crianca_responsaveis in their turmas"
ON public.crianca_responsaveis
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM criancas c
    JOIN turma_educadores te ON te.turma_id = c.turma_id
    WHERE c.id = crianca_responsaveis.crianca_id
      AND te.educador_user_id = auth.uid()
  )
);


-- ------------------------------------------------------------------------
-- Migration: 20260329212525_cbe69ac4-b724-4495-a2d9-ea724b745cd3.sql
-- ------------------------------------------------------------------------

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


-- ------------------------------------------------------------------------
-- Migration: 20260329220717_76b10feb-86d6-4fd7-8c95-106017aa6d60.sql
-- ------------------------------------------------------------------------
INSERT INTO public.creches (id, nome)
VALUES ('00000000-0000-0000-0000-000000000001', 'Template Padrão')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------
-- Migration: 20260330003101_dd276990-ba9c-47f6-a5e6-764bbe8c8c48.sql
-- ------------------------------------------------------------------------

-- 1. Add 'aluno' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'aluno';

-- 2. Add email_aluno and user_id to criancas
ALTER TABLE public.criancas ADD COLUMN IF NOT EXISTS email_aluno text;
ALTER TABLE public.criancas ADD COLUMN IF NOT EXISTS user_id uuid;

-- 3. Add atividades_avaliacoes_ativo to configuracoes_pedagogicas
ALTER TABLE public.configuracoes_pedagogicas ADD COLUMN IF NOT EXISTS atividades_avaliacoes_ativo boolean NOT NULL DEFAULT false;

-- 4. Create atividades_pedagogicas table
CREATE TABLE public.atividades_pedagogicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  educador_user_id uuid NOT NULL,
  data_entrega date NOT NULL,
  tipo text NOT NULL DEFAULT 'atividade',
  instrucoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atividades_pedagogicas ENABLE ROW LEVEL SECURITY;

-- 5. Create atividade_questoes table
CREATE TABLE public.atividade_questoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL REFERENCES public.atividades_pedagogicas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  tipo text NOT NULL DEFAULT 'texto',
  imagem_url text,
  ordem integer NOT NULL DEFAULT 0,
  pontuacao numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atividade_questoes ENABLE ROW LEVEL SECURITY;

-- 6. Create atividade_opcoes table (for multiple choice)
CREATE TABLE public.atividade_opcoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questao_id uuid NOT NULL REFERENCES public.atividade_questoes(id) ON DELETE CASCADE,
  texto text NOT NULL,
  is_correta boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atividade_opcoes ENABLE ROW LEVEL SECURITY;

-- 7. Create atividade_entregas table (student submissions)
CREATE TABLE public.atividade_entregas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL REFERENCES public.atividades_pedagogicas(id) ON DELETE CASCADE,
  aluno_crianca_id uuid NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendente',
  nota numeric,
  feedback_educador text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atividade_entregas ENABLE ROW LEVEL SECURITY;

-- 8. Create atividade_respostas table (individual question responses)
CREATE TABLE public.atividade_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entrega_id uuid NOT NULL REFERENCES public.atividade_entregas(id) ON DELETE CASCADE,
  questao_id uuid NOT NULL REFERENCES public.atividade_questoes(id) ON DELETE CASCADE,
  resposta_texto text,
  opcao_selecionada_id uuid REFERENCES public.atividade_opcoes(id),
  foto_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atividade_respostas ENABLE ROW LEVEL SECURITY;

-- 9. Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('atividades-arquivos', 'atividades-arquivos', true)
ON CONFLICT (id) DO NOTHING;

-- 10. RLS policies for atividades_pedagogicas
CREATE POLICY "Admins can manage atividades" ON public.atividades_pedagogicas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage atividades of their creche" ON public.atividades_pedagogicas FOR ALL TO authenticated
  USING (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)))
  WITH CHECK (is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(turma_id)));

CREATE POLICY "Educadores can manage their atividades" ON public.atividades_pedagogicas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM turma_educadores te WHERE te.turma_id = atividades_pedagogicas.turma_id AND te.educador_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM turma_educadores te WHERE te.turma_id = atividades_pedagogicas.turma_id AND te.educador_user_id = auth.uid()));

CREATE POLICY "Alunos can view atividades of their turma" ON public.atividades_pedagogicas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM criancas c WHERE c.turma_id = atividades_pedagogicas.turma_id AND c.user_id = auth.uid()));

CREATE POLICY "Responsaveis can view atividades of their criancas turma" ON public.atividades_pedagogicas FOR SELECT TO authenticated
  USING (turma_id IN (SELECT get_turma_ids_for_responsavel(auth.uid())));

-- 11. RLS policies for atividade_questoes
CREATE POLICY "Admins can manage questoes" ON public.atividade_questoes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Educadores can manage questoes of their atividades" ON public.atividade_questoes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividades_pedagogicas ap JOIN turma_educadores te ON te.turma_id = ap.turma_id WHERE ap.id = atividade_questoes.atividade_id AND te.educador_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM atividades_pedagogicas ap JOIN turma_educadores te ON te.turma_id = ap.turma_id WHERE ap.id = atividade_questoes.atividade_id AND te.educador_user_id = auth.uid()));

CREATE POLICY "Directors can manage questoes" ON public.atividade_questoes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividades_pedagogicas ap WHERE ap.id = atividade_questoes.atividade_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ap.turma_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM atividades_pedagogicas ap WHERE ap.id = atividade_questoes.atividade_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ap.turma_id))));

CREATE POLICY "Alunos can view questoes" ON public.atividade_questoes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM atividades_pedagogicas ap JOIN criancas c ON c.turma_id = ap.turma_id WHERE ap.id = atividade_questoes.atividade_id AND c.user_id = auth.uid()));

CREATE POLICY "Responsaveis can view questoes" ON public.atividade_questoes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM atividades_pedagogicas ap WHERE ap.id = atividade_questoes.atividade_id AND ap.turma_id IN (SELECT get_turma_ids_for_responsavel(auth.uid()))));

-- 12. RLS policies for atividade_opcoes
CREATE POLICY "Admins can manage opcoes" ON public.atividade_opcoes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Educadores can manage opcoes" ON public.atividade_opcoes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividade_questoes aq JOIN atividades_pedagogicas ap ON ap.id = aq.atividade_id JOIN turma_educadores te ON te.turma_id = ap.turma_id WHERE aq.id = atividade_opcoes.questao_id AND te.educador_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM atividade_questoes aq JOIN atividades_pedagogicas ap ON ap.id = aq.atividade_id JOIN turma_educadores te ON te.turma_id = ap.turma_id WHERE aq.id = atividade_opcoes.questao_id AND te.educador_user_id = auth.uid()));

CREATE POLICY "Directors can manage opcoes" ON public.atividade_opcoes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividade_questoes aq JOIN atividades_pedagogicas ap ON ap.id = aq.atividade_id WHERE aq.id = atividade_opcoes.questao_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ap.turma_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM atividade_questoes aq JOIN atividades_pedagogicas ap ON ap.id = aq.atividade_id WHERE aq.id = atividade_opcoes.questao_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ap.turma_id))));

CREATE POLICY "Alunos can view opcoes" ON public.atividade_opcoes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM atividade_questoes aq JOIN atividades_pedagogicas ap ON ap.id = aq.atividade_id JOIN criancas c ON c.turma_id = ap.turma_id WHERE aq.id = atividade_opcoes.questao_id AND c.user_id = auth.uid()));

CREATE POLICY "Responsaveis can view opcoes" ON public.atividade_opcoes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM atividade_questoes aq JOIN atividades_pedagogicas ap ON ap.id = aq.atividade_id WHERE aq.id = atividade_opcoes.questao_id AND ap.turma_id IN (SELECT get_turma_ids_for_responsavel(auth.uid()))));

-- 13. RLS policies for atividade_entregas
CREATE POLICY "Admins can manage entregas" ON public.atividade_entregas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Educadores can manage entregas in their turmas" ON public.atividade_entregas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividades_pedagogicas ap JOIN turma_educadores te ON te.turma_id = ap.turma_id WHERE ap.id = atividade_entregas.atividade_id AND te.educador_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM atividades_pedagogicas ap JOIN turma_educadores te ON te.turma_id = ap.turma_id WHERE ap.id = atividade_entregas.atividade_id AND te.educador_user_id = auth.uid()));

CREATE POLICY "Directors can manage entregas" ON public.atividade_entregas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividades_pedagogicas ap WHERE ap.id = atividade_entregas.atividade_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ap.turma_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM atividades_pedagogicas ap WHERE ap.id = atividade_entregas.atividade_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ap.turma_id))));

CREATE POLICY "Alunos can manage own entregas" ON public.atividade_entregas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM criancas c WHERE c.id = atividade_entregas.aluno_crianca_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM criancas c WHERE c.id = atividade_entregas.aluno_crianca_id AND c.user_id = auth.uid()));

CREATE POLICY "Responsaveis can view entregas of their criancas" ON public.atividade_entregas FOR SELECT TO authenticated
  USING (aluno_crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid())));

-- 14. RLS policies for atividade_respostas
CREATE POLICY "Admins can manage respostas_atv" ON public.atividade_respostas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Educadores can manage respostas_atv in their turmas" ON public.atividade_respostas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividade_entregas ae JOIN atividades_pedagogicas ap ON ap.id = ae.atividade_id JOIN turma_educadores te ON te.turma_id = ap.turma_id WHERE ae.id = atividade_respostas.entrega_id AND te.educador_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM atividade_entregas ae JOIN atividades_pedagogicas ap ON ap.id = ae.atividade_id JOIN turma_educadores te ON te.turma_id = ap.turma_id WHERE ae.id = atividade_respostas.entrega_id AND te.educador_user_id = auth.uid()));

CREATE POLICY "Directors can manage respostas_atv" ON public.atividade_respostas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividade_entregas ae JOIN atividades_pedagogicas ap ON ap.id = ae.atividade_id WHERE ae.id = atividade_respostas.entrega_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ap.turma_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM atividade_entregas ae JOIN atividades_pedagogicas ap ON ap.id = ae.atividade_id WHERE ae.id = atividade_respostas.entrega_id AND is_diretor_of_creche(auth.uid(), get_creche_id_from_turma(ap.turma_id))));

CREATE POLICY "Alunos can manage own respostas_atv" ON public.atividade_respostas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM atividade_entregas ae JOIN criancas c ON c.id = ae.aluno_crianca_id WHERE ae.id = atividade_respostas.entrega_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM atividade_entregas ae JOIN criancas c ON c.id = ae.aluno_crianca_id WHERE ae.id = atividade_respostas.entrega_id AND c.user_id = auth.uid()));

CREATE POLICY "Responsaveis can view respostas_atv of their criancas" ON public.atividade_respostas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM atividade_entregas ae WHERE ae.id = atividade_respostas.entrega_id AND ae.aluno_crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid()))));

-- 15. Storage policies for atividades-arquivos bucket
CREATE POLICY "Authenticated can upload atividade files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'atividades-arquivos');

CREATE POLICY "Authenticated can view atividade files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'atividades-arquivos');

CREATE POLICY "Authenticated can delete own atividade files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'atividades-arquivos');

-- 16. Triggers for updated_at
CREATE TRIGGER update_atividades_pedagogicas_updated_at BEFORE UPDATE ON public.atividades_pedagogicas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_atividade_entregas_updated_at BEFORE UPDATE ON public.atividade_entregas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ------------------------------------------------------------------------
-- Migration: 20260330014930_9340933b-3b91-4eeb-bbaf-911bd74f2c8c.sql
-- ------------------------------------------------------------------------

CREATE POLICY "Alunos can view own crianca record"
ON public.criancas
FOR SELECT
TO authenticated
USING (user_id = auth.uid());


-- ------------------------------------------------------------------------
-- Migration: 20260330015554_d0db46c2-8dbd-480d-afd7-c24ae7c24e1a.sql
-- ------------------------------------------------------------------------

-- Allow alunos to view grade_aulas of their turma
CREATE POLICY "Alunos can view grade_aulas of their turma"
ON public.grade_aulas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    WHERE c.turma_id = grade_aulas.turma_id
      AND c.user_id = auth.uid()
  )
);

-- Allow alunos to view materias of their school
CREATE POLICY "Alunos can view materias of their school"
ON public.materias
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    JOIN public.turmas t ON t.id = c.turma_id
    WHERE t.creche_id = materias.creche_id
      AND c.user_id = auth.uid()
  )
);


-- ------------------------------------------------------------------------
-- Migration: 20260330015930_1d893734-4f48-4ea6-98a2-a84282a9efb9.sql
-- ------------------------------------------------------------------------
CREATE POLICY "Alunos can view their turma"
ON public.turmas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    WHERE c.turma_id = turmas.id AND c.user_id = auth.uid()
  )
);

-- ------------------------------------------------------------------------
-- Migration: 20260330021358_e53975ca-1a0a-4db7-ba71-8928abdbbb1d.sql
-- ------------------------------------------------------------------------

-- Add 'secretaria' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'secretaria';

-- Add modulo_secretaria_ativo to configuracoes_pedagogicas
ALTER TABLE public.configuracoes_pedagogicas 
ADD COLUMN IF NOT EXISTS modulo_secretaria_ativo boolean NOT NULL DEFAULT false;


-- ------------------------------------------------------------------------
-- Migration: 20260330021700_c4f3c0cb-6458-47f1-af24-2dcc46f5dcbe.sql
-- ------------------------------------------------------------------------

-- Add RLS policies for secretaria role on key tables
-- Secretaria members are in creche_membros, so existing "Members can view" policies cover SELECT.
-- We need additional policies for tables where secretaria needs write access.

-- criancas: secretaria can manage criancas of their creche
CREATE POLICY "Secretaria can manage criancas of their creche"
ON public.criancas FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND 
  is_member_of_turma_creche(auth.uid(), turma_id)
)
WITH CHECK (
  has_role(auth.uid(), 'secretaria') AND 
  is_member_of_turma_creche(auth.uid(), turma_id)
);

-- presencas: secretaria can manage
CREATE POLICY "Secretaria can manage presencas of their creche"
ON public.presencas FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND EXISTS (
    SELECT 1 FROM criancas c
    JOIN turmas t ON t.id = c.turma_id
    JOIN creche_membros cm ON cm.creche_id = t.creche_id
    WHERE c.id = presencas.crianca_id AND cm.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'secretaria') AND EXISTS (
    SELECT 1 FROM criancas c
    JOIN turmas t ON t.id = c.turma_id
    JOIN creche_membros cm ON cm.creche_id = t.creche_id
    WHERE c.id = presencas.crianca_id AND cm.user_id = auth.uid()
  )
);

-- eventos: secretaria can manage
CREATE POLICY "Secretaria can manage eventos of their creche"
ON public.eventos FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND EXISTS (
    SELECT 1 FROM criancas c
    JOIN turmas t ON t.id = c.turma_id
    JOIN creche_membros cm ON cm.creche_id = t.creche_id
    WHERE c.id = eventos.crianca_id AND cm.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'secretaria') AND EXISTS (
    SELECT 1 FROM criancas c
    JOIN turmas t ON t.id = c.turma_id
    JOIN creche_membros cm ON cm.creche_id = t.creche_id
    WHERE c.id = eventos.crianca_id AND cm.user_id = auth.uid()
  )
);

-- turmas: secretaria can view turmas of their creche (already covered by member policies for SELECT on turmas)
-- Let's check if turmas has a member policy... it doesn't. Add one.
CREATE POLICY "Secretaria can view turmas of their creche"
ON public.turmas FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND EXISTS (
    SELECT 1 FROM creche_membros cm
    WHERE cm.creche_id = turmas.creche_id AND cm.user_id = auth.uid()
  )
);

-- profiles: secretaria can view profiles of their creche
CREATE POLICY "Secretaria can view profiles of creche members"
ON public.profiles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND (
    user_id = auth.uid() OR is_in_same_creche(auth.uid(), user_id)
  )
);


-- ------------------------------------------------------------------------
-- Migration: 20260330022839_94a13a18-51a1-452b-a7f1-236694f741be.sql
-- ------------------------------------------------------------------------

-- Allow directors to manage permissoes_perfil of their school
CREATE POLICY "Directors can manage permissoes_perfil of their school"
ON public.permissoes_perfil FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'diretor') AND is_diretor_of_creche(auth.uid(), creche_id)
)
WITH CHECK (
  has_role(auth.uid(), 'diretor') AND is_diretor_of_creche(auth.uid(), creche_id)
);


-- ------------------------------------------------------------------------
-- Migration: 20260330024137_e3aebf50-4f29-49d0-b5e6-adc26367d3df.sql
-- ------------------------------------------------------------------------

-- Secretaria RLS for boletins
CREATE POLICY "Secretaria can manage boletins of their creche"
ON public.boletins FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM turmas t JOIN creche_membros cm ON cm.creche_id = t.creche_id WHERE t.id = boletins.turma_id AND cm.user_id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM turmas t JOIN creche_membros cm ON cm.creche_id = t.creche_id WHERE t.id = boletins.turma_id AND cm.user_id = auth.uid())
);

-- grade_aulas
CREATE POLICY "Secretaria can view grade_aulas of their creche"
ON public.grade_aulas FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM turmas t JOIN creche_membros cm ON cm.creche_id = t.creche_id WHERE t.id = grade_aulas.turma_id AND cm.user_id = auth.uid())
);

-- materias
CREATE POLICY "Secretaria can view materias of their creche"
ON public.materias FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM creche_membros cm WHERE cm.creche_id = materias.creche_id AND cm.user_id = auth.uid())
);

-- turma_educadores
CREATE POLICY "Secretaria can view turma_educadores of their creche"
ON public.turma_educadores FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'secretaria') AND is_member_of_turma_creche(auth.uid(), turma_id));

-- atividades_pedagogicas
CREATE POLICY "Secretaria can view atividades of their creche"
ON public.atividades_pedagogicas FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'secretaria') AND is_member_of_turma_creche(auth.uid(), turma_id));

-- atividade_entregas
CREATE POLICY "Secretaria can view entregas of their creche"
ON public.atividade_entregas FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM atividades_pedagogicas ap WHERE ap.id = atividade_entregas.atividade_id AND is_member_of_turma_creche(auth.uid(), ap.turma_id))
);

-- atividade_questoes
CREATE POLICY "Secretaria can view questoes of their creche"
ON public.atividade_questoes FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM atividades_pedagogicas ap WHERE ap.id = atividade_questoes.atividade_id AND is_member_of_turma_creche(auth.uid(), ap.turma_id))
);

-- atividade_opcoes
CREATE POLICY "Secretaria can view opcoes of their creche"
ON public.atividade_opcoes FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM atividade_questoes aq JOIN atividades_pedagogicas ap ON ap.id = aq.atividade_id WHERE aq.id = atividade_opcoes.questao_id AND is_member_of_turma_creche(auth.uid(), ap.turma_id))
);

-- atividade_respostas
CREATE POLICY "Secretaria can view respostas of their creche"
ON public.atividade_respostas FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM atividade_entregas ae JOIN atividades_pedagogicas ap ON ap.id = ae.atividade_id WHERE ae.id = atividade_respostas.entrega_id AND is_member_of_turma_creche(auth.uid(), ap.turma_id))
);

-- feriados
CREATE POLICY "Secretaria can manage feriados"
ON public.feriados FOR ALL TO authenticated
USING (has_role(auth.uid(), 'secretaria'))
WITH CHECK (has_role(auth.uid(), 'secretaria'));

-- eventos_futuros
CREATE POLICY "Secretaria can view eventos_futuros"
ON public.eventos_futuros FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'secretaria'));

-- relatorio_alunos
CREATE POLICY "Secretaria can view relatorio_alunos of their creche"
ON public.relatorio_alunos FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'secretaria') AND is_member_of_turma_creche(auth.uid(), turma_id));

-- relatorio_modelos
CREATE POLICY "Secretaria can view relatorio_modelos of their creche"
ON public.relatorio_modelos FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM creche_membros cm WHERE cm.creche_id = relatorio_modelos.creche_id AND cm.user_id = auth.uid())
);

-- relatorio_secoes
CREATE POLICY "Secretaria can view relatorio_secoes of their creche"
ON public.relatorio_secoes FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM relatorio_modelos rm JOIN creche_membros cm ON cm.creche_id = rm.creche_id WHERE rm.id = relatorio_secoes.modelo_id AND cm.user_id = auth.uid())
);

-- relatorio_campos
CREATE POLICY "Secretaria can view relatorio_campos of their creche"
ON public.relatorio_campos FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM relatorio_secoes rs JOIN relatorio_modelos rm ON rm.id = rs.modelo_id JOIN creche_membros cm ON cm.creche_id = rm.creche_id WHERE rs.id = relatorio_campos.secao_id AND cm.user_id = auth.uid())
);

-- relatorio_respostas
CREATE POLICY "Secretaria can view relatorio_respostas of their creche"
ON public.relatorio_respostas FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM relatorio_alunos ra WHERE ra.id = relatorio_respostas.relatorio_aluno_id AND is_member_of_turma_creche(auth.uid(), ra.turma_id))
);

-- authorized_pickups
CREATE POLICY "Secretaria can manage authorized_pickups of their creche"
ON public.authorized_pickups FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM criancas c WHERE c.id = authorized_pickups.crianca_id AND is_member_of_turma_creche(auth.uid(), c.turma_id))
)
WITH CHECK (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM criancas c WHERE c.id = authorized_pickups.crianca_id AND is_member_of_turma_creche(auth.uid(), c.turma_id))
);

-- crianca_responsaveis
CREATE POLICY "Secretaria can manage crianca_responsaveis of their creche"
ON public.crianca_responsaveis FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM criancas c WHERE c.id = crianca_responsaveis.crianca_id AND is_member_of_turma_creche(auth.uid(), c.turma_id))
)
WITH CHECK (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (SELECT 1 FROM criancas c WHERE c.id = crianca_responsaveis.crianca_id AND is_member_of_turma_creche(auth.uid(), c.turma_id))
);

-- profiles (view same creche members)
CREATE POLICY "Secretaria can view profiles of same creche"
ON public.profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'secretaria') AND is_in_same_creche(auth.uid(), user_id));


-- ------------------------------------------------------------------------
-- Migration: 20260330024518_40c36ada-63c2-4685-8686-85f184a57547.sql
-- ------------------------------------------------------------------------

-- Secretaria can view user_roles of same creche members
CREATE POLICY "Secretaria can view roles of creche members"
ON public.user_roles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  is_in_same_creche(auth.uid(), user_id) AND
  role <> 'admin'
);

-- Secretaria can also view profiles of alunos in their school (alunos not in creche_membros)
CREATE POLICY "Secretaria can view aluno profiles of their creche"
ON public.profiles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (
    SELECT 1 FROM criancas c
    JOIN turmas t ON t.id = c.turma_id
    JOIN creche_membros cm ON cm.creche_id = t.creche_id
    WHERE c.user_id = profiles.user_id AND cm.user_id = auth.uid()
  )
);

-- Secretaria can update profiles of same creche (for toggling ativo, editing)
CREATE POLICY "Secretaria can update profiles of same creche"
ON public.profiles FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  (is_in_same_creche(auth.uid(), user_id) OR
   EXISTS (
     SELECT 1 FROM criancas c
     JOIN turmas t ON t.id = c.turma_id
     JOIN creche_membros cm ON cm.creche_id = t.creche_id
     WHERE c.user_id = profiles.user_id AND cm.user_id = auth.uid()
   ))
);

-- Secretaria can view aluno roles too
CREATE POLICY "Secretaria can view aluno roles"
ON public.user_roles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (
    SELECT 1 FROM criancas c
    JOIN turmas t ON t.id = c.turma_id
    JOIN creche_membros cm ON cm.creche_id = t.creche_id
    WHERE c.user_id = user_roles.user_id AND cm.user_id = auth.uid()
  )
);


-- ------------------------------------------------------------------------
-- Migration: 20260330025009_453bcbc7-6ece-48fa-bf63-a72ee466b041.sql
-- ------------------------------------------------------------------------

-- Allow secretaria to view all creche_membros of their school
CREATE POLICY "Secretaria can view membros of their creche"
ON public.creche_membros FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  EXISTS (
    SELECT 1 FROM creche_membros my_cm
    WHERE my_cm.user_id = auth.uid() AND my_cm.creche_id = creche_membros.creche_id
  )
);


-- ------------------------------------------------------------------------
-- Migration: 20260330025220_dcd3c6bb-5c22-4a9f-9b6e-519afc893131.sql
-- ------------------------------------------------------------------------

-- Create a helper function to get the creche_id for a user (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_creche_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT creche_id FROM public.creche_membros
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Secretaria can view membros of their creche" ON public.creche_membros;

-- Recreate with non-recursive approach
CREATE POLICY "Secretaria can view membros of their creche"
ON public.creche_membros FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria') AND
  creche_id = get_user_creche_id(auth.uid())
);


-- ------------------------------------------------------------------------
-- Migration: 20260330031526_4c7fa892-de9f-4a31-877e-96f3718943d1.sql
-- ------------------------------------------------------------------------

CREATE TABLE public.suporte_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  email text NOT NULL,
  assunto text NOT NULL,
  mensagem text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suporte_mensagens ENABLE ROW LEVEL SECURITY;

-- All authenticated users can insert
CREATE POLICY "Authenticated users can insert suporte"
ON public.suporte_mensagens FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can view their own messages
CREATE POLICY "Users can view own suporte"
ON public.suporte_mensagens FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admins can manage all
CREATE POLICY "Admins can manage all suporte"
ON public.suporte_mensagens FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));


-- ------------------------------------------------------------------------
-- Migration: 20260330032043_ef39c7cb-6d03-481b-9db8-dba9a57bd73e.sql
-- ------------------------------------------------------------------------

-- Allow admins to update suporte_mensagens (status changes)
CREATE POLICY "Admins can update suporte_mensagens"
ON public.suporte_mensagens FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));


-- ------------------------------------------------------------------------
-- Migration: 20260330033009_499bf9db-6d71-4e05-95e1-528ecac8ee99.sql
-- ------------------------------------------------------------------------

-- Allow users to see support recados addressed to them (remetente_user_id = their id, remetente_nome contains Suporte)
CREATE POLICY "Users can view support recados addressed to them"
  ON public.recados FOR SELECT TO authenticated
  USING (
    remetente_user_id = auth.uid()
    AND turma_id IS NULL
    AND crianca_id IS NULL
    AND remetente_nome LIKE '%Suporte%'
  );


-- ------------------------------------------------------------------------
-- Migration: 20260330033102_44e2f38b-8788-451a-a97e-e69e20a796e3.sql
-- ------------------------------------------------------------------------

-- Enable realtime for suporte_mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE public.suporte_mensagens;

-- Trigger to notify admin when new support message arrives
CREATE OR REPLACE FUNCTION public.notify_admin_on_suporte()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin record;
BEGIN
  FOR _admin IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo)
    VALUES (
      _admin.user_id,
      '🛟 Nova mensagem de suporte',
      COALESCE(NEW.nome, 'Usuário') || ': ' || COALESCE(NEW.assunto, 'Sem assunto'),
      'evento'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_admin_on_suporte
  AFTER INSERT ON public.suporte_mensagens
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_suporte();


-- ------------------------------------------------------------------------
-- Migration: 20260407184229_119ebef0-94c8-4c3e-a72e-51b63889c568.sql
-- ------------------------------------------------------------------------

-- Create boletos table
CREATE TABLE public.boletos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creche_id UUID NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  crianca_id UUID NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL,
  vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  descricao TEXT,
  referencia TEXT,
  desconto_antecipacao NUMERIC(5,2) DEFAULT 0,
  data_limite_desconto DATE,
  multa_atraso NUMERIC(5,2) DEFAULT 0,
  juros_dia NUMERIC(5,4) DEFAULT 0,
  parcela_atual INTEGER DEFAULT 1,
  total_parcelas INTEGER DEFAULT 1,
  linha_digitavel TEXT,
  codigo_barras TEXT,
  nosso_numero TEXT,
  observacoes TEXT,
  data_pagamento DATE,
  registrado_por_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all boletos"
ON public.boletos FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Directors can manage boletos of their creche"
ON public.boletos FOR ALL TO authenticated
USING (is_diretor_of_creche(auth.uid(), creche_id))
WITH CHECK (is_diretor_of_creche(auth.uid(), creche_id));

CREATE POLICY "Secretaria can manage boletos of their creche"
ON public.boletos FOR ALL TO authenticated
USING (has_role(auth.uid(), 'secretaria'::app_role) AND creche_id = get_user_creche_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'secretaria'::app_role) AND creche_id = get_user_creche_id(auth.uid()));

CREATE POLICY "Responsaveis can view boletos of their criancas"
ON public.boletos FOR SELECT TO authenticated
USING (crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid())));

-- Updated_at trigger
CREATE TRIGGER update_boletos_updated_at
BEFORE UPDATE ON public.boletos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add modulo_boletos_ativo to configuracoes_pedagogicas
ALTER TABLE public.configuracoes_pedagogicas
ADD COLUMN modulo_boletos_ativo BOOLEAN NOT NULL DEFAULT false;


-- ------------------------------------------------------------------------
-- Migration: 20260429083516_480c3482-cd88-4044-939b-2e9e8891f9c4.sql
-- ------------------------------------------------------------------------
-- 1. Fix search_path nas funções da fila de emails
CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint LANGUAGE sql SECURITY DEFINER SET search_path = public, pgmq
AS $function$ SELECT pgmq.send(queue_name, payload); $function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE sql SECURITY DEFINER SET search_path = public, pgmq
AS $function$ SELECT msg_id, read_ct, message FROM pgmq.read(queue_name, vt, batch_size); $function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public, pgmq
AS $function$ SELECT pgmq.delete(queue_name, message_id); $function$;

-- 2. Revogar EXECUTE de anon/public nas funções SECURITY DEFINER da fila (apenas service_role usa)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

-- 3. Restringir LIST nos buckets públicos: trocar SELECT amplo por SELECT autenticado
DROP POLICY IF EXISTS "Anyone can view pickup photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view recado attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view atividade files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view creche logos" ON storage.objects;

-- Recriar permitindo apenas leitura individual por authenticated (sem listing por anon)
CREATE POLICY "Authenticated can view pickup photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'authorized-pickups-photos');

CREATE POLICY "Authenticated can view recado attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'recado-anexos');

CREATE POLICY "Authenticated can view atividade files v2"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'atividades-arquivos');

-- creche-logos precisa ser legível por anon (usado em emails/landing). Mantém público mas sem permitir listing.
CREATE POLICY "Public can view creche logo objects"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'creche-logos' AND name IS NOT NULL);

-- email-assets idem
DROP POLICY IF EXISTS "Public can view email assets" ON storage.objects;
CREATE POLICY "Public can view email asset objects"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'email-assets' AND name IS NOT NULL);

-- ------------------------------------------------------------------------
-- Migration: 20260429083602_4bf436fb-9153-40d6-9751-eed6088d376b.sql
-- ------------------------------------------------------------------------
-- Revogar EXECUTE de anon em todas as funções SECURITY DEFINER (mantém authenticated)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_creche_id(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_creche_id_from_turma(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_crianca_ids_for_responsavel(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_turma_ids_for_responsavel(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_diretor_of_creche(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_educador_of_turma(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_in_same_creche(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_member_of_turma_creche(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_responsavel_of_crianca(uuid, uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_creche_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_creche_id_from_turma(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_crianca_ids_for_responsavel(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_turma_ids_for_responsavel(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_diretor_of_creche(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_educador_of_turma(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_in_same_creche(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_member_of_turma_creche(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_responsavel_of_crianca(uuid, uuid) TO authenticated;

-- Tornar privados os buckets sensíveis (mantém logos e email-assets públicos)
UPDATE storage.buckets SET public = false
WHERE id IN ('recado-anexos', 'authorized-pickups-photos', 'atividades-arquivos');

-- ------------------------------------------------------------------------
-- Migration: 20260429084010_57955037-ce18-48c3-87f1-164ef9c6b18f.sql
-- ------------------------------------------------------------------------
-- Funções que são APENAS triggers do Postgres — revogar EXECUTE de todos os roles da API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_suporte() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_medication_reminder() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_recado() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_responsaveis_on_evento() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Garante que anon não pode chamar nenhum helper (mantém só authenticated + service_role, exigidos pelas RLS)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_creche_id(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_creche_id_from_turma(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_crianca_ids_for_responsavel(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_turma_ids_for_responsavel(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_diretor_of_creche(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_educador_of_turma(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_in_same_creche(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_member_of_turma_creche(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_responsavel_of_crianca(uuid, uuid) FROM anon, PUBLIC;

-- ------------------------------------------------------------------------
-- Migration: 20260429152940_1a8d61b1-821c-4668-9b35-c6c94db62cb4.sql
-- ------------------------------------------------------------------------

-- Helper: check if user can access a given crianca (responsavel, educador da turma, diretor da creche, admin)
CREATE OR REPLACE FUNCTION public.can_access_crianca(_user_id uuid, _crianca_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.crianca_responsaveis cr
      WHERE cr.crianca_id = _crianca_id AND cr.responsavel_user_id = _user_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.criancas c
      JOIN public.turma_educadores te ON te.turma_id = c.turma_id
      WHERE c.id = _crianca_id AND te.educador_user_id = _user_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.criancas c
      JOIN public.turmas t ON t.id = c.turma_id
      JOIN public.creche_membros cm ON cm.creche_id = t.creche_id
      JOIN public.user_roles ur ON ur.user_id = cm.user_id
      WHERE c.id = _crianca_id
        AND cm.user_id = _user_id
        AND ur.role IN ('diretor','secretaria')
    )
$$;

REVOKE EXECUTE ON FUNCTION public.can_access_crianca(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_crianca(uuid, uuid) TO authenticated;

-- Ensure bucket is private
UPDATE storage.buckets SET public = false WHERE id = 'authorized-pickups-photos';

-- Drop old broad policies
DROP POLICY IF EXISTS "Authenticated can view pickup photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload pickup photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update pickup photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete pickup photos" ON storage.objects;

-- Path convention: <crianca_id>/<person_id>.<ext>
-- SELECT: only users authorized for that crianca
CREATE POLICY "Pickup photos: authorized read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'authorized-pickups-photos'
  AND public.can_access_crianca(
    auth.uid(),
    NULLIF((storage.foldername(name))[1], '')::uuid
  )
);

CREATE POLICY "Pickup photos: authorized insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'authorized-pickups-photos'
  AND public.can_access_crianca(
    auth.uid(),
    NULLIF((storage.foldername(name))[1], '')::uuid
  )
);

CREATE POLICY "Pickup photos: authorized update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'authorized-pickups-photos'
  AND public.can_access_crianca(
    auth.uid(),
    NULLIF((storage.foldername(name))[1], '')::uuid
  )
);

CREATE POLICY "Pickup photos: authorized delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'authorized-pickups-photos'
  AND public.can_access_crianca(
    auth.uid(),
    NULLIF((storage.foldername(name))[1], '')::uuid
  )
);


-- ------------------------------------------------------------------------
-- Migration: 20260429153655_1bce0583-4168-4dde-9db8-b6a6180ebc96.sql
-- ------------------------------------------------------------------------

-- Audit table
CREATE TABLE public.pickup_photo_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  crianca_id uuid NOT NULL,
  authorized_pickup_id uuid,
  action text NOT NULL CHECK (action IN ('view','upload','update','delete')),
  foto_path text,
  user_email text,
  user_role text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pickup_audit_created_at ON public.pickup_photo_audit (created_at DESC);
CREATE INDEX idx_pickup_audit_crianca ON public.pickup_photo_audit (crianca_id);
CREATE INDEX idx_pickup_audit_user ON public.pickup_photo_audit (user_id);

ALTER TABLE public.pickup_photo_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can read pickup audit"
ON public.pickup_photo_audit FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Block direct writes from clients; only DB triggers / SECURITY DEFINER funcs insert.
-- (No INSERT/UPDATE/DELETE policies => denied for anon and authenticated.)

-- RPC to log a view event (called from frontend when signed URLs are generated)
CREATE OR REPLACE FUNCTION public.log_pickup_photo_view(
  _crianca_id uuid,
  _authorized_pickup_id uuid,
  _foto_path text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _role text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;

  -- Only allow logging if the caller actually has access to the crianca
  IF NOT public.can_access_crianca(_uid, _crianca_id) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  SELECT email INTO _email FROM public.profiles WHERE user_id = _uid;
  SELECT role::text INTO _role FROM public.user_roles WHERE user_id = _uid LIMIT 1;

  INSERT INTO public.pickup_photo_audit
    (user_id, crianca_id, authorized_pickup_id, action, foto_path, user_email, user_role)
  VALUES
    (_uid, _crianca_id, _authorized_pickup_id, 'view', _foto_path, _email, _role);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_pickup_photo_view(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_pickup_photo_view(uuid, uuid, text) TO authenticated;

-- Trigger function for INSERT/UPDATE/DELETE on authorized_pickups
CREATE OR REPLACE FUNCTION public.audit_authorized_pickups_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _role text;
BEGIN
  IF _uid IS NOT NULL THEN
    SELECT email INTO _email FROM public.profiles WHERE user_id = _uid;
    SELECT role::text INTO _role FROM public.user_roles WHERE user_id = _uid LIMIT 1;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.foto_url IS NOT NULL THEN
      INSERT INTO public.pickup_photo_audit
        (user_id, crianca_id, authorized_pickup_id, action, foto_path, user_email, user_role)
      VALUES (_uid, NEW.crianca_id, NEW.id, 'upload', NEW.foto_url, _email, _role);
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF COALESCE(OLD.foto_url, '') IS DISTINCT FROM COALESCE(NEW.foto_url, '') THEN
      IF OLD.foto_url IS NULL AND NEW.foto_url IS NOT NULL THEN
        INSERT INTO public.pickup_photo_audit
          (user_id, crianca_id, authorized_pickup_id, action, foto_path, user_email, user_role)
        VALUES (_uid, NEW.crianca_id, NEW.id, 'upload', NEW.foto_url, _email, _role);
      ELSIF OLD.foto_url IS NOT NULL AND NEW.foto_url IS NULL THEN
        INSERT INTO public.pickup_photo_audit
          (user_id, crianca_id, authorized_pickup_id, action, foto_path, user_email, user_role)
        VALUES (_uid, NEW.crianca_id, NEW.id, 'delete', OLD.foto_url, _email, _role);
      ELSE
        INSERT INTO public.pickup_photo_audit
          (user_id, crianca_id, authorized_pickup_id, action, foto_path, user_email, user_role)
        VALUES (_uid, NEW.crianca_id, NEW.id, 'update', NEW.foto_url, _email, _role);
      END IF;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.foto_url IS NOT NULL THEN
      INSERT INTO public.pickup_photo_audit
        (user_id, crianca_id, authorized_pickup_id, action, foto_path, user_email, user_role)
      VALUES (_uid, OLD.crianca_id, OLD.id, 'delete', OLD.foto_url, _email, _role);
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.audit_authorized_pickups_changes() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_audit_authorized_pickups_ins
AFTER INSERT ON public.authorized_pickups
FOR EACH ROW EXECUTE FUNCTION public.audit_authorized_pickups_changes();

CREATE TRIGGER trg_audit_authorized_pickups_upd
AFTER UPDATE ON public.authorized_pickups
FOR EACH ROW EXECUTE FUNCTION public.audit_authorized_pickups_changes();

CREATE TRIGGER trg_audit_authorized_pickups_del
AFTER DELETE ON public.authorized_pickups
FOR EACH ROW EXECUTE FUNCTION public.audit_authorized_pickups_changes();


-- ------------------------------------------------------------------------
-- Migration: 20260429155052_3d92565d-b3bb-42b2-9c1c-74846e2b80b3.sql
-- ------------------------------------------------------------------------
-- Fix cross-tenant leak on eventos_futuros
DROP POLICY IF EXISTS "Authenticated can view eventos_futuros" ON public.eventos_futuros;

CREATE POLICY "Members can view eventos_futuros from their school"
  ON public.eventos_futuros
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'secretaria'::app_role)
    OR turma_id IS NULL
    OR is_member_of_turma_creche(auth.uid(), turma_id)
    OR is_educador_of_turma(auth.uid(), turma_id)
    OR auth.uid() IN (
      SELECT cr.responsavel_user_id
      FROM public.crianca_responsaveis cr
      JOIN public.criancas c ON c.id = cr.crianca_id
      WHERE c.turma_id = eventos_futuros.turma_id
    )
  );

-- Restrict realtime.messages so users only receive events on their own user-scoped topic
-- Topics in this app are subscribed by user_id (e.g. notificacoes:<uid>)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can receive own realtime messages" ON realtime.messages;

CREATE POLICY "Authenticated can receive own realtime messages"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- Allow only if the topic includes the user's uid, OR is a public app channel.
    -- This is a defense-in-depth restriction; table RLS still applies on the underlying row.
    (topic LIKE '%' || auth.uid()::text || '%')
    OR (topic LIKE 'public:%')
  );

-- ------------------------------------------------------------------------
-- Migration: 20260429163044_b8f2461d-4867-4e5e-98a8-68f8f4399144.sql
-- ------------------------------------------------------------------------

-- ============================================
-- 1. Tighten recado-anexos storage policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated can view recado attachments" ON storage.objects;

CREATE POLICY "Recado attachments: owner or recado participant can view"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'recado-anexos'
  AND (
    -- Uploader (path is `{user_id}/...`)
    (storage.foldername(name))[1] = auth.uid()::text
    -- Or the file is referenced in a recado the user can SELECT (RLS on recados applies)
    OR EXISTS (
      SELECT 1 FROM public.recados r
      WHERE r.anexo_url LIKE '%' || storage.objects.name
    )
  )
);

-- ============================================
-- 2. Tighten atividades-arquivos storage policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated can view atividade files v2" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload atividade files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete own atividade files" ON storage.objects;

-- Helper: check if user can access an atividades-arquivos path
-- Paths used:
--   respostas/{crianca_id}/...  -> needs can_access_crianca
--   questoes/...                -> educator/diretor/admin/secretaria only
CREATE POLICY "Atividade files: read when authorized"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'atividades-arquivos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      (storage.foldername(name))[1] = 'respostas'
      AND public.can_access_crianca(
        auth.uid(),
        NULLIF((storage.foldername(name))[2], '')::uuid
      )
    )
    OR (
      (storage.foldername(name))[1] = 'questoes'
      AND (
        has_role(auth.uid(), 'educador'::app_role)
        OR has_role(auth.uid(), 'diretor'::app_role)
        OR has_role(auth.uid(), 'secretaria'::app_role)
        OR has_role(auth.uid(), 'aluno'::app_role)
        OR has_role(auth.uid(), 'responsavel'::app_role)
      )
    )
  )
);

CREATE POLICY "Atividade files: upload when authorized"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'atividades-arquivos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      (storage.foldername(name))[1] = 'respostas'
      AND public.can_access_crianca(
        auth.uid(),
        NULLIF((storage.foldername(name))[2], '')::uuid
      )
    )
    OR (
      (storage.foldername(name))[1] = 'questoes'
      AND (
        has_role(auth.uid(), 'educador'::app_role)
        OR has_role(auth.uid(), 'diretor'::app_role)
        OR has_role(auth.uid(), 'admin'::app_role)
      )
    )
  )
);

CREATE POLICY "Atividade files: delete when authorized"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'atividades-arquivos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      (storage.foldername(name))[1] = 'respostas'
      AND public.can_access_crianca(
        auth.uid(),
        NULLIF((storage.foldername(name))[2], '')::uuid
      )
    )
    OR (
      (storage.foldername(name))[1] = 'questoes'
      AND (
        has_role(auth.uid(), 'educador'::app_role)
        OR has_role(auth.uid(), 'diretor'::app_role)
      )
    )
  )
);

-- ============================================
-- 3. Fix eventos_futuros: scope school-wide events to creche members
-- ============================================
DROP POLICY IF EXISTS "Members can view eventos_futuros from their school" ON public.eventos_futuros;

CREATE POLICY "Members can view eventos_futuros from their school"
ON public.eventos_futuros FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'secretaria'::app_role)
  OR (turma_id IS NOT NULL AND is_member_of_turma_creche(auth.uid(), turma_id))
  OR (turma_id IS NOT NULL AND is_educador_of_turma(auth.uid(), turma_id))
  OR (
    turma_id IS NOT NULL
    AND auth.uid() IN (
      SELECT cr.responsavel_user_id
      FROM crianca_responsaveis cr
      JOIN criancas c ON c.id = cr.crianca_id
      WHERE c.turma_id = eventos_futuros.turma_id
    )
  )
  -- School-wide events (turma_id IS NULL): visible to any user that belongs to ANY creche
  OR (
    turma_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.creche_membros cm WHERE cm.user_id = auth.uid()
    )
  )
);


-- ------------------------------------------------------------------------
-- Migration: 20260429163755_3b8b780d-1644-40a4-80d5-09be27421509.sql
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can delete creche logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update creche logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload creche logos" ON storage.objects;

CREATE POLICY "Admins or directors can delete creche logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'creche-logos'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR (
      (storage.foldername(name))[1] IS NOT NULL
      AND public.is_diretor_of_creche(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  )
);

CREATE POLICY "Admins or directors can update creche logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'creche-logos'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR (
      (storage.foldername(name))[1] IS NOT NULL
      AND public.is_diretor_of_creche(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  )
);

CREATE POLICY "Admins or directors can upload creche logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'creche-logos'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR (
      (storage.foldername(name))[1] IS NOT NULL
      AND public.is_diretor_of_creche(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  )
);

DROP POLICY IF EXISTS "Recado attachments: owner or recado participant can view" ON storage.objects;

CREATE POLICY "Recado attachments: owner or authorized participant can view"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'recado-anexos'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.recados r
      WHERE r.anexo_url ~~ ('%' || objects.name)
        AND (
          r.remetente_user_id = auth.uid()
          OR (r.crianca_id IS NOT NULL AND public.can_access_crianca(auth.uid(), r.crianca_id))
          OR (r.turma_id IS NOT NULL AND (
                public.is_educador_of_turma(auth.uid(), r.turma_id)
                OR public.is_member_of_turma_creche(auth.uid(), r.turma_id)
              ))
        )
    )
  )
);

-- ------------------------------------------------------------------------
-- Migration: 20260429172447_d015f03f-5e32-44cc-8983-7aec12a776f1.sql
-- ------------------------------------------------------------------------

-- 1) Restrict INSERT path in recado-anexos to user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload recado attachments" ON storage.objects;

CREATE POLICY "Users upload recado attachments to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recado-anexos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2) Tighten realtime.messages SELECT policy: remove broad public:% wildcard
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'realtime' AND tablename = 'messages'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON realtime.messages', pol.policyname);
  END LOOP;
END $$;

-- Scoped subscription rules:
-- Topic conventions supported:
--   user:<uuid>            -> only that user
--   creche:<uuid>          -> only members of that creche
--   turma:<uuid>           -> only educators/members of that turma
--   crianca:<uuid>         -> only users with access to that crianca
--   suporte:<uuid>         -> only that user's own support topic, or admins
-- Admins can subscribe to anything.
CREATE POLICY "Authenticated scoped realtime subscriptions"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    realtime.topic() = 'user:' || auth.uid()::text
  )
  OR (
    realtime.topic() LIKE 'suporte:%'
    AND substring(realtime.topic() from 9) = auth.uid()::text
  )
  OR (
    realtime.topic() LIKE 'creche:%'
    AND EXISTS (
      SELECT 1 FROM public.creche_membros cm
      WHERE cm.user_id = auth.uid()
        AND cm.creche_id::text = substring(realtime.topic() from 8)
    )
  )
  OR (
    realtime.topic() LIKE 'turma:%'
    AND public.is_member_of_turma_creche(auth.uid(), (substring(realtime.topic() from 7))::uuid)
  )
  OR (
    realtime.topic() LIKE 'crianca:%'
    AND public.can_access_crianca(auth.uid(), (substring(realtime.topic() from 9))::uuid)
  )
);


-- ------------------------------------------------------------------------
-- Migration: 20260504140740_eacad44f-20b9-4dec-b1e8-13aa6aa97d94.sql
-- ------------------------------------------------------------------------
-- Make SELECT restriction on orcamentos explicit: only admins can read submitted quote requests.
-- (RLS already denies by default for non-admins; this adds a clear, dedicated SELECT policy.)
DROP POLICY IF EXISTS "Only admins can read orcamentos" ON public.orcamentos;
CREATE POLICY "Only admins can read orcamentos"
ON public.orcamentos
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------------------
-- Migration: 20260505135502_e4cb96d2-272f-4135-ad17-07893b5049f8.sql
-- ------------------------------------------------------------------------

-- ============================================
-- 1. eventos_futuros: add creche_id
-- ============================================
ALTER TABLE public.eventos_futuros ADD COLUMN IF NOT EXISTS creche_id uuid;

-- Backfill from turma if available
UPDATE public.eventos_futuros ef
SET creche_id = t.creche_id
FROM public.turmas t
WHERE ef.turma_id = t.id AND ef.creche_id IS NULL;

-- Any remaining null -> assign to template (admin global) so we don't lose data
UPDATE public.eventos_futuros
SET creche_id = '00000000-0000-0000-0000-000000000000'
WHERE creche_id IS NULL;

ALTER TABLE public.eventos_futuros ALTER COLUMN creche_id SET NOT NULL;

DROP POLICY IF EXISTS "Members can view eventos_futuros from their school" ON public.eventos_futuros;
DROP POLICY IF EXISTS "Directors can manage eventos_futuros" ON public.eventos_futuros;
DROP POLICY IF EXISTS "Secretaria can view eventos_futuros" ON public.eventos_futuros;

CREATE POLICY "Members can view eventos_futuros of their creche"
ON public.eventos_futuros FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM creche_membros cm WHERE cm.creche_id = eventos_futuros.creche_id AND cm.user_id = auth.uid())
  OR (turma_id IS NOT NULL AND is_educador_of_turma(auth.uid(), turma_id))
  OR (turma_id IS NOT NULL AND auth.uid() IN (
    SELECT cr.responsavel_user_id FROM crianca_responsaveis cr
    JOIN criancas c ON c.id = cr.crianca_id WHERE c.turma_id = eventos_futuros.turma_id
  ))
);

CREATE POLICY "Directors can manage eventos_futuros of their creche"
ON public.eventos_futuros FOR ALL TO authenticated
USING (has_role(auth.uid(), 'diretor'::app_role) AND is_diretor_of_creche(auth.uid(), creche_id))
WITH CHECK (has_role(auth.uid(), 'diretor'::app_role) AND is_diretor_of_creche(auth.uid(), creche_id));

CREATE POLICY "Secretaria can manage eventos_futuros of their creche"
ON public.eventos_futuros FOR ALL TO authenticated
USING (has_role(auth.uid(), 'secretaria'::app_role) AND creche_id = get_user_creche_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'secretaria'::app_role) AND creche_id = get_user_creche_id(auth.uid()));

-- ============================================
-- 2. feriados: add creche_id (nullable = global)
-- ============================================
ALTER TABLE public.feriados ADD COLUMN IF NOT EXISTS creche_id uuid;

DROP POLICY IF EXISTS "Authenticated can view feriados" ON public.feriados;
DROP POLICY IF EXISTS "Directors can manage feriados" ON public.feriados;
DROP POLICY IF EXISTS "Secretaria can manage feriados" ON public.feriados;

CREATE POLICY "Members can view feriados of their creche or global"
ON public.feriados FOR SELECT TO authenticated
USING (
  creche_id IS NULL
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM creche_membros cm WHERE cm.creche_id = feriados.creche_id AND cm.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM criancas c JOIN turmas t ON t.id = c.turma_id WHERE t.creche_id = feriados.creche_id AND c.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM crianca_responsaveis cr
    JOIN criancas c ON c.id = cr.crianca_id
    JOIN turmas t ON t.id = c.turma_id
    WHERE cr.responsavel_user_id = auth.uid() AND t.creche_id = feriados.creche_id
  )
);

CREATE POLICY "Directors can manage feriados of their creche"
ON public.feriados FOR ALL TO authenticated
USING (has_role(auth.uid(), 'diretor'::app_role) AND creche_id IS NOT NULL AND is_diretor_of_creche(auth.uid(), creche_id))
WITH CHECK (has_role(auth.uid(), 'diretor'::app_role) AND creche_id IS NOT NULL AND is_diretor_of_creche(auth.uid(), creche_id));

CREATE POLICY "Secretaria can manage feriados of their creche"
ON public.feriados FOR ALL TO authenticated
USING (has_role(auth.uid(), 'secretaria'::app_role) AND creche_id = get_user_creche_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'secretaria'::app_role) AND creche_id = get_user_creche_id(auth.uid()));

-- ============================================
-- 3. recados: tighten responsavel turma-level visibility
-- ============================================
DROP POLICY IF EXISTS "Responsáveis can view recados for their crianças" ON public.recados;

CREATE POLICY "Responsáveis can view recados for their crianças"
ON public.recados FOR SELECT TO authenticated
USING (
  -- Direct messages about own child
  (crianca_id IN (SELECT get_crianca_ids_for_responsavel(auth.uid())))
  -- Class-wide messages, only if sent by school staff
  OR (
    turma_id IN (SELECT get_turma_ids_for_responsavel(auth.uid()))
    AND crianca_id IS NULL
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = recados.remetente_user_id
        AND ur.role IN ('educador'::app_role, 'diretor'::app_role, 'admin'::app_role, 'secretaria'::app_role)
    )
  )
);

-- ============================================
-- 4. pickup_photo_audit: explicit deny on direct writes (only triggers/SECURITY DEFINER funcs)
-- ============================================
DROP POLICY IF EXISTS "Block direct inserts on pickup_photo_audit" ON public.pickup_photo_audit;
CREATE POLICY "Block direct inserts on pickup_photo_audit"
ON public.pickup_photo_audit FOR INSERT TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "Block direct updates on pickup_photo_audit" ON public.pickup_photo_audit;
CREATE POLICY "Block direct updates on pickup_photo_audit"
ON public.pickup_photo_audit FOR UPDATE TO authenticated
USING (false);

DROP POLICY IF EXISTS "Block direct deletes on pickup_photo_audit" ON public.pickup_photo_audit;
CREATE POLICY "Block direct deletes on pickup_photo_audit"
ON public.pickup_photo_audit FOR DELETE TO authenticated
USING (false);


-- ------------------------------------------------------------------------
-- Migration: 20260505141115_23818167-f307-4419-b812-1f80b09152df.sql
-- ------------------------------------------------------------------------

-- ============================================================
-- 1) atividade_opcoes: hide is_correta from students until graded
-- ============================================================

-- Drop the over-permissive SELECT for alunos/responsaveis
DROP POLICY IF EXISTS "Alunos can view opcoes" ON public.atividade_opcoes;
DROP POLICY IF EXISTS "Responsaveis can view opcoes" ON public.atividade_opcoes;

-- Allow alunos to view full opcoes (with is_correta) ONLY after entrega is graded
CREATE POLICY "Alunos can view opcoes after graded"
ON public.atividade_opcoes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.atividade_questoes aq
    JOIN public.atividade_entregas ae ON ae.atividade_id = aq.atividade_id
    JOIN public.criancas c ON c.id = ae.aluno_crianca_id
    WHERE aq.id = atividade_opcoes.questao_id
      AND c.user_id = auth.uid()
      AND ae.status = 'avaliada'
  )
);

CREATE POLICY "Responsaveis can view opcoes after graded"
ON public.atividade_opcoes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.atividade_questoes aq
    JOIN public.atividade_entregas ae ON ae.atividade_id = aq.atividade_id
    WHERE aq.id = atividade_opcoes.questao_id
      AND ae.aluno_crianca_id IN (
        SELECT public.get_crianca_ids_for_responsavel(auth.uid())
      )
      AND ae.status = 'avaliada'
  )
);

-- Safe RPC for taking the quiz: returns options WITHOUT is_correta
CREATE OR REPLACE FUNCTION public.get_opcoes_for_quiz(_questao_id uuid)
RETURNS TABLE (id uuid, questao_id uuid, texto text, ordem integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.questao_id, o.texto, o.ordem
  FROM public.atividade_opcoes o
  JOIN public.atividade_questoes aq ON aq.id = o.questao_id
  JOIN public.atividades_pedagogicas ap ON ap.id = aq.atividade_id
  WHERE o.questao_id = _questao_id
    AND (
      -- aluno enrolled in the turma
      EXISTS (
        SELECT 1 FROM public.criancas c
        WHERE c.turma_id = ap.turma_id AND c.user_id = auth.uid()
      )
      -- responsavel of a child in the turma
      OR ap.turma_id IN (SELECT public.get_turma_ids_for_responsavel(auth.uid()))
      -- staff
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.is_diretor_of_creche(auth.uid(), public.get_creche_id_from_turma(ap.turma_id))
      OR public.is_educador_of_turma(auth.uid(), ap.turma_id)
      OR (public.has_role(auth.uid(), 'secretaria'::app_role)
          AND public.is_member_of_turma_creche(auth.uid(), ap.turma_id))
    )
  ORDER BY o.ordem;
$$;

GRANT EXECUTE ON FUNCTION public.get_opcoes_for_quiz(uuid) TO authenticated;

-- ============================================================
-- 2) recados: tighten Director UPDATE
-- ============================================================
DROP POLICY IF EXISTS "Directors can update recados of their creche" ON public.recados;

CREATE POLICY "Directors can update own recados"
ON public.recados
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'diretor'::app_role)
  AND remetente_user_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'diretor'::app_role)
  AND remetente_user_id = auth.uid()
);

-- ============================================================
-- 3) recados: educadores cannot SELECT via remetente alone
-- ============================================================
DROP POLICY IF EXISTS "Educadores can manage recados in their turmas" ON public.recados;

-- SELECT/UPDATE/DELETE: limited to currently assigned turmas
CREATE POLICY "Educadores can read recados in their turmas"
ON public.recados
FOR SELECT
TO authenticated
USING (
  ((turma_id IS NOT NULL) AND public.is_educador_of_turma(auth.uid(), turma_id))
  OR ((crianca_id IS NOT NULL) AND EXISTS (
        SELECT 1 FROM public.criancas c
        WHERE c.id = recados.crianca_id
          AND public.is_educador_of_turma(auth.uid(), c.turma_id)
      ))
);

CREATE POLICY "Educadores can update own recados in their turmas"
ON public.recados
FOR UPDATE
TO authenticated
USING (
  remetente_user_id = auth.uid()
  AND (
    ((turma_id IS NOT NULL) AND public.is_educador_of_turma(auth.uid(), turma_id))
    OR ((crianca_id IS NOT NULL) AND EXISTS (
          SELECT 1 FROM public.criancas c
          WHERE c.id = recados.crianca_id
            AND public.is_educador_of_turma(auth.uid(), c.turma_id)
        ))
  )
)
WITH CHECK (remetente_user_id = auth.uid());

CREATE POLICY "Educadores can delete own recados in their turmas"
ON public.recados
FOR DELETE
TO authenticated
USING (
  remetente_user_id = auth.uid()
  AND (
    ((turma_id IS NOT NULL) AND public.is_educador_of_turma(auth.uid(), turma_id))
    OR ((crianca_id IS NOT NULL) AND EXISTS (
          SELECT 1 FROM public.criancas c
          WHERE c.id = recados.crianca_id
            AND public.is_educador_of_turma(auth.uid(), c.turma_id)
        ))
  )
);

CREATE POLICY "Educadores can insert recados in their turmas"
ON public.recados
FOR INSERT
TO authenticated
WITH CHECK (
  remetente_user_id = auth.uid()
  AND (
    ((turma_id IS NOT NULL) AND public.is_educador_of_turma(auth.uid(), turma_id))
    OR ((crianca_id IS NOT NULL) AND EXISTS (
          SELECT 1 FROM public.criancas c
          WHERE c.id = recados.crianca_id
            AND public.is_educador_of_turma(auth.uid(), c.turma_id)
        ))
    OR (parent_id IS NOT NULL)
  )
);

-- ============================================================
-- 4) atividades-arquivos storage: scope questoes per turma
-- Path is now: questoes/{turma_id}/...
-- ============================================================
DROP POLICY IF EXISTS "Atividade files: read when authorized" ON storage.objects;
DROP POLICY IF EXISTS "Atividade files: upload when authorized" ON storage.objects;
DROP POLICY IF EXISTS "Atividade files: delete when authorized" ON storage.objects;

CREATE POLICY "Atividade files: read when authorized"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'atividades-arquivos'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      (storage.foldername(name))[1] = 'respostas'
      AND public.can_access_crianca(
        auth.uid(),
        (NULLIF((storage.foldername(name))[2], ''))::uuid
      )
    )
    OR (
      (storage.foldername(name))[1] = 'questoes'
      AND (storage.foldername(name))[2] IS NOT NULL
      AND (
        public.is_educador_of_turma(auth.uid(), (NULLIF((storage.foldername(name))[2], ''))::uuid)
        OR public.is_diretor_of_creche(
              auth.uid(),
              public.get_creche_id_from_turma((NULLIF((storage.foldername(name))[2], ''))::uuid)
           )
        OR (public.has_role(auth.uid(), 'secretaria'::app_role)
            AND public.is_member_of_turma_creche(auth.uid(), (NULLIF((storage.foldername(name))[2], ''))::uuid))
        OR EXISTS (
          SELECT 1 FROM public.criancas c
          WHERE c.turma_id = (NULLIF((storage.foldername(name))[2], ''))::uuid
            AND c.user_id = auth.uid()
        )
        OR (NULLIF((storage.foldername(name))[2], ''))::uuid IN (
          SELECT public.get_turma_ids_for_responsavel(auth.uid())
        )
      )
    )
  )
);

CREATE POLICY "Atividade files: upload when authorized"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'atividades-arquivos'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      (storage.foldername(name))[1] = 'respostas'
      AND public.can_access_crianca(
        auth.uid(),
        (NULLIF((storage.foldername(name))[2], ''))::uuid
      )
    )
    OR (
      (storage.foldername(name))[1] = 'questoes'
      AND (storage.foldername(name))[2] IS NOT NULL
      AND (
        public.is_educador_of_turma(auth.uid(), (NULLIF((storage.foldername(name))[2], ''))::uuid)
        OR public.is_diretor_of_creche(
              auth.uid(),
              public.get_creche_id_from_turma((NULLIF((storage.foldername(name))[2], ''))::uuid)
           )
      )
    )
  )
);

CREATE POLICY "Atividade files: delete when authorized"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'atividades-arquivos'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      (storage.foldername(name))[1] = 'respostas'
      AND public.can_access_crianca(
        auth.uid(),
        (NULLIF((storage.foldername(name))[2], ''))::uuid
      )
    )
    OR (
      (storage.foldername(name))[1] = 'questoes'
      AND (storage.foldername(name))[2] IS NOT NULL
      AND (
        public.is_educador_of_turma(auth.uid(), (NULLIF((storage.foldername(name))[2], ''))::uuid)
        OR public.is_diretor_of_creche(
              auth.uid(),
              public.get_creche_id_from_turma((NULLIF((storage.foldername(name))[2], ''))::uuid)
           )
      )
    )
  )
);


-- ------------------------------------------------------------------------
-- Migration: 20260505141447_6785b0e7-34c6-4445-84b4-77853d9af106.sql
-- ------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid := auth.uid();
BEGIN
  -- Allow when called without an auth context (RLS internal / service role)
  IF _caller IS NOT NULL
     AND _caller <> _user_id
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = _caller AND role = 'admin'::app_role
     )
  THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid := auth.uid();
  _role app_role;
BEGIN
  IF _caller IS NOT NULL
     AND _caller <> _user_id
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = _caller AND role = 'admin'::app_role
     )
  THEN
    RETURN NULL;
  END IF;

  SELECT role INTO _role FROM public.user_roles
  WHERE user_id = _user_id LIMIT 1;
  RETURN _role;
END;
$$;


-- ------------------------------------------------------------------------
-- Migration: 20260505142546_6daf7f09-81dc-434f-9e44-d96d9a7a6fb8.sql
-- ------------------------------------------------------------------------

-- 1) Recados: tighten educador INSERT (no parent_id bypass)
DROP POLICY IF EXISTS "Educadores can insert recados in their turmas" ON public.recados;
CREATE POLICY "Educadores can insert recados in their turmas"
ON public.recados FOR INSERT TO authenticated
WITH CHECK (
  remetente_user_id = auth.uid()
  AND (
    (turma_id IS NOT NULL AND public.is_educador_of_turma(auth.uid(), turma_id))
    OR (crianca_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.criancas c
      WHERE c.id = recados.crianca_id
        AND public.is_educador_of_turma(auth.uid(), c.turma_id)
    ))
    OR (parent_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.recados pr
      WHERE pr.id = recados.parent_id
        AND (
          (pr.turma_id IS NOT NULL AND public.is_educador_of_turma(auth.uid(), pr.turma_id))
          OR (pr.crianca_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.criancas c2
            WHERE c2.id = pr.crianca_id
              AND public.is_educador_of_turma(auth.uid(), c2.turma_id)
          ))
        )
    ))
  )
);

-- 2) Recados: tighten responsavel INSERT
DROP POLICY IF EXISTS "Responsáveis can insert recados for their crianças" ON public.recados;
CREATE POLICY "Responsáveis can insert recados for their crianças"
ON public.recados FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'responsavel'::app_role)
  AND remetente_user_id = auth.uid()
  AND (
    (crianca_id IS NOT NULL AND public.is_responsavel_of_crianca(auth.uid(), crianca_id))
    OR (parent_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.recados pr
      WHERE pr.id = recados.parent_id
        AND (
          (pr.crianca_id IS NOT NULL AND public.is_responsavel_of_crianca(auth.uid(), pr.crianca_id))
          OR (pr.turma_id IS NOT NULL AND pr.turma_id IN (
            SELECT public.get_turma_ids_for_responsavel(auth.uid())
          ))
        )
    ))
  )
);

-- 3) configuracoes_pedagogicas: allow alunos and responsaveis to read their school's flags
CREATE POLICY "Alunos can view their school config"
ON public.configuracoes_pedagogicas FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    JOIN public.turmas t ON t.id = c.turma_id
    WHERE t.creche_id = configuracoes_pedagogicas.creche_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Responsaveis can view their school config"
ON public.configuracoes_pedagogicas FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crianca_responsaveis cr
    JOIN public.criancas c ON c.id = cr.crianca_id
    JOIN public.turmas t ON t.id = c.turma_id
    WHERE cr.responsavel_user_id = auth.uid()
      AND t.creche_id = configuracoes_pedagogicas.creche_id
  )
);

-- 4) Notificacoes: validate crianca_id belongs to caller (when provided)
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notificacoes;
CREATE POLICY "Users can insert own notifications"
ON public.notificacoes FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    crianca_id IS NULL
    OR public.can_access_crianca(auth.uid(), crianca_id)
  )
);

-- 5) Revoke EXECUTE on get_opcoes_for_quiz from anon
REVOKE EXECUTE ON FUNCTION public.get_opcoes_for_quiz(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_opcoes_for_quiz(uuid) TO authenticated;


-- ------------------------------------------------------------------------
-- Migration: 20260505143901_1912ebd3-04e6-46b4-b9ff-6b5ce5cf1b6b.sql
-- ------------------------------------------------------------------------
CREATE POLICY "Alunos can view own presencas"
ON public.presencas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.criancas c
    WHERE c.id = presencas.crianca_id AND c.user_id = auth.uid()
  )
);

-- ------------------------------------------------------------------------
-- Migration: 20260505160800_170b7d5c-b962-400a-8085-c444ae4dea8f.sql
-- ------------------------------------------------------------------------
-- Função para inserir resposta de suporte como recado, contornando RLS de forma segura
CREATE OR REPLACE FUNCTION public.send_suporte_reply(
  _suporte_id uuid,
  _titulo text,
  _conteudo text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _target_user uuid;
  _new_id uuid;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;

  -- Apenas admins podem responder mensagens de suporte
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _caller AND role = 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin role required';
  END IF;

  SELECT user_id INTO _target_user FROM public.suporte_mensagens WHERE id = _suporte_id;
  IF _target_user IS NULL THEN
    RAISE EXCEPTION 'suporte message not found';
  END IF;

  INSERT INTO public.recados (titulo, conteudo, remetente_user_id, remetente_nome, crianca_id, turma_id)
  VALUES (_titulo, _conteudo, _target_user, '🛟 Suporte', NULL, NULL)
  RETURNING id INTO _new_id;

  -- Marcar suporte como respondido
  UPDATE public.suporte_mensagens SET status = 'respondido', updated_at = now() WHERE id = _suporte_id;

  RETURN _new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_suporte_reply(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_suporte_reply(uuid, text, text) TO authenticated;

-- ------------------------------------------------------------------------
-- Migration: 20260506210538_b0187a47-ab88-44f5-a60d-ddadf2e2bf6f.sql
-- ------------------------------------------------------------------------

-- Tabela de categorias
CREATE TABLE public.blog_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de tags
CREATE TABLE public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de artigos
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  resumo TEXT,
  conteudo TEXT NOT NULL DEFAULT '',
  capa_url TEXT,
  capa_alt TEXT,
  meta_title TEXT,
  meta_description TEXT,
  palavra_chave_principal TEXT,
  palavras_chave_secundarias TEXT[] NOT NULL DEFAULT '{}',
  categoria_id UUID REFERENCES public.blog_categorias(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicado')),
  autor_user_id UUID,
  autor_nome TEXT,
  reading_time INT NOT NULL DEFAULT 1,
  views INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_categoria ON public.blog_posts(categoria_id);

-- Tabela N:N posts <-> tags
CREATE TABLE public.blog_post_tags (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Trigger updated_at
CREATE TRIGGER trg_blog_posts_updated BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_blog_categorias_updated BEFORE UPDATE ON public.blog_categorias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.blog_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

-- Leitura pública (anon + authenticated)
CREATE POLICY "Public can read categorias" ON public.blog_categorias
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can read tags" ON public.blog_tags
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can read published posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (status = 'publicado');

CREATE POLICY "Public can read post_tags of published" ON public.blog_post_tags
  FOR SELECT TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.blog_posts p WHERE p.id = post_id AND p.status = 'publicado')
  );

-- Admin: gestão completa
CREATE POLICY "Admins manage categorias" ON public.blog_categorias
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage tags" ON public.blog_tags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage posts" ON public.blog_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage post_tags" ON public.blog_post_tags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Bucket público para imagens do blog
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-imagens', 'blog-imagens', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read blog images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'blog-imagens');

CREATE POLICY "Admins can upload blog images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-imagens' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blog images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-imagens' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blog images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'blog-imagens' AND public.has_role(auth.uid(), 'admin'::app_role));


-- ------------------------------------------------------------------------
-- Migration: 20260507130842_c69512c0-dd99-461a-bbd8-989d88be6dcb.sql
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can read blog images" ON storage.objects;

CREATE POLICY "Admins can list blog images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'blog-imagens'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- ------------------------------------------------------------------------
-- Migration: 20260508142647_5b5d25b2-113d-44ea-9b8e-3e12a6545de6.sql
-- ------------------------------------------------------------------------

-- ============================================================
-- 1. DROP MÓDULO ANTIGO DE BOLETOS
-- ============================================================
DROP TABLE IF EXISTS public.boletos CASCADE;

-- ============================================================
-- 2. HELPER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_financeiro_admin(_user_id uuid, _creche_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.creche_membros cm
      JOIN public.user_roles ur ON ur.user_id = cm.user_id
      WHERE cm.user_id = _user_id
        AND cm.creche_id = _creche_id
        AND ur.role IN ('diretor'::app_role, 'secretaria'::app_role)
    );
$$;

-- ============================================================
-- 3. FINANCIAL SETTINGS
-- ============================================================
CREATE TABLE public.financial_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL UNIQUE REFERENCES public.creches(id) ON DELETE CASCADE,
  asaas_api_key_encrypted text,
  asaas_api_key_iv text,
  asaas_api_key_tag text,
  asaas_api_key_last4 text,
  asaas_environment text NOT NULL DEFAULT 'production' CHECK (asaas_environment IN ('production','sandbox')),
  asaas_connected boolean NOT NULL DEFAULT false,
  asaas_account_name text,
  asaas_account_email text,
  asaas_last_validation timestamptz,
  asaas_webhook_token uuid NOT NULL DEFAULT gen_random_uuid(),
  asaas_webhook_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_settings ENABLE ROW LEVEL SECURITY;

-- Safe view: never expose encrypted key columns to clients
CREATE OR REPLACE VIEW public.financial_settings_safe AS
SELECT id, creche_id, asaas_api_key_last4, asaas_environment, asaas_connected,
       asaas_account_name, asaas_account_email, asaas_last_validation,
       created_at, updated_at
FROM public.financial_settings;

-- No SELECT policy on the table for clients (only via view + edge functions w/ service role)
CREATE POLICY "fs admin select"
  ON public.financial_settings FOR SELECT TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id));

-- ============================================================
-- 4. FINANCIAL CUSTOMERS
-- ============================================================
CREATE TABLE public.financial_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  crianca_id uuid REFERENCES public.criancas(id) ON DELETE SET NULL,
  responsavel_user_id uuid,
  asaas_customer_id text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  cpf_cnpj text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creche_id, asaas_customer_id)
);
ALTER TABLE public.financial_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fc admin all"
  ON public.financial_customers FOR ALL TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id))
  WITH CHECK (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE INDEX idx_fc_creche ON public.financial_customers(creche_id);
CREATE INDEX idx_fc_crianca ON public.financial_customers(crianca_id);

-- ============================================================
-- 5. SUBSCRIPTIONS (recorrência)
-- ============================================================
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.financial_customers(id) ON DELETE CASCADE,
  crianca_id uuid REFERENCES public.criancas(id) ON DELETE SET NULL,
  asaas_subscription_id text NOT NULL,
  value numeric(12,2) NOT NULL,
  cycle text NOT NULL CHECK (cycle IN ('MONTHLY','QUARTERLY','YEARLY','WEEKLY','BIWEEKLY','SEMIANNUALLY')),
  next_due_date date,
  description text,
  billing_type text NOT NULL DEFAULT 'UNDEFINED',
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creche_id, asaas_subscription_id)
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub admin all"
  ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id))
  WITH CHECK (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE INDEX idx_sub_creche ON public.subscriptions(creche_id);
CREATE INDEX idx_sub_customer ON public.subscriptions(customer_id);

-- ============================================================
-- 6. INVOICES
-- ============================================================
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  crianca_id uuid REFERENCES public.criancas(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES public.financial_customers(id) ON DELETE RESTRICT,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  asaas_payment_id text NOT NULL,
  description text,
  value numeric(12,2) NOT NULL,
  net_value numeric(12,2),
  due_date date NOT NULL,
  payment_method text NOT NULL DEFAULT 'UNDEFINED' CHECK (payment_method IN ('PIX','BOLETO','CREDIT_CARD','UNDEFINED','DEBIT_CARD','TRANSFER','DEPOSIT')),
  status text NOT NULL DEFAULT 'PENDING',
  invoice_url text,
  bank_slip_url text,
  pix_qrcode text,
  pix_copy_paste text,
  pix_expires_at timestamptz,
  external_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creche_id, asaas_payment_id)
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv admin all"
  ON public.invoices FOR ALL TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id))
  WITH CHECK (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE INDEX idx_inv_creche ON public.invoices(creche_id);
CREATE INDEX idx_inv_status ON public.invoices(creche_id, status);
CREATE INDEX idx_inv_due ON public.invoices(creche_id, due_date);
CREATE INDEX idx_inv_customer ON public.invoices(customer_id);
CREATE INDEX idx_inv_crianca ON public.invoices(crianca_id);

-- ============================================================
-- 7. PAYMENTS
-- ============================================================
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  paid_at timestamptz NOT NULL DEFAULT now(),
  value numeric(12,2) NOT NULL,
  net_value numeric(12,2),
  payment_method text,
  status text NOT NULL DEFAULT 'CONFIRMED',
  transaction_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pay admin all"
  ON public.payments FOR ALL TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id))
  WITH CHECK (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE INDEX idx_pay_creche ON public.payments(creche_id);
CREATE INDEX idx_pay_invoice ON public.payments(invoice_id);

-- ============================================================
-- 8. WEBHOOK LOGS
-- ============================================================
CREATE TABLE public.asaas_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid REFERENCES public.creches(id) ON DELETE CASCADE,
  event text NOT NULL,
  asaas_payment_id text,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  error text,
  received_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.asaas_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wl admin select"
  ON public.asaas_webhook_logs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (creche_id IS NOT NULL AND public.is_financeiro_admin(auth.uid(), creche_id))
  );

CREATE UNIQUE INDEX idx_webhook_idem ON public.asaas_webhook_logs(event, asaas_payment_id) WHERE asaas_payment_id IS NOT NULL;
CREATE INDEX idx_wl_creche ON public.asaas_webhook_logs(creche_id);
CREATE INDEX idx_wl_received ON public.asaas_webhook_logs(received_at DESC);

-- ============================================================
-- 9. UPDATED_AT TRIGGERS
-- ============================================================
CREATE TRIGGER trg_fs_updated BEFORE UPDATE ON public.financial_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_fc_updated BEFORE UPDATE ON public.financial_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_inv_updated BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sub_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ------------------------------------------------------------------------
-- Migration: 20260508142723_fe1f7299-9f1d-466d-900d-79a0a61f23e1.sql
-- ------------------------------------------------------------------------

DROP VIEW IF EXISTS public.financial_settings_safe;
REVOKE EXECUTE ON FUNCTION public.is_financeiro_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_financeiro_admin(uuid, uuid) TO authenticated, service_role;


-- ------------------------------------------------------------------------
-- Migration: 20260508151052_ee78a7cc-5211-41df-8b7f-a288c1831df6.sql
-- ------------------------------------------------------------------------
-- Allow directors to manage their own school's sidebar configuration
DROP POLICY IF EXISTS "Diretores can manage their school sidebar_config" ON public.sidebar_config;
CREATE POLICY "Diretores can manage their school sidebar_config"
  ON public.sidebar_config
  FOR ALL
  TO authenticated
  USING (public.is_diretor_of_creche(auth.uid(), creche_id))
  WITH CHECK (public.is_diretor_of_creche(auth.uid(), creche_id));

-- ------------------------------------------------------------------------
-- Migration: 20260508160330_5be075a6-6f78-44a2-abda-2775d8578cee.sql
-- ------------------------------------------------------------------------

-- Provider enum
DO $$ BEGIN
  CREATE TYPE public.financial_provider AS ENUM ('asaas', 'inter');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. financial_accounts
CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id UUID NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  provider public.financial_provider NOT NULL,
  client_id TEXT,
  encrypted_client_secret BYTEA,
  client_secret_iv BYTEA,
  client_secret_tag BYTEA,
  certificate_path TEXT,
  private_key_path TEXT,
  conta_corrente TEXT,
  webhook_secret UUID NOT NULL DEFAULT gen_random_uuid(),
  account_name TEXT,
  environment TEXT NOT NULL DEFAULT 'production',
  connected BOOLEAN NOT NULL DEFAULT false,
  last_validation TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(creche_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_financial_accounts_creche ON public.financial_accounts(creche_id);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_webhook_token ON public.financial_accounts(webhook_secret);

ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance admins read accounts (no secrets)"
  ON public.financial_accounts FOR SELECT TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE POLICY "Finance admins manage accounts"
  ON public.financial_accounts FOR ALL TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id))
  WITH CHECK (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE TRIGGER trg_financial_accounts_updated
  BEFORE UPDATE ON public.financial_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. financial_invoices
CREATE TABLE IF NOT EXISTS public.financial_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id UUID NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  crianca_id UUID REFERENCES public.criancas(id) ON DELETE SET NULL,
  provider public.financial_provider NOT NULL,
  external_id TEXT,
  nosso_numero TEXT,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  payment_method TEXT,
  pix_qrcode TEXT,
  pix_copy_paste TEXT,
  pix_expires_at TIMESTAMPTZ,
  boleto_pdf_url TEXT,
  boleto_linha_digitavel TEXT,
  description TEXT,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  raw_payload JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_financial_invoices_creche ON public.financial_invoices(creche_id);
CREATE INDEX IF NOT EXISTS idx_financial_invoices_status ON public.financial_invoices(creche_id, status);
CREATE INDEX IF NOT EXISTS idx_financial_invoices_crianca ON public.financial_invoices(crianca_id);
CREATE INDEX IF NOT EXISTS idx_financial_invoices_due ON public.financial_invoices(due_date);

ALTER TABLE public.financial_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance admins read invoices"
  ON public.financial_invoices FOR SELECT TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE POLICY "Finance admins write invoices"
  ON public.financial_invoices FOR ALL TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id))
  WITH CHECK (public.is_financeiro_admin(auth.uid(), creche_id));

-- Responsáveis podem ver invoices dos próprios filhos
CREATE POLICY "Responsaveis veem invoices dos filhos"
  ON public.financial_invoices FOR SELECT TO authenticated
  USING (
    crianca_id IS NOT NULL
    AND public.is_responsavel_of_crianca(auth.uid(), crianca_id)
  );

CREATE TRIGGER trg_financial_invoices_updated
  BEFORE UPDATE ON public.financial_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. financial_transactions
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id UUID NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.financial_invoices(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL,
  amount NUMERIC(12,2),
  status TEXT,
  raw_payload JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_creche ON public.financial_transactions(creche_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_invoice ON public.financial_transactions(invoice_id);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance admins read transactions"
  ON public.financial_transactions FOR SELECT TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id));

-- 4. financial_webhook_logs
CREATE TABLE IF NOT EXISTS public.financial_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id UUID REFERENCES public.creches(id) ON DELETE SET NULL,
  provider public.financial_provider NOT NULL,
  event TEXT,
  external_id TEXT,
  payload JSONB,
  processed BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_financial_webhook_idem
  ON public.financial_webhook_logs(provider, event, external_id)
  WHERE external_id IS NOT NULL AND event IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financial_webhook_logs_creche
  ON public.financial_webhook_logs(creche_id, received_at DESC);

ALTER TABLE public.financial_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance admins read webhook logs"
  ON public.financial_webhook_logs FOR SELECT TO authenticated
  USING (creche_id IS NOT NULL AND public.is_financeiro_admin(auth.uid(), creche_id));

CREATE POLICY "Admins read all webhook logs"
  ON public.financial_webhook_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. View safe (sem secrets)
CREATE OR REPLACE VIEW public.vw_financial_accounts_safe AS
SELECT
  id, creche_id, provider, client_id, conta_corrente, account_name,
  environment, connected, last_validation, last_error,
  webhook_secret,
  (encrypted_client_secret IS NOT NULL) AS has_secret,
  (certificate_path IS NOT NULL) AS has_certificate,
  (private_key_path IS NOT NULL) AS has_private_key,
  created_at, updated_at
FROM public.financial_accounts;

GRANT SELECT ON public.vw_financial_accounts_safe TO authenticated;

-- 6. Storage bucket privado para certificados
INSERT INTO storage.buckets (id, name, public)
VALUES ('inter-certificates', 'inter-certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Apenas admins/diretores/secretarias podem listar certificados da própria escola
-- (Na prática, edge functions usam service role; estas policies são fallback de segurança)
CREATE POLICY "Finance admins read own certs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'inter-certificates'
    AND public.is_financeiro_admin(
      auth.uid(),
      ((storage.foldername(name))[1])::uuid
    )
  );

CREATE POLICY "Finance admins upload own certs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'inter-certificates'
    AND public.is_financeiro_admin(
      auth.uid(),
      ((storage.foldername(name))[1])::uuid
    )
  );

CREATE POLICY "Finance admins delete own certs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'inter-certificates'
    AND public.is_financeiro_admin(
      auth.uid(),
      ((storage.foldername(name))[1])::uuid
    )
  );


-- ------------------------------------------------------------------------
-- Migration: 20260508160348_7d787562-728e-41e2-bd3b-e6c31dff92a9.sql
-- ------------------------------------------------------------------------

ALTER VIEW public.vw_financial_accounts_safe SET (security_invoker = on);


-- ------------------------------------------------------------------------
-- Migration: 20260508162743_86c3fb3e-d948-41d4-a7e7-78d8aa2a71a5.sql
-- ------------------------------------------------------------------------

ALTER TABLE public.creches
  ADD COLUMN IF NOT EXISTS financial_provider public.financial_provider,
  ADD COLUMN IF NOT EXISTS financial_environment text;

COMMENT ON COLUMN public.creches.financial_provider IS 'Active financial provider for the school (asaas | inter). Only admin can change.';
COMMENT ON COLUMN public.creches.financial_environment IS 'Environment of the financial provider (sandbox | production).';


-- ------------------------------------------------------------------------
-- Migration: 20260508164419_0a92269d-49be-4ca4-919a-3370158fb3df.sql
-- ------------------------------------------------------------------------

-- =========================================
-- SAAS FINANCIAL MODULE (Agenda Fleur → Escolas)
-- =========================================

-- 1) Account singleton
CREATE TABLE public.saas_financial_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'inter',
  client_id text,
  encrypted_client_secret bytea,
  client_secret_iv bytea,
  client_secret_tag bytea,
  certificate_path text,
  private_key_path text,
  conta_corrente text,
  environment text NOT NULL DEFAULT 'production',
  webhook_secret uuid NOT NULL DEFAULT gen_random_uuid(),
  connected boolean NOT NULL DEFAULT false,
  last_validation timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saas_financial_account ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas account admin only"
  ON public.saas_financial_account FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_saas_account_updated
  BEFORE UPDATE ON public.saas_financial_account
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Plans
CREATE TABLE public.saas_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  monthly_price numeric(10,2) NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas plans admin manage"
  ON public.saas_plans FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "saas plans members read"
  ON public.saas_plans FOR SELECT TO authenticated
  USING (active = true);

CREATE TRIGGER trg_saas_plans_updated
  BEFORE UPDATE ON public.saas_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Subscriptions
CREATE TABLE public.saas_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL UNIQUE,
  plan_id uuid NOT NULL REFERENCES public.saas_plans(id),
  status text NOT NULL DEFAULT 'trialing',
  monthly_amount numeric(10,2) NOT NULL DEFAULT 0,
  due_day integer NOT NULL DEFAULT 10 CHECK (due_day BETWEEN 1 AND 28),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  trial_ends_at date,
  next_billing_date date,
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_saas_subs_creche ON public.saas_subscriptions(creche_id);
CREATE INDEX idx_saas_subs_status ON public.saas_subscriptions(status);

ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas subs admin only"
  ON public.saas_subscriptions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Diretor pode ver a própria assinatura (somente leitura)
CREATE POLICY "saas subs diretor read own"
  ON public.saas_subscriptions FOR SELECT TO authenticated
  USING (is_diretor_of_creche(auth.uid(), creche_id));

CREATE TRIGGER trg_saas_subs_updated
  BEFORE UPDATE ON public.saas_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Invoices
CREATE TABLE public.saas_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.saas_subscriptions(id) ON DELETE SET NULL,
  creche_id uuid NOT NULL,
  external_id text,
  invoice_number text,
  amount numeric(10,2) NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  pix_qrcode text,
  pix_copy_paste text,
  boleto_pdf_url text,
  linha_digitavel text,
  description text,
  paid_at timestamptz,
  cancelled_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_saas_invoices_creche ON public.saas_invoices(creche_id);
CREATE INDEX idx_saas_invoices_status ON public.saas_invoices(status);
CREATE INDEX idx_saas_invoices_external ON public.saas_invoices(external_id);
CREATE INDEX idx_saas_invoices_due ON public.saas_invoices(due_date);

ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas invoices admin only"
  ON public.saas_invoices FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "saas invoices diretor read own"
  ON public.saas_invoices FOR SELECT TO authenticated
  USING (is_diretor_of_creche(auth.uid(), creche_id));

CREATE TRIGGER trg_saas_invoices_updated
  BEFORE UPDATE ON public.saas_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Transactions
CREATE TABLE public.saas_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.saas_invoices(id) ON DELETE CASCADE,
  transaction_type text NOT NULL DEFAULT 'PAYMENT',
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'CONFIRMED',
  paid_at timestamptz NOT NULL DEFAULT now(),
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_saas_tx_invoice ON public.saas_transactions(invoice_id);

ALTER TABLE public.saas_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas tx admin only"
  ON public.saas_transactions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6) Webhook logs
CREATE TABLE public.saas_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  external_id text,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  error text,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_saas_wl_received ON public.saas_webhook_logs(received_at DESC);

ALTER TABLE public.saas_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas wl admin select"
  ON public.saas_webhook_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 7) Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('saas-inter-certificates', 'saas-inter-certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Only service role can manipulate (no policies = locked, service role bypasses)
-- Add explicit deny for safety: no policies for authenticated users.

-- 8) Seed plans
INSERT INTO public.saas_plans (code, name, monthly_price, features, ordem) VALUES
  ('trial',      'Trial 14 dias',  0.00,   '{"alunos":50,"recursos":["agenda","mensagens"]}'::jsonb, 1),
  ('basico',     'Básico',         99.00,  '{"alunos":80,"recursos":["agenda","mensagens","eventos"]}'::jsonb, 2),
  ('premium',    'Premium',        199.00, '{"alunos":200,"recursos":["agenda","mensagens","eventos","financeiro","relatorios"]}'::jsonb, 3),
  ('enterprise', 'Enterprise',     399.00, '{"alunos":-1,"recursos":["tudo"]}'::jsonb, 4)
ON CONFLICT (code) DO NOTHING;

-- 9) Singleton row
INSERT INTO public.saas_financial_account (provider, environment, connected)
VALUES ('inter', 'production', false)
ON CONFLICT DO NOTHING;


-- ------------------------------------------------------------------------
-- Migration: 20260508171255_9deb2e80-8c28-43b9-8753-f0c2f801532c.sql
-- ------------------------------------------------------------------------

ALTER TABLE public.financial_accounts
  ADD COLUMN IF NOT EXISTS webhook_registered_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_auth_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_auth_error text;

ALTER TABLE public.financial_invoices
  ADD COLUMN IF NOT EXISTS pix_txid text,
  ADD COLUMN IF NOT EXISTS pix_qrcode_image text,
  ADD COLUMN IF NOT EXISTS boleto_pdf_path text;

CREATE INDEX IF NOT EXISTS idx_financial_invoices_pix_txid ON public.financial_invoices(pix_txid);

CREATE TABLE IF NOT EXISTS public.inter_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  action text NOT NULL,
  status text NOT NULL,
  request_id text,
  http_status int,
  error text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inter_audit_logs_creche ON public.inter_audit_logs(creche_id, created_at DESC);

ALTER TABLE public.inter_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance admins read audit logs"
  ON public.inter_audit_logs
  FOR SELECT TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id));


-- ------------------------------------------------------------------------
-- Migration: 20260509174305_570165eb-da44-48ad-ac13-e5d46c696910.sql
-- ------------------------------------------------------------------------

ALTER TABLE public.financial_accounts
  ADD COLUMN IF NOT EXISTS webhook_certificate_path text;

DROP VIEW IF EXISTS public.vw_financial_accounts_safe;

CREATE VIEW public.vw_financial_accounts_safe
WITH (security_invoker=on) AS
SELECT id,
    creche_id,
    provider,
    client_id,
    conta_corrente,
    account_name,
    environment,
    connected,
    last_validation,
    last_error,
    webhook_secret,
    webhook_registered_at,
    last_auth_at,
    last_auth_error,
    encrypted_client_secret IS NOT NULL AS has_secret,
    certificate_path IS NOT NULL AS has_certificate,
    private_key_path IS NOT NULL AS has_private_key,
    webhook_certificate_path IS NOT NULL AS has_webhook_certificate,
    created_at,
    updated_at
FROM public.financial_accounts;


-- ------------------------------------------------------------------------
-- Migration: 20260512150758_e139a9a0-37d4-459d-aa29-5587270924b1.sql
-- ------------------------------------------------------------------------

-- ============ Régua de cobrança ============
CREATE TABLE public.financial_collection_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  stage_offset_days int NOT NULL,
  channel text NOT NULL DEFAULT 'notificacao',
  titulo text NOT NULL,
  template text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creche_id, stage_offset_days, channel)
);
CREATE INDEX idx_fcr_creche ON public.financial_collection_rules(creche_id);

ALTER TABLE public.financial_collection_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fcr_admin_all" ON public.financial_collection_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "fcr_diretor_secretaria" ON public.financial_collection_rules
  FOR ALL TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id))
  WITH CHECK (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE TRIGGER fcr_updated_at BEFORE UPDATE ON public.financial_collection_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Logs de envio da régua ============
CREATE TABLE public.financial_collection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  invoice_id uuid,
  rule_id uuid REFERENCES public.financial_collection_rules(id) ON DELETE SET NULL,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  recipient text,
  payload jsonb,
  error text,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fcl_creche ON public.financial_collection_logs(creche_id);
CREATE INDEX idx_fcl_invoice ON public.financial_collection_logs(invoice_id);

ALTER TABLE public.financial_collection_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fcl_admin_all" ON public.financial_collection_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "fcl_diretor_secretaria_select" ON public.financial_collection_logs
  FOR SELECT TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id));

-- ============ Templates de mensagem financeira ============
CREATE TABLE public.financial_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creche_id uuid NOT NULL REFERENCES public.creches(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  titulo text NOT NULL,
  body text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fmt_creche ON public.financial_message_templates(creche_id);

ALTER TABLE public.financial_message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fmt_admin_all" ON public.financial_message_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "fmt_diretor_secretaria" ON public.financial_message_templates
  FOR ALL TO authenticated
  USING (public.is_financeiro_admin(auth.uid(), creche_id))
  WITH CHECK (public.is_financeiro_admin(auth.uid(), creche_id));

CREATE TRIGGER fmt_updated_at BEFORE UPDATE ON public.financial_message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

