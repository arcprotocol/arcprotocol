# ARC Protocol API Reference

This document provides a comprehensive reference of the ARC Protocol API for both client and server implementations.

## Contents

- [Client API](#client-api)
- [Server API](#server-api)
- [Types](#types)
- [Error Handling](#error-handling)

## Client API

The ARC Protocol provides a client implementation for making requests to ARC-compatible servers.

### ARCClient

Main client class for agent communication.

#### Constructor

```typescript
constructor(options: ARCClientOptions)
```

**Parameters:**
- `options`: Configuration options for the client.
  - `endpoint`: The ARC endpoint URL.
  - `requestAgent`: ID of the agent making requests.
  - `token?`: OAuth2 bearer token for authentication.
  - `timeout?`: Request timeout in seconds (default: 60).
  - `verifySSL?`: Whether to verify SSL certificates (default: true).

#### Task Methods

##### task.create

Create a new asynchronous task.

```typescript
async task.create(
  params: TaskCreateParams,
  targetAgent: string,
  traceId?: string,
  timeout?: number
): Promise<TaskResult>
```

**Parameters:**
- `params`: Task creation parameters.
  - `initialMessage`: Initial message to start the task.
  - `priority?`: Task priority (LOW, NORMAL, HIGH, URGENT).
  - `metadata?`: Custom task metadata.
- `targetAgent`: ID of the agent that should handle the task.
- `traceId?`: Workflow tracking ID for multi-agent processes.
- `timeout?`: Request timeout in seconds.

**Returns:** Task creation result.

##### task.send

Send a message to an existing task.

```typescript
async task.send(
  params: TaskSendParams,
  targetAgent: string,
  traceId?: string,
  timeout?: number
): Promise<SuccessResult>
```

**Parameters:**
- `params`: Task message parameters.
  - `taskId`: Task identifier.
  - `message`: Message object to send.
- `targetAgent`: ID of the agent that should handle the task.
- `traceId?`: Workflow tracking ID for multi-agent processes.
- `timeout?`: Request timeout in seconds.

**Returns:** Success result.

##### task.info

Get information about a task.

```typescript
async task.info(
  params: TaskInfoParams,
  targetAgent: string,
  traceId?: string,
  timeout?: number
): Promise<TaskResult>
```

**Parameters:**
- `params`: Task info parameters.
  - `taskId`: Task identifier.
  - `includeMessages?`: Whether to include conversation history (default: true).
  - `includeArtifacts?`: Whether to include artifacts (default: true).
- `targetAgent`: ID of the agent that should handle the task.
- `traceId?`: Workflow tracking ID for multi-agent processes.
- `timeout?`: Request timeout in seconds.

**Returns:** Task info result.

##### task.cancel

Cancel an existing task.

```typescript
async task.cancel(
  params: TaskCancelParams,
  targetAgent: string,
  traceId?: string,
  timeout?: number
): Promise<TaskResult>
```

**Parameters:**
- `params`: Task cancellation parameters.
  - `taskId`: Task identifier.
  - `reason?`: Cancellation reason.
- `targetAgent`: ID of the agent that should handle the task.
- `traceId?`: Workflow tracking ID for multi-agent processes.
- `timeout?`: Request timeout in seconds.

**Returns:** Task cancellation result.

##### task.subscribe

Subscribe to task notifications.

```typescript
async task.subscribe(
  params: TaskSubscribeParams,
  targetAgent: string,
  traceId?: string,
  timeout?: number
): Promise<SubscriptionResult>
```

**Parameters:**
- `params`: Task subscription parameters.
  - `taskId`: Task identifier.
  - `callbackUrl`: URL to receive webhook notifications.
  - `events?`: Events to subscribe to.
- `targetAgent`: ID of the agent that should handle the task.
- `traceId?`: Workflow tracking ID for multi-agent processes.
- `timeout?`: Request timeout in seconds.

**Returns:** Subscription result.

##### task.notification

Send a task notification.

```typescript
async task.notification(
  params: TaskNotificationParams,
  targetAgent: string,
  traceId?: string,
  timeout?: number
): Promise<SuccessResult>
```

**Parameters:**
- `params`: Task notification parameters.
  - `taskId`: Task identifier.
  - `event`: Event type.
  - `timestamp`: Event timestamp.
  - `data`: Event data.
- `targetAgent`: ID of the agent that should receive the notification.
- `traceId?`: Workflow tracking ID for multi-agent processes.
- `timeout?`: Request timeout in seconds.

**Returns:** Success result.

#### Chat Methods

##### chat.start

Start a real-time chat.

```typescript
async chat.start(
  params: ChatStartParams,
  targetAgent: string,
  traceId?: string,
  timeout?: number
): Promise<ChatResult | AsyncIterator<any>>
```

**Parameters:**
- `params`: Chat start parameters.
  - `initialMessage`: Initial message to start the conversation.
  - `chatId?`: Client-specified chat identifier.
  - `stream?`: Whether to use streaming responses (default: false).
  - `metadata?`: Custom chat metadata.
- `targetAgent`: ID of the agent that should handle the chat.
- `traceId?`: Workflow tracking ID for multi-agent processes.
- `timeout?`: Request timeout in seconds.

**Returns:** Chat result or streaming response iterator.

##### chat.message

Send a message to an active chat.

```typescript
async chat.message(
  params: ChatMessageParams,
  targetAgent: string,
  traceId?: string,
  timeout?: number
): Promise<ChatResult | AsyncIterator<any>>
```

**Parameters:**
- `params`: Chat message parameters.
  - `chatId`: Chat identifier.
  - `message`: Message object to send.
  - `stream?`: Whether to use streaming responses (default: false).
- `targetAgent`: ID of the agent that should handle the chat.
- `traceId?`: Workflow tracking ID for multi-agent processes.
- `timeout?`: Request timeout in seconds.

**Returns:** Chat result or streaming response iterator.

##### chat.end

End an active chat.

```typescript
async chat.end(
  params: ChatEndParams,
  targetAgent: string,
  traceId?: string,
  timeout?: number
): Promise<ChatResult>
```

**Parameters:**
- `params`: Chat end parameters.
  - `chatId`: Chat identifier.
  - `reason?`: End reason.
- `targetAgent`: ID of the agent that should handle the chat.
- `traceId?`: Workflow tracking ID for multi-agent processes.
- `timeout?`: Request timeout in seconds.

**Returns:** Chat result.

## Server API

The ARC Protocol provides a server implementation for handling ARC requests.

### ARCServer

Main server class for agent communication.

#### Constructor

```typescript
constructor(options: ARCServerOptions)
```

**Parameters:**
- `options`: Configuration options for the server.
  - `agentId`: ID of this agent.
  - `name?`: Agent name.
  - `version?`: Agent version.
  - `agentDescription?`: Agent description.
  - `enableCors?`: Enable CORS (default: true).
  - `enableValidation?`: Enable request validation (default: true).
  - `enableLogging?`: Enable request logging (default: true).
  - `enableAuth?`: Enable authentication (default: false).
  - `requiredScopes?`: OAuth2 scope requirements for methods.
  - `authValidator?`: Authentication validator function.

#### Methods

##### registerHandler

Register a method handler.

```typescript
registerHandler<T = any, R = any>(method: string, handler: MethodHandler<T, R>): void
```

**Parameters:**
- `method`: Method name (e.g., "task.create").
- `handler`: Handler function that processes the request.

##### setRequiredScopes

Set required OAuth2 scopes for a method.

```typescript
setRequiredScopes(method: string, scopes: string[]): void
```

**Parameters:**
- `method`: Method name.
- `scopes`: Required OAuth2 scopes.

##### handleRequest

Handle an ARC protocol request.

```typescript
async handleRequest(requestData: ARCRequest, authHeader?: string): Promise<ARCResponse>
```

**Parameters:**
- `requestData`: Raw ARC request object.
- `authHeader?`: Authorization header value.

**Returns:** ARC response object.

##### getAgentInfo

Get agent information.

```typescript
getAgentInfo(): Record<string, any>
```

**Returns:** Agent information object.

### Express Middleware

```typescript
function createExpressMiddleware(server: ARCServer): (req: any, res: any, next: any) => Promise<void>
```

**Parameters:**
- `server`: ARC server instance.

**Returns:** Express middleware function.

## Types

The ARC Protocol defines the following key types:

### Enums

- `Role`: Message role (user, agent, or system).
- `PartType`: Message part type (TextPart, DataPart, FilePart, ImagePart, AudioPart).
- `Encoding`: Data encoding format (base64, utf8, binary).
- `TaskStatus`: Task status values (SUBMITTED, WORKING, INPUT_REQUIRED, COMPLETED, FAILED, CANCELED).
- `ChatStatus`: Chat status values (ACTIVE, PAUSED, CLOSED).
- `Priority`: Task priority levels (LOW, NORMAL, HIGH, URGENT).
- `EventType`: Task notification event types.
- `ResultType`: Result type indicator (task, chat, subscription, success).

### Interfaces

- `Part`: Message part containing text or binary content.
- `Message`: Message object containing content from a user, agent, or system.
- `Artifact`: Artifact generated during task execution.
- `TaskObject`: Task object representing an asynchronous agent task.
- `ChatObject`: Chat object representing a real-time communication session.
- `SubscriptionObject`: Subscription for task notifications.
- `ErrorObject`: Error information for failed requests.
- `ARCRequest`: ARC protocol request.
- `ARCResponse`: ARC protocol response.
- Various parameter and result interfaces for specific methods.

## Error Handling

The ARC Protocol defines standard error codes for various error situations:

### JSON-RPC Standard Errors
- -32700: Parse error (invalid JSON)
- -32600: Invalid request (malformed ARC message)
- -32601: Method not found
- -32602: Invalid params
- -32603: Internal error

### ARC-Specific Errors
- Agent Errors (-41000 to -41099)
- Task Errors (-42000 to -42099)
- Chat Errors (-43000 to -43099)
- Security Errors (-44000 to -44099)
- Protocol Errors (-45000 to -45099)

For details, see the full protocol specification.