const { PrismaClient } = require('c:/Users/shubham/fairbnb--new/backend/node_modules/@prisma/client');

async function provision() {
  const adminPrisma = new PrismaClient({
    datasources: {
      db: { url: 'postgresql://postgres:Password%40246@localhost:5432/postgres?schema=public' }
    }
  });

  try {
    await adminPrisma.$connect();
    console.log('[DB Provision] Connected to PostgreSQL server on localhost:5432.');

    const dbs = await adminPrisma.$queryRawUnsafe("SELECT datname FROM pg_database WHERE datname = 'studioi_dev'");
    if (!dbs || dbs.length === 0) {
      await adminPrisma.$executeRawUnsafe('CREATE DATABASE studioi_dev');
      console.log('[DB Provision] Successfully created database: studioi_dev');
    } else {
      console.log('[DB Provision] Database studioi_dev already exists.');
    }
  } catch (err) {
    console.error('[DB Provision] Error:', err.message);
    process.exit(1);
  } finally {
    await adminPrisma.$disconnect();
  }
}

provision();
