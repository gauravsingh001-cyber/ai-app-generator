import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../db';
import { loadConfig } from '../engine/configParser';
import { buildZodSchemaForEntity } from '../engine/schemaBuilder';
import fs from 'fs';
import csvParser from 'csv-parser';
import { z } from 'zod';

export const importCsv = async (req: AuthRequest, res: Response) => {
  const entity = req.params.entity as string;
  const config = loadConfig();
  const entityConfig = config.entities.find(e => e.name === entity);

  if (!entityConfig) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: `Entity ${entity} not found` });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }

  const schema = buildZodSchemaForEntity(entityConfig);
  const results: any[] = [];
  const errors: any[] = [];
  let rowCount = 0;

  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on('data', (data) => {
      rowCount++;
      try {
        // Convert empty strings to undefined to let Zod handle optional fields
        const cleanedData: any = {};
        for (const key in data) {
          if (data[key] === '') {
            cleanedData[key] = undefined;
          } else {
            cleanedData[key] = data[key];
          }
        }
        const parsed = schema.parse(cleanedData);
        results.push(parsed);
      } catch (err) {
        if (err instanceof z.ZodError) {
          errors.push({ row: rowCount, issues: (err as any).errors });
        }
      }
    })
    .on('end', async () => {
      fs.unlinkSync(req.file!.path); // cleanup file

      if (results.length > 0) {
        try {
          await prisma.dynamicRecord.createMany({
            data: results.map(r => ({
              entity,
              data: r as any,
              userId: req.user?.id
            }))
          });
        } catch (dbError) {
          return res.status(500).json({ error: 'Database error during import' });
        }
      }

      res.json({
        success: true,
        imported: results.length,
        failed: errors.length,
        errors
      });
    });
};
