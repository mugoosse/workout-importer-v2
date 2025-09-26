import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  muscles: defineTable({
    name: v.string(),
    anatomicalGroup: v.optional(v.string()),
    svgId: v.union(
      v.literal("adductor_longus_and_pectineus"),
      v.literal("adductor_magnus"),
      v.literal("biceps_brachii"),
      v.literal("biceps_femoris"),
      v.literal("brachialis"),
      v.literal("brachioradialis"),
      v.literal("deltoids"),
      v.literal("extensor_carpi_radialis"),
      v.literal("external_obliques"),
      v.literal("flexor_carpi_radialis"),
      v.literal("flexor_carpi_ulnaris"),
      v.literal("gastrocnemius"),
      v.literal("gluteus_maximus"),
      v.literal("gluteus_medius"),
      v.literal("gracilis"),
      v.literal("infraspinatus"),
      v.literal("latissimus_dorsi"),
      v.literal("lower_trapezius"),
      v.literal("omohyoid"),
      v.literal("pectoralis_major"),
      v.literal("peroneus_longus"),
      v.literal("rectus_abdominis"),
      v.literal("rectus_femoris"),
      v.literal("rhomboid_muscles"),
      v.literal("sartorius"),
      v.literal("semitendinosus"),
      v.literal("serratus_anterior"),
      v.literal("soleus"),
      v.literal("sternocleidomastoid"),
      v.literal("tensor_fasciae_latae"),
      v.literal("teres_major"),
      v.literal("erector_spinae"),
      v.literal("trapezius"),
      v.literal("triceps_brachii"),
      v.literal("vastus_lateralis"),
      v.literal("vastus_medialis"),
    ),
    group: v.union(
      v.literal("abdominals"),
      v.literal("shoulders"),
      v.literal("biceps"),
      v.literal("triceps"),
      v.literal("forearms"),
      v.literal("quadriceps"),
      v.literal("hamstrings"),
      v.literal("calves"),
      v.literal("glutes"),
      v.literal("abductors"),
      v.literal("adductors"),
      v.literal("lats"),
      v.literal("traps"),
      v.literal("lower_back"),
      v.literal("upper_back"),
      v.literal("chest"),
      v.literal("neck"),
    ),
    majorGroup: v.union(
      v.literal("chest"),
      v.literal("back"),
      v.literal("legs"),
      v.literal("shoulders"),
      v.literal("arms"),
      v.literal("core"),
    ),
  }),
  exercises: defineTable({
    title: v.string(),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
    source: v.string(),
    exerciseType: v.union(
      v.literal("Weight Reps"), // Example: Bench Press, Dumbbell Curls
      v.literal("Reps Only"), // Example: Pullups, Sit ups, Burpees
      v.literal("Weighted Bodyweight"), // Example: Weighted Pull Ups, Weighted Dips
      v.literal("Assisted Bodyweight"), // Example: Assisted Pullups, Assisted Dips
      v.literal("Duration"), // Example: Planks, Yoga, Stretching
      v.literal("Weight & Duration"), // Example: Weighted Plank, Wall Sit
      v.literal("Distance & Duration"), // Example: Running, Cycling, Rowing
      v.literal("Weight & Distance"), // Example: Farmers Walk, Suitcase Carry
    ),
    thumbnailUrl: v.optional(v.string()),
  })
    .index("by_title", ["title"])
    .index("by_type", ["exerciseType"])
    .searchIndex("search_exercises", {
      searchField: "title",
      filterFields: ["source", "exerciseType"],
    }),
  equipment: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),
  exerciseEquipment: defineTable({
    exerciseId: v.id("exercises"),
    equipmentId: v.id("equipment"),
  })
    .index("by_exercise", ["exerciseId"])
    .index("by_equipment", ["equipmentId"]),
  exerciseMuscles: defineTable({
    exerciseId: v.id("exercises"),
    muscleId: v.id("muscles"),
    role: v.union(
      v.literal("target"),
      v.literal("lengthening"),
      v.literal("synergist"),
      v.literal("stabilizer"),
    ),
  })
    .index("by_exercise", ["exerciseId", "role"])
    .index("by_muscle", ["muscleId", "role"])
    .index("by_exercise_and_muscle", ["exerciseId", "muscleId"]),
  videos: defineTable({
    position: v.number(),
    title: v.string(),
    link: v.string(),
    thumbnail: v.string(),
    clip: v.optional(v.string()),
    source: v.string(),
    sourceIcon: v.optional(v.string()),
    channel: v.string(),
    searchQuery: v.string(),
    searchDate: v.number(),
  })
    .index("by_search", ["searchQuery", "searchDate"])
    .index("by_position", ["searchQuery", "position"])
    .index("by_link", ["link"]),
  exerciseVideos: defineTable({
    exerciseId: v.id("exercises"),
    videoId: v.id("videos"),
  })
    .index("by_exercise", ["exerciseId"])
    .index("by_video", ["videoId"])
    .index("by_both", ["exerciseId", "videoId"]),
});

export default schema;
