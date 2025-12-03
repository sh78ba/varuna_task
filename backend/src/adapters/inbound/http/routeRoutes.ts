import { Router, Request, Response } from 'express';
import { GetRoutesUseCase } from '../../../core/application/usecases/GetRoutesUseCase';
import { SetBaselineUseCase } from '../../../core/application/usecases/SetBaselineUseCase';
import { ComputeComparisonUseCase } from '../../../core/application/usecases/ComputeComparisonUseCase';
import { RouteRepository } from '../../../core/ports/RouteRepository';

export function createRouteRoutes(routeRepository: RouteRepository): Router {
  const router = Router();

  const getRoutesUseCase = new GetRoutesUseCase(routeRepository);
  const setBaselineUseCase = new SetBaselineUseCase(routeRepository);
  const computeComparisonUseCase = new ComputeComparisonUseCase(routeRepository);

  // GET /routes - Get all routes with optional filters
  router.get('/', async (req: Request, res: Response) => {
    try {
      const filters = {
        vesselType: req.query.vesselType as string | undefined,
        fuelType: req.query.fuelType as string | undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
      };

      const routes = await getRoutesUseCase.execute(filters);
      res.json(routes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /routes/:routeId/baseline - Set a route as baseline
  router.post('/:routeId/baseline', async (req: Request, res: Response) => {
    try {
      const { routeId } = req.params;
      const route = await setBaselineUseCase.execute(routeId);
      res.json(route);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  // GET /routes/comparison - Get baseline vs comparison routes
  router.get('/comparison', async (req: Request, res: Response) => {
    try {
      const filters = {
        vesselType: req.query.vesselType as string | undefined,
        fuelType: req.query.fuelType as string | undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
      };

      const comparisons = await computeComparisonUseCase.execute(filters);
      res.json(comparisons);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
