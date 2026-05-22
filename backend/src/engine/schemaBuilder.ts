import { z } from 'zod';
import { EntityType } from './configParser';

export const buildZodSchemaForEntity = (entity: EntityType) => {
  const schemaShape: Record<string, any> = {};

  entity.fields.forEach(field => {
    let fieldSchema: any = z.any();

    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'password':
      case 'select':
        fieldSchema = z.string();
        if (field.required) {
          fieldSchema = fieldSchema.min(1, `${field.name} is required`);
        }
        break;
      case 'email':
        fieldSchema = z.string().email();
        if (!field.required) {
          fieldSchema = fieldSchema.optional().or(z.literal(''));
        }
        break;
      case 'number':
        fieldSchema = z.number().or(z.string().regex(/^\d+$/).transform(Number));
        if (!field.required) {
          fieldSchema = fieldSchema.optional();
        }
        break;
      case 'checkbox':
        fieldSchema = z.boolean().or(z.string().transform(v => v === 'true'));
        if (!field.required) {
          fieldSchema = fieldSchema.optional();
        }
        break;
      case 'date':
        fieldSchema = z.string().datetime().or(z.date());
        if (!field.required) {
          fieldSchema = fieldSchema.optional();
        }
        break;
      default:
        fieldSchema = z.any();
        break;
    }

    if (!field.required) {
      fieldSchema = fieldSchema.optional().nullable();
    }

    schemaShape[field.name] = fieldSchema;
  });

  // Catchall allows extra columns without failing. Missing required columns will fail.
  return z.object(schemaShape).catchall(z.any());
};
