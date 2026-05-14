-- ========================================================
-- SCHEMA INICIAL - GUSTAVO ALEXANDRE MULTIMARCAS
-- ========================================================

-- Função utilitária para atualização automática de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Tabela de Veículos
CREATE TABLE public.vehicles (
  id serial NOT NULL,
  name text NOT NULL,
  brand text NULL,
  price text NULL,
  year text NULL,
  fuel text NULL,
  transmission text NULL,
  km text NULL,
  color text NULL,
  placa text NULL,
  doors text NULL,
  badge text NULL,
  description text NULL,
  spotlight boolean NULL DEFAULT false,
  available boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT vehicles_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_vehicles_available ON public.vehicles USING btree (available) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_vehicles_spotlight ON public.vehicles USING btree (spotlight) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON public.vehicles USING btree (brand) TABLESPACE pg_default;

CREATE TRIGGER update_vehicles_updated_at BEFORE
UPDATE ON vehicles FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();


-- 2. Tabela de Imagens de Veículos
CREATE TABLE public.vehicle_images (
  id serial NOT NULL,
  vehicle_id integer NOT NULL,
  image_url text NOT NULL,
  image_meta jsonb NULL,
  display_order integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT vehicle_images_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_images_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON public.vehicle_images USING btree (vehicle_id) TABLESPACE pg_default;


-- 3. Tabela de Diferenciais (Features)
CREATE TABLE public.vehicle_features (
  id serial NOT NULL,
  vehicle_id integer NOT NULL,
  feature text NOT NULL,
  display_order integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT vehicle_features_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_features_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_vehicle_features_vehicle_id ON public.vehicle_features USING btree (vehicle_id) TABLESPACE pg_default;


-- 4. Tabela de Usuários Administrativos
CREATE TABLE public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  username text NOT NULL,
  password_hash text NOT NULL,
  name text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id),
  CONSTRAINT admin_users_username_key UNIQUE (username)
) TABLESPACE pg_default;

CREATE TRIGGER update_admin_users_updated_at BEFORE
UPDATE ON admin_users FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();

-- ========================================================
-- SEGURANÇA: RLS, POLICIES E VIEW PÚBLICA
-- ========================================================

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.vehicles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images FORCE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_features FORCE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users FORCE ROW LEVEL SECURITY;

-- Impede acesso direto de anon/authenticated às tabelas brutas.
REVOKE ALL ON TABLE public.vehicles FROM anon, authenticated;
REVOKE ALL ON TABLE public.vehicle_images FROM anon, authenticated;
REVOKE ALL ON TABLE public.vehicle_features FROM anon, authenticated;
REVOKE ALL ON TABLE public.admin_users FROM anon, authenticated;

DROP POLICY IF EXISTS public_read_available_vehicles ON public.vehicles;
CREATE POLICY public_read_available_vehicles
ON public.vehicles
FOR SELECT
TO anon, authenticated
USING (available = true);

DROP POLICY IF EXISTS public_read_images_from_available_vehicles ON public.vehicle_images;
CREATE POLICY public_read_images_from_available_vehicles
ON public.vehicle_images
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.vehicles v
    WHERE v.id = vehicle_images.vehicle_id
      AND v.available = true
  )
);

DROP VIEW IF EXISTS public.public_vehicle_catalog;
CREATE VIEW public.public_vehicle_catalog AS
SELECT
  v.id,
  v.name,
  v.brand,
  v.price,
  v.year,
  v.fuel,
  v.transmission,
  v.badge,
  v.description,
  v.km,
  img.image_url AS first_image_url,
  COALESCE(
    img.image_meta -> 'variants' ->> 'card',
    img.image_url
  ) AS first_image_thumb_url
FROM public.vehicles v
LEFT JOIN LATERAL (
  SELECT
    vi.image_url,
    vi.image_meta
  FROM public.vehicle_images vi
  WHERE vi.vehicle_id = v.id
  ORDER BY vi.display_order ASC, vi.id ASC
  LIMIT 1
) img ON true
WHERE v.available = true;

REVOKE ALL ON TABLE public.public_vehicle_catalog FROM PUBLIC;
GRANT SELECT ON TABLE public.public_vehicle_catalog TO anon, authenticated;

COMMENT ON VIEW public.public_vehicle_catalog IS
'Catálogo público somente leitura. Não expõe placa nem metadados administrativos.';
