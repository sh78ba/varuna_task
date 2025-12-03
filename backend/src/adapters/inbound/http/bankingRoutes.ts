import { Router, Request, Response } from 'express';
import { BankSurplusUseCase } from '../../../core/application/usecases/BankSurplusUseCase';
import { ApplyBankedUseCase } from '../../../core/application/usecases/ApplyBankedUseCase';
import { BankRepository } from '../../../core/ports/BankRepository';
import { ComplianceRepository } from '../../../core/ports/ComplianceRepository';

export function createBankingRoutes(
  bankRepository: BankRepository,
  complianceRepository: ComplianceRepository
): Router {
  const router = Router();

  const bankSurplusUseCase = new BankSurplusUseCase(bankRepository, complianceRepository);
  const applyBankedUseCase = new ApplyBankedUseCase(bankRepository, complianceRepository);

  // GET /banking/records - Get bank entries for a ship
  router.get('/records', async (req: Request, res: Response) => {
    try {
      const { shipId, year } = req.query;

      if (!shipId) {
        return res.status(400).json({ error: 'shipId is required' });
      }

      const records = year
        ? await bankRepository.findByShipAndYear(shipId as string, parseInt(year as string))
        : await bankRepository.findByShip(shipId as string);

      res.json(records);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /banking/bank - Bank positive CB
  router.post('/bank', async (req: Request, res: Response) => {
    try {
      const { shipId, year, amountGco2eq } = req.body;

      if (!shipId || !year || !amountGco2eq) {
        return res.status(400).json({ error: 'shipId, year, and amountGco2eq are required' });
      }

      const bankEntry = await bankSurplusUseCase.execute({
        shipId,
        year: parseInt(year),
        amountGco2eq: parseFloat(amountGco2eq),
      });

      res.status(201).json(bankEntry);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /banking/apply - Apply banked surplus
  router.post('/apply', async (req: Request, res: Response) => {
    try {
      const { shipId, year, amountGco2eq } = req.body;

      if (!shipId || !year || !amountGco2eq) {
        return res.status(400).json({ error: 'shipId, year, and amountGco2eq are required' });
      }

      const summary = await applyBankedUseCase.execute({
        shipId,
        year: parseInt(year),
        amountGco2eq: parseFloat(amountGco2eq),
      });

      res.json(summary);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
