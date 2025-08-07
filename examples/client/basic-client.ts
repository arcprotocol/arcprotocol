/**
 * Basic ARC Protocol client example
 * 
 * This example demonstrates how to use the ARC client to interact with ARC-compatible agents.
 */

import { ARCClient } from '../../src';

// Create ARC client
const client = new ARCClient({
  endpoint: 'https://api.company.com/arc',
  requestAgent: 'client-app-01',
  token: 'your-oauth2-token'  // Replace with your actual token
});

async function createTask() {
  try {
    // Create a task
    const taskResult = await client.task.create({
      initialMessage: {
        role: 'user',
        parts: [{ type: 'TextPart', content: 'Analyze this document' }]
      },
      priority: 'HIGH',
      metadata: { source: 'client-example' }
    }, 'document-analyzer-01');

    console.log('Task created:', taskResult);
    
    // Get task information
    const taskId = taskResult.task.taskId;
    const taskInfo = await client.task.info({
      taskId,
      includeMessages: true,
      includeArtifacts: true
    }, 'document-analyzer-01');
    
    console.log('Task info:', taskInfo);
    
    // Send a message to the task
    const messageResult = await client.task.send({
      taskId,
      message: {
        role: 'user',
        parts: [{ type: 'TextPart', content: 'Please focus on financial data' }]
      }
    }, 'document-analyzer-01');
    
    console.log('Message sent:', messageResult);
    
    // Subscribe to task notifications
    const subscription = await client.task.subscribe({
      taskId,
      callbackUrl: 'https://my-app.com/webhooks/tasks',
      events: ['TASK_COMPLETED', 'TASK_FAILED']
    }, 'document-analyzer-01');
    
    console.log('Subscribed to task:', subscription);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

async function startChat() {
  try {
    // Start a chat
    const chatResult = await client.chat.start({
      initialMessage: {
        role: 'user',
        parts: [{ type: 'TextPart', content: 'I need help with my account' }]
      },
      stream: false,  // Set to true for streaming responses
      metadata: { context: 'support' }
    }, 'support-agent-01');

    console.log('Chat started:', chatResult);
    
    if ('chat' in chatResult) {
      const chatId = chatResult.chat.chatId;
      
      // Send a follow-up message
      const messageResult = await client.chat.message({
        chatId,
        message: {
          role: 'user',
          parts: [{ type: 'TextPart', content: 'How do I reset my password?' }]
        },
        stream: false
      }, 'support-agent-01');
      
      console.log('Message sent:', messageResult);
      
      // End the chat
      const endResult = await client.chat.end({
        chatId,
        reason: 'Question answered'
      }, 'support-agent-01');
      
      console.log('Chat ended:', endResult);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

async function startStreamingChat() {
  try {
    // Start a chat with streaming enabled
    const chatResponse = await client.chat.start({
      initialMessage: {
        role: 'user',
        parts: [{ type: 'TextPart', content: 'Tell me a story about AI' }]
      },
      stream: true,
      metadata: { context: 'creative' }
    }, 'storyteller-agent-01');

    // Check if response is a streaming response
    if (Symbol.asyncIterator in chatResponse) {
      console.log('Receiving streaming response:');
      
      // Process stream events
      const streamResponse = chatResponse as AsyncGenerator<any>;
      for await (const event of streamResponse) {
        if (event.message?.parts?.[0]?.content) {
          process.stdout.write(event.message.parts[0].content);
        }
      }
      
      console.log('\nStreaming response complete');
    } else {
      console.log('Got regular response:', chatResponse);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run examples
async function runExamples() {
  await createTask();
  await startChat();
  await startStreamingChat();
}

runExamples().catch(console.error);