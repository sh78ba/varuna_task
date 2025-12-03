import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.bankEntry.deleteMany();
  await prisma.shipCompliance.deleteMany();
  await prisma.route.deleteMany();

  // Seed routes with the provided test data
  const routes = await prisma.route.createMany({
    data: [
      {
        routeId: 'R001',
        vesselType: 'Container',
        fuelType: 'HFO',
        year: 2024,
        ghgIntensity: 91.0,
        fuelConsumption: 5000,
        distance: 12000,
        totalEmissions: 4500,
        isBaseline: true, // Set R001 as baseline
      },
      {
        routeId: 'R002',
        vesselType: 'BulkCarrier',
        fuelType: 'LNG',
        year: 2024,
        ghgIntensity: 88.0,
        fuelConsumption: 4800,
        distance: 11500,
        totalEmissions: 4200,
        isBaseline: false,
      },
      {
        routeId: 'R003',
        vesselType: 'Tanker',
        fuelType: 'MGO',
        year: 2024,
        ghgIntensity: 93.5,
        fuelConsumption: 5100,
        distance: 12500,
        totalEmissions: 4700,
        isBaseline: false,
      },
      {
        routeId: 'R004',
        vesselType: 'RoRo',
        fuelType: 'HFO',
        year: 2025,
        ghgIntensity: 89.2,
        fuelConsumption: 4900,
        distance: 11800,
        totalEmissions: 4300,
        isBaseline: false,
      },
      {
        routeId: 'R005',
        vesselType: 'Container',
        fuelType: 'LNG',
        year: 2025,
        ghgIntensity: 90.5,
        fuelConsumption: 4950,
        distance: 11900,
        totalEmissions: 4400,
        isBaseline: false,
      },
    ],
  });

  console.log(`Created ${routes.count} routes`);

  // Seed comprehensive compliance balance records for testing
  // Cover years 2024, 2025, 2026 and ships SHIP001-SHIP004
  await prisma.shipCompliance.createMany({
    data: [
      // Year 2024
      { shipId: 'SHIP001', year: 2024, cbGco2eq: 15000 },  // Surplus
      { shipId: 'SHIP002', year: 2024, cbGco2eq: -8000 },  // Deficit
      { shipId: 'SHIP003', year: 2024, cbGco2eq: 12000 },  // Surplus
      { shipId: 'SHIP004', year: 2024, cbGco2eq: -5000 },  // Deficit
      // Year 2025
      { shipId: 'SHIP001', year: 2025, cbGco2eq: 18000 },  // Surplus
      { shipId: 'SHIP002', year: 2025, cbGco2eq: -6000 },  // Deficit
      { shipId: 'SHIP003', year: 2025, cbGco2eq: 14000 },  // Surplus
      { shipId: 'SHIP004', year: 2025, cbGco2eq: -7000 },  // Deficit
      // Year 2026
      { shipId: 'SHIP001', year: 2026, cbGco2eq: 20000 },  // Surplus
      { shipId: 'SHIP002', year: 2026, cbGco2eq: -4000 },  // Deficit
      { shipId: 'SHIP003', year: 2026, cbGco2eq: 16000 },  // Surplus
      { shipId: 'SHIP004', year: 2026, cbGco2eq: -9000 },  // Deficit
    ],
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
