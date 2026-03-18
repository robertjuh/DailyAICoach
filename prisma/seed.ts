import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create test user — update supabase_id to match your real Supabase auth user
  const user = await prisma.user.upsert({
    where: { email: "test@dailycoach.app" },
    update: {},
    create: {
      supabase_id: "REPLACE_WITH_YOUR_SUPABASE_AUTH_USER_ID",
      email: "test@dailycoach.app",
      name: "Test User",
      onboarding_done: true,
      timezone: "Europe/Amsterdam",
    },
  });

  console.log("Created user:", user.id);

  // Create MORNING routine with 3 items
  const routine = await prisma.routine.create({
    data: {
      user_id: user.id,
      name: "Morning Routine",
      type: "MORNING",
      is_active: true,
      items: {
        create: [
          { name: "Meditate", duration_minutes: 10, sort_order: 0 },
          { name: "Read", duration_minutes: 20, sort_order: 1 },
          { name: "Exercise", duration_minutes: 30, sort_order: 2 },
        ],
      },
    },
  });

  console.log("Created routine:", routine.id);

  // Create 2 goals
  const goals = await prisma.goal.createMany({
    data: [
      { user_id: user.id, title: "Learn to code", is_active: true },
      { user_id: user.id, title: "Build a healthy morning routine", is_active: true },
    ],
  });

  console.log("Created goals:", goals.count);

  // Seed memory entries for goals
  await prisma.memoryEntry.createMany({
    data: [
      {
        user_id: user.id,
        category: "GOAL",
        content: "User wants to learn to code",
        source: "onboarding",
      },
      {
        user_id: user.id,
        category: "GOAL",
        content: "User wants to build a healthy morning routine",
        source: "onboarding",
      },
    ],
  });

  console.log("Seeded memory entries for goals");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
