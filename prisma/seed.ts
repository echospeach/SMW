import { hash } from "bcryptjs";
import { PlatformId } from "../src/generated/prisma/enums";
import { prisma } from "../src/lib/prisma";

const DEMO_EMAIL = "demo@smw.app";
const DEMO_PASSWORD = "password123";

const INITIAL_CONNECTIONS: Record<PlatformId, boolean> = {
  FACEBOOK: true,
  INSTAGRAM: true,
  X: true,
  LINKEDIN: false,
  TIKTOK: false,
  YOUTUBE: false,
};

const HANDLES: Record<PlatformId, string> = {
  FACEBOOK: "@smw.page",
  INSTAGRAM: "@smw.ig",
  X: "@smw_hq",
  LINKEDIN: "SMW Inc.",
  TIKTOK: "@smw",
  YOUTUBE: "SMW Channel",
};

const INITIAL_AUTOMATION: Record<PlatformId, { enabled: boolean; times: string[] }> = {
  FACEBOOK: { enabled: true, times: ["09:00", "13:30", "19:00"] },
  INSTAGRAM: { enabled: true, times: ["08:30", "17:00"] },
  X: { enabled: true, times: ["09:00", "12:00", "16:00"] },
  LINKEDIN: { enabled: false, times: ["10:00"] },
  TIKTOK: { enabled: false, times: ["18:00"] },
  YOUTUBE: { enabled: false, times: ["15:00"] },
};

async function main() {
  const passwordHash = await hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      plan: "STARTER",
      settings: { create: { autoTrending: true } },
    },
  });

  for (const platformId of Object.values(PlatformId)) {
    const connected = INITIAL_CONNECTIONS[platformId];
    await prisma.socialConnection.upsert({
      where: { userId_platformId: { userId: user.id, platformId } },
      update: {},
      create: {
        userId: user.id,
        platformId,
        connected,
        handle: connected ? HANDLES[platformId] : null,
        connectedAt: connected ? new Date() : null,
      },
    });

    const automation = INITIAL_AUTOMATION[platformId];
    await prisma.automationRule.upsert({
      where: { userId_platformId: { userId: user.id, platformId } },
      update: {},
      create: {
        userId: user.id,
        platformId,
        enabled: automation.enabled,
        times: automation.times,
      },
    });
  }

  console.log(`Seeded demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
