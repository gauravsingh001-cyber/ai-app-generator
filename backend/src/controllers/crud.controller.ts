import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../db';
import { loadConfig } from '../engine/configParser';
import { buildZodSchemaForEntity } from '../engine/schemaBuilder';
import { z } from 'zod';

const getEntityConfig = (entityName: string) => {
  const config = loadConfig();
  return config.entities.find(e => e.name === entityName);
};

export const getRecords = async (req: AuthRequest, res: Response) => {
  const entity = req.params.entity as string;
  const entityConfig = getEntityConfig(entity);

  if (!entityConfig) {
    return res.status(404).json({ error: `Entity ${entity} not found in config` });
  }

  try {
    const records = await prisma.dynamicRecord.findMany({
      where: {
        entity: entity,
        userId: req.user?.id
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(records.map(r => ({ id: r.id, ...r.data as any, createdAt: r.createdAt })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch records' });
  }
};

export const createRecord = async (req: AuthRequest, res: Response) => {
  const entity = req.params.entity as string;
  const entityConfig = getEntityConfig(entity);

  if (!entityConfig) {
    return res.status(404).json({ error: `Entity ${entity} not found in config` });
  }

  const schema = buildZodSchemaForEntity(entityConfig);

  try {
    const parsedData = schema.parse(req.body);

    const record = await prisma.dynamicRecord.create({
      data: {
        entity,
        data: parsedData as any,
        userId: req.user?.id
      }
    });

    res.status(201).json({ id: record.id, ...record.data as any, createdAt: record.createdAt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: (error as any).errors });
    }
    res.status(500).json({ error: 'Failed to create record' });
  }
};

export const updateRecord = async (req: AuthRequest, res: Response) => {
  const entity = req.params.entity as string;
  const id = req.params.id as string;
  const entityConfig = getEntityConfig(entity);

  if (!entityConfig) {
    return res.status(404).json({ error: `Entity ${entity} not found in config` });
  }

  const schema = buildZodSchemaForEntity(entityConfig);

  try {
    // Ensure ownership
    const existing = await prisma.dynamicRecord.findUnique({ where: { id } });
    if (!existing || existing.entity !== entity || existing.userId !== req.user?.id) {
      return res.status(404).json({ error: 'Record not found or access denied' });
    }

    // Partial validation for updates
    const parsedData = schema.partial().parse(req.body);
    
    // Merge existing data
    const newData = { ...(existing.data as object), ...parsedData };

    const record = await prisma.dynamicRecord.update({
      where: { id },
      data: {
        data: newData as any
      }
    });

    res.json({ id: record.id, ...record.data as any, updatedAt: record.updatedAt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: (error as any).errors });
    }
    res.status(500).json({ error: 'Failed to update record' });
  }
};

export const deleteRecord = async (req: AuthRequest, res: Response) => {
  const entity = req.params.entity as string;
  const id = req.params.id as string;

  try {
    const existing = await prisma.dynamicRecord.findUnique({ where: { id } });
    if (!existing || existing.entity !== entity || existing.userId !== req.user?.id) {
      return res.status(404).json({ error: 'Record not found or access denied' });
    }

    await prisma.dynamicRecord.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete record' });
  }
};
