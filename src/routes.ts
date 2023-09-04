// src/routes.ts
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.send('Hello, Express with TypeScript!');
});

export default router;