import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../modules/categories/categoryController.js';

const categoryRouter = Router();
categoryRouter.use(requireAuth);

categoryRouter.get('/', listCategories);
categoryRouter.post('/', createCategory);
categoryRouter.put('/:id', updateCategory);
categoryRouter.delete('/:id', deleteCategory);

export default categoryRouter;

