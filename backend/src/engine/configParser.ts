import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const FieldSchema = z.object({
  name: z.string().catch('unknown_field'),
  type: z.enum(['text', 'textarea', 'number', 'email', 'password', 'select', 'checkbox', 'date']).catch('text' as any),
  required: z.boolean().optional().default(false),
  options: z.array(z.string()).optional(),
  label: z.record(z.string(), z.string()).optional()
}).catchall(z.any()); // Accept unknown fields without crashing

const EntitySchema = z.object({
  name: z.string().catch('unknown_entity'),
  tableName: z.string().optional(),
  fields: z.array(FieldSchema).catch([])
}).catchall(z.any());

export const AppConfigSchema = z.object({
  appName: z.string().default('Untitled App'),
  entities: z.array(EntitySchema).default([])
}).catchall(z.any());

export type AppConfigType = z.infer<typeof AppConfigSchema>;
export type EntityType = z.infer<typeof EntitySchema>;
export type FieldType = z.infer<typeof FieldSchema>;

let cachedConfig: AppConfigType | null = null;

export const loadConfig = (): AppConfigType => {
  if (cachedConfig) return cachedConfig;
  try {
    const configPath = path.join(__dirname, '../config/appConfig.json');
    const rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Validate config
    const result = AppConfigSchema.safeParse(rawConfig);
    if (!result.success) {
      console.warn("Config parsing yielded warnings. Proceeding with safe fallback.");
      // We could use safe fallbacks here
    }
    
    cachedConfig = AppConfigSchema.parse(rawConfig);
    return cachedConfig;
  } catch (err) {
    console.error("Failed to load config, using fallback.", err);
    return { appName: 'Error Loading Config', entities: [] };
  }
};
