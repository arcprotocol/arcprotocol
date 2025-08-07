/**
 * ARC Protocol - Agent Remote Communication
 * 
 * This is the main entry point for the ARC Protocol TypeScript implementation.
 * It exports all the necessary types and classes for using ARC in a TypeScript project.
 * 
 * @packageDocumentation
 */

// Export types
export * from './types';

// Export client implementation
export { ARCClient, ARCClientOptions } from './client';

// Export server implementation
export { 
  ARCServer, 
  ARCServerOptions, 
  MethodHandler, 
  RequestContext, 
  AuthResult, 
  AuthValidator,
  createServer, 
  createExpressMiddleware 
} from './server';

// Export version
export const VERSION = '1.0.0';