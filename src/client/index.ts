/**
 * ARC Protocol Client Implementation
 * 
 * This file provides a TypeScript client implementation for the ARC Protocol.
 */

import {
  ARCRequest,
  ARCResponse,
  TaskMethods,
  ChatMethods,
  TaskCreateParams,
  TaskResult,
  TaskSendParams,
  SuccessResult,
  TaskInfoParams,
  TaskCancelParams,
  TaskSubscribeParams,
  SubscriptionResult,
  TaskNotificationParams,
  ChatStartParams,
  ChatResult,
  ChatMessageParams,
  ChatEndParams,
  ChatStreamEvent,
  ChatDoneEvent
} from '../types';

/**
 * Options for the ARC client
 */
export interface ARCClientOptions {
  /** The ARC endpoint URL */
  endpoint: string;
  /** ID of the agent making requests */
  requestAgent: string;
  /** OAuth2 bearer token for authentication */
  token?: string;
  /** Request timeout in seconds */
  timeout?: number;
  /** Whether to verify SSL certificates */
  verifySSL?: boolean;
}

/**
 * ARC Protocol client for agent communication
 */
export class ARCClient {
  private endpoint: string;
  private requestAgent: string;
  private token?: string;
  private timeout: number;
  private verifySSL: boolean;

  public task: TaskMethods;
  public chat: ChatMethods;

  /**
   * Create a new ARC client
   * 
   * @param options Client configuration options
   */
  constructor(options: ARCClientOptions) {
    this.endpoint = options.endpoint.endsWith('/') 
      ? options.endpoint.slice(0, -1) 
      : options.endpoint;
    this.requestAgent = options.requestAgent;
    this.token = options.token;
    this.timeout = options.timeout || 60.0;
    this.verifySSL = options.verifySSL !== false;

    // Initialize method handlers
    this.task = {
      create: this.createTask.bind(this),
      send: this.sendTaskMessage.bind(this),
      info: this.getTaskInfo.bind(this),
      cancel: this.cancelTask.bind(this),
      subscribe: this.subscribeToTask.bind(this),
      notification: this.sendTaskNotification.bind(this)
    };

    this.chat = {
      start: this.startChat.bind(this),
      message: this.sendChatMessage.bind(this),
      end: this.endChat.bind(this)
    };
  }

  /**
   * Send an ARC request and return the response
   * 
   * @param method ARC method name (e.g., "task.create")
   * @param targetAgent ID of the agent that should handle the request
   * @param params Method-specific parameters
   * @param traceId Optional workflow tracking ID
   * @param timeout Request timeout in seconds (overrides default)
   * @param stream Whether to request a streaming response via SSE
   * @returns ARC response or streaming iterator
   */
  private async sendRequest(
    method: string,
    targetAgent: string,
    params: Record<string, any>,
    traceId?: string,
    timeout?: number,
    stream?: boolean
  ): Promise<any> {
    // Prepare request
    const requestId = this.generateRequestId();
    const request: ARCRequest = {
      arc: "1.0",
      id: requestId,
      method,
      requestAgent: this.requestAgent,
      targetAgent,
      params
    };

    if (traceId) {
      request.traceId = traceId;
    }

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/arc+json',
      'Accept': stream ? 'text/event-stream' : 'application/arc+json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Handle streaming requests
    if (stream && (method.startsWith('chat.') && params.stream === true)) {
      return this.handleStreamingRequest(request, headers, timeout);
    }

    // Standard request
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: AbortSignal.timeout((timeout || this.timeout) * 1000)
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const data: ARCResponse = await response.json();

      // Validate response
      this.validateResponse(data, requestId);

      // Check for error
      if (data.error) {
        throw this.createError(data.error);
      }

      return data.result;
    } catch (error) {
      if (error instanceof Error) {
        // Handle timeouts
        if ((error as any).name === 'AbortError') {
          throw new Error(`Request timed out after ${timeout || this.timeout} seconds`);
        }
        
        // Re-throw the error
        throw error;
      }
      
      // Fallback error
      throw new Error('Unknown error occurred');
    }
  }

  /**
   * Handle a streaming request using Server-Sent Events (SSE)
   * 
   * @param request The ARC request object
   * @param headers HTTP headers
   * @param timeout Request timeout in seconds
   * @returns An async generator yielding streaming events
   */
  private async *handleStreamingRequest(
    request: ARCRequest,
    headers: HeadersInit,
    timeout?: number
  ): Promise<AsyncGenerator<ChatStreamEvent | ChatDoneEvent>> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
      signal: AbortSignal.timeout((timeout || this.timeout) * 1000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (separated by double newlines)
        while (buffer.includes('\n\n')) {
          const [eventText, remaining] = buffer.split('\n\n', 2);
          buffer = remaining;

          // Parse the SSE event
          const event = this.parseSSEEvent(eventText);
          
          if (event) {
            yield event.data;
            
            // If this is the done event, stop reading
            if (event.event === 'done') {
              return;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Parse a Server-Sent Events (SSE) message
   * 
   * @param eventText Raw SSE message text
   * @returns Parsed event or undefined if invalid
   */
  private parseSSEEvent(eventText: string): { event: string, data: any } | undefined {
    const lines = eventText.split('\n');
    let eventType = '';
    let data = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        data = line.slice(5).trim();
      }
    }

    if (eventType && data) {
      try {
        return {
          event: eventType,
          data: JSON.parse(data)
        };
      } catch (error) {
        // If parsing fails, return the raw data
        return {
          event: eventType,
          data
        };
      }
    }

    return undefined;
  }

  /**
   * Validate an ARC response
   * 
   * @param response ARC response object
   * @param requestId Expected request ID
   */
  private validateResponse(response: ARCResponse, requestId: string | number): void {
    // Check required fields
    const requiredFields = ['arc', 'id', 'responseAgent', 'targetAgent'];
    for (const field of requiredFields) {
      if (!(field in response)) {
        throw new Error(`Missing required field in response: ${field}`);
      }
    }

    // Check protocol version
    if (response.arc !== '1.0') {
      throw new Error(`Unsupported ARC version: ${response.arc}`);
    }

    // Check ID matches
    if (response.id !== requestId) {
      throw new Error('Response ID does not match request ID');
    }

    // Check result or error
    if (!('result' in response) && !('error' in response)) {
      throw new Error('Response must contain either result or error');
    }
  }

  /**
   * Create an appropriate error from an ARC error object
   * 
   * @param error ARC error object
   * @returns Error instance
   */
  private createError(error: any): Error {
    const errorMessage = `${error.message} (code: ${error.code})`;
    const err = new Error(errorMessage);
    (err as any).code = error.code;
    (err as any).details = error.details;
    return err;
  }

  /**
   * Generate a unique request ID
   * 
   * @returns Unique ID string
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // === Task Methods ===

  /**
   * Create a new asynchronous task
   * 
   * @param params Task creation parameters
   * @param targetAgent ID of the agent that should handle the task
   * @param traceId Optional workflow tracking ID
   * @param timeout Request timeout in seconds
   * @returns Task creation result
   */
  private async createTask(
    params: TaskCreateParams,
    targetAgent: string,
    traceId?: string,
    timeout?: number
  ): Promise<TaskResult> {
    return this.sendRequest(
      'task.create',
      targetAgent,
      params,
      traceId,
      timeout
    ) as Promise<TaskResult>;
  }

  /**
   * Send a message to an existing task
   * 
   * @param params Task message parameters
   * @param targetAgent ID of the agent that should handle the task
   * @param traceId Optional workflow tracking ID
   * @param timeout Request timeout in seconds
   * @returns Success result
   */
  private async sendTaskMessage(
    params: TaskSendParams,
    targetAgent: string,
    traceId?: string,
    timeout?: number
  ): Promise<SuccessResult> {
    return this.sendRequest(
      'task.send',
      targetAgent,
      params,
      traceId,
      timeout
    ) as Promise<SuccessResult>;
  }

  /**
   * Get information about a task
   * 
   * @param params Task info parameters
   * @param targetAgent ID of the agent that should handle the task
   * @param traceId Optional workflow tracking ID
   * @param timeout Request timeout in seconds
   * @returns Task info result
   */
  private async getTaskInfo(
    params: TaskInfoParams,
    targetAgent: string,
    traceId?: string,
    timeout?: number
  ): Promise<TaskResult> {
    return this.sendRequest(
      'task.info',
      targetAgent,
      params,
      traceId,
      timeout
    ) as Promise<TaskResult>;
  }

  /**
   * Cancel an existing task
   * 
   * @param params Task cancellation parameters
   * @param targetAgent ID of the agent that should handle the task
   * @param traceId Optional workflow tracking ID
   * @param timeout Request timeout in seconds
   * @returns Task cancellation result
   */
  private async cancelTask(
    params: TaskCancelParams,
    targetAgent: string,
    traceId?: string,
    timeout?: number
  ): Promise<TaskResult> {
    return this.sendRequest(
      'task.cancel',
      targetAgent,
      params,
      traceId,
      timeout
    ) as Promise<TaskResult>;
  }

  /**
   * Subscribe to task notifications
   * 
   * @param params Task subscription parameters
   * @param targetAgent ID of the agent that should handle the task
   * @param traceId Optional workflow tracking ID
   * @param timeout Request timeout in seconds
   * @returns Subscription result
   */
  private async subscribeToTask(
    params: TaskSubscribeParams,
    targetAgent: string,
    traceId?: string,
    timeout?: number
  ): Promise<SubscriptionResult> {
    return this.sendRequest(
      'task.subscribe',
      targetAgent,
      params,
      traceId,
      timeout
    ) as Promise<SubscriptionResult>;
  }

  /**
   * Send a task notification
   * 
   * @param params Task notification parameters
   * @param targetAgent ID of the agent that should receive the notification
   * @param traceId Optional workflow tracking ID
   * @param timeout Request timeout in seconds
   * @returns Success result
   */
  private async sendTaskNotification(
    params: TaskNotificationParams,
    targetAgent: string,
    traceId?: string,
    timeout?: number
  ): Promise<SuccessResult> {
    return this.sendRequest(
      'task.notification',
      targetAgent,
      params,
      traceId,
      timeout
    ) as Promise<SuccessResult>;
  }

  // === Chat Methods ===

  /**
   * Start a real-time chat
   * 
   * @param params Chat start parameters
   * @param targetAgent ID of the agent that should handle the chat
   * @param traceId Optional workflow tracking ID
   * @param timeout Request timeout in seconds
   * @returns Chat result or streaming response
   */
  private async startChat(
    params: ChatStartParams,
    targetAgent: string,
    traceId?: string,
    timeout?: number
  ): Promise<ChatResult | AsyncGenerator<ChatStreamEvent | ChatDoneEvent>> {
    return this.sendRequest(
      'chat.start',
      targetAgent,
      params,
      traceId,
      timeout,
      params.stream
    );
  }

  /**
   * Send a message to an active chat
   * 
   * @param params Chat message parameters
   * @param targetAgent ID of the agent that should handle the chat
   * @param traceId Optional workflow tracking ID
   * @param timeout Request timeout in seconds
   * @returns Chat result or streaming response
   */
  private async sendChatMessage(
    params: ChatMessageParams,
    targetAgent: string,
    traceId?: string,
    timeout?: number
  ): Promise<ChatResult | AsyncGenerator<ChatStreamEvent | ChatDoneEvent>> {
    return this.sendRequest(
      'chat.message',
      targetAgent,
      params,
      traceId,
      timeout,
      params.stream
    );
  }

  /**
   * End an active chat
   * 
   * @param params Chat end parameters
   * @param targetAgent ID of the agent that should handle the chat
   * @param traceId Optional workflow tracking ID
   * @param timeout Request timeout in seconds
   * @returns Chat result
   */
  private async endChat(
    params: ChatEndParams,
    targetAgent: string,
    traceId?: string,
    timeout?: number
  ): Promise<ChatResult> {
    return this.sendRequest(
      'chat.end',
      targetAgent,
      params,
      traceId,
      timeout
    ) as Promise<ChatResult>;
  }
}