import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function clearDatabase() {
  // Delete in correct order (foreign key constraints)
  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.bankEntry.deleteMany();
  await prisma.shipCompliance.deleteMany();
  await prisma.route.deleteMany();
}

export async function seedTestData() {
  // Use upsert to handle both creation and reset
  await prisma.route.upsert({
    where: { routeId: 'TEST001' },
    create: {
      routeId: 'TEST001',
      vesselType: 'Container',
      fuelType: 'HFO',
      year: 2024,
      ghgIntensity: 91.0,
      fuelConsumption: 5000,
      distance: 10000,
      totalEmissions: 450000,
      isBaseline: false,
    },
    update: {
      isBaseline: false, // Reset baseline
    },
  });

  await prisma.route.upsert({
    where: { routeId: 'TEST002' },
    create: {
      routeId: 'TEST002',
      vesselType: 'Container',
      fuelType: 'LNG',
      year: 2024,
      ghgIntensity: 85.0,
      fuelConsumption: 4500,
      distance: 10000,
      totalEmissions: 400000,
      isBaseline: false,
    },
    update: {
      isBaseline: false, // Reset baseline
    },
  });

  // Reset ship compliance records to original values
  await prisma.shipCompliance.upsert({
    where: { shipId_year: { shipId: 'TESTSHIP001', year: 2024 } },
    create: {
      shipId: 'TESTSHIP001',
      year: 2024,
      cbGco2eq: 15000,
    },
    update: {
      cbGco2eq: 15000, // Reset to original value
    },
  });

  await prisma.shipCompliance.upsert({
    where: { shipId_year: { shipId: 'TESTSHIP002', year: 2024 } },
    create: {
      shipId: 'TESTSHIP002',
      year: 2024,
      cbGco2eq: -8000,
    },
    update: {
      cbGco2eq: -8000, // Reset to original value
    },
  });

  await prisma.shipCompliance.upsert({
    where: { shipId_year: { shipId: 'TESTSHIP003', year: 2024 } },
    create: {
      shipId: 'TESTSHIP003',
      year: 2024,
      cbGco2eq: 10000,
    },
    update: {
      cbGco2eq: 10000, // Reset to original value
    },
  });
}

beforeAll(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await clearDatabase();
  await prisma.$disconnect();
});
