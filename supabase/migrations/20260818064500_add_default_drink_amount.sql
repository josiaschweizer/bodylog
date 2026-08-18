ALTER TABLE public.profiles
  ADD COLUMN default_drink_amount_ml integer NOT NULL DEFAULT 500;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_default_drink_amount_ml_check
  CHECK (default_drink_amount_ml BETWEEN 1 AND 10000);
