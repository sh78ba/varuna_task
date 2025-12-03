import { Router, Request, Response } from 'express';
import { CreatePoolUseCase } from '../../../core/application/usecases/CreatePoolUseCase';
import { PoolRepository } from '../../../core/ports/PoolRepository';
import { ComplianceRepository } from '../../../core/ports/ComplianceRepository';

export function createPoolRoutes(
  poolRepository: PoolRepository,
  complianceRepository: ComplianceRepository
): Router {
  const router = Router();

  const createPoolUseCase = new CreatePoolUseCase(poolRepository, complianceRepository);

  // POST /pools - Create a new pool
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { year, members } = req.body;

      if (!year || !members || !Array.isArray(members)) {
        return res.status(400).json({ error: 'year and members array are required' });
      }

      const pool = await createPoolUseCase.execute({ year, members });
      return res.status(201).json(pool);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  });

  // GET /pools - Get pools by year
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { year } = req.query;

      if (!year) {
        return res.status(400).json({ error: 'year is required' });
      }

      const pools = await poolRepository.findByYear(parseInt(year as string));
      return res.json(pools);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // GET /pools/:id - Get pool by ID
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const pool = await poolRepository.findById(id);

      if (!pool) {
        return res.status(404).json({ error: 'Pool not found' });
      }

      return res.json(pool);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  return router;
}
