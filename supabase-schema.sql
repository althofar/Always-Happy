-- Jalankan seluruh SQL ini di Supabase Dashboard > SQL Editor.
--
-- LANGKAH WAJIB SEBELUM MENJALANKAN:
-- 1. Cari tulisan GANTI_DENGAN_EMAIL_ADMIN di bawah (hanya satu tempat, di fungsi is_admin).
-- 2. Ganti dengan email akun admin yang akan kamu buat di Authentication > Users.
--    Tulis dengan huruf kecil semua, tetap di dalam tanda kutip satu.
--
-- SETELAH MENJALANKAN:
-- 3. Authentication > Users > Add user: isi email dan password admin, centang Auto Confirm User.
-- 4. Authentication > Sign In / Providers: matikan "Allow new users to sign up".
--    Tanpa langkah ini, orang lain bisa mendaftar sendiri lewat anon key yang terlihat publik.
--    Dengan fungsi is_admin() di bawah, akun yang bukan admin tetap tidak bisa membaca data tamu.
--
-- Aman dijalankan ulang di proyek yang sudah memakai versi lama: kebijakan lama akan diganti.

create extension if not exists pgcrypto;

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  attendance text not null check (attendance in ('Hadir','Tidak hadir')),
  guests integer not null default 1 check (guests between 1 and 4),
  note text default '',
  created_at timestamptz not null default now()
);
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_name text default '',
  created_at timestamptz not null default now()
);

alter table public.rsvps enable row level security;
alter table public.wishes enable row level security;
alter table public.guests enable row level security;

-- Hanya akun dengan email ini yang dianggap admin.
-- Kalau email belum diganti, tidak ada yang lolos sebagai admin (aman, tapi dashboard kosong).
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'althofar1202@gmail.com'
$$;

-- Pengunjung boleh mengirim RSVP dan ucapan, tetapi tidak membaca data RSVP.
drop policy if exists "Public can submit RSVP" on public.rsvps;
create policy "Public can submit RSVP" on public.rsvps for insert to anon, authenticated
  with check (char_length(name) between 1 and 150 and char_length(coalesce(note,'')) <= 1000);
drop policy if exists "Public can submit wishes" on public.wishes;
create policy "Public can submit wishes" on public.wishes for insert to anon, authenticated
  with check (char_length(name) between 1 and 150 and char_length(message) between 1 and 2000);

-- Ucapan boleh dibaca publik agar muncul di halaman undangan.
drop policy if exists "Public can read wishes" on public.wishes;
create policy "Public can read wishes" on public.wishes for select to anon, authenticated using (true);

-- Hanya admin yang boleh membaca, mengubah, dan menghapus data.
-- Jangan pernah memasukkan service_role key atau secret key ke situs.
drop policy if exists "Authenticated admin can manage RSVPs" on public.rsvps;
drop policy if exists "Admin can manage RSVPs" on public.rsvps;
create policy "Admin can manage RSVPs" on public.rsvps for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated admin can manage wishes" on public.wishes;
drop policy if exists "Admin can manage wishes" on public.wishes;
create policy "Admin can manage wishes" on public.wishes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated admin can manage guests" on public.guests;
drop policy if exists "Admin can manage guests" on public.guests;
create policy "Admin can manage guests" on public.guests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
