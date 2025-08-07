/**
 * Basic ARC Protocol server example
 * 
 * This example demonstrates how to create a basic ARC server using Express.
 */

import express from 'express';
import { createServer, createExpressMiddleware } from '../../src';
import { ResultType, TaskStatus } from '../../src/types';

// Create Express app
const app = express();
app.use(express.json());

// Create ARC server
const arcServer = createServer('example-agent-01', {
  name: 'Example Agent',
  version: '1.0.0',
  agentDescription: 'An example ARC protocol agent',
  enableCors: true,
  enableValidation: true,
  enableLogging: true
});

// Register task.create handler
arcServer.registerHandler('task.create', async (params, context) => {
  console.log('Received task.create request:', {
    from: context.request_agent,
    initialMessage: params.initialMessage,
    priority: params.priority
  });

  // In a real implementation, you would:
  // 1. Validate parameters
  // 2. Save the task to a database
  // 3. Start processing the task in the background
  
  // Create a task ID
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  // Return task result
  return {
    type: ResultType.TASK,
    task: {
      taskId,
      status: TaskStatus.SUBMITTED,
      createdAt: new Date().toISOString()
    }
  };
});

// Register task.info handler
arcServer.registerHandler('task.info', async (params, context) => {
  console.log('Received task.info request:', {
    from: context.request_agent,
    taskId: params.taskId
  });
  
  // In a real implementation, you would fetch task info from a database
  
  // Return mock task data
  return {
    type: ResultType.TASK,
    task: {
      taskId: params.taskId,
      status: TaskStatus.WORKING,
      createdAt: new Date(Date.now() - 60000).toISOString(),
      updatedAt: new Date().toISOString(),
      messages: params.includeMessages ? [
        {
          role: 'user',
          parts: [{ type: 'TextPart', content: 'Initial task request' }],
          timestamp: new Date(Date.now() - 60000).toISOString()
        }
      ] : undefined,
      artifacts: params.includeArtifacts ? [] : undefined
    }
  };
});

// Register chat.start handler with streaming support
arcServer.registerHandler('chat.start', async (params, context) => {
  console.log('Received chat.start request:', {
    from: context.request_agent,
    initialMessage: params.initialMessage,
    stream: params.stream
  });
  
  // Generate a chat ID if not provided
  const chatId = params.chatId || `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  // Check if streaming is requested
  if (params.stream) {
    // Create a streaming message response
    const streamingMessage = {
      // Create a stream method that returns an async generator
      stream: async function* () {
        const response = "I'm an ARC protocol agent. I'll stream this response word by word to demonstrate streaming.";
        const words = response.split(' ');
        
        // Stream each word with a delay
        for (const word of words) {
          yield { type: 'TextPart', content: word + ' ' };
          await new Promise(resolve => setTimeout(resolve, 100)); // Delay between words
        }
      }
    };
    
    // Return a chat result with a streamable message
    return {
      type: ResultType.CHAT,
      chat: {
        chatId,
        status: 'ACTIVE',
        message: streamingMessage,
        createdAt: new Date().toISOString(),
        participants: ['example-agent-01']
      }
    };
  } else {
    // Return a standard chat result
    return {
      type: ResultType.CHAT,
      chat: {
        chatId,
        status: 'ACTIVE',
        message: {
          role: 'agent',
          parts: [{ 
            type: 'TextPart', 
            content: "I'm an ARC protocol agent. How can I assist you today?" 
          }]
        },
        createdAt: new Date().toISOString(),
        participants: ['example-agent-01']
      }
    };
  }
});

// Register agent.info endpoint
app.get('/agent-info', (req, res) => {
  res.json(arcServer.getAgentInfo());
});

// Register ARC protocol endpoint
app.use(createExpressMiddleware(arcServer));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ARC Protocol server listening on port ${PORT}`);
  console.log(`Agent ID: example-agent-01`);
  console.log(`Endpoint: http://localhost:${PORT}/arc`);
});