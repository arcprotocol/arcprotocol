/**
 * OpenAPI to OpenRPC Schema Converter
 * 
 * This utility converts the ARC Protocol OpenAPI schema to OpenRPC format.
 */

import fs from 'fs/promises';
import path from 'path';
import * as yaml from 'js-yaml';
import { OpenAPIV3 } from 'openapi-types';

// Paths
const OPENAPI_SCHEMA_PATH = path.join(__dirname, '../../spec/arc/v1/schema/arc-schema.yaml');
const OPENRPC_OUTPUT_PATH = path.join(__dirname, '../../spec/arc/v1/schema/arc-openrpc.json');

/**
 * Convert OpenAPI components to OpenRPC schemas
 */
function convertComponents(components: OpenAPIV3.ComponentsObject): any {
  const schemas: any = {};
  
  // Convert schemas
  for (const [name, schema] of Object.entries(components.schemas || {})) {
    schemas[name] = convertSchema(schema);
  }
  
  return {
    schemas,
    contentDescriptors: {
      arcRequest: {
        name: 'arcRequest',
        schema: {
          type: 'object',
          properties: {
            arc: {
              type: 'string',
              enum: ['1.0']
            },
            id: {
              type: ['string', 'integer']
            },
            method: {
              type: 'string'
            },
            requestAgent: {
              type: 'string'
            },
            targetAgent: {
              type: 'string'
            },
            params: {
              type: 'object'
            },
            traceId: {
              type: 'string'
            }
          },
          required: ['arc', 'id', 'method', 'requestAgent', 'targetAgent', 'params']
        },
        description: 'Standard ARC protocol request format'
      },
      arcResponse: {
        name: 'arcResponse',
        schema: {
          type: 'object',
          properties: {
            arc: {
              type: 'string',
              enum: ['1.0']
            },
            id: {
              type: ['string', 'integer']
            },
            responseAgent: {
              type: 'string'
            },
            targetAgent: {
              type: 'string'
            },
            result: {
              type: ['object', 'null']
            },
            error: {
              type: ['object', 'null'],
              properties: {
                code: {
                  type: 'integer'
                },
                message: {
                  type: 'string'
                },
                details: {
                  type: ['object', 'array', 'string', 'number', 'boolean', 'null']
                }
              },
              required: ['code', 'message']
            },
            traceId: {
              type: 'string'
            }
          },
          required: ['arc', 'id', 'responseAgent', 'targetAgent']
        },
        description: 'Standard ARC protocol response format'
      }
    },
    examples: {
      taskCreateExample: {
        name: 'Create a document analysis task',
        summary: 'Create a new task to analyze a document',
        value: {
          initialMessage: {
            role: 'user',
            parts: [
              {
                type: 'TextPart',
                content: 'Analyze the uploaded financial report for key insights'
              },
              {
                type: 'FilePart',
                content: 'base64encodedpdf...',
                mimeType: 'application/pdf',
                filename: 'Q4-2024-Report.pdf'
              }
            ]
          },
          priority: 'HIGH',
          metadata: {
            deadline: '2024-01-15T17:00:00Z',
            userId: 'user-123'
          }
        }
      }
    }
  };
}

/**
 * Convert OpenAPI schema to OpenRPC schema
 */
function convertSchema(schema: any): any {
  if (!schema) return {};
  
  // Handle references
  if (schema.$ref) {
    return { $ref: schema.$ref };
  }
  
  // Handle arrays
  if (schema.type === 'array' && schema.items) {
    return {
      type: 'array',
      items: convertSchema(schema.items)
    };
  }
  
  // Pass through most properties
  const result: any = {};
  
  // Copy standard properties
  ['type', 'properties', 'required', 'enum', 'format', 'description', 
   'minimum', 'maximum', 'minLength', 'maxLength', 'default', 'additionalProperties'].forEach(prop => {
    if (prop in schema) {
      result[prop] = schema[prop];
    }
  });
  
  // Convert nested properties if they exist
  if (result.properties) {
    for (const [propName, propSchema] of Object.entries(result.properties)) {
      result.properties[propName] = convertSchema(propSchema as any);
    }
  }
  
  return result;
}

/**
 * Convert OpenAPI paths to OpenRPC methods
 */
function convertPathsToMethods(paths: OpenAPIV3.PathsObject): any[] {
  const methods: any[] = [];
  
  // Map of ARC methods to their OpenAPI path patterns
  const arcMethods = {
    'task.create': '/arc/task.create',
    'task.send': '/arc/task.send',
    'task.info': '/arc/task.info',
    'task.cancel': '/arc/task.cancel',
    'task.subscribe': '/arc/task.subscribe',
    'task.notification': '/arc/task.notification',
    'chat.start': '/arc/chat.start',
    'chat.message': '/arc/chat.message',
    'chat.end': '/arc/chat.end'
  };
  
  // Standard error codes
  const errorCodes: Record<string, { code: number, message: string }[]> = {
    'task.create': [
      { code: -32602, message: 'Invalid parameters' },
      { code: -41002, message: 'Agent not available' },
      { code: -44003, message: 'Insufficient OAuth2 scope' }
    ],
    'task.send': [
      { code: -42001, message: 'Task not found' },
      { code: -42002, message: 'Task already completed' },
      { code: -42003, message: 'Task already canceled' }
    ],
    'task.info': [
      { code: -42001, message: 'Task not found' }
    ],
    'task.cancel': [
      { code: -42001, message: 'Task not found' },
      { code: -42002, message: 'Task already completed' },
      { code: -42003, message: 'Task already canceled' }
    ],
    'task.subscribe': [
      { code: -42001, message: 'Task not found' }
    ],
    'chat.start': [
      { code: -43006, message: 'Chat buffer overflow' },
      { code: -43004, message: 'Chat participant limit exceeded' }
    ],
    'chat.message': [
      { code: -43001, message: 'Chat not found' },
      { code: -43002, message: 'Chat already closed' },
      { code: -43005, message: 'Invalid chat message' }
    ],
    'chat.end': [
      { code: -43001, message: 'Chat not found' },
      { code: -43002, message: 'Chat already closed' }
    ],
    'task.notification': []
  };
  
  // Method descriptions
  const methodDescriptions: Record<string, string> = {
    'task.create': 'Create a new asynchronous task with an agent. Use when you want to delegate work that may take time to complete (e.g., document analysis, report generation).',
    'task.send': 'Send additional data to a task. Only used when the task status is INPUT_REQUIRED - meaning the agent needs more information from you to continue processing the task.',
    'task.info': 'Get comprehensive information about a task, including its status, conversation history, and any generated artifacts.',
    'task.cancel': 'Cancel a running task before completion. Use when you no longer need the task results or want to stop processing.',
    'task.subscribe': 'Subscribe to receive webhook notifications about task status changes. Use when you want to be notified automatically instead of polling with task.info.',
    'chat.start': 'Begin a real-time conversation with an agent, including the first message. Use for interactive scenarios like customer support, collaborative editing, or live assistance.',
    'chat.message': 'Send follow-up messages in an active chat conversation. Used when chat history is preserved by the server. Requires a valid chatId to maintain context between exchanges.',
    'chat.end': 'Terminate an active chat conversation. Used only for chats with preserved history. Requires a valid chatId to identify which persistent chat to close.',
    'task.notification': 'Sent by the processing agent to notify about task progress, completion, or status changes. This is a fire-and-forget method where the sender doesn\'t expect or process the response beyond basic HTTP acknowledgment.'
  };
  
  // Method categories
  const methodTags: Record<string, string[]> = {
    'task.create': ['Task Methods'],
    'task.send': ['Task Methods'],
    'task.info': ['Task Methods'],
    'task.cancel': ['Task Methods'],
    'task.subscribe': ['Task Methods'],
    'chat.start': ['Chat Methods'],
    'chat.message': ['Chat Methods'],
    'chat.end': ['Chat Methods'],
    'task.notification': ['Notification Methods']
  };
  
  // Create an RPC method for each ARC method
  for (const [methodName, path] of Object.entries(arcMethods)) {
    // Find the matching OpenAPI path
    const pathObj = paths[path];
    if (!pathObj || !pathObj.post) continue;
    
    // Get the operation
    const op = pathObj.post;
    
    // Create the method
    const method: any = {
      name: methodName,
      summary: op.summary || methodName,
      description: methodDescriptions[methodName] || op.description,
      paramStructure: 'by-name',
      params: [],
      result: {
        name: getResultName(methodName),
        schema: getResultSchema(methodName),
        description: getResultDescription(methodName)
      },
      errors: errorCodes[methodName] || [],
      tags: methodTags[methodName].map(name => ({ name }))
    };
    
    // Add parameters based on request body schema
    if (op.requestBody) {
      const content = (op.requestBody as OpenAPIV3.RequestBodyObject).content;
      const schema = content['application/arc+json']?.schema as OpenAPIV3.SchemaObject;
      
      if (schema && schema.properties) {
        // Convert schema properties to RPC params
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          method.params.push({
            name: propName,
            required: (schema.required || []).includes(propName),
            schema: convertSchema(propSchema),
            description: (propSchema as OpenAPIV3.SchemaObject).description
          });
        }
      }
    }
    
    methods.push(method);
  }
  
  return methods;
}

/**
 * Get result name based on method
 */
function getResultName(method: string): string {
  if (method.startsWith('task.')) {
    if (method === 'task.subscribe') return 'subscriptionResult';
    if (method === 'task.send' || method === 'task.notification') return 'successResult';
    return 'taskResult';
  }
  
  if (method.startsWith('chat.')) {
    return 'chatResult';
  }
  
  return 'result';
}

/**
 * Get result schema based on method
 */
function getResultSchema(method: string): any {
  if (method.startsWith('task.')) {
    if (method === 'task.subscribe') {
      return {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['subscription']
          },
          subscription: {
            $ref: '#/components/schemas/SubscriptionObject'
          }
        },
        required: ['type', 'subscription']
      };
    }
    
    if (method === 'task.send' || method === 'task.notification') {
      return {
        type: 'object',
        properties: {
          success: {
            type: 'boolean'
          },
          message: {
            type: 'string'
          }
        },
        required: ['success']
      };
    }
    
    return {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['task']
        },
        task: {
          $ref: '#/components/schemas/TaskObject'
        }
      },
      required: ['type', 'task']
    };
  }
  
  if (method.startsWith('chat.')) {
    return {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['chat']
        },
        chat: {
          $ref: '#/components/schemas/ChatObject'
        }
      },
      required: ['type', 'chat']
    };
  }
  
  return {
    type: 'object'
  };
}

/**
 * Get result description based on method
 */
function getResultDescription(method: string): string {
  if (method.startsWith('task.')) {
    if (method === 'task.create') return 'Task creation result';
    if (method === 'task.info') return 'Task information result';
    if (method === 'task.cancel') return 'Task cancellation result';
    if (method === 'task.subscribe') return 'Subscription result';
    if (method === 'task.send') return 'Operation success result';
    if (method === 'task.notification') return 'Simple acknowledgment (not processed by sender)';
  }
  
  if (method.startsWith('chat.')) {
    if (method === 'chat.start') return 'Chat start result';
    if (method === 'chat.message') return 'Chat message result';
    if (method === 'chat.end') return 'Chat end result';
  }
  
  return 'Operation result';
}

/**
 * Generate OpenRPC schema from OpenAPI schema
 */
async function generateOpenRPCSchema(): Promise<void> {
  try {
    console.log(`Reading OpenAPI schema from ${OPENAPI_SCHEMA_PATH}`);
    
    // Check if file exists
    try {
      await fs.access(OPENAPI_SCHEMA_PATH);
    } catch (error) {
      console.error(`Error: OpenAPI schema file not found at ${OPENAPI_SCHEMA_PATH}`);
      console.error('Please make sure the file exists at the correct location.');
      process.exit(1);
    }
    
    // Read OpenAPI schema
    const openApiContent = await fs.readFile(OPENAPI_SCHEMA_PATH, 'utf-8');
    const openApiSchema = yaml.load(openApiContent) as OpenAPIV3.Document;
    
    // Create OpenRPC schema
    const openRpcSchema = {
      openrpc: '1.2.6',
      info: {
        version: openApiSchema.info.version,
        title: openApiSchema.info.title,
        description: openApiSchema.info.description,
        license: openApiSchema.info.license
      },
      servers: [
        {
          name: 'Default ARC Endpoint',
          url: 'https://api.company.com/arc'
        }
      ],
      methods: convertPathsToMethods(openApiSchema.paths || {}),
      components: convertComponents(openApiSchema.components || {})
    };
    
    // Ensure output directory exists
    await fs.mkdir(path.dirname(OPENRPC_OUTPUT_PATH), { recursive: true });
    
    // Write OpenRPC schema
    await fs.writeFile(
      OPENRPC_OUTPUT_PATH,
      JSON.stringify(openRpcSchema, null, 2),
      'utf-8'
    );
    
    console.log(`Generated OpenRPC schema at ${OPENRPC_OUTPUT_PATH}`);
  } catch (error) {
    console.error('Error generating OpenRPC schema:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  generateOpenRPCSchema();
}

export { generateOpenRPCSchema };