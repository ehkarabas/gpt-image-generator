-- Helper functions for testing database schema

-- Function to get foreign key constraints information
create or replace function public.get_foreign_keys()
returns table (
  table_name text,
  constraint_name text,
  column_name text,
  foreign_table_name text,
  foreign_column_name text
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    tc.table_name::text,
    tc.constraint_name::text,
    kcu.column_name::text,
    ccu.table_name::text as foreign_table_name,
    ccu.column_name::text as foreign_column_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu 
    on tc.constraint_name = kcu.constraint_name
    and tc.table_schema = kcu.table_schema
  join information_schema.constraint_column_usage ccu 
    on ccu.constraint_name = tc.constraint_name
    and ccu.table_schema = tc.table_schema
  where tc.constraint_type = 'FOREIGN KEY'
    and tc.table_schema = 'public'
    and tc.table_name in ('profiles', 'conversations', 'messages', 'images');
end;
$$;

-- Grant execute permission to authenticated users for testing
grant execute on function public.get_foreign_keys() to authenticated;
grant execute on function public.get_foreign_keys() to service_role;