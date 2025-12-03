import { Router, Request, Response } from 'express';
import { ComputeCBUseCase } from '../../../core/application/usecases/ComputeCBUseCase';
import { GetAdjustedCBUseCase } from '../../../core/application/usecases/GetAdjustedCBUseCase';
import { ComplianceRepository } from '../../../core/ports/ComplianceRepository';
import { BankRepository } from '../../../core/ports/BankRepository';

export function createComplianceRoutes(
  complianceRepository: ComplianceRepository,
  bankRepository: BankRepository
): Router {
  const router = Router();

  const computeCBUseCase = new ComputeCBUseCase(complianceRepository);
  const getAdjustedCBUseCase = new GetAdjustedCBUseCase(complianceRepository, bankRepository);

  // GET /compliance/cb - Get or compute compliance balance
  router.get('/cb', async (req: Request, res: Response) => {
    try {
      const { shipId, year } = req.query;

      if (!shipId || !year) {
        return res.status(400).json({ error: 'shipId and year are required' });
      }

      // For this endpoint, we'll compute CB based on provided data
      // In real scenario, this would fetch actual vessel data
      const actualIntensity = parseFloat(req.query.actualIntensity as string) || 90.0;
      const fuelConsumption = parseFloat(req.query.fuelConsumption as string) || 5000;

      const cb = await computeCBUseCase.execute({
        shipId: shipId as string,
        year: parseInt(year as string),
        actualIntensity,
        fuelConsumption,
      });

      res.json(cb);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /compliance/adjusted-cb - Get adjusted compliance balance
  router.get('/adjusted-cb', async (req: Request, res: Response) => {
    try {
      const { shipId, year } = req.query;

      if (!shipId || !year) {
        return res.status(400).json({ error: 'shipId and year are required' });
      }

      const adjustedCb = await getAdjustedCBUseCase.execute(
        shipId as string,
        parseInt(year as string)
      );

      res.json(adjustedCb);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  return router;
}
