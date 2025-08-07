/**
 * ARC Protocol Server Implementation
 * 
 * This file provides a basic implementation of an ARC Protocol server.
 * It's designed to be framework-agnostic but includes an Express adapter.
 */

import {
  ARCRequest,
  ARCResponse,
  ErrorObject,
  ChatObject,
  ChatStatus
} from '../types';

/**
 * Method handler function type
 * @param params Method parameters
 * @param context Request context
 * @returns Result data or Promise of result data
 */
export type MethodHandler<T = any, R = any> = (params: T, context: RequestContext) => Promise<R> | R;

/**
 * Authentication validation function
 * @param token OAuth2 token
 * @returns Authentication result with scopes
 */
export type AuthValidator = (token: string) => Promise<AuthResult> | AuthResult;

/**
 * Authentication result
 */
export interface AuthResult {
  /** Whether authentication was successful */
  authenticated: boolean;
  /** OAuth2 scopes granted to the token */
  scopes?: string[];
  /** User or client ID associated with the token */
  subject?: string;
  /** Error message if authentication failed */
  error?: string;
}

/**
 * Context for an ARC request
 */
export interface RequestContext {
  /** Request identifier */
  request_id: string;
  /** Method being called */
  method: string;
  /** ID of the agent making the request */
  request_agent: string;
  /** ID of the agent that should handle the request */
  target_agent: string;
  /** Workflow tracking ID for multi-agent processes */
  trace_id?: string;
  /** Raw ARC request object */
  raw_request: ARCRequest;
  /** Authentication information */
  auth: {
    /** Whether the request is authenticated */
    authenticated: boolean;
    /** OAuth2 token from the request */
    token?: string;
    /** OAuth2 scopes associated with the token */
    scopes?: string[];
    /** User or client ID associated with the token */
    subject?: string;
  };
}

/**
 * Options for the ARC server
 */
export interface ARCServerOptions {
  /** ID of this agent */
  agentId: string;
  /** Agent name */
  name?: string;
  /** Agent version */
  version?: string;
  /** Agent description */
  agentDescription?: string;
  /** Enable CORS */
  enableCors?: boolean;
  /** Enable request validation */
  enableValidation?: boolean;
  /** Enable request logging */
  enableLogging?: boolean;
  /** Enable authentication */
  enableAuth?: boolean;
  /** OAuth2 scope requirements for methods */
  requiredScopes?: Record<string, string[]>;
  /** Authentication validator function */
  authValidator?: AuthValidator;
}

/**
 * ARC Protocol server implementation
 */
export class ARCServer {
  private agentId: string;
  private name?: string;
  private version: string;
  private agentDescription?: string;
  private enableCors: boolean;
  private enableValidation: boolean;
  private enableLogging: boolean;
  private enableAuth: boolean;
  private handlers: Record<string, MethodHandler> = {};
  private requiredScopes: Record<string, string[]> = {};
  private authValidator?: AuthValidator;

  /**
   * Create a new ARC server
   * 
   * @param options Server configuration options
   */
  constructor(options: ARCServerOptions) {
    this.agentId = options.agentId;
    this.name = options.name;
    this.version = options.version || '1.0.0';
    this.agentDescription = options.agentDescription;
    this.enableCors = options.enableCors !== false;
    this.enableValidation = options.enableValidation !== false;
    this.enableLogging = options.enableLogging !== false;
    this.enableAuth = options.enableAuth === true;
    
    if (options.requiredScopes) {
      this.requiredScopes = options.requiredScopes;
    } else {
      // Default required scopes
      this.requiredScopes = {
        'task.create': ['arc.task.controller', 'arc.agent.caller'],
        'task.send': ['arc.task.controller', 'arc.agent.caller'],
        'task.info': ['arc.task.controller', 'arc.agent.caller'],
        'task.cancel': ['arc.task.controller', 'arc.agent.caller'],
        'task.subscribe': ['arc.task.controller', 'arc.agent.caller'],
        'task.notification': ['arc.task.notify', 'arc.agent.receiver'],
        'chat.start': ['arc.chat.controller', 'arc.agent.caller'],
        'chat.message': ['arc.chat.controller', 'arc.agent.caller'],
        'chat.end': ['arc.chat.controller', 'arc.agent.caller']
      };
    }
    
    this.authValidator = options.authValidator;
  }

  /**
   * Register a method handler
   * 
   * @param method Method name
   * @param handler Handler function
   */
  public registerHandler<T = any, R = any>(method: string, handler: MethodHandler<T, R>): void {
    this.handlers[method] = handler;
  }

  /**
   * Set required OAuth2 scopes for a method
   * 
   * @param method Method name
   * @param scopes Required scopes
   */
  public setRequiredScopes(method: string, scopes: string[]): void {
    this.requiredScopes[method] = scopes;
  }

  /**
   * Get supported methods
   * 
   * @returns Array of supported method names
   */
  public getSupportedMethods(): string[] {
    return Object.keys(this.handlers);
  }

  /**
   * Handle an ARC protocol request
   * 
   * @param requestData Raw ARC request object
   * @param authHeader Authorization header value
   * @returns ARC response object
   */
  public async handleRequest(
    requestData: ARCRequest,
    authHeader?: string
  ): Promise<ARCResponse> {
    try {
      // Basic validation
      if (!requestData || typeof requestData !== 'object') {
        return this.createErrorResponse(
          null,
          {
            code: -32600,
            message: 'Invalid request: Request must be a JSON object'
          }
        );
      }

      // Extract request fields
      const { arc, id, method, requestAgent, targetAgent, params, traceId } = requestData;

      // Check required fields
      const requiredFields = ['arc', 'id', 'method', 'requestAgent', 'targetAgent', 'params'];
      for (const field of requiredFields) {
        if (!(field in requestData)) {
          return this.createErrorResponse(
            requestData,
            {
              code: -32600,
              message: `Invalid request: Missing required field '${field}'`
            }
          );
        }
      }

      // Check ARC version
      if (arc !== '1.0') {
        return this.createErrorResponse(
          requestData,
          {
            code: -45001,
            message: `Invalid ARC version: ${arc}`,
            details: { supportedVersion: '1.0' }
          }
        );
      }

      // Check if this request is for this agent
      if (targetAgent !== this.agentId) {
        return this.createErrorResponse(
          requestData,
          {
            code: -41001,
            message: `Agent not found: ${targetAgent}`,
            details: {
              requestedAgent: targetAgent,
              currentAgent: this.agentId
            }
          }
        );
      }

      // Check method
      if (!(method in this.handlers)) {
        return this.createErrorResponse(
          requestData,
          {
            code: -32601,
            message: `Method not found: ${method}`,
            details: {
              supportedMethods: this.getSupportedMethods()
            }
          }
        );
      }

      // Extract authentication information from request
      const authContext: { authenticated: boolean; token?: string; scopes?: string[]; subject?: string } = {
        authenticated: false
      };
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        authContext.token = token;
        
        // Validate token if auth is enabled
        if (this.enableAuth && this.authValidator) {
          const authResult = await this.authValidator(token);
          authContext.authenticated = authResult.authenticated;
          authContext.scopes = authResult.scopes;
          authContext.subject = authResult.subject;
          
          // Check required scopes
          if (authResult.authenticated && method in this.requiredScopes) {
            const requiredScopes = this.requiredScopes[method];
            const hasRequiredScopes = requiredScopes.every(
              scope => authResult.scopes?.includes(scope)
            );
            
            if (!hasRequiredScopes) {
              return this.createErrorResponse(
                requestData,
                {
                  code: -44003,
                  message: 'Insufficient OAuth2 scope',
                  details: {
                    requiredScopes,
                    providedScopes: authResult.scopes
                  }
                }
              );
            }
          }
        }
      }

      // Create context
      const context: RequestContext = {
        request_id: id,
        method,
        request_agent: requestAgent,
        target_agent: targetAgent,
        trace_id: traceId,
        raw_request: requestData,
        auth: authContext
      };

      // Get handler
      const handler = this.handlers[method];

      // Execute handler
      const result = await handler(params, context);

      // Build response
      const response: ARCResponse = {
        arc: '1.0',
        id,
        responseAgent: this.agentId,
        targetAgent: requestAgent,
        result,
        error: null
      };

      if (traceId) {
        response.traceId = traceId;
      }

      return response;
    } catch (error) {
      // Handle errors
      return this.createErrorResponse(
        requestData,
        this.createErrorFromException(error)
      );
    }
  }

  /**
   * Create a streaming response for chat methods
   * 
   * @param chatId Chat identifier
   * @param messageGenerator Async generator yielding message parts
   * @returns Server-sent events formatted string
   */
  public createChatStream(
    chatId: string,
    messageGenerator: AsyncGenerator<any>
  ): AsyncGenerator<string> {
    return this.createSSEGenerator(chatId, messageGenerator);
  }

  /**
   * Create a Server-Sent Events generator
   * 
   * @param chatId Chat identifier
   * @param messageGenerator Async generator yielding message parts
   * @returns Server-sent events formatted string generator
   */
  private async *createSSEGenerator(
    chatId: string,
    messageGenerator: AsyncGenerator<any>
  ): AsyncGenerator<string> {
    try {
      for await (const messagePart of messageGenerator) {
        // Format as SSE
        yield `event: stream\ndata: ${JSON.stringify({
          chatId,
          message: {
            role: 'agent',
            parts: [messagePart]
          }
        })}\n\n`;
      }

      // Send done event
      yield `event: done\ndata: ${JSON.stringify({
        chatId,
        status: ChatStatus.ACTIVE,
        done: true
      })}\n\n`;
    } catch (error) {
      // Send error event
      yield `event: error\ndata: ${JSON.stringify({
        chatId,
        error: this.createErrorFromException(error)
      })}\n\n`;
      
      // Send done event to close the stream
      yield `event: done\ndata: ${JSON.stringify({
        chatId,
        status: ChatStatus.ACTIVE,
        done: true
      })}\n\n`;
    }
  }

  /**
   * Create an ARC error response
   * 
   * @param request Original request or null
   * @param error Error object
   * @returns Error response
   */
  private createErrorResponse(
    request: ARCRequest | null,
    error: ErrorObject
  ): ARCResponse {
    return {
      arc: '1.0',
      id: request?.id || 'error',
      responseAgent: this.agentId,
      targetAgent: request?.requestAgent || 'unknown',
      traceId: request?.traceId,
      result: null,
      error
    };
  }

  /**
   * Create an error object from an exception
   * 
   * @param error Exception object
   * @returns ARC error object
   */
  private createErrorFromException(error: any): ErrorObject {
    if (typeof error === 'object' && error !== null) {
      // If it's already an ARC error format
      if ('code' in error && 'message' in error) {
        return {
          code: error.code,
          message: error.message,
          details: error.details
        };
      }
      
      // Check for common error properties
      if (error instanceof Error) {
        return {
          code: -32603,
          message: error.message || 'Internal server error',
          details: {
            name: error.name,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
          }
        };
      }
    }
    
    // Default error
    return {
      code: -32603,
      message: String(error) || 'Internal server error'
    };
  }

  /**
   * Get agent information
   * 
   * @returns Agent information object
   */
  public getAgentInfo(): Record<string, any> {
    return {
      agentId: this.agentId,
      name: this.name || this.agentId,
      description: this.agentDescription,
      version: this.version,
      status: 'active',
      endpoints: {
        arc: '/arc'
      },
      supportedMethods: this.getSupportedMethods()
    };
  }
}

/**
 * Create Express middleware for an ARC server
 * 
 * @param server ARC server instance
 * @returns Express middleware function
 */
export function createExpressMiddleware(server: ARCServer): (req: any, res: any, next: any) => Promise<void> {
  return async (req: any, res: any, next: any) => {
    try {
      // Only handle POST requests to /arc
      if (req.method !== 'POST' || req.path !== '/arc') {
        return next();
      }

      // Get request body
      const requestData = req.body;
      
      // Get auth header
      const authHeader = req.headers.authorization;
      
      // Check for streaming requests
      const acceptHeader = req.headers.accept || '';
      const wantsStreaming = acceptHeader.includes('text/event-stream');
      
      // Check if the request is for a streaming method
      const isStreamingRequest = wantsStreaming && 
        requestData?.method?.startsWith('chat.') && 
        requestData?.params?.stream === true;
      
      if (isStreamingRequest) {
        // Handle streaming response
        try {
          // Set SSE headers
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          
          // Get chat ID from request params
          const chatId = requestData.params.chatId || `chat-${Date.now()}`;
          
          // Create context
          const context = {
            request_id: requestData.id,
            method: requestData.method,
            request_agent: requestData.requestAgent,
            target_agent: requestData.targetAgent,
            trace_id: requestData.traceId,
            raw_request: requestData,
            auth: {
              authenticated: false,
              token: authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined
            }
          };
          
          // Get handler
          const handler = server['handlers'][requestData.method];
          
          if (!handler) {
            throw new Error(`Method not found: ${requestData.method}`);
          }
          
          // Execute handler and get result
          const result = await handler(requestData.params, context);
          
          // Check if the result has a chat object with a message that can be streamed
          if (
            result && 
            result.type === 'chat' && 
            result.chat && 
            typeof result.chat.message?.stream === 'function'
          ) {
            // Get the message generator
            const messageGenerator = result.chat.message.stream();
            
            // Create SSE generator
            const sseGenerator = server.createChatStream(
              result.chat.chatId,
              messageGenerator
            );
            
            // Send each chunk
            for await (const chunk of sseGenerator) {
              res.write(chunk);
              
              // Ensure chunks are sent immediately
              if (typeof res.flush === 'function') {
                res.flush();
              }
            }
            
            // End response
            res.end();
            return;
          }
          
          // If not streamable, send regular response
          const response = {
            arc: '1.0',
            id: requestData.id,
            responseAgent: server['agentId'],
            targetAgent: requestData.requestAgent,
            result,
            error: null
          };
          
          if (requestData.traceId) {
            response.traceId = requestData.traceId;
          }
          
          res.json(response);
        } catch (error) {
          // Send error as SSE
          res.write(`event: error\ndata: ${JSON.stringify({
            error: server['createErrorFromException'](error)
          })}\n\n`);
          
          res.write(`event: done\ndata: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        }
      } else {
        // Handle standard response
        const response = await server.handleRequest(requestData, authHeader);
        res.json(response);
      }
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Create a new ARC server
 * 
 * @param agentId Agent identifier
 * @param options Server configuration options
 * @returns ARC server instance
 */
export function createServer(agentId: string, options: Partial<ARCServerOptions> = {}): ARCServer {
  return new ARCServer({
    agentId,
    ...options
  });
}