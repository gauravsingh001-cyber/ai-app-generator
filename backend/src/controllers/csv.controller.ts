import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../db';
import { loadConfig } from '../engine/configParser';
import { buildZodSchemaForEntity } from '../engine/schemaBuilder';
import fs from 'fs';
import csvParser from 'csv-parser';
import { z } from 'zod';

export const importCsv = async (
  req: AuthRequest,
  res: Response
) => {

  const entity = req.params.entity as string;

  const config = loadConfig();

  const entityConfig = config.entities.find(
    e => e.name === entity
  );

  // =========================
  // ENTITY CHECK
  // =========================

  if (!entityConfig) {

    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(404).json({
      error: `Entity ${entity} not found`
    });
  }

  // =========================
  // FILE CHECK
  // =========================

  if (!req.file) {

    return res.status(400).json({
      error: 'No CSV file uploaded'
    });
  }

  // =========================
  // BUILD ZOD SCHEMA
  // =========================

  const schema = buildZodSchemaForEntity(entityConfig);

  const results: any[] = [];

  const errors: any[] = [];

  let rowCount = 0;

  // =========================
  // READ CSV
  // =========================

  fs.createReadStream(req.file.path)

    .pipe(csvParser())

    .on('data', (data) => {

      rowCount++;

      try {

        const cleanedData: any = {};

        // =========================
        // CLEAN + TYPE CONVERSION
        // =========================

        for (const field of entityConfig.fields) {

          let value = data[field.name];

          // Empty string handling
          if (value === '') {
            value = undefined;
          }

          // =========================
          // NUMBER CONVERSION
          // =========================

          if (
            field.type === 'number' &&
            value !== undefined
          ) {

            value = Number(value);

          }

          // =========================
          // CHECKBOX CONVERSION
          // =========================

          if (
            field.type === 'checkbox' &&
            value !== undefined
          ) {

            value =
              value === 'true' ||
              value === 'TRUE' ||
              value === '1';

          }

          cleanedData[field.name] = value;
        }

        // =========================
        // VALIDATE
        // =========================

        const parsed = schema.parse(cleanedData);

        results.push(parsed);

      } catch (err) {

        if (err instanceof z.ZodError) {

          errors.push({

            row: rowCount,

            issues: err.issues

          });
        }
      }
    })

    // =========================
    // CSV FINISHED
    // =========================

    .on('end', async () => {

      // Delete uploaded file
      fs.unlinkSync(req.file!.path);

      console.log('VALID RECORDS =>', results);

      console.log('VALIDATION ERRORS =>', errors);

      try {

        // =========================
        // SAVE TO DATABASE
        // =========================

        if (results.length > 0) {

          await prisma.dynamicRecord.createMany({

            data: results.map(r => ({

              entity,

              data: r,

              userId: req.user?.id

            }))
          });
        }

        // =========================
        // SUCCESS RESPONSE
        // =========================

        return res.json({

          success: true,

          imported: results.length,

          failed: errors.length,

          errors

        });

      } catch (dbError) {

        console.error('DATABASE ERROR =>', dbError);

        return res.status(500).json({

          error: 'Database error during import'

        });
      }
    });
};