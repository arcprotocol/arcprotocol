# ARC Protocol Specification
**Agent Remote Communication Protocol**  
**Version 1.0**  
**Date: November 3, 2025**

---

## Table of Contents
1. [Overview](#overview)
2. [Protocol Architecture](#protocol-architecture)
3. [Message Structure](#message-structure)
4. [Error Handling](#error-handling)
5. [Agent Discovery](#agent-discovery)
6. [Method Definitions](#method-definitions)
7. [Data Types](#data-types)
8. [Authentication & Security](#authentication--security)
9. [Implementation Examples](#implementation-examples)
10. [Comparison to Existing Protocols](#comparison-to-existing-protocols)
11. [Implementation Guidelines](#implementation-guidelines)

---

## Overview

**ARC (Agent Remote Communication)** is a communication standard between agents for multi-agent systems. The protocol enables hosting multiple agent types on a single endpoint with agent-level routing via `requestAgent` and `targetAgent` fields, and provides workflow tracing capabilities designed for integration with monitoring platforms.

### Key Features
- **Multi-Agent Architecture**: Single endpoint supports multiple agents with agent identification at protocol level
- **Agent-Centric Routing**: Identify request source and target at protocol level with `requestAgent`/`targetAgent` fields
- **Workflow Tracing**: End-to-end traceability across multi-agent processes via `traceId`, designed for integration with monitoring platforms
- **Unified Deployment**: Host different agent types on single URL with agent-level routing
- **Stateless Design**: Each request is independent with no session state
- **Lightweight**: Minimal overhead with only essential fields
- **Method-Based**: Clean RPC-style method invocation
- **HTTPS Transport**: Works over HTTPS with POST requests
- **Server-Sent Events**: Support for streaming responses via SSE

### Why ARC?
Existing protocols require complex infrastructure for multi-agent scenarios. ARC solves this with:

#### **Multi-Agent Capabilities (Unique to ARC)**
- **Single Endpoint, Multiple Agents**: Deploy multiple agents behind `https://company.com/arc`
- **Agent-Level Routing**: Route to specific agents via `requestAgent` and `targetAgent` fields
- **Cross-Agent Workflows**: Agent A → Agent B → Agent C with full traceability via `traceId`
- **Unified Agent Management**: Simplified agent communication with consistent protocol

---

### Design Goals
- **Simplicity**: Easy to understand, implement, and debug
- **Agent-Focused**: Designed specifically for autonomous agent communication
- **Performance**: Low latency and minimal bandwidth overhead
- **Scalability**: Support for multi-agent systems
- **Security**: Authentication and authorization patterns
- **Observability**: Workflow tracing for integration with monitoring platforms
- **RPC Foundation**: Leverages proven RPC patterns for reliability
- **Extensible**: Optional fields allow protocol evolution without breaking changes
- **Error Handling**: Categorized error codes for debugging and monitoring

---

## Protocol Architecture

### Transport Layer
- **Protocol**: HTTPS
- **Method**: POST only
- **Endpoint**: `/arc` (recommended)
- **Content-Type**: `application/arc+json` for standard responses or `text/event-stream` for SSE streaming responses
- **Authentication**: OAuth 2.0 Bearer tokens (recommended)

ARC follows a **stateless RPC pattern** where:
- Each request is a complete, self-contained message
- Agents are identified at the protocol level via `requestAgent` and `targetAgent` fields
- Single endpoint handles all communication (`/arc`)
- HTTPS is used for transport security
- OAuth 2.0 Bearer tokens recommended for authentication
- Workflow tracing via `traceId` for integration with monitoring platforms

```
┌─────────────────┐    HTTPS POST /arc   ┌─────────────────┐
│   Agent A       │ ────────────────────> │   Agent B       │
│ (requestAgent)  │                       │ (targetAgent)   │
└─────────────────┘ <──────────────────── └─────────────────┘
                      HTTPS Response
```

### Multi-Agent Server Architecture
ARC supports single-endpoint, multi-agent deployments:
```
https://company.com/arc  ← Single endpoint
├── finance-analyzer-01
├── document-processor-03  
├── report-generator-05
└── email-sender-02
```

---

## Message Structure

### Request Object

An ARC request is represented by a JSON object with the following structure:

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `arc` | String | Yes | Protocol version. MUST be "1.0" |
| `id` | String/Number | Yes | Unique request identifier for correlation |
| `method` | String | Yes | Method name to be invoked |
| `requestAgent` | String | Yes | ID of the agent sending the request |
| `targetAgent` | String | Yes | ID of the agent that should handle the request |
| `params` | Object | Yes | Method-specific parameters |
| `traceId` | String | No | Workflow tracking ID for multi-agent processes |

### Request Structure
```json
{
  "arc": "1.0",                              // Required: Protocol version
  "id": "msg_abc123",                        // Required: Request identifier  
  "method": "task.create",                  // Required: Method to invoke
  "requestAgent": "finance-analyzer-01",     // Required: Sending agent ID
  "targetAgent": "document-processor-03",    // Required: Target agent ID
  "traceId": "trace_report_20240115_abc123", // Optional: Workflow tracking
  "params": {                                // Required: Method parameters
    "initialMessage": {
      "role": "user",
      "parts": [{"type": "TextPart", "content": "Process quarterly report"}]
    },
    "priority": "HIGH"
  }
}
```

### Response Object

An ARC response is represented by a JSON object with the following structure:

### Response Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `arc` | String | Yes | Protocol version. MUST be "1.0" |
| `id` | String/Number | Yes | MUST match the request ID |
| `responseAgent` | String | Yes | ID of the agent that processed the request |
| `targetAgent` | String | Yes | ID of the agent that should receive the response |
| `result` | Object/null | Yes* | Method result data (see Result Types below for structure) |
| `error` | Object/null | Yes* | Error information (null if successful) |
| `traceId` | String | No | Same workflow tracking ID from request |

*Note: Either `result` OR `error` must be present, but not both.

### Success Response Structure
```json
{
  "arc": "1.0",                              // Required: Protocol version
  "id": "msg_abc123",                        // Required: Matches request ID
  "responseAgent": "document-processor-03",  // Required: Responding agent ID
  "targetAgent": "finance-analyzer-01",      // Required: Target for response
  "traceId": "trace_report_20240115_abc123", // Optional: Same as request
  "result": {                                // Success result OR error (not both)
    "type": "task",
    "task": {
      "taskId": "task-12345",
      "status": "SUBMITTED",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  },
  "error": null                              // Error object if failed
}
```

### Result Types

ARC responses use different result structures depending on the operation type:

| Result Structure | Description | Used By Methods |
|------------------|-------------|-----------------|
| `{"type": "task"}` | Task-related operations that return data | `task.create`, `task.info`, `task.cancel`, `task.subscribe` |
| `{"type": "chat"}` | Chat-related operations that return data | `chat.start`, `chat.end` |
| `{"success": true}` | Simple acknowledgments for message operations | `task.send`, `chat.message` |

**Examples:**

```json
// Task data response
{
  "type": "task",
  "task": {"taskId": "task-123", "status": "SUBMITTED", ...}
}

// Chat data response  
{
  "type": "chat",
  "chat": {"chatId": "chat-456", "status": "ACTIVE", ...}
}

// Simple acknowledgment response
{
  "success": true,                     // Required: Operation success indicator
  "message": "Message sent successfully"  // Optional: Human-readable confirmation
}
```

---

## Error Handling

### Error Object Structure
When an error occurs, the `error` field MUST contain an object with:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | Number | Yes | Numeric error code (integer) |
| `message` | String | Yes | Human-readable error description |
| `details` | Any | No | Optional additional error information |

### Standard Error Codes

#### JSON-RPC Standard Errors
| Code | Description |
|------|-------------|
| -32700 | Parse error (invalid JSON) |
| -32600 | Invalid request (malformed ARC message) |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |

#### ARC-Specific Errors

**Agent Errors (-41000 to -41099)**
| Code | Description |
|------|-------------|
| -41001 | Agent not found |
| -41002 | Agent not available |
| -41003 | Agent unreachable |
| -41004 | Invalid agent ID |
| -41005 | Agent authentication failed |
| -41006 | Agent timeout |
| -41010 | Multiple agents with same ID |
| -41011 | Agent capacity exceeded |
| ... | *Reserved for future agent errors* |

**Task Errors (-42000 to -42099)**
| Code | Description |
|------|-------------|
| -42001 | Task not found |
| -42002 | Task already completed |
| -42003 | Task already canceled |
| -42004 | Task execution failed |
| -42005 | Task timeout |
| -42006 | Invalid task status transition |
| -42010 | Task priority invalid |
| -42011 | Task deadline exceeded |
| ... | *Reserved for future task errors* |

**Chat Errors (-43000 to -43099)**
| Code | Description |
|------|-------------|
| -43001 | Chat not found |
| -43002 | Chat already closed |
| -43003 | Chat timeout |
| -43004 | Chat participant limit exceeded |
| -43005 | Invalid chat message |
| -43006 | Chat buffer overflow |
| ... | *Reserved for future chat errors* |

**Security Errors (-44000 to -44099)**
| Code | Description |
|------|-------------|
| -44001 | Authentication failed |
| -44002 | Authorization failed |
| -44003 | Insufficient OAuth2 scope |
| -44004 | Token expired |
| -44005 | Token invalid |
| -44006 | Permission denied |
| -44007 | Rate limit exceeded |
| -44008 | IP address blocked |
| ... | *Reserved for future security errors* |

**Protocol Errors (-45000 to -45099)**
| Code | Description |
|------|-------------|
| -45001 | Invalid ARC version |
| -45002 | Missing required field |
| -45003 | Invalid field format |
| -45004 | Message too large |
| -45005 | Workflow trace invalid |
| -45006 | Circular reference detected |
| ... | *Reserved for future protocol errors* |

### Error Response Example
```json
{
  "arc": "1.0",
  "id": "msg_abc123",
  "responseAgent": "document-processor-03",
  "targetAgent": "finance-analyzer-01",
  "traceId": "trace_report_20240115_abc123",
  "result": null,
  "error": {
    "code": -41002,
    "message": "Agent not available",
    "details": {
      "agentId": "missing-agent",
      "suggestion": "Check agent registry"
    }
  }
}
```

---

## Agent Discovery

Agent discovery is handled through simple HTTP endpoints, separate from the ARC protocol:

### Agent Information Endpoint Example
```
GET /agent-info
```
```json
{
  "agentId": "finance-analyzer-01",
  "capabilities": ["document-analysis", "financial-reporting"],
  "prompt": [Finance analyzer agent used for ...]
  "version": "1.2.0",
  "status": "active",
  "endpoints": {
    "arc": "/arc"
  },
  "supportedMethods": [
    "agent.getCapabilities",
    "task.create",
    "task.info"
  ]
}
```

---

## Method Definitions

ARC defines **9 standard methods** across three categories:

### Method Categories Overview

#### 1. Task Methods (Asynchronous)
For long-running, asynchronous agent operations where work may take time to complete:

- **`task.create`** - Initiate a new asynchronous task with an agent. Use when you want to delegate work that may take time to complete (e.g., document analysis, report generation).

- **`task.send`** - Send additional message to an existing task. **Only used when the task status is `INPUT_REQUIRED`** - meaning the agent needs more information from you to continue processing the task.

- **`task.info`** - Retrieve current task status, conversation history, and any generated artifacts. Use to check progress or get comprehensive information when task is completed.

- **`task.cancel`** - Cancel a running task before completion. Use when you no longer need the task results or want to stop processing.

- **`task.subscribe`** - Subscribe to receive webhook notifications about task status changes. Use when you want to be notified automatically instead of polling with `task.info`.

#### 2. Chat Methods (Real-time)
For real-time, interactive agent communication where you need immediate back-and-forth conversation:

**Conversation History Management:**
ARC provides flexible support for both stateful and stateless chat interactions:
- **Stateful Chats**: When the server preserves conversation history across exchanges (like thread IDs in LangChain), a `chatId` links all messages within the same conversation.
- **Stateless Chats**: For simple request-response interactions without server-side history, `chatId` can be omitted in `chat.start`.

The `chatId` value identifies the conversation context on the server side. If the agent creates a session (like a thread ID) and keeps it active, the `chatId` corresponds to this server-side context. For agents that don't preserve conversation history, simple exchanges can be performed without chat history tracking.

- **`chat.start`** - Begin a real-time conversation with an agent, including the first message. Use for interactive scenarios like customer support, collaborative editing, or live assistance.

- **`chat.message`** - Send follow-up messages in an active chat conversation. Used when chat history is preserved by the server. Requires a valid chatId to maintain context between exchanges.

- **`chat.end`** - Terminate an active chat conversation. Used only for chats with preserved history. Requires a valid chatId to identify which persistent chat to close.

#### 3. Notification Methods (Server-initiated)
Methods that agents use to push updates back to requesters:

- **`task.notification`** - Sent by the **processing agent** to notify about task progress, completion, or status changes. The target agent that received the task uses this to report back. **This is a fire-and-forget method** where the sender doesn't expect or process the response beyond basic HTTP acknowledgment.

---

## Detailed Method Specifications

### Task Methods (Asynchronous)
For long-running, asynchronous agent operations.

#### `task.create`
Create a new asynchronous task.

**Request Params:**
```json
{
  "initialMessage": {          // Required: Initial message to start the task
    "role": "user", 
    "parts": [{"type": "TextPart", "content": "Process document"}]
  },
  "priority": "NORMAL",        // Optional: LOW, NORMAL, HIGH, URGENT
  "metadata": {                // Optional: Custom task metadata
    "deadline": "2024-01-15T17:00:00Z",
    "department": "finance",
    "EmployeeID": "35462617"
  }
}
```

**Response Result:**
```json
{
  "type": "task",               // Required: Response type indicator
  "task": {
    "taskId": "task-12345",     // Required: Server-generated unique task identifier
    "status": "SUBMITTED",      // Required: SUBMITTED, WORKING, INPUT_REQUIRED, COMPLETED, FAILED, CANCELED
    "createdAt": "2024-01-15T10:30:00Z"  // Required: ISO timestamp when task was created
  }
}
```

#### `task.send`
Send a message to an existing task.

**Request Params:**
```json
{
  "taskId": "task-12345",      // Required: Task identifier    
  "message": {                 // Required: Message object to send
    "role": "user",
    "parts": [{"type": "TextPart", "content": "Please prioritize the financial analysis"}]
  }
}
```

**Response Result:**
```json
{
  "success": true,                     // Required: Operation success indicator
  "message": "Message sent to task successfully"  // Optional: Human-readable confirmation
}
```

#### `task.info`
Retrieve task status and history.

**Request Params:**
```json
{
  "taskId": "task-12345",      // Required: Task identifier
  "includeMessages": true,     // Optional: default true – Include full conversation
  "includeArtifacts": true     // Optional: default true – Include all artifacts
}
```

**Response Result:**
```json
{
  "type": "task",
  "task": {
    "taskId": "task-12345",     // Required: Task identifier
    "status": "WORKING",        // Required: Current task status
    "createdAt": "2024-01-15T10:30:00Z",  // Required: Creation timestamp
    "updatedAt": "2024-01-15T10:35:00Z",  // Optional: Last update timestamp
    "messages": [               // Optional: Based on includeMessages parameter
      {
        "role": "user",
        "parts": [{"type": "TextPart", "content": "Process document"}],
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ],
    "artifacts": [              // Optional: Based on includeArtifacts parameter
      {
        "artifactId": "artifact-123",
        "name": "Analysis Report",
        "mimeType": "application/pdf",
        "createdAt": "2024-01-15T10:32:00Z"
      }
    ]
  }
}
```

#### `task.cancel`
Cancel an existing task.

**Request Params:**
```json
{
  "taskId": "task-12345",       // Required: Task identifier
  "reason": "Priority changed"  // Optional
}
```

**Response Result:**
```json
{
  "type": "task",
  "task": {
    "taskId": "task-12345",     // Required: Task identifier
    "status": "CANCELED",       // Required: New status after cancellation
    "canceledAt": "2024-01-15T10:40:00Z",  // Required: Cancellation timestamp
    "reason": "Priority changed"  // Optional: Cancellation reason
  }
}
```

#### `task.subscribe`
Subscribe to task notifications via webhook.

**Request Params:**
```json
{
  "taskId": "task-12345",
  "callbackUrl": "https://myserver.com/webhooks/tasks",
  "events": ["TASK_COMPLETED", "TASK_FAILED"]  // Optional: default ["TASK_COMPLETED", "TASK_FAILED"]
}
```

**Response Result:**
```json
{
  "type": "task",
  "subscription": {
    "subscriptionId": "sub-67890",  // Required: Server-generated subscription ID
    "taskId": "task-12345",         // Required: Task being monitored
    "callbackUrl": "https://myserver.com/webhooks/tasks",  // Required: Webhook URL
    "events": ["TASK_COMPLETED", "TASK_FAILED"],  // Required: Subscribed events
    "createdAt": "2024-01-15T10:30:00Z",  // Required: Subscription timestamp
    "active": true                  // Required: Subscription status
  }
}
```

**Available Events:**
- `TASK_CREATED` - Task was created  
- `TASK_STARTED` - Agent began processing
- `TASK_PAUSED` - Task paused (waiting for input)
- `TASK_RESUMED` - Task resumed processing  
- `TASK_COMPLETED` - Task finished successfully
- `TASK_FAILED` - Task failed with error
- `TASK_CANCELED` - Task was canceled
- `NEW_MESSAGE` - New message added to task
- `NEW_ARTIFACT` - New file/output generated
- `STATUS_CHANGE` - Any status transition (catch-all)

---

### Chat Methods (Real-time)
For real-time, interactive agent communication.

#### `chat.start`
Start a real-time conversation with an initial message.

**Request Params:**
```json
{
  "initialMessage": {              // Required: Initial message to start the conversation
    "role": "user",
    "parts": [{"type": "TextPart", "content": "Hello, I need help with my account"}]
  },
  "chatId": "chat-67890",     // Optional: Client-specified chat identifier. If not provided, server generates one
  "stream": true,                  // Optional (default: false): When true, response will use Server-Sent Events (SSE)
  "metadata": {                    // Optional: Custom chat metadata
    "EmployeeID": "238764638",
    "context": "customer-support"
  }
}
```

**Standard Response Result (when stream=false or omitted):**
```json
{
  "type": "chat",
  "chat": {
    "chatId": "chat-67890",   // Required
    "message": {                  // Required: The full response message
      "role": "agent",
      "parts": [
        {
          "type": "TextPart",
          "content": "Hello! I'm here to help with your account. How can I assist you today?"
        }
      ]
    },
    "participants": ["chat-agent-01"],  // Optional
    "createdAt": "2024-01-15T10:30:00Z" // Optional
  }
}
```

**Streaming Response (when stream=true):**
The server will keep the connection open and send a series of events using Server-Sent Events (SSE) format. Each chunk will contain a partial response.

**Note on SSE Response Format:** 
SSE responses intentionally use a simplified format that differs from standard ARC responses. They omit the full ARC message envelope (no arc version, id, responseAgent fields, etc.) for efficiency. This streamlined format reduces bandwidth usage and simplifies processing during streaming.

**Supported Content Types in SSE:**
All content types defined in the protocol (TextPart, DataPart, FilePart, ImagePart, AudioPart) can be streamed via SSE. Binary data types are Base64-encoded within the JSON payload:

```
event: stream
data: {"chatId": "chat-67890", "message": {"role": "agent", "parts": [{"type": "TextPart", "content": "Hello! How"}]}}

event: stream
data: {"chatId": "chat-67890", "message": {"role": "agent", "parts": [{"type": "TextPart", "content": " can I assist"}]}}

event: stream
data: {"chatId": "chat-67890", "message": {"role": "agent", "parts": [{"type": "TextPart", "content": " you today?"}]}}

event: done
data: {"chatId": "chat-67890", "status": "ACTIVE", "done": true}
```


#### `chat.message`
Continue conversation in an active chat (used for follow-up messages).

**Request Params:**
```json
{
  "chatId": "chat-67890",   // Required
  "message": {                  // Required
    "role": "user",
    "parts": [{"type": "TextPart", "content": "What's the weather like?"}]
  },
  "stream": true               // Optional (default: false): When true, response will use Server-Sent Events (SSE)
}
```

**Response Result:** 
Same format as `chat.start` - returns a complete message when `stream=false`, or uses Server-Sent Events when `stream=true`. Since `chatId` is required for this method, the response always corresponds to a stateful chat with preserved conversation history.



#### `chat.end`
End an active chat.

**Request Params:**
```json
{
  "chatId": "chat-67890",   // Required
  "reason": "Conversation completed"  // Optional
}
```

**Response Result:**
```json
{
  "type": "chat",
  "chat": {
    "chatId": "chat-67890",
    "status": "CLOSED",
    "closedAt": "2024-01-15T10:45:00Z",
    "reason": "Conversation completed"
  }
}
```

---

### Notification Methods (Server-initiated)
For server-to-client notifications.

#### `task.notification`
Server-initiated task status notification. This is a **fire-and-forget** method where the sender doesn't expect or process any specific response data beyond basic HTTP protocol requirements.

**Request Params:**
```json
{
  "taskId": "task-12345",
  "event": "TASK_COMPLETED",    // See Available Events in task.subscribe
  "timestamp": "2024-01-15T10:35:00Z",
  "data": {
    "status": "COMPLETED",        // Required: string - current task status
    "message": "Task finished successfully",  // Required: string - human-readable description
    // ... optional event-specific fields below
  }
}
```

**Response Handling:**
The receiver of a `task.notification` request SHOULD return a standard HTTP success status code (200 OK) to acknowledge receipt, but the sender SHOULD NOT depend on the response content. The sender MAY check for basic HTTP success/failure status but SHOULD NOT wait for or process detailed response data.
```json
// Simple acknowledgment (content not processed by sender)
{
  "success": true
}
```
**Available Optional Fields:**

| Field | Type | Description | Used By Events |
|-------|------|-------------|----------------|
| `priority` | string | Task priority (LOW\|NORMAL\|HIGH\|URGENT) | TASK_CREATED |
| `assignedAgent` | string | Agent ID handling the task | TASK_CREATED |
| `createdAt` | string | ISO timestamp when task was created | TASK_CREATED, NEW_ARTIFACT |
| `startedAt` | string | ISO timestamp when task started | TASK_STARTED |
| `pausedAt` | string | ISO timestamp when task was paused | TASK_PAUSED |
| `resumedAt` | string | ISO timestamp when task resumed | TASK_RESUMED |
| `completedAt` | string | ISO timestamp when task completed | TASK_COMPLETED |
| `failedAt` | string | ISO timestamp when task failed | TASK_FAILED |
| `canceledAt` | string | ISO timestamp when task was canceled | TASK_CANCELED |
| `changedAt` | string | ISO timestamp when status changed | STATUS_CHANGE |
| `duration` | number | Total task duration in milliseconds | TASK_COMPLETED, TASK_FAILED |
| `pauseDuration` | number | Time paused in milliseconds | TASK_RESUMED |
| `estimatedDuration` | number | Estimated duration in milliseconds | TASK_STARTED |
| `artifactCount` | number | Number of artifacts generated | TASK_COMPLETED |
| `messageCount` | number | Number of messages in conversation | TASK_COMPLETED |
| `canceledBy` | string | Agent or user ID who canceled task | TASK_CANCELED |
| `reason` | string | Human-readable reason for action | TASK_PAUSED, TASK_CANCELED, STATUS_CHANGE |
| `requiredInput` | string | Type of input needed when paused | TASK_PAUSED |
| `previousStatus` | string | Previous task status | STATUS_CHANGE |
| `error` | object | Structured error information | TASK_FAILED |
| `messageContent` | object | Complete Message object | NEW_MESSAGE |
| `artifact` | object | Complete Artifact object | NEW_ARTIFACT |

---

## Data Types

### Core Objects

#### Message
```json
{
  "role": "user",              // Required: user, agent, system
  "parts": [                   // Required: Array of message parts
    {
      "type": "TextPart",      // Required: TextPart, DataPart, FilePart, ImagePart, AudioPart
      "content": "Hello world"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"  // Optional
}
```

#### Part Types
- **TextPart**: Plain text content
- **DataPart**: Structured data with MIME type
- **FilePart**: File attachment with metadata  
- **ImagePart**: Image data with format info
- **AudioPart**: Audio data with encoding info

#### Chat
```json
{
  "chatId": "chat-67890",           // Required: Unique identifier for the chat session
  "status": "ACTIVE",               // Required: ACTIVE, PAUSED, CLOSED
  "message": {                      // Optional: Latest message in the chat
    "role": "agent",
    "parts": [{"type": "TextPart", "content": "Hello! How can I assist you today?"}]
  },
  "participants": ["user-01", "agent-01"],  // Optional: List of participants in the chat
  "createdAt": "2024-01-15T10:30:00Z",      // Required: When the chat was created
  "updatedAt": "2024-01-15T10:35:00Z",      // Optional: When the chat was last updated
  "metadata": {                             // Optional: Additional chat information
    "subject": "Account Help",
    "priority": "NORMAL"
  }
}
```

#### Artifact
```json
{
  "artifactId": "artifact-123",
  "name": "Quarterly Report",
  "description": "Q4 2024 financial analysis",
  "parts": [
    {"type": "FilePart", "content": "...", "mimeType": "application/pdf"}
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "version": "1.0"
}
```

---

## Authentication & Security

### Transport-Level Authentication
ARC recommends **OAuth 2.0 Bearer tokens** for authentication:

```http
POST /arc
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "arc": "1.0",
  "method": "task.create",
  ...
}
```

### Required OAuth2 Scopes

ARC implementations SHOULD use the following OAuth2 scope pattern: `arc.{domain}.{role}`

#### Communication Role Scopes
- `arc.agent.caller` - Initiate requests to other agents
- `arc.agent.receiver` - Receive and process requests, send notifications/chunks

#### Operation Controller Scopes  
- `arc.task.controller` - Full control over task operations
- `arc.chat.controller` - Full control over chat operations
- `arc.task.notify` - Send task notifications


#### Scope-to-Method Authorization Matrix
| Method | Required Scopes | Agent Role |
|--------|----------------|------------|
| `task.create` | `arc.task.controller` + `arc.agent.caller` | Requesting agent initiates task |
| `task.send` | `arc.task.controller` + `arc.agent.caller` | Requesting agent sends to task |
| `task.info` | `arc.task.controller` + `arc.agent.caller` | Requesting agent gets task info |
| `task.cancel` | `arc.task.controller` + `arc.agent.caller` | Requesting agent cancels task |
| `task.subscribe` | `arc.task.controller` + `arc.agent.caller` | Requesting agent subscribes |
| `task.notification` | `arc.task.notify` + `arc.agent.receiver` | Target agent notifies about task |
| `chat.start` | `arc.chat.controller` + `arc.agent.caller` | Requesting agent starts chat |
| `chat.message` | `arc.chat.controller` + `arc.agent.caller` | Requesting agent sends message |
| `chat.end` | `arc.chat.controller` + `arc.agent.caller` | Requesting agent ends chat |


#### Common Access Patterns
```
# Task-focused requesting agent
scopes: "arc.task.controller arc.agent.caller"

# Chat-focused requesting agent  
scopes: "arc.chat.controller arc.agent.caller"

# Full requesting agent (can initiate both tasks and chats)
scopes: "arc.task.controller arc.chat.controller arc.agent.caller"

# Task processing agent (receives tasks, sends notifications)
scopes: "arc.task.notify arc.agent.receiver"

# Chat processing agent (receives chats)  
scopes: "arc.chat.controller arc.agent.receiver"

# Full processing agent (can handle both tasks and chats)
scopes: "arc.task.notify arc.chat.controller arc.agent.receiver"
```

---

## Implementation Examples

### Basic Task Creation
```json
// Request
{
  "arc": "1.0",
  "id": "req_001", 
  "method": "task.create",
  "requestAgent": "user-interface-01",
  "targetAgent": "document-analyzer-01",
  "params": {
    "initialMessage": {
      "role": "user",
      "parts": [
        {
          "type": "TextPart",
          "content": "Analyze the uploaded financial report for key insights"
        },
        {
          "type": "FilePart",
          "content": "base64encodedpdf...",
          "mimeType": "application/pdf",
          "filename": "Q4-2024-Report.pdf"
        }
      ]
    },
    "priority": "HIGH",
    "metadata": {
      "deadline": "2024-01-15T17:00:00Z",
      "userId": "user-123"
    }
  }
}

// Response
{
  "arc": "1.0",
  "id": "req_001",
  "responseAgent": "document-analyzer-01", 
  "targetAgent": "user-interface-01",
  "result": {
    "type": "task",
    "task": {
      "taskId": "task-fin-analysis-456",
      "status": "SUBMITTED",
      "createdAt": "2024-01-15T09:30:00Z",
      "messages": [],
      "artifacts": []
    }
  }
}
```

### Multi-Agent Workflow with Tracing
```json
// Step 1: User → Document Agent
{
  "arc": "1.0",
  "id": "req_001",
  "method": "task.create", 
  "requestAgent": "user-interface-01",
  "targetAgent": "document-processor-01",
  "traceId": "workflow_quarterly_report_789",
  "params": {
    "initialMessage": {
      "role": "user", 
      "parts": [{"type": "TextPart", "content": "Extract data from quarterly report"}]
    }
  }
}

// Step 2: Document Agent → Chart Agent (same traceId)
{
  "arc": "1.0",
  "id": "req_002",
  "method": "task.create",
  "requestAgent": "document-processor-01", 
  "targetAgent": "chart-generator-01",
  "traceId": "workflow_quarterly_report_789",  // Same trace!
  "params": {
    "initialMessage": {
      "role": "agent",
      "parts": [
        {"type": "TextPart", "content": "Generate charts from extracted data"},
        {"type": "DataPart", "content": "{\"revenue\": 1000000}", "mimeType": "application/json"}
      ]
    }
  }
}
```

### Real-time Chat Example with SSE
```json
// Start Chat with SSE streaming
{
  "arc": "1.0",
  "id": "req_003",
  "method": "chat.start",
  "requestAgent": "chat-interface-01",
  "targetAgent": "conversational-ai-01",
  "params": {
    "initialMessage": {
      "role": "user",
      "parts": [{"type": "TextPart", "content": "Hello, I need help with my account"}]
    },
    "stream": true,
    "metadata": {
      "sessionId": "customer-session-123",
      "context": "technical-support"
    }
  }
}

// SSE Response (Server-Sent Events)
event: chat
data: {"chatId": "chat-67890", "message": {"role": "agent", "parts": [{"type": "TextPart", "content": "Hello! I'm"}]}}

event: chat
data: {"chatId": "chat-67890", "message": {"role": "agent", "parts": [{"type": "TextPart", "content": " here to"}]}}

event: chat
data: {"chatId": "chat-67890", "message": {"role": "agent", "parts": [{"type": "TextPart", "content": " help with your account."}]}}

event: done
data: {"chatId": "chat-abc456", "status": "ACTIVE", "done": true}

// Send follow-up message with streaming
{
  "arc": "1.0", 
  "id": "req_004",
  "method": "chat.message",
  "requestAgent": "chat-interface-01",
  "targetAgent": "conversational-ai-01",
  "params": {
    "chatId": "chat-67890",
    "message": {
      "role": "user",
      "parts": [{"type": "TextPart", "content": "How do I reset my password?"}]
    },
    "stream": true
  }
}
```

---

## Comparison to Existing Protocols

### Agent Protocol Comparison

| Feature | ARC | ACP (Agent Communication Protocol) | A2A (Agent-to-Agent) |
|---------|-----|-----------------------------------|----------------------|
| **Primary Purpose** | Agent communication standard | Agent lifecycle management | Agent interoperability |
| **Agent Identification** | `requestAgent`/`targetAgent` fields | Agent URI | Agent Cards |
| **Workflow Tracing** | `traceId` for monitoring integration | Built-in tracing | Task tracking |
| **Message Format** | JSON-based | REST/MIME-based | JSON-based |
| **Transport** | HTTPS | REST/HTTP | HTTP/SSE |
| **Real-time Support** | SSE streaming | Streaming | SSE/Webhook |
| **Agent Discovery** | Separate API | Offline discovery | Agent Cards |
| **Authentication** | OAuth 2.0 | Multiple methods | OAuth/JWT |
| **Governance** | Open | Linux Foundation | Google-led |
| **Multimodal Support** | Multiple part types | Native | Multiple formats |
| **Current Status** | Active development | Active development | Active development |

### Key Advantages of ARC

1. **Agent-First Design**: Unlike generic communication specifications, ARC is purpose-built for agent communication with agent-level routing and workflow tracing
2. **Lightweight & Focused**: ARC provides a minimal yet powerful protocol specifically designed for multi-agent systems
3. **Agent-Centric Routing**: Identify request source and target at protocol level with `requestAgent`/`targetAgent` fields
4. **Workflow Tracing**: Support for tracing across multi-agent workflows, designed for integration with monitoring platforms

---

**ARC Protocol v1.0** - Agent Remote Communication Protocol
*A stateless, lightweight remote procedure call (RPC) protocol for multi-agent systems with workflow tracing capabilities*

Copyright © 2025. Licensed under Apache License 2.0.