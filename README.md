# ARC Protocol - Agent Remote Communication

[![GitHub license](https://img.shields.io/github/license/arcprotocol/arcprotocol)](https://github.com/arcprotocol/arcprotocol/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/arc-protocol.svg)](https://www.npmjs.com/package/arc-protocol)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/arcprotocol/arcprotocol/blob/main/CONTRIBUTING.md)

**ARC (Agent Remote Communication)** is the first RPC protocol that solves multi-agent deployment complexity with built-in agent routing, load balancing, and workflow tracing. Deploy hundreds of different agent types on a single endpoint with zero infrastructure overhead.

## Key Features

- **Multi-Agent Architecture**: Single endpoint supports multiple agents with built-in routing
- **Load Balancing Ready**: Multiple instances of the same agent via `requestAgent`/`targetAgent` routing
- **Workflow Tracing**: End-to-end traceability across multi-agent processes via `traceId`
- **Agent-Centric Routing**: Built-in agent identification and routing at protocol level
- **Stateless Design**: Each request is independent with no session state
- **Method-Based**: Clean RPC-style method invocation
- **Transport Agnostic**: Works over HTTP, WebSockets, or any transport layer
- **Server-Sent Events**: Support for streaming responses via SSE
- **Comprehensive Error Handling**: 500+ categorized error codes with detailed context for debugging and monitoring

## Getting Started

### Installation

```bash
npm install arc-protocol
```

### Basic Usage

```typescript
import { ARCClient } from 'arc-protocol';

// Initialize ARC client
const client = new ARCClient({
  endpoint: 'https://company.com/arc',
  requestAgent: 'my-app-01',
  token: 'your-oauth2-token'
});

// Create a task
const taskResult = await client.task.create({
  targetAgent: 'document-processor-01',
  initialMessage: {
    role: 'user',
    parts: [{ type: 'TextPart', content: 'Process this document' }]
  },
  priority: 'HIGH'
});

console.log(`Task created with ID: ${taskResult.task.taskId}`);

// Start a real-time chat
const chatResult = await client.chat.start({
  targetAgent: 'support-agent-01',
  initialMessage: {
    role: 'user',
    parts: [{ type: 'TextPart', content: 'I need help with my account' }]
  },
  stream: true  // Enable streaming response
});

// Process streamed response
for await (const chunk of chatResult.stream()) {
  console.log(chunk.message.parts[0].content);
}
```

## Documentation

- [Protocol Specification](./specification/README.md)
- [API Reference](./docs/api-reference.md)
- [Examples](./examples/README.md)
- [TypeScript Types](./types/README.md)
- [Implementation Guide](./docs/implementation-guide.md)

## Multi-Agent Architecture

ARC enables seamless multi-agent communication with a single endpoint:

```
https://company.com/arc  ← Single endpoint
├── finance-analyzer-01, finance-analyzer-02    (Load balanced)
├── document-processor-03, document-processor-04
├── chart-generator-05
└── report-writer-07
```

## Method Categories

### Task Methods (Asynchronous)

For long-running, asynchronous agent operations:
- `task.create` - Create a new task
- `task.send` - Send additional data to a task
- `task.info` - Get task status and results
- `task.cancel` - Cancel a running task
- `task.subscribe` - Get notifications about task progress

### Chat Methods (Real-time)

For real-time, interactive agent communication:
- `chat.start` - Begin a real-time chat
- `chat.message` - Send messages within a chat
- `chat.end` - End an active chat

### Notification Methods (Server-initiated)

For server-to-client notifications:
- `task.notification` - Notify about task state changes

## Contributing

We welcome contributions to the ARC Protocol! See our [contributing guide](./CONTRIBUTING.md) for details.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](./LICENSE) file for details.

## About

ARC Protocol is maintained and developed as an open specification to improve interoperability between agent systems. Learn more about our mission and goals in the [About section](./docs/about.md).