-- Promuove a admin il profilo associato all'email indicata.
-- L'utente deve essersi PRIMA registrato (così esistono auth.users + profiles).
update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and u.email = 'mcdevelop03@gmail.com';
