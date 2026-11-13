-- Creates the Thanksgiving 2026 event (only if it doesn't exist yet).
-- Paste into Supabase → SQL Editor → Run, after schema.sql.
do $$
declare
  ev uuid;
  core uuid;
begin
  if exists (select 1 from events where slug = 'thanksgiving-2026') then
    raise notice 'thanksgiving-2026 already exists, skipping';
    return;
  end if;

  insert into events (slug, title, tagline, event_date, dinner_time, location_name, address,
    invite_copy, closing_note, house_rules, rsvp_deadline, dish_name_deadline, theme)
  values (
    'thanksgiving-2026',
    'Thanksgiving in New York, 2026',
    'You are warmly invited to Thanksgiving at the Fords in New York.',
    '2026-11-26', '16:30',
    'Ford Residence', E'718 Greene Avenue\nBrooklyn, New York',
    'A celebration of bright spirits, good company (and, with any luck, even better wine), and enough food to make one wish the holiday stretched on twice as long. Guests are welcome to arrive whenever the mood strikes. Contribute to the meal, settle in, and come early enough to enjoy a drink or two before a feast we will all be thankful for.',
    'Inspired variations, repeats, and personal takes on any dish are more than welcome!',
    E'Bagels and breakfast things in the morning, an app-heavy afternoon, and a seated dinner at half past four.\nA handful of us will take the main dishes. Everyone else, bring an app, a dessert, or something to drink.\nEverything homemade, please: no store-bought dishes or desserts.\nDinner runs about two hours, then the leftovers go straight into the fridge. Hungry again at ten? Turkey and ham sandwiches await.',
    '2026-11-20', '2026-11-20',
    '{"background":"#5C1000","ink":"#F6EBD3","collage":"/events/thanksgiving-2026/collage.webp"}'
  ) returning id into ev;

  insert into kitchen_resources (event_id, kind, label, quantity, capacity, sort_order)
  values (ev, 'oven', 'Oven', 1, 2, 0);

  insert into categories (event_id, name, kind, soft_cap, nudge, description, sort_order)
  values (ev, 'The Feast', 'core', null, null, 'The main dishes. One person each.', 0)
  returning id into core;

  insert into categories (event_id, name, kind, soft_cap, nudge, description, sort_order) values
    (ev, 'Apps', 'open', 6, 'We''ve got plenty of apps. Could you bring a dessert or an extra side instead?', 'For the long afternoon.', 1),
    (ev, 'Extra sides', 'open', 5, 'The table''s getting full of sides. An app would be a big help!', 'Beyond the core dishes.', 2),
    (ev, 'Desserts', 'open', 6, 'We''ve got lots of desserts already. Could you bring an app?', 'Sweet conclusions.', 3),
    (ev, 'Drinks', 'open', 5, 'We''re well stocked on drinks. Could you bring an app or a side?', 'Wine, cocktails, cider, non-alcoholic.', 4);

  insert into slots (event_id, category_id, name, description, sort_order) values
    (ev, core, 'Turkey & gravy', null, 0),
    (ev, core, 'Ham or roast', null, 1),
    (ev, core, 'Mashed potatoes', null, 2),
    (ev, core, 'Sweet potatoes', null, 3),
    (ev, core, 'Stuffing', null, 4),
    (ev, core, 'Green beans', null, 5),
    (ev, core, 'Cranberry sauce', null, 6),
    (ev, core, 'Rolls', null, 7);
end $$;
