CREATE TYPE "public"."aluno_subtype" AS ENUM('cliente', 'parceiro', 'lead');--> statement-breakpoint
CREATE TYPE "public"."company_tier" AS ENUM('cliente', 'parceiro', 'prospect');--> statement-breakpoint
CREATE TYPE "public"."course_level" AS ENUM('intro', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."course_visibility" AS ENUM('public', 'enrolled_only', 'company_only', 'invite_only');--> statement-breakpoint
CREATE TYPE "public"."enrollment_source" AS ENUM('self', 'admin', 'company_bulk', 'lead_magnet');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'completed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."lesson_progress_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."lesson_type" AS ENUM('video', 'text', 'quiz', 'assignment', 'live');--> statement-breakpoint
CREATE TYPE "public"."persona" AS ENUM('decisor', 'influenciador');--> statement-breakpoint
CREATE TYPE "public"."sap_product" AS ENUM('B1', 'S4HC', 'both', 'none');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'instrutor', 'aluno');--> statement-breakpoint
CREATE TYPE "public"."video_provider" AS ENUM('bunny', 'mux');--> statement-breakpoint
CREATE TYPE "public"."video_status" AS ENUM('uploading', 'processing', 'ready', 'errored');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"parent_id" uuid,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cnpj" varchar(14),
	"sap_product" "sap_product" DEFAULT 'none' NOT NULL,
	"tier" "company_tier" DEFAULT 'prospect' NOT NULL,
	"hubspot_company_id" text,
	"account_owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_instructors" (
	"course_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"role" text DEFAULT 'lead' NOT NULL,
	CONSTRAINT "course_instructors_course_id_profile_id_pk" PRIMARY KEY("course_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_tags" (
	"course_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "course_tags_course_id_tag_id_pk" PRIMARY KEY("course_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(128) NOT NULL,
	"title_i18n" jsonb NOT NULL,
	"summary_i18n" jsonb,
	"description_i18n" jsonb,
	"cover_url" text,
	"trailer_video_id" uuid,
	"category_id" uuid,
	"level" "course_level" DEFAULT 'intro' NOT NULL,
	"status" "course_status" DEFAULT 'draft' NOT NULL,
	"visibility" "course_visibility" DEFAULT 'public' NOT NULL,
	"target_personas" text[],
	"sap_module" text[],
	"instructor_owner_id" uuid,
	"language" varchar(8) DEFAULT 'pt-BR' NOT NULL,
	"estimated_minutes" integer,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"source" "enrollment_source" DEFAULT 'self' NOT NULL,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"progress_pct" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_course_profile_unique" UNIQUE("course_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lesson_events" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"event" text NOT NULL,
	"payload" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_events_id_at_pk" PRIMARY KEY("id","at")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lesson_progress" (
	"enrollment_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"status" "lesson_progress_status" DEFAULT 'not_started' NOT NULL,
	"watch_position_seconds" integer DEFAULT 0 NOT NULL,
	"watched_seconds_total" integer DEFAULT 0 NOT NULL,
	"last_event_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_enrollment_id_lesson_id_pk" PRIMARY KEY("enrollment_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"title_i18n" jsonb NOT NULL,
	"order" integer NOT NULL,
	"type" "lesson_type" NOT NULL,
	"duration_seconds" integer,
	"is_preview" boolean DEFAULT false NOT NULL,
	"passing_required" boolean DEFAULT false NOT NULL,
	"content_ref" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lessons_module_order_unique" UNIQUE("module_id","order")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title_i18n" jsonb NOT NULL,
	"summary_i18n" jsonb,
	"order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "modules_course_order_unique" UNIQUE("course_id","order")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profile_companies" (
	"profile_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"relationship" text DEFAULT 'employee' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_companies_profile_id_company_id_pk" PRIMARY KEY("profile_id","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'aluno' NOT NULL,
	"aluno_subtype" "aluno_subtype",
	"persona" "persona",
	"job_title" text,
	"phone_e164" varchar(20),
	"whatsapp_opt_in" boolean DEFAULT false NOT NULL,
	"locale" varchar(8) DEFAULT 'pt-BR' NOT NULL,
	"hubspot_contact_id" text,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "video_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "video_provider" DEFAULT 'bunny' NOT NULL,
	"provider_asset_id" text NOT NULL,
	"playback_id" text,
	"duration_seconds" integer,
	"aspect_ratio" varchar(16),
	"status" "video_status" DEFAULT 'uploading' NOT NULL,
	"thumbnail_url" text,
	"captions_url" text,
	"transcript_text" text,
	"transcript_segments" jsonb,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companies" ADD CONSTRAINT "companies_account_owner_id_profiles_id_fk" FOREIGN KEY ("account_owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_tags" ADD CONSTRAINT "course_tags_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_tags" ADD CONSTRAINT "course_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "courses" ADD CONSTRAINT "courses_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_owner_id_profiles_id_fk" FOREIGN KEY ("instructor_owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile_companies" ADD CONSTRAINT "profile_companies_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile_companies" ADD CONSTRAINT "profile_companies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "video_assets" ADD CONSTRAINT "video_assets_uploaded_by_profiles_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "courses_status_visibility_category_idx" ON "courses" USING btree ("status","visibility","category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_profile_status_idx" ON "enrollments" USING btree ("profile_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lesson_events_enrollment_at_idx" ON "lesson_events" USING btree ("enrollment_id","at");