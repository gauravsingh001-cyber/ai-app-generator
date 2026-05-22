import { Router } from 'express';
import multer from 'multer';
import { getRecords, createRecord, updateRecord, deleteRecord } from '../controllers/crud.controller';
import { importCsv } from '../controllers/csv.controller';
import { authenticate } from '../middleware/auth';
import { loadConfig } from '../engine/configParser';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Serve the schema config
router.get('/config', (req, res) => {
  const config = loadConfig();
  res.json(config);
});

// Generic dynamic CRUD routes
router.get('/:entity', authenticate, getRecords);
router.post('/:entity', authenticate, createRecord);
router.put('/:entity/:id', authenticate, updateRecord);
router.delete('/:entity/:id', authenticate, deleteRecord);

// CSV Upload
router.post('/:entity/upload', authenticate, upload.single('file'), importCsv);

export default router;
