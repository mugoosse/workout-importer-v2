import { v } from 'convex/values';
import { query } from './_generated/server';

// Get a single muscle by ID
export const get = query({
  args: { muscleId: v.id('muscles') },
  handler: async (ctx, args) => {
    const muscle = await ctx.db.get(args.muscleId);
    return muscle;
  },
});


// List all muscles
export const list = query(async (ctx) => {
  const muscles = await ctx.db
    .query('muscles')
    .collect();

  return muscles;
});
