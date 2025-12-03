import express, { Express } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

import { PrismaRouteRepository } from '../adapters/outbound/PrismaRouteRepository';
import { PrismaComplianceRepository } from '../adapters/outbound/PrismaComplianceRepository';
import { PrismaBankRepository } from '../adapters/outbound/PrismaBankRepositoryImpl';
import { PrismaPoolRepository } from '../adapters/outbound/PrismaPoolRepository';

import { createRouteRoutes } from '../adapters/inbound/http/routeRoutes';
import { createComplianceRoutes } from '../adapters/inbound/http/complianceRoutes';
import { createBankingRoutes } from '../adapters/inbound/http/bankingRoutes';
import { createPoolRoutes } from '../adapters/inbound/http/poolRoutes';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Repositories
const routeRepository = new PrismaRouteRepository(prisma);
const complianceRepository = new PrismaComplianceRepository(prisma);
const bankRepository = new PrismaBankRepository(prisma);
const poolRepository = new PrismaPoolRepository(prisma);

// Routes
app.use('/routes', createRouteRoutes(routeRepository));
app.use('/compliance', createComplianceRoutes(complianceRepository, bankRepository));
app.use('/banking', createBankingRoutes(bankRepository, complianceRepository));
app.use('/pools', createPoolRoutes(poolRepository, complianceRepository));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`⚓ FuelEU Maritime API server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export { app, prisma };
