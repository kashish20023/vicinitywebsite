const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({ where: { role: 'BROKER' } }).then(u => {
  console.log(u ? u.email : 'No broker found');
  process.exit(0);
});
