# ARC Protocol Examples

This directory contains example implementations of the ARC Protocol.

## Client Examples

The `client` directory contains examples of how to use the ARC client:

- **basic-client.ts**: A simple client that demonstrates:
  - Creating a task
  - Getting task information
  - Sending a message to a task
  - Subscribing to task notifications
  - Starting a chat
  - Sending chat messages
  - Using streaming responses

## Server Examples

The `server` directory contains examples of how to implement ARC servers:

- **basic-server.ts**: A simple Express-based server that demonstrates:
  - Setting up an ARC server
  - Registering method handlers
  - Implementing streaming responses
  - Exposing agent information

## Running the Examples

### Prerequisites

- Node.js 16+
- TypeScript

### Setup

1. Install dependencies:
```bash
npm install
```

2. Build the ARC Protocol library:
```bash
npm run build
```

### Running Client Examples

```bash
# Make sure to update the example with valid endpoint and token
npx ts-node examples/client/basic-client.ts
```

### Running Server Examples

```bash
npx ts-node examples/server/basic-server.ts
```

The server will start on port 3000 (or the port specified in the PORT environment variable).

## Testing with Real Requests

Once the server is running, you can send ARC requests using cURL:

```bash
curl -X POST http://localhost:3000/arc \
  -H "Content-Type: application/arc+json" \
  -d '{
    "arc": "1.0",
    "id": "req_1",
    "method": "task.create",
    "requestAgent": "test-client",
    "targetAgent": "example-agent-01",
    "params": {
      "initialMessage": {
        "role": "user",
        "parts": [{"type": "TextPart", "content": "Hello"}]
      }
    }
  }'
```

To test streaming responses:

```bash
curl -X POST http://localhost:3000/arc \
  -H "Content-Type: application/arc+json" \
  -H "Accept: text/event-stream" \
  -d '{
    "arc": "1.0",
    "id": "req_2",
    "method": "chat.start",
    "requestAgent": "test-client",
    "targetAgent": "example-agent-01",
    "params": {
      "initialMessage": {
        "role": "user",
        "parts": [{"type": "TextPart", "content": "Tell me a story"}]
      },
      "stream": true
    }
  }'
```