const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findUnique({where: {email: 'AnotherNewCoHost@fairbnb.com'}}).then(console.log);
prisma.coHostRelationship.findFirst({where: {coHostUser: {email: 'AnotherNewCoHost@fairbnb.com'}}}).then(console.log);
