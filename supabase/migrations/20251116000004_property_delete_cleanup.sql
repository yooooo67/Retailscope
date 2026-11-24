-- RETAILSCOPE — referential cleanup
-- When a property is deleted, remove its id from every contact's
-- property_ids array so no dead links remain.

create or replace function public.remove_property_from_contacts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.contacts
  set property_ids = array_remove(property_ids, old.id)
  where old.id = any(property_ids);
  return old;
end;
$$;

drop trigger if exists properties_cleanup_contacts on public.properties;
create trigger properties_cleanup_contacts
  after delete on public.properties
  for each row execute function public.remove_property_from_contacts();
