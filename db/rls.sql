-- =============================================================================
-- Universidade Invent — RLS policies, helpers e triggers
--
-- Aplicar APÓS o `drizzle-kit migrate` criar as tabelas. Idempotente.
-- Toda tabela tem RLS habilitado E forçado. Default-deny.
--
-- Ver CLAUDE.md §4 e §5.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.current_role() returns text
  language sql stable security definer set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public
as $$
  select coalesce(public.current_role() = 'admin', false);
$$;

create or replace function public.is_instructor() returns boolean
  language sql stable security definer set search_path = public
as $$
  select coalesce(public.current_role() in ('admin', 'instrutor'), false);
$$;

create or replace function public.is_instructor_of(course uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists(
    select 1 from public.course_instructors
    where course_id = course and profile_id = auth.uid()
  ) or public.is_admin();
$$;

create or replace function public.owns_enrollment(enrollment uuid) returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists(
    select 1 from public.enrollments
    where id = enrollment and profile_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Trigger: auth.users → profiles
-- Cria profile automaticamente em todo signup. Sem isso, signups orfãos.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Habilitar e forçar RLS em todas as tabelas públicas
-- ---------------------------------------------------------------------------

alter table public.profiles            enable row level security;
alter table public.profiles            force row level security;
alter table public.companies           enable row level security;
alter table public.companies           force row level security;
alter table public.profile_companies   enable row level security;
alter table public.profile_companies   force row level security;
alter table public.categories          enable row level security;
alter table public.categories          force row level security;
alter table public.tags                enable row level security;
alter table public.tags                force row level security;
alter table public.courses             enable row level security;
alter table public.courses             force row level security;
alter table public.course_tags         enable row level security;
alter table public.course_tags         force row level security;
alter table public.course_instructors  enable row level security;
alter table public.course_instructors  force row level security;
alter table public.modules             enable row level security;
alter table public.modules             force row level security;
alter table public.lessons             enable row level security;
alter table public.lessons             force row level security;
alter table public.video_assets        enable row level security;
alter table public.video_assets        force row level security;
alter table public.enrollments         enable row level security;
alter table public.enrollments         force row level security;
alter table public.lesson_progress     enable row level security;
alter table public.lesson_progress     force row level security;
alter table public.lesson_events       enable row level security;
alter table public.lesson_events       force row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- companies & profile_companies
-- ---------------------------------------------------------------------------

drop policy if exists "companies_select_member_or_admin" on public.companies;
create policy "companies_select_member_or_admin" on public.companies
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.profile_companies pc
      where pc.company_id = id and pc.profile_id = auth.uid()
    )
  );

drop policy if exists "companies_admin_write" on public.companies;
create policy "companies_admin_write" on public.companies
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profile_companies_select" on public.profile_companies;
create policy "profile_companies_select" on public.profile_companies
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "profile_companies_admin_write" on public.profile_companies;
create policy "profile_companies_admin_write" on public.profile_companies
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Catálogo (categories, tags) — leitura pública, escrita admin
-- ---------------------------------------------------------------------------

drop policy if exists "categories_read_all" on public.categories;
create policy "categories_read_all" on public.categories for select using (true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tags_read_all" on public.tags;
create policy "tags_read_all" on public.tags for select using (true);

drop policy if exists "tags_admin_write" on public.tags;
create policy "tags_admin_write" on public.tags
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------

drop policy if exists "courses_read_published" on public.courses;
create policy "courses_read_published" on public.courses
  for select using (
    (status = 'published' and visibility = 'public')
    or instructor_owner_id = auth.uid()
    or public.is_instructor_of(id)
    or public.is_admin()
  );

drop policy if exists "courses_instructor_write_own" on public.courses;
create policy "courses_instructor_write_own" on public.courses
  for update using (
    public.is_admin() or instructor_owner_id = auth.uid()
  )
  with check (
    public.is_admin() or instructor_owner_id = auth.uid()
  );

drop policy if exists "courses_admin_insert" on public.courses;
create policy "courses_admin_insert" on public.courses
  for insert with check (public.is_instructor());

drop policy if exists "courses_admin_delete" on public.courses;
create policy "courses_admin_delete" on public.courses
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- course_tags, course_instructors, modules, lessons — herdam do curso
-- ---------------------------------------------------------------------------

drop policy if exists "course_tags_read" on public.course_tags;
create policy "course_tags_read" on public.course_tags
  for select using (exists (
    select 1 from public.courses c where c.id = course_id
      and (c.status = 'published' or public.is_instructor_of(c.id))
  ));

drop policy if exists "course_tags_write" on public.course_tags;
create policy "course_tags_write" on public.course_tags
  for all using (public.is_instructor_of(course_id)) with check (public.is_instructor_of(course_id));

drop policy if exists "course_instructors_read" on public.course_instructors;
create policy "course_instructors_read" on public.course_instructors
  for select using (true);

drop policy if exists "course_instructors_admin_write" on public.course_instructors;
create policy "course_instructors_admin_write" on public.course_instructors
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "modules_read" on public.modules;
create policy "modules_read" on public.modules
  for select using (exists (
    select 1 from public.courses c where c.id = course_id
      and (c.status = 'published' or public.is_instructor_of(c.id))
  ));

drop policy if exists "modules_write" on public.modules;
create policy "modules_write" on public.modules
  for all using (public.is_instructor_of(course_id)) with check (public.is_instructor_of(course_id));

drop policy if exists "lessons_read" on public.lessons;
create policy "lessons_read" on public.lessons
  for select using (
    exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id
        and (
          public.is_instructor_of(c.id)
          or is_preview = true
          or (c.status = 'published' and exists (
            select 1 from public.enrollments e
            where e.course_id = c.id and e.profile_id = auth.uid()
          ))
        )
    )
  );

drop policy if exists "lessons_write" on public.lessons;
create policy "lessons_write" on public.lessons
  for all using (
    exists (
      select 1 from public.modules m
      where m.id = module_id and public.is_instructor_of(m.course_id)
    )
  )
  with check (
    exists (
      select 1 from public.modules m
      where m.id = module_id and public.is_instructor_of(m.course_id)
    )
  );

-- ---------------------------------------------------------------------------
-- video_assets — instrutores e admin
-- ---------------------------------------------------------------------------

drop policy if exists "video_assets_read" on public.video_assets;
create policy "video_assets_read" on public.video_assets
  for select using (public.is_instructor() or uploaded_by = auth.uid());

drop policy if exists "video_assets_write" on public.video_assets;
create policy "video_assets_write" on public.video_assets
  for all using (public.is_instructor()) with check (public.is_instructor());

-- ---------------------------------------------------------------------------
-- enrollments — aluno vê suas matrículas; instrutor do curso vê todas dele
-- ---------------------------------------------------------------------------

drop policy if exists "enrollments_select_own_or_instructor" on public.enrollments;
create policy "enrollments_select_own_or_instructor" on public.enrollments
  for select using (
    profile_id = auth.uid()
    or public.is_instructor_of(course_id)
    or public.is_admin()
  );

drop policy if exists "enrollments_insert_self" on public.enrollments;
create policy "enrollments_insert_self" on public.enrollments
  for insert with check (
    profile_id = auth.uid() or public.is_admin()
  );

drop policy if exists "enrollments_admin_update" on public.enrollments;
create policy "enrollments_admin_update" on public.enrollments
  for update using (public.is_admin() or profile_id = auth.uid())
  with check (public.is_admin() or profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- lesson_progress — dono da matrícula
-- ---------------------------------------------------------------------------

drop policy if exists "lesson_progress_select_owner_or_instructor" on public.lesson_progress;
create policy "lesson_progress_select_owner_or_instructor" on public.lesson_progress
  for select using (
    public.owns_enrollment(enrollment_id)
    or public.is_admin()
    or exists (
      select 1 from public.enrollments e
      where e.id = enrollment_id and public.is_instructor_of(e.course_id)
    )
  );

drop policy if exists "lesson_progress_upsert_owner" on public.lesson_progress;
create policy "lesson_progress_upsert_owner" on public.lesson_progress
  for all using (public.owns_enrollment(enrollment_id))
  with check (public.owns_enrollment(enrollment_id));

-- ---------------------------------------------------------------------------
-- lesson_events — append-only do aluno; leitura de instrutor/admin
-- ---------------------------------------------------------------------------

drop policy if exists "lesson_events_insert_owner" on public.lesson_events;
create policy "lesson_events_insert_owner" on public.lesson_events
  for insert with check (public.owns_enrollment(enrollment_id));

drop policy if exists "lesson_events_select_owner_or_instructor" on public.lesson_events;
create policy "lesson_events_select_owner_or_instructor" on public.lesson_events
  for select using (
    public.owns_enrollment(enrollment_id)
    or public.is_admin()
    or exists (
      select 1 from public.enrollments e
      where e.id = enrollment_id and public.is_instructor_of(e.course_id)
    )
  );
