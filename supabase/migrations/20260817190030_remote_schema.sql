-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP EXTENSION pg_net;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE TYPE public.gender_type AS ENUM (
  'MALE',
  'FEMALE'
);

CREATE TYPE public.meal_type AS ENUM (
  'BREAKFAST',
  'LUNCH',
  'DINNER',
  'SNACK',
  'OTHER'
);

CREATE TYPE public.medication_form AS ENUM (
  'TABLET',
  'CAPSULE',
  'DROPS',
  'LIQUID',
  'POWDER',
  'SPRAY',
  'INJECTION',
  'SUPPOSITORY',
  'OTHER'
);

CREATE TYPE public.medication_schedule_type AS ENUM (
  'SCHEDULED',
  'AS_NEEDED'
);

CREATE TYPE public.stool_amount AS ENUM (
  'SMALL',
  'MEDIUM',
  'LARGE'
);

CREATE TYPE public.stool_consistency AS ENUM (
  'WATERY_DIARRHEA',
  'DIARRHEA',
  'SOFT',
  'NORMAL',
  'HARD',
  'VERY_HARD'
);

CREATE TYPE public.tracking_entry_type AS ENUM (
  'FOOD',
  'DRINK',
  'MEDICATION',
  'STOOL',
  'URINATION',
  'SYMPTOM',
  'BODY_MEASUREMENT',
  'SLEEP',
  'OTHER'
);

CREATE TYPE public.urine_amount AS ENUM (
  'SMALL',
  'MEDIUM',
  'LARGE'
);

CREATE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  insert into public.profiles (
    id,
    first_name,
    last_name
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );

  return new;
end;
$function$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;

GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;

GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;

CREATE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

GRANT ALL ON FUNCTION public.set_updated_at() TO anon;

GRANT ALL ON FUNCTION public.set_updated_at() TO authenticated;

GRANT ALL ON FUNCTION public.set_updated_at() TO service_role;

CREATE TABLE public.body_measurements (
  id                       uuid         NOT NULL,
  weight_kg                numeric(6,2),
  temperature_celsius      numeric(4,2),
  pulse_bpm                integer,
  systolic_blood_pressure  integer,
  diastolic_blood_pressure integer
);

ALTER TABLE public.body_measurements
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.body_measurements
  ADD CONSTRAINT body_measurement_has_value CHECK (weight_kg IS NOT NULL OR temperature_celsius IS NOT NULL OR pulse_bpm IS NOT NULL OR systolic_blood_pressure IS
    NOT NULL OR diastolic_blood_pressure IS NOT NULL);

ALTER TABLE public.body_measurements
  ADD CONSTRAINT body_measurements_diastolic_blood_pressure_check CHECK (diastolic_blood_pressure IS NULL OR diastolic_blood_pressure > 0);

ALTER TABLE public.body_measurements
  ADD CONSTRAINT body_measurements_pkey PRIMARY KEY (id);

ALTER TABLE public.body_measurements
  ADD CONSTRAINT body_measurements_pulse_bpm_check CHECK (pulse_bpm IS NULL OR pulse_bpm > 0);

ALTER TABLE public.body_measurements
  ADD CONSTRAINT body_measurements_systolic_blood_pressure_check CHECK (systolic_blood_pressure IS NULL OR systolic_blood_pressure > 0);

ALTER TABLE public.body_measurements
  ADD CONSTRAINT body_measurements_weight_kg_check CHECK (weight_kg IS NULL OR weight_kg > 0::numeric);

GRANT ALL ON public.body_measurements TO anon;

GRANT ALL ON public.body_measurements TO authenticated;

GRANT ALL ON public.body_measurements TO service_role;

CREATE TABLE public.daily_notes (
  id           uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id      uuid                     NOT NULL,
  date         date                     NOT NULL,
  wellbeing    smallint,
  stress_level smallint,
  note         text,
  created_at   timestamp with time zone DEFAULT now() NOT NULL,
  updated_at   timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.daily_notes
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.daily_notes
  ADD CONSTRAINT daily_notes_pkey PRIMARY KEY (id);

ALTER TABLE public.daily_notes
  ADD CONSTRAINT daily_notes_stress_level_check CHECK (stress_level IS NULL OR stress_level >= 0 AND stress_level <= 10);

ALTER TABLE public.daily_notes
  ADD CONSTRAINT daily_notes_user_id_date_key UNIQUE (user_id, date);

ALTER TABLE public.daily_notes
  ADD CONSTRAINT daily_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.daily_notes
  ADD CONSTRAINT daily_notes_wellbeing_check CHECK (wellbeing IS NULL OR wellbeing >= 0 AND wellbeing <= 10);

GRANT ALL ON public.daily_notes TO anon;

GRANT ALL ON public.daily_notes TO authenticated;

GRANT ALL ON public.daily_notes TO service_role;

CREATE INDEX idx_daily_notes_user_date ON public.daily_notes (user_id, date DESC);

CREATE TRIGGER daily_notes_set_updated_at
  BEFORE UPDATE ON public.daily_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users manage own daily notes" ON public.daily_notes
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE TABLE public.drink_entries (
  id              uuid         NOT NULL,
  drink_name      text         NOT NULL,
  amount_ml       integer,
  caffeine_mg     numeric(8,2),
  alcohol_percent numeric(5,2)
);

ALTER TABLE public.drink_entries
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.drink_entries
  ADD CONSTRAINT drink_entries_alcohol_percent_check CHECK (alcohol_percent IS NULL OR alcohol_percent >= 0::numeric AND alcohol_percent <= 100::numeric);

ALTER TABLE public.drink_entries
  ADD CONSTRAINT drink_entries_amount_ml_check CHECK (amount_ml IS NULL OR amount_ml > 0);

ALTER TABLE public.drink_entries
  ADD CONSTRAINT drink_entries_caffeine_mg_check CHECK (caffeine_mg IS NULL OR caffeine_mg >= 0::numeric);

ALTER TABLE public.drink_entries
  ADD CONSTRAINT drink_entries_pkey PRIMARY KEY (id);

GRANT ALL ON public.drink_entries TO anon;

GRANT ALL ON public.drink_entries TO authenticated;

GRANT ALL ON public.drink_entries TO service_role;

CREATE TABLE public.food_entries (
  id          uuid             NOT NULL,
  meal_type   public.meal_type DEFAULT 'OTHER'::public.meal_type NOT NULL,
  description text,
  spicy_level smallint,
  fatty_level smallint
);

ALTER TABLE public.food_entries
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.food_entries
  ADD CONSTRAINT food_entries_fatty_level_check CHECK (fatty_level IS NULL OR fatty_level >= 0 AND fatty_level <= 5);

ALTER TABLE public.food_entries
  ADD CONSTRAINT food_entries_pkey PRIMARY KEY (id);

ALTER TABLE public.food_entries
  ADD CONSTRAINT food_entries_spicy_level_check CHECK (spicy_level IS NULL OR spicy_level >= 0 AND spicy_level <= 5);

GRANT ALL ON public.food_entries TO anon;

GRANT ALL ON public.food_entries TO authenticated;

GRANT ALL ON public.food_entries TO service_role;

CREATE TABLE public.food_entry_items (
  id            uuid                     DEFAULT gen_random_uuid() NOT NULL,
  food_entry_id uuid                     NOT NULL,
  food_id       uuid,
  custom_name   text,
  amount        numeric(10,2),
  unit          text,
  created_at    timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.food_entry_items
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.food_entry_items
  ADD CONSTRAINT food_entry_item_has_food CHECK (food_id IS NOT NULL OR NULLIF(TRIM(BOTH FROM custom_name), ''::text) IS NOT NULL);

ALTER TABLE public.food_entry_items
  ADD CONSTRAINT food_entry_items_amount_check CHECK (amount IS NULL OR amount > 0::numeric);

ALTER TABLE public.food_entry_items
  ADD CONSTRAINT food_entry_items_food_entry_id_fkey FOREIGN KEY (food_entry_id) REFERENCES public.food_entries(id) ON DELETE CASCADE;

ALTER TABLE public.food_entry_items
  ADD CONSTRAINT food_entry_items_pkey PRIMARY KEY (id);

GRANT ALL ON public.food_entry_items TO anon;

GRANT ALL ON public.food_entry_items TO authenticated;

GRANT ALL ON public.food_entry_items TO service_role;

CREATE INDEX idx_food_entry_items_food_entry ON public.food_entry_items (food_entry_id);

CREATE TABLE public.foods (
  id         uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id    uuid                     NOT NULL,
  name       text                     NOT NULL,
  brand      text,
  notes      text,
  is_active  boolean                  DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.foods
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.foods
  ADD CONSTRAINT foods_pkey PRIMARY KEY (id);

ALTER TABLE public.food_entry_items
  ADD CONSTRAINT food_entry_items_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(id) ON DELETE SET NULL;

ALTER TABLE public.foods
  ADD CONSTRAINT foods_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

GRANT ALL ON public.foods TO anon;

GRANT ALL ON public.foods TO authenticated;

GRANT ALL ON public.foods TO service_role;

CREATE INDEX idx_foods_user_active ON public.foods (user_id, is_active);

CREATE TRIGGER foods_set_updated_at
  BEFORE UPDATE ON public.foods
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users manage own foods" ON public.foods
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE TABLE public.medication_entries (
  id                     uuid          NOT NULL,
  medication_id          uuid          NOT NULL,
  medication_schedule_id uuid,
  dose                   numeric(10,3),
  dose_unit              text,
  taken_as_needed        boolean       DEFAULT false NOT NULL
);

ALTER TABLE public.medication_entries
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.medication_entries
  ADD CONSTRAINT medication_entries_dose_check CHECK (dose IS NULL OR dose > 0::numeric);

ALTER TABLE public.medication_entries
  ADD CONSTRAINT medication_entries_pkey PRIMARY KEY (id);

GRANT ALL ON public.medication_entries TO anon;

GRANT ALL ON public.medication_entries TO authenticated;

GRANT ALL ON public.medication_entries TO service_role;

CREATE INDEX idx_medication_entries_medication ON public.medication_entries (medication_id);

CREATE TABLE public.medication_schedules (
  id             uuid                            DEFAULT gen_random_uuid() NOT NULL,
  user_id        uuid                            NOT NULL,
  medication_id  uuid                            NOT NULL,
  schedule_type  public.medication_schedule_type DEFAULT 'SCHEDULED'::public.medication_schedule_type NOT NULL,
  scheduled_time time without time zone,
  dose           numeric(10,3),
  dose_unit      text,
  weekdays       smallint[],
  valid_from     date,
  valid_until    date,
  is_active      boolean                         DEFAULT true NOT NULL,
  created_at     timestamp with time zone        DEFAULT now() NOT NULL,
  updated_at     timestamp with time zone        DEFAULT now() NOT NULL
);

ALTER TABLE public.medication_schedules
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.medication_schedules
  ADD CONSTRAINT medication_schedule_dates_valid CHECK (valid_from IS NULL OR valid_until IS NULL OR valid_until >= valid_from);

ALTER TABLE public.medication_schedules
  ADD CONSTRAINT medication_schedule_weekdays_valid
    CHECK (weekdays IS NULL OR weekdays <@ ARRAY[1::smallint, 2::smallint, 3::smallint, 4::smallint, 5::smallint, 6::smallint, 7::smallint]);

ALTER TABLE public.medication_schedules
  ADD CONSTRAINT medication_schedules_dose_check CHECK (dose IS NULL OR dose > 0::numeric);

ALTER TABLE public.medication_schedules
  ADD CONSTRAINT medication_schedules_pkey PRIMARY KEY (id);

ALTER TABLE public.medication_entries
  ADD CONSTRAINT medication_entries_medication_schedule_id_fkey FOREIGN KEY (medication_schedule_id) REFERENCES public.medication_schedules(id) ON DELETE SET NULL;

ALTER TABLE public.medication_schedules
  ADD CONSTRAINT medication_schedules_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.medication_schedules
  ADD CONSTRAINT scheduled_medication_has_time CHECK (schedule_type <> 'SCHEDULED'::public.medication_schedule_type OR scheduled_time IS NOT NULL);

GRANT ALL ON public.medication_schedules TO anon;

GRANT ALL ON public.medication_schedules TO authenticated;

GRANT ALL ON public.medication_schedules TO service_role;

CREATE INDEX idx_medication_schedules_medication ON public.medication_schedules (medication_id);

CREATE INDEX idx_medication_schedules_user_active ON public.medication_schedules (user_id, is_active);

CREATE TRIGGER medication_schedules_set_updated_at
  BEFORE UPDATE ON public.medication_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users manage own medication schedules" ON public.medication_schedules
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE TABLE public.medications (
  id                uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id           uuid                     NOT NULL,
  name              text                     NOT NULL,
  active_ingredient text,
  strength          numeric(10,3),
  strength_unit     text,
  form              public.medication_form   DEFAULT 'TABLET'::public.medication_form NOT NULL,
  default_dose      numeric(10,3),
  default_dose_unit text,
  notes             text,
  is_active         boolean                  DEFAULT true NOT NULL,
  created_at        timestamp with time zone DEFAULT now() NOT NULL,
  updated_at        timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.medications
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.medications
  ADD CONSTRAINT medications_default_dose_check CHECK (default_dose IS NULL OR default_dose > 0::numeric);

ALTER TABLE public.medications
  ADD CONSTRAINT medications_pkey PRIMARY KEY (id);

ALTER TABLE public.medication_entries
  ADD CONSTRAINT medication_entries_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(id) ON DELETE RESTRICT;

ALTER TABLE public.medication_schedules
  ADD CONSTRAINT medication_schedules_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(id) ON DELETE CASCADE;

ALTER TABLE public.medications
  ADD CONSTRAINT medications_strength_check CHECK (strength IS NULL OR strength > 0::numeric);

ALTER TABLE public.medications
  ADD CONSTRAINT medications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

GRANT ALL ON public.medications TO anon;

GRANT ALL ON public.medications TO authenticated;

GRANT ALL ON public.medications TO service_role;

CREATE INDEX idx_medications_user_active ON public.medications (user_id, is_active);

CREATE TRIGGER medications_set_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users manage own medications" ON public.medications
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE TABLE public.profiles (
  id                uuid                     NOT NULL,
  first_name        text,
  last_name         text,
  birth_date        date,
  gender            public.gender_type,
  height_cm         numeric(5,2),
  current_weight_kg numeric(6,2),
  timezone          text                     DEFAULT 'Europe/Zurich'::text NOT NULL,
  created_at        timestamp with time zone DEFAULT now() NOT NULL,
  updated_at        timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_current_weight_kg_check CHECK (current_weight_kg IS NULL OR current_weight_kg > 0::numeric);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_height_cm_check CHECK (height_cm IS NULL OR height_cm > 0::numeric);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

GRANT ALL ON public.profiles TO anon;

GRANT ALL ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING ((id = auth.uid()))
  WITH CHECK ((id = auth.uid()));

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING ((id = auth.uid()));

CREATE TABLE public.sleep_entries (
  id               uuid                     NOT NULL,
  sleep_started_at timestamp with time zone NOT NULL,
  sleep_ended_at   timestamp with time zone,
  quality          smallint,
  interruptions    integer
);

ALTER TABLE public.sleep_entries
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sleep_entries
  ADD CONSTRAINT sleep_entries_interruptions_check CHECK (interruptions IS NULL OR interruptions >= 0);

ALTER TABLE public.sleep_entries
  ADD CONSTRAINT sleep_entries_pkey PRIMARY KEY (id);

ALTER TABLE public.sleep_entries
  ADD CONSTRAINT sleep_entries_quality_check CHECK (quality IS NULL OR quality >= 1 AND quality <= 5);

ALTER TABLE public.sleep_entries
  ADD CONSTRAINT sleep_times_valid CHECK (sleep_ended_at IS NULL OR sleep_ended_at >= sleep_started_at);

GRANT ALL ON public.sleep_entries TO anon;

GRANT ALL ON public.sleep_entries TO authenticated;

GRANT ALL ON public.sleep_entries TO service_role;

CREATE TABLE public.stool_entries (
  id                  uuid                     NOT NULL,
  consistency         public.stool_consistency NOT NULL,
  bristol_scale       smallint,
  amount              public.stool_amount,
  urgency             smallint,
  pain_level          smallint,
  blood               boolean                  DEFAULT false NOT NULL,
  mucus               boolean                  DEFAULT false NOT NULL,
  color               text,
  unusual_smell       boolean,
  complete_evacuation boolean
);

ALTER TABLE public.stool_entries
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.stool_entries
  ADD CONSTRAINT stool_entries_bristol_scale_check CHECK (bristol_scale IS NULL OR bristol_scale >= 1 AND bristol_scale <= 7);

ALTER TABLE public.stool_entries
  ADD CONSTRAINT stool_entries_pain_level_check CHECK (pain_level IS NULL OR pain_level >= 0 AND pain_level <= 10);

ALTER TABLE public.stool_entries
  ADD CONSTRAINT stool_entries_pkey PRIMARY KEY (id);

ALTER TABLE public.stool_entries
  ADD CONSTRAINT stool_entries_urgency_check CHECK (urgency IS NULL OR urgency >= 0 AND urgency <= 5);

GRANT ALL ON public.stool_entries TO anon;

GRANT ALL ON public.stool_entries TO authenticated;

GRANT ALL ON public.stool_entries TO service_role;

CREATE TABLE public.symptom_entries (
  id               uuid     NOT NULL,
  symptom_id       uuid,
  custom_name      text,
  severity         smallint NOT NULL,
  duration_minutes integer,
  body_area        text
);

ALTER TABLE public.symptom_entries
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.symptom_entries
  ADD CONSTRAINT symptom_entries_duration_minutes_check CHECK (duration_minutes IS NULL OR duration_minutes >= 0);

ALTER TABLE public.symptom_entries
  ADD CONSTRAINT symptom_entries_pkey PRIMARY KEY (id);

ALTER TABLE public.symptom_entries
  ADD CONSTRAINT symptom_entries_severity_check CHECK (severity >= 0 AND severity <= 10);

ALTER TABLE public.symptom_entries
  ADD CONSTRAINT symptom_entry_has_symptom CHECK (symptom_id IS NOT NULL OR NULLIF(TRIM(BOTH FROM custom_name), ''::text) IS NOT NULL);

GRANT ALL ON public.symptom_entries TO anon;

GRANT ALL ON public.symptom_entries TO authenticated;

GRANT ALL ON public.symptom_entries TO service_role;

CREATE TABLE public.symptoms (
  id          uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id     uuid                     NOT NULL,
  name        text                     NOT NULL,
  description text,
  is_active   boolean                  DEFAULT true NOT NULL,
  created_at  timestamp with time zone DEFAULT now() NOT NULL,
  updated_at  timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.symptoms
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.symptoms
  ADD CONSTRAINT symptoms_pkey PRIMARY KEY (id);

ALTER TABLE public.symptom_entries
  ADD CONSTRAINT symptom_entries_symptom_id_fkey FOREIGN KEY (symptom_id) REFERENCES public.symptoms(id) ON DELETE SET NULL;

ALTER TABLE public.symptoms
  ADD CONSTRAINT symptoms_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.symptoms
  ADD CONSTRAINT symptoms_user_id_name_key UNIQUE (user_id, name);

GRANT ALL ON public.symptoms TO anon;

GRANT ALL ON public.symptoms TO authenticated;

GRANT ALL ON public.symptoms TO service_role;

CREATE INDEX idx_symptoms_user_active ON public.symptoms (user_id, is_active);

CREATE TRIGGER symptoms_set_updated_at
  BEFORE UPDATE ON public.symptoms
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users manage own symptoms" ON public.symptoms
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE TABLE public.tags (
  id         uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id    uuid                     NOT NULL,
  name       text                     NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.tags
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tags
  ADD CONSTRAINT tags_pkey PRIMARY KEY (id);

ALTER TABLE public.tags
  ADD CONSTRAINT tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.tags
  ADD CONSTRAINT tags_user_id_name_key UNIQUE (user_id, name);

GRANT ALL ON public.tags TO anon;

GRANT ALL ON public.tags TO authenticated;

GRANT ALL ON public.tags TO service_role;

CREATE POLICY "Users manage own tags" ON public.tags
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE TABLE public.tracking_entries (
  id          uuid                       DEFAULT gen_random_uuid() NOT NULL,
  user_id     uuid                       NOT NULL,
  entry_type  public.tracking_entry_type NOT NULL,
  occurred_at timestamp with time zone   DEFAULT now() NOT NULL,
  note        text,
  created_at  timestamp with time zone   DEFAULT now() NOT NULL,
  updated_at  timestamp with time zone   DEFAULT now() NOT NULL
);

CREATE POLICY "Users manage own body measurements" ON public.body_measurements
  USING ((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = body_measurements.id) AND (te.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = body_measurements.id) AND (te.user_id = auth.uid())))));

CREATE POLICY "Users manage own drink entries" ON public.drink_entries
  USING ((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = drink_entries.id) AND (te.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = drink_entries.id) AND (te.user_id = auth.uid())))));

CREATE POLICY "Users manage own food entries" ON public.food_entries
  USING ((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = food_entries.id) AND (te.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = food_entries.id) AND (te.user_id = auth.uid())))));

CREATE POLICY "Users manage own food entry items" ON public.food_entry_items
  USING ((EXISTS ( SELECT 1
   FROM (public.food_entries fe
     JOIN public.tracking_entries te ON ((te.id = fe.id)))
  WHERE ((fe.id = food_entry_items.food_entry_id) AND (te.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.food_entries fe
     JOIN public.tracking_entries te ON ((te.id = fe.id)))
  WHERE ((fe.id = food_entry_items.food_entry_id) AND (te.user_id = auth.uid())))));

CREATE POLICY "Users manage own medication entries" ON public.medication_entries
  USING ((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = medication_entries.id) AND (te.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = medication_entries.id) AND (te.user_id = auth.uid())))));

CREATE POLICY "Users manage own sleep entries" ON public.sleep_entries
  USING ((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = sleep_entries.id) AND (te.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = sleep_entries.id) AND (te.user_id = auth.uid())))));

CREATE POLICY "Users manage own stool entries" ON public.stool_entries
  USING ((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = stool_entries.id) AND (te.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = stool_entries.id) AND (te.user_id = auth.uid())))));

CREATE POLICY "Users manage own symptom entries" ON public.symptom_entries
  USING ((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = symptom_entries.id) AND (te.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = symptom_entries.id) AND (te.user_id = auth.uid())))));

ALTER TABLE public.tracking_entries
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tracking_entries
  ADD CONSTRAINT tracking_entries_pkey PRIMARY KEY (id);

ALTER TABLE public.body_measurements
  ADD CONSTRAINT body_measurements_id_fkey FOREIGN KEY (id) REFERENCES public.tracking_entries(id) ON DELETE CASCADE;

ALTER TABLE public.drink_entries
  ADD CONSTRAINT drink_entries_id_fkey FOREIGN KEY (id) REFERENCES public.tracking_entries(id) ON DELETE CASCADE;

ALTER TABLE public.food_entries
  ADD CONSTRAINT food_entries_id_fkey FOREIGN KEY (id) REFERENCES public.tracking_entries(id) ON DELETE CASCADE;

ALTER TABLE public.medication_entries
  ADD CONSTRAINT medication_entries_id_fkey FOREIGN KEY (id) REFERENCES public.tracking_entries(id) ON DELETE CASCADE;

ALTER TABLE public.sleep_entries
  ADD CONSTRAINT sleep_entries_id_fkey FOREIGN KEY (id) REFERENCES public.tracking_entries(id) ON DELETE CASCADE;

ALTER TABLE public.stool_entries
  ADD CONSTRAINT stool_entries_id_fkey FOREIGN KEY (id) REFERENCES public.tracking_entries(id) ON DELETE CASCADE;

ALTER TABLE public.symptom_entries
  ADD CONSTRAINT symptom_entries_id_fkey FOREIGN KEY (id) REFERENCES public.tracking_entries(id) ON DELETE CASCADE;

ALTER TABLE public.tracking_entries
  ADD CONSTRAINT tracking_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

GRANT ALL ON public.tracking_entries TO anon;

GRANT ALL ON public.tracking_entries TO authenticated;

GRANT ALL ON public.tracking_entries TO service_role;

CREATE INDEX idx_tracking_entries_user_occurred_at ON public.tracking_entries (user_id, occurred_at DESC);

CREATE INDEX idx_tracking_entries_user_type ON public.tracking_entries (user_id, entry_type);

CREATE TRIGGER tracking_entries_set_updated_at
  BEFORE UPDATE ON public.tracking_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users can create own tracking entries" ON public.tracking_entries
  FOR INSERT
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can delete own tracking entries" ON public.tracking_entries
  FOR DELETE
  USING ((user_id = auth.uid()));

CREATE POLICY "Users can update own tracking entries" ON public.tracking_entries
  FOR UPDATE
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can view own tracking entries" ON public.tracking_entries
  FOR SELECT
  USING ((user_id = auth.uid()));

CREATE TABLE public.tracking_entry_tags (
  tracking_entry_id uuid NOT NULL,
  tag_id            uuid NOT NULL
);

ALTER TABLE public.tracking_entry_tags
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tracking_entry_tags
  ADD CONSTRAINT tracking_entry_tags_pkey PRIMARY KEY (tracking_entry_id, tag_id);

ALTER TABLE public.tracking_entry_tags
  ADD CONSTRAINT tracking_entry_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;

ALTER TABLE public.tracking_entry_tags
  ADD CONSTRAINT tracking_entry_tags_tracking_entry_id_fkey FOREIGN KEY (tracking_entry_id) REFERENCES public.tracking_entries(id) ON DELETE CASCADE;

GRANT ALL ON public.tracking_entry_tags TO anon;

GRANT ALL ON public.tracking_entry_tags TO authenticated;

GRANT ALL ON public.tracking_entry_tags TO service_role;

CREATE POLICY "Users manage own tracking entry tags" ON public.tracking_entry_tags
  USING (((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = tracking_entry_tags.tracking_entry_id) AND (te.user_id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM public.tags t
  WHERE ((t.id = tracking_entry_tags.tag_id) AND (t.user_id = auth.uid()))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = tracking_entry_tags.tracking_entry_id) AND (te.user_id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM public.tags t
  WHERE ((t.id = tracking_entry_tags.tag_id) AND (t.user_id = auth.uid()))))));

CREATE TABLE public.urination_entries (
  id         uuid                NOT NULL,
  amount     public.urine_amount,
  color      text,
  urgency    smallint,
  pain_level smallint,
  burning    boolean             DEFAULT false NOT NULL,
  nighttime  boolean             DEFAULT false NOT NULL
);

ALTER TABLE public.urination_entries
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.urination_entries
  ADD CONSTRAINT urination_entries_id_fkey FOREIGN KEY (id) REFERENCES public.tracking_entries(id) ON DELETE CASCADE;

ALTER TABLE public.urination_entries
  ADD CONSTRAINT urination_entries_pain_level_check CHECK (pain_level IS NULL OR pain_level >= 0 AND pain_level <= 10);

ALTER TABLE public.urination_entries
  ADD CONSTRAINT urination_entries_pkey PRIMARY KEY (id);

ALTER TABLE public.urination_entries
  ADD CONSTRAINT urination_entries_urgency_check CHECK (urgency IS NULL OR urgency >= 0 AND urgency <= 5);

GRANT ALL ON public.urination_entries TO anon;

GRANT ALL ON public.urination_entries TO authenticated;

GRANT ALL ON public.urination_entries TO service_role;

CREATE POLICY "Users manage own urination entries" ON public.urination_entries
  USING ((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = urination_entries.id) AND (te.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.tracking_entries te
  WHERE ((te.id = urination_entries.id) AND (te.user_id = auth.uid())))));
