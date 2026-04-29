
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
