import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const schema = defineSchema({
  ...authTables,
  muscles: defineTable({
    name: v.string(),
    anatomicalGroup: v.optional(v.string()),
    svgId: v.union(
      v.literal('adductor_longus_and_pectineus'),
      v.literal('adductor_magnus'),
      v.literal('biceps_brachii'),
      v.literal('biceps_femoris'),
      v.literal('brachialis'),
      v.literal('brachioradialis'),
      v.literal('deltoids'),
      v.literal('extensor_carpi_radialis'),
      v.literal('external_obliques'),
      v.literal('flexor_carpi_radialis'),
      v.literal('flexor_carpi_ulnaris'),
      v.literal('gastrocnemius'),
      v.literal('gluteus_maximus'),
      v.literal('gluteus_medius'),
      v.literal('gracilis'),
      v.literal('infraspinatus'),
      v.literal('latissimus_dorsi'),
      v.literal('lower_trapezius'),
      v.literal('omohyoid'),
      v.literal('pectoralis_major'),
      v.literal('peroneus_longus'),
      v.literal('rectus_abdominis'),
      v.literal('rectus_femoris'),
      v.literal('rhomboid_muscles'),
      v.literal('sartorius'),
      v.literal('semitendinosus'),
      v.literal('serratus_anterior'),
      v.literal('soleus'),
      v.literal('sternocleidomastoid'),
      v.literal('tensor_fasciae_latae'),
      v.literal('teres_major'),
      v.literal('erector_spinae'),
      v.literal('trapezius'),
      v.literal('triceps_brachii'),
      v.literal('vastus_lateralis'),
      v.literal('vastus_medialis')
    ),
    majorGroup: v.union(
      v.literal('chest'),
      v.literal('back'),
      v.literal('legs'),
      v.literal('shoulders'),
      v.literal('arms'),
      v.literal('core')
    ),
  })
});

export default schema;
