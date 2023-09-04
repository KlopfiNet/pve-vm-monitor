// src/routes.ts
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.send('Hello, I am alive!');
});

// Start a watcher for this VM
router.post('/view/:id', (req, res) => {
  
})

export default router;