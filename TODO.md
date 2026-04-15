# TODO

## Supabase SQL Editor

### 1. Auto-populate `users` on signup

Run in Supabase SQL Editor to create a trigger that inserts a new row into `users` whenever a user signs up (magic link, Google, Apple, etc.):

```sql
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 2. Enable Row Level Security on `users`

Run in Supabase SQL Editor to ensure users can only access their own data, even if someone queries Supabase directly with the anon key:

```sql
alter table public.users enable row level security;

create policy "Users can only access their own record"
  on public.users
  for all
  using (id = auth.uid());
```
