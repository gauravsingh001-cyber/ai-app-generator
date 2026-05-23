import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../db';
import { loadConfig } from '../engine/configParser';
import { buildZodSchemaForEntity } from '../engine/schemaBuilder';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

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
    return res.json(records.map(r => ({ id: r.id, ...r.data as any, createdAt: r.createdAt })));
  } catch (error) {
    console.error("Prisma getRecords error, falling back to file storage:", (error as any)?.message || error);
    // fallback to file storage
    try {
      const fallbackDir = path.join(__dirname, '../../data');
      if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true });
      const fallbackPath = path.join(fallbackDir, 'fallbackRecords.json');
      if (!fs.existsSync(fallbackPath)) fs.writeFileSync(fallbackPath, JSON.stringify([]));
      const raw = fs.readFileSync(fallbackPath, 'utf8');
      const all: any[] = JSON.parse(raw || '[]');
      const filtered = all.filter(r => r.entity === entity && r.userId === req.user?.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.json(filtered.map(r => ({ id: r.id, ...r.data, createdAt: r.createdAt })));
    } catch (err) {
      console.error('Fallback read failed:', err);
      return res.status(500).json({ error: 'Failed to fetch records' });
    }
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

    // Try DB insert first
    try {
      const record = await prisma.dynamicRecord.create({
        data: {
          entity,
          data: parsedData as any,
          userId: req.user?.id
        }
      });
      return res.status(201).json({ id: record.id, ...record.data as any, createdAt: record.createdAt });
    } catch (dbErr) {
      console.error('Prisma create error, falling back to file storage:', (dbErr as any)?.message || dbErr);
      // Fallback: write to local JSON
      try {
        const fallbackDir = path.join(__dirname, '../../data');
        if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true });
        const fallbackPath = path.join(fallbackDir, 'fallbackRecords.json');
        if (!fs.existsSync(fallbackPath)) fs.writeFileSync(fallbackPath, JSON.stringify([]));
        const raw = fs.readFileSync(fallbackPath, 'utf8');
        const all: any[] = JSON.parse(raw || '[]');
        const newRecord = {
          id: randomUUID(),
          entity,
          data: parsedData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: req.user?.id || null
        };
        all.push(newRecord);
        fs.writeFileSync(fallbackPath, JSON.stringify(all, null, 2));
        return res.status(201).json({ id: newRecord.id, ...newRecord.data, createdAt: newRecord.createdAt });
      } catch (fileErr) {
        console.error('Fallback write failed:', fileErr);
        throw dbErr;
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: (error as any).errors });
    }
    console.error('createRecord unexpected error:', error);
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
    // Try DB update first
    try {
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

      return res.json({ id: record.id, ...record.data as any, updatedAt: record.updatedAt });
    } catch (dbErr) {
      console.error('Prisma update error, falling back to file storage:', (dbErr as any)?.message || dbErr);
      // Fallback to file
      try {
        const fallbackDir = path.join(__dirname, '../../data');
        const fallbackPath = path.join(fallbackDir, 'fallbackRecords.json');
        if (!fs.existsSync(fallbackPath)) return res.status(500).json({ error: 'Failed to update record' });
        const raw = fs.readFileSync(fallbackPath, 'utf8');
        const all: any[] = JSON.parse(raw || '[]');
        const idx = all.findIndex(r => r.id === id && r.entity === entity && r.userId === req.user?.id);
        if (idx === -1) return res.status(404).json({ error: 'Record not found or access denied' });
        const parsedData = schema.partial().parse(req.body);
        const newData = { ...(all[idx].data || {}), ...parsedData };
        all[idx].data = newData;
        all[idx].updatedAt = new Date().toISOString();
        fs.writeFileSync(fallbackPath, JSON.stringify(all, null, 2));
        return res.json({ id: all[idx].id, ...all[idx].data, updatedAt: all[idx].updatedAt });
      } catch (fileErr) {
        console.error('Fallback update failed:', fileErr);
        return res.status(500).json({ error: 'Failed to update record' });
      }
    }
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
    try {
      const existing = await prisma.dynamicRecord.findUnique({ where: { id } });
      if (!existing || existing.entity !== entity || existing.userId !== req.user?.id) {
        return res.status(404).json({ error: 'Record not found or access denied' });
      }

      await prisma.dynamicRecord.delete({ where: { id } });
      return res.json({ success: true });
    } catch (dbErr) {
      console.error('Prisma delete error, falling back to file storage:', (dbErr as any)?.message || dbErr);
      try {
        const fallbackDir = path.join(__dirname, '../../data');
        const fallbackPath = path.join(fallbackDir, 'fallbackRecords.json');
        if (!fs.existsSync(fallbackPath)) return res.status(500).json({ error: 'Failed to delete record' });
        const raw = fs.readFileSync(fallbackPath, 'utf8');
        let all: any[] = JSON.parse(raw || '[]');
        const idx = all.findIndex(r => r.id === id && r.entity === entity && r.userId === req.user?.id);
        if (idx === -1) return res.status(404).json({ error: 'Record not found or access denied' });
        all.splice(idx, 1);
        fs.writeFileSync(fallbackPath, JSON.stringify(all, null, 2));
        return res.json({ success: true });
      } catch (fileErr) {
        console.error('Fallback delete failed:', fileErr);
        return res.status(500).json({ error: 'Failed to delete record' });
      }
    }
  } catch (error) {
    console.error('deleteRecord unexpected error:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
};
