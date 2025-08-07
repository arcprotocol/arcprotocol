/**
 * Schema to TypeScript Types Generator
 * 
 * This utility converts the ARC Protocol OpenAPI schema to TypeScript types.
 */

import fs from 'fs/promises';
import path from 'path';
import * as yaml from 'js-yaml';
import { OpenAPIV3 } from 'openapi-types';

// Paths
const SCHEMA_PATH = path.join(__dirname, '../../specification/schema/arc-schema.yaml');
const OUTPUT_PATH = path.join(__dirname, '../types/generated.ts');

// Type mapping
const typeMapping: Record<string, string> = {
  'integer': 'number',
  'number': 'number',
  'string': 'string',
  'boolean': 'boolean',
  'array': 'Array',
  'object': 'Record<string, any>'
};

/**
 * Convert an OpenAPI schema to TypeScript type
 */
function schemaToType(schema: any, name: string, components: OpenAPIV3.ComponentsObject): string {
  if (!schema) return 'any';
  
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop() || '';
    return refName;
  }
  
  if (schema.enum) {
    return schema.enum.map((e: string) => `'${e}'`).join(' | ');
  }
  
  if (schema.type === 'array' && schema.items) {
    const itemType = schemaToType(schema.items, `${name}Item`, components);
    return `${itemType}[]`;
  }
  
  if (schema.type === 'object' || schema.properties) {
    let result = '{\n';
    
    for (const [propName, propSchema] of Object.entries(schema.properties || {})) {
      const required = (schema.required || []).includes(propName);
      const propType = schemaToType(propSchema, `${name}${capitalizeFirst(propName)}`, components);
      const description = (propSchema as any).description ? 
        `/** ${(propSchema as any).description} */\n    ` : '';
      
      result += `    ${description}${propName}${required ? '' : '?'}: ${propType};\n`;
    }
    
    result += '}';
    return result;
  }
  
  return typeMapping[schema.type] || 'any';
}

/**
 * Convert the first character of a string to uppercase
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate TypeScript types from OpenAPI schema
 */
async function generateTypes(): Promise<void> {
  try {
    // Read schema
    const schemaContent = await fs.readFile(SCHEMA_PATH, 'utf-8');
    const schema = yaml.load(schemaContent) as OpenAPIV3.Document;
    
    // Output
    let output = '/**\n';
    output += ' * ARC Protocol - Generated TypeScript types\n';
    output += ' * Generated from OpenAPI schema\n';
    output += ' * DO NOT EDIT MANUALLY\n';
    output += ' */\n\n';
    
    // Generate enums
    const schemas = schema.components?.schemas || {};
    
    for (const [name, schemaObj] of Object.entries(schemas)) {
      if ('enum' in schemaObj) {
        output += `export enum ${name} {\n`;
        (schemaObj.enum || []).forEach((value: string) => {
          output += `  ${value} = '${value}',\n`;
        });
        output += '}\n\n';
      }
    }
    
    // Generate interfaces
    for (const [name, schemaObj] of Object.entries(schemas)) {
      if (!('enum' in schemaObj)) {
        const description = schemaObj.description ? 
          `/**\n * ${schemaObj.description}\n */\n` : '';
        
        output += `${description}export interface ${name} ${schemaToType(schemaObj, name, schema.components!)}\n\n`;
      }
    }
    
    // Write output
    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await fs.writeFile(OUTPUT_PATH, output);
    
    console.log(`Generated TypeScript types at ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('Error generating types:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  generateTypes();
}

export { generateTypes };