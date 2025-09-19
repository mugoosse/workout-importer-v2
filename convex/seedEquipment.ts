import { mutation } from "./_generated/server";

const EQUIPMENT_LIST = [
  "Ab Wheel",
  "BOSU",
  "Barbell",
  "Battle Rope",
  "Bench",
  "Bodyweight",
  "Box",
  "Cable",
  "Cable Bar",
  "Captain's Chair",
  "Dumbbell",
  "EZ Bar",
  "Foam Roller",
  "GHD Machine",
  "Hurdle",
  "Kettlebell",
  "Landmine",
  "Machine",
  "Medicine-Ball",
  "Mini Band",
  "Parallettes",
  "Plyo Box",
  "Resistance Band",
  "Rings",
  "Roman Chair",
  "Sandbag",
  "Sliders",
  "Smith Machine",
  "Stability Ball",
  "Straps",
  "T Bar",
  "Trap Bar",
  "Weight Plate",
  "Weight Sled"
];

export const seedEquipment = mutation({
  args: {},
  handler: async (ctx) => {
    let seeded = 0;

    for (const name of EQUIPMENT_LIST) {
      const existing = await ctx.db
        .query("equipment")
        .withIndex("by_name", q => q.eq("name", name))
        .first();

      if (!existing) {
        await ctx.db.insert("equipment", { name });
        seeded++;
      }
    }

    return {
      totalEquipment: EQUIPMENT_LIST.length,
      newlySeeded: seeded,
      message: `Seeded ${seeded} new equipment items (${EQUIPMENT_LIST.length} total)`
    };
  }
});