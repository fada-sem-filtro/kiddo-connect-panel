
ALTER TABLE public.presencas
ADD COLUMN pickup_person_id uuid NULL,
ADD COLUMN pickup_person_name text NULL,
ADD COLUMN pickup_person_type text NULL,
ADD COLUMN pickup_registered_by text NULL;
