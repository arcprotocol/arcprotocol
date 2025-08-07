# ARC Protocol Implementation Guide

This guide provides best practices and recommendations for implementing the ARC Protocol in your applications.

## Table of Contents

- [Client Implementation](#client-implementation)
- [Server Implementation](#server-implementation)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Working with Tasks](#working-with-tasks)
- [Working with Chats](#working-with-chats)
- [Streaming Responses](#streaming-responses)
- [Workflows and Tracing](#workflows-and-tracing)

## Client Implementation

### Getting Started

To use the ARC Protocol client:

```typescript
import { ARCClient } from 'arc-protocol';

// Initialize client
const client = new ARCClient({
  endpoint: 'https://api.company.com/arc',
  requestAgent: 'my-client-01',
  token: 'your-oauth2-token'
});
```

### Best Practices

1. **Agent Identification**: Use consistent, descriptive agent IDs that include:
   - Service name
   - Function
   - Instance identifier
   
   Example: `document-analyzer-01`, `customer-support-03`

2. **Error Handling**: Implement proper error handling for different error types:

```typescript
try {
  const result = await client.task.create({...});
} catch (error) {
  if ('code' in error) {
    switch (error.code) {
      case -41001: // Agent not found
        console.error('Target agent not found:', error.message);
        break;
      case -44001: // Authentication failed
        console.error('Authentication error:', error.message);
        break;
      default:
        console.error('ARC error:', error.message, 'code:', error.code);
    }
  } else {
    console.error('Network or system error:', error);
  }
}
```

3. **Timeout Handling**: Set appropriate timeouts based on operation type:
   - Standard operations: 30-60 seconds
   - Long-running tasks: 2-5 minutes for task creation
   - Streaming connections: 30+ minutes

4. **Retry Logic**: Implement exponential backoff for network errors, but don't retry business logic errors:

```typescript
async function retryOperation(operation, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      if (
        'code' in error || // ARC business logic error
        retries >= maxRetries - 1
      ) {
        throw error; // Don't retry business logic errors
      }
      
      retries++;
      const delay = 2 ** retries * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Server Implementation

### Getting Started

To create an ARC Protocol server:

```typescript
import { createServer, createExpressMiddleware } from 'arc-protocol';
import express from 'express';

// Create Express app
const app = express();
app.use(express.json());

// Create ARC server
const arcServer = createServer('my-agent-01', {
  name: 'My Agent',
  version: '1.0.0',
  agentDescription: 'My ARC protocol agent'
});

// Register handlers
arcServer.registerHandler('task.create', async (params, context) => {
  // Implementation
});

// Add middleware
app.use(createExpressMiddleware(arcServer));

// Start server
app.listen(3000);
```

### Best Practices

1. **Method Handlers**: Keep method handlers focused and separate business logic:

```typescript
// Register handler
arcServer.registerHandler('task.create', async (params, context) => {
  try {
    // Validate parameters
    if (!params.initialMessage?.parts?.length) {
      throw new Error('Missing initial message content');
    }
    
    // Process the task
    const taskResult = await yourBusinessLogic.processTask(params);
    
    // Return result in ARC format
    return {
      type: 'task',
      task: {
        taskId: taskResult.id,
        status: 'SUBMITTED',
        createdAt: taskResult.creationTime
      }
    };
  } catch (error) {
    // Throw appropriate ARC error
    const arcError = new Error(error.message);
    arcError.code = -42004; // Task execution failed
    throw arcError;
  }
});
```

2. **Authentication**: Implement proper OAuth2 authentication:

```typescript
const arcServer = createServer('my-agent-01', {
  enableAuth: true,
  authValidator: async (token) => {
    try {
      const decoded = await verifyJwt(token);
      return {
        authenticated: true,
        scopes: decoded.scopes,
        subject: decoded.sub
      };
    } catch (error) {
      return {
        authenticated: false,
        error: 'Invalid token'
      };
    }
  }
});
```

3. **Logging**: Implement structured logging for debugging:

```typescript
arcServer.registerHandler('task.create', async (params, context) => {
  logger.info('Task creation request received', {
    requestId: context.request_id,
    requestAgent: context.request_agent,
    traceId: context.trace_id
  });
  
  // Process task
  
  logger.info('Task created successfully', {
    requestId: context.request_id,
    taskId: taskId,
    traceId: context.trace_id
  });
  
  // Return result
});
```

## Authentication

ARC uses OAuth 2.0 Bearer tokens for authentication. The protocol defines specific scopes for different operations:

### OAuth2 Scope Pattern

`arc.{domain}.{role}`

### Communication Role Scopes
- `arc.agent.caller` - Initiate requests to other agents
- `arc.agent.receiver` - Receive and process requests

### Operation Controller Scopes
- `arc.task.controller` - Full control over task operations
- `arc.chat.controller` - Full control over chat operations
- `arc.task.notify` - Send task notifications

### Common Scope Patterns

```typescript
// Task-focused requesting agent
const requestScopes = 'arc.task.controller arc.agent.caller';

// Chat-focused requesting agent
const requestScopes = 'arc.chat.controller arc.agent.caller';

// Task processing agent
const processingScopes = 'arc.task.notify arc.agent.receiver';
```

## Error Handling

ARC defines a comprehensive error code system:

1. **JSON-RPC Standard Errors**: Codes -32000 to -32099
2. **Agent Errors**: Codes -41000 to -41099
3. **Task Errors**: Codes -42000 to -42099
4. **Chat Errors**: Codes -43000 to -43099
5. **Security Errors**: Codes -44000 to -44099
6. **Protocol Errors**: Codes -45000 to -45099

### Creating Error Responses

```typescript
function createErrorResponse(requestId, errorCode, errorMessage, details = null) {
  return {
    arc: '1.0',
    id: requestId,
    responseAgent: 'my-agent-01',
    targetAgent: 'requesting-agent-id',
    result: null,
    error: {
      code: errorCode,
      message: errorMessage,
      details
    }
  };
}
```

## Working with Tasks

Tasks are long-running, asynchronous operations. Here's a typical task lifecycle:

1. **Creation**: Client sends `task.create` request
2. **Processing**: Agent works on the task (status: WORKING)
3. **Input Required**: Agent may ask for additional input (status: INPUT_REQUIRED)
4. **Completion**: Task completes successfully (status: COMPLETED) or fails (status: FAILED)

### Best Practices

1. **Unique Task IDs**: Generate unique task IDs that are:
   - URL-safe
   - Include a timestamp component
   - Have sufficient entropy

2. **Task Status Management**: Use a state machine approach for task status transitions.

3. **Long-Running Tasks**: Use background workers for tasks that take > 30 seconds:
   ```typescript
   arcServer.registerHandler('task.create', async (params, context) => {
     // Create task record
     const taskId = generateTaskId();
     
     // Start background worker
     startBackgroundWorker(taskId, params);
     
     // Return immediately
     return {
       type: 'task',
       task: {
         taskId,
         status: 'SUBMITTED',
         createdAt: new Date().toISOString()
       }
     };
   });
   ```

4. **Task Artifacts**: Structure artifacts with clear metadata.

## Working with Chats

Chats are real-time, interactive conversations. Here's a typical chat lifecycle:

1. **Start**: Client sends `chat.start` request
2. **Message Exchange**: Client and agent exchange messages with `chat.message`
3. **End**: Client sends `chat.end` request

### Best Practices

1. **Chat State**: Maintain chat state on the server side with appropriate timeouts.

2. **Message Validation**: Validate incoming messages.

3. **Chat Timeouts**: Implement automatic timeouts for inactive chats.

## Streaming Responses

ARC supports streaming responses via Server-Sent Events (SSE):

### Client-Side Streaming

```typescript
// Start chat with streaming
const streamResponse = await client.chat.start({
  initialMessage: {
    role: 'user',
    parts: [{ type: 'TextPart', content: 'Tell me a story' }]
  },
  stream: true
}, 'storyteller-agent-01');

// Process streaming response
for await (const event of streamResponse) {
  console.log(event.message.parts[0].content);
}
```

### Server-Side Streaming

```typescript
arcServer.registerHandler('chat.start', async (params, context) => {
  const chatId = params.chatId || generateChatId();
  
  if (params.stream) {
    // Create a streamable message
    const streamingMessage = {
      stream: async function*() {
        const words = "This is a streaming response from the server.".split(' ');
        
        for (const word of words) {
          yield { type: 'TextPart', content: word + ' ' };
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    };
    
    // Return streaming response
    return {
      type: 'chat',
      chat: {
        chatId,
        status: 'ACTIVE',
        message: streamingMessage
      }
    };
  } else {
    // Return standard response
    return {
      type: 'chat',
      chat: {
        chatId,
        status: 'ACTIVE',
        message: {
          role: 'agent',
          parts: [{ type: 'TextPart', content: 'How can I help you?' }]
        }
      }
    };
  }
});
```

## Workflows and Tracing

ARC supports multi-agent workflows through the `traceId` field:

### Workflow Tracing

```typescript
// Start a workflow
const traceId = `workflow-${Date.now()}`;

// First agent
const taskResult = await client.task.create({
  initialMessage: {
    role: 'user',
    parts: [{ type: 'TextPart', content: 'Extract data from this document' }]
  }
}, 'document-analyzer-01', traceId);

// Second agent (same trace)
const chartResult = await client.task.create({
  initialMessage: {
    role: 'agent',
    parts: [
      { type: 'TextPart', content: 'Generate charts from this data' },
      { type: 'DataPart', content: JSON.stringify(extractedData) }
    ]
  }
}, 'chart-generator-01', traceId);
```

### Tracing Best Practices

1. **Unique Trace IDs**: Generate workflow-specific trace IDs that are descriptive and include a timestamp.

2. **Propagation**: Always propagate the same traceId through all related requests.

3. **Logging**: Include traceId in all logs for correlation.

4. **Error Handling**: Propagate traceId in error responses.