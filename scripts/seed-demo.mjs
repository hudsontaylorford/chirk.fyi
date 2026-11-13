// Local testing only: makes a "demo" event filled with the 2025 contributions.
// Usage: node scripts/seed-demo.mjs   (uses DATABASE_URL)
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL ?? "postgres://postgres@localhost:5432/eventkit", { prepare: false });

await sql`delete from events where slug = 'demo'`;
const [src] = await sql`select * from events where slug = 'thanksgiving-2026'`;
const { id: _id, created_at: _c, updated_at: _u, ...ev } = src;
const [e] = await sql`insert into events ${sql({ ...ev, slug: "demo", title: "Thanksgiving Demo (2025 data)" })} returning id`;
const catMap = {};
for (const c of await sql`select * from categories where event_id = ${src.id}`) {
  const [n] = await sql`insert into categories ${sql({ event_id: e.id, name: c.name, kind: c.kind, soft_cap: c.soft_cap, nudge: c.nudge, description: c.description, sort_order: c.sort_order })} returning id`;
  catMap[c.name] = n.id;
}
const slot = {};
for (const s of await sql`select s.*, c.name as cat from slots s join categories c on c.id = s.category_id where s.event_id = ${src.id}`) {
  const [n] = await sql`insert into slots ${sql({ event_id: e.id, category_id: catMap[s.cat], name: s.name, sort_order: s.sort_order })} returning id`;
  slot[s.name] = n.id;
}
await sql`insert into kitchen_resources (event_id, kind, label, quantity, capacity) values (${e.id}, 'oven', 'Oven', 1, 2)`;

const D = (cat, name, extra = {}) => ({ cat, name, ...extra });
const oven = (t, m, timing = "before") => ({ kitchen_needs: ["oven"], oven_temp_f: t, oven_minutes: m, timing });
const people = [
  ["Hudson", 2, 0, "morning", "", [D("The Feast", "Turkey and gravy", { slot: "Turkey & gravy", ...oven(350, 120) }), D("Desserts", "Pecan cheesecake"), D("Drinks", "Coffee, seltzer, wine, liquor")]],
  ["Victoria", 1, 0, "morning", "", [D("The Feast", "Stuffing", { slot: "Stuffing", ...oven(425, 20) }), D("Extra sides", "Corn"), D("Desserts", "Apple pie", oven(375, 60, "after")), D("Desserts", "Maple tart")]],
  ["Caleb", 1, 0, "afternoon", "", [D("The Feast", "Green bean casserole", { slot: "Green beans" }), D("Desserts", "Chocolate crinkle cookies")]],
  ["Kellie", 1, 0, "afternoon", "", [D("The Feast", "Rolls & honey butter", { slot: "Rolls" }), D("Desserts", null)]],
  ["Madi & Max", 2, 0, "afternoon", "Max: no shellfish", [D("The Feast", "Sweet potatoes", { slot: "Sweet potatoes" }), D("Extra sides", "Mac and cheese", oven(350, 25))]],
  ["Graham", 1, 0, "dinner", "", [D("The Feast", "NY strip roast & horseradish", { slot: "Ham or roast", ...oven(200, 45) }), D("Desserts", "Pumpkin pie"), D("Drinks", "Batched manhattan")]],
  ["Ryan & Rebekah", 2, 1, "afternoon", "", [D("Apps", "Goat cheese stuffed dates", oven(400, 15)), D("Desserts", "Chocolate caramel sea salt tart")]],
  ["Jake & Jordan", 2, 0, "afternoon", "", [D("Extra sides", "Sirloin tip roast", { kitchen_needs: ["outlet"], timing: "before" }), D("Drinks", "Wine")]],
  ["Ellen", 1, 0, "afternoon", "Vegetarian", [D("Extra sides", "Winter salad", { kitchen_needs: ["fridge"] }), D("Desserts", "Lemon pie")]],
  ["Breanna", 1, 0, "dinner", "", [D("Apps", "Labneh dip with veggies", { kitchen_needs: ["ready", "fridge"] }), D("Drinks", "Beer")]],
  ["Aubrey", 1, 0, "dinner", "Gluten-free", [D("Desserts", "Ice cream", { kitchen_needs: ["fridge"] })]],
  ["Emily & Brian", 2, 0, "afternoon", "", [D("Apps", "Jalapeño poppers"), D("Desserts", "Brown butter chocolate chip cookies")]],
  ["Nick", 1, 0, "afternoon", "", [D("Desserts", "Babka")]],
];
for (const [name, adults, kids, arrival, diet, dishes] of people) {
  const [g] = await sql`insert into guests ${sql({ event_id: e.id, name, adults, kids, arrival_window: arrival, dietary_notes: diet || null, status: "yes" })} returning id`;
  for (const d of dishes) {
    await sql`insert into dishes ${sql({
      event_id: e.id, guest_id: g.id, category_id: catMap[d.cat], slot_id: d.slot ? slot[d.slot] : null, dish_name: d.name,
      kitchen_needs: d.kitchen_needs ?? [], oven_temp_f: d.oven_temp_f ?? null, oven_minutes: d.oven_minutes ?? null, timing: d.timing ?? null,
    })}`;
  }
}
await sql`insert into guests (event_id, name, status, adults) values (${e.id}, 'S.', 'maybe', 1)`;
console.log("demo event ready at /demo");
await sql.end();
