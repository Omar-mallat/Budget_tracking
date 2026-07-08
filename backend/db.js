const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: __dirname + '/../.env' });

const prisma = new PrismaClient();

module.exports = prisma;
