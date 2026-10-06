import { PrismaClient } from './backend/node_modules/@prisma/client/index.js';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Querying PostgreSQL Database directly via Prisma...\n');

  const banners = await prisma.banner.findMany({
    include: {
      coupon: true,
      leads: true,
    },
  });

  console.log(`Found ${banners.length} Banner(s) in PostgreSQL Database:`);
  console.dir(banners, { depth: null });

  await prisma.$disconnect();
}

checkDatabase().catch((e) => {
  console.error(e);
  process.exit(1);
});
