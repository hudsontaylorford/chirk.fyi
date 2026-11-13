-- Creates Thanksgiving 2026. Paste into Neon → SQL Editor → Run (after schema.sql).
with e as (
  insert into events (slug, title, date, time, place, address, rsvp_by, bring_prompt, details)
  values (
    'thanksgiving-2026', 'Thanksgiving 2026', '2026-11-26', '16:30', 'The Fords''',
    '718 Greene Avenue, Brooklyn, NY', '2026-11-20',
    'What''s your main dish?',
    E'Come whenever: bagels in the morning, snacks all afternoon, dinner at 4:30.\n\nA few of us cover the main dishes; everyone else brings one thing (a drink, dessert or app is perfect). Homemade, please!'
  )
  on conflict (slug) do nothing
  returning id
)
insert into items (event_id, kind, name, sort)
select e.id, 'needed', x.name, x.sort
from e, (values ('Turkey & gravy', 1), ('Ham or roast', 2), ('Mashed potatoes', 3), ('Sweet potatoes', 4),
                ('Stuffing', 5), ('Green beans', 6), ('Cranberry sauce', 7), ('Rolls', 8)) as x(name, sort);
