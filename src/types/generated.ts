/**
 * ARC Protocol - Generated TypeScript types
 * Generated from OpenAPI schema
 * DO NOT EDIT MANUALLY
 */

export interface ARCRequest {
    /** Protocol version. Must be "1.0" */
    arc: '1.0';
    /** Unique request identifier for correlation */
    id: any;
    /** Method name to be invoked */
    method: 'task.create' | 'task.send' | 'task.info' | 'task.cancel' | 'task.subscribe' | 'task.notification' | 'chat.start' | 'chat.message' | 'chat.end';
    /** ID of the agent sending the request */
    requestAgent: string;
    /** ID of the agent that should handle the request */
    targetAgent: string;
    /** Optional workflow tracking ID for multi-agent processes */
    traceId?: string;
    /** Method-specific parameters */
    params: {
};
}

export interface ARCResponse {
    /** Protocol version. Must be "1.0" */
    arc: '1.0';
    /** Must match the request ID */
    id: any;
    /** ID of the agent that processed the request */
    responseAgent: string;
    /** ID of the agent that should receive the response */
    targetAgent: string;
    /** Same workflow tracking ID from request */
    traceId?: string;
    /** Method result data (null if error occurred) */
    result?: any;
    /** Error information (null if successful) */
    error?: ErrorObject;
}

export interface TaskCreateParams {
    /** Initial message to start the task */
    initialMessage: Message;
    /** Task priority level */
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    /** Custom task metadata */
    metadata?: {
};
}

export interface TaskSendParams {
    /** Task identifier */
    taskId: string;
    /** Message object to send */
    message: Message;
}

export interface TaskInfoParams {
    /** Task identifier */
    taskId: string;
    /** Include full conversation history */
    includeMessages?: boolean;
    /** Include all generated artifacts */
    includeArtifacts?: boolean;
}

export interface TaskCancelParams {
    /** Task identifier */
    taskId: string;
    /** Reason for cancellation */
    reason?: string;
}

export interface TaskSubscribeParams {
    /** Task identifier */
    taskId: string;
    /** Webhook URL for notifications */
    callbackUrl: string;
    /** Events to subscribe to */
    events?: 'TASK_CREATED' | 'TASK_STARTED' | 'TASK_PAUSED' | 'TASK_RESUMED' | 'TASK_COMPLETED' | 'TASK_FAILED' | 'TASK_CANCELED' | 'NEW_MESSAGE' | 'NEW_ARTIFACT' | 'STATUS_CHANGE'[];
}

export interface ChatStartParams {
    /** Initial message to start the conversation */
    initialMessage: Message;
    /** Client-specified chat identifier. If not provided, server generates one */
    chatId?: string;
    /** When true, response will use Server-Sent Events (SSE) */
    stream?: boolean;
    /** Custom chat metadata */
    metadata?: {
};
}

export interface ChatMessageParams {
    /** Chat identifier */
    chatId: string;
    /** Message to send to chat */
    message: Message;
    /** When true, response will use Server-Sent Events (SSE) */
    stream?: boolean;
}

export interface ChatEndParams {
    /** Chat identifier */
    chatId: string;
    /** Reason for ending chat */
    reason?: string;
}

export interface TaskNotificationParams {
    /** Task identifier */
    taskId: string;
    /** Event type */
    event: 'TASK_CREATED' | 'TASK_STARTED' | 'TASK_PAUSED' | 'TASK_RESUMED' | 'TASK_COMPLETED' | 'TASK_FAILED' | 'TASK_CANCELED' | 'NEW_MESSAGE' | 'NEW_ARTIFACT' | 'STATUS_CHANGE';
    /** Event timestamp */
    timestamp: string;
    /** Event-specific notification data */
    data: TaskNotificationData;
}

export interface TaskResult {
    type: 'task';
    task: Task;
}

export interface ChatResult {
    type: 'chat';
    chat: Chat;
}

export interface SubscriptionResult {
    type: 'task';
    subscription: Subscription;
}

export interface SuccessResult {
    success: 'true';
    /** Optional human-readable confirmation */
    message?: string;
}

export interface Task {
    /** Server-generated unique task identifier */
    taskId: string;
    /** Current task status */
    status: 'SUBMITTED' | 'WORKING' | 'INPUT_REQUIRED' | 'COMPLETED' | 'FAILED' | 'CANCELED';
    /** ISO timestamp when task was created */
    createdAt: string;
    /** Last update timestamp */
    updatedAt?: string;
    /** Completion timestamp */
    completedAt?: string;
    /** Cancellation timestamp */
    canceledAt?: string;
    /** Reason for cancellation or failure */
    reason?: string;
    /** Task conversation history */
    messages?: Message[];
    /** Generated files and outputs */
    artifacts?: Artifact[];
}

export interface Chat {
    /** Unique chat identifier */
    chatId: string;
    /** Current chat status */
    status: 'ACTIVE' | 'PAUSED' | 'CLOSED';
    /** Latest message in the chat */
    message?: Message;
    /** Agent IDs participating in the chat */
    participants?: string[];
    /** Chat creation timestamp */
    createdAt?: string;
    /** Chat last update timestamp */
    updatedAt?: string;
    /** Chat closure timestamp */
    closedAt?: string;
    /** Reason for closure */
    reason?: string;
}

export interface Subscription {
    /** Server-generated subscription ID */
    subscriptionId: string;
    /** Task being monitored */
    taskId: string;
    /** Webhook URL */
    callbackUrl: string;
    /** Subscribed events */
    events: string[];
    /** Subscription timestamp */
    createdAt: string;
    /** Subscription status */
    active: boolean;
}

export interface Message {
    /** Message sender role */
    role: 'user' | 'agent' | 'system';
    /** Array of message parts */
    parts: MessagePart[];
    /** Message timestamp */
    timestamp?: string;
}

export interface MessagePart {
}

export interface TextPart {
    type: 'TextPart';
    /** Plain text content */
    content: string;
}

export interface DataPart {
    type: 'DataPart';
    /** Structured data content */
    content: string;
    /** MIME type of the data */
    mimeType: string;
}

export interface FilePart {
    type: 'FilePart';
    /** Base64 encoded file content */
    content: string;
    /** File MIME type */
    mimeType: string;
    /** Original filename */
    filename?: string;
}

export interface ImagePart {
    type: 'ImagePart';
    /** Base64 encoded image content */
    content: string;
    /** Image MIME type */
    mimeType: string;
    /** Image width in pixels */
    width?: number;
    /** Image height in pixels */
    height?: number;
}

export interface AudioPart {
    type: 'AudioPart';
    /** Base64 encoded audio content */
    content: string;
    /** Audio MIME type */
    mimeType: string;
    /** Audio duration in seconds */
    duration?: number;
}

export interface Artifact {
    /** Unique artifact identifier */
    artifactId: string;
    /** Human-readable artifact name */
    name: string;
    /** Artifact description */
    description?: string;
    /** Artifact content parts */
    parts: MessagePart[];
    /** Artifact creation timestamp */
    createdAt: string;
    /** Artifact version */
    version?: string;
}

export interface TaskNotificationData {
    /** Current task status */
    status: string;
    /** Human-readable description */
    message: string;
    /** Task priority (used by TASK_CREATED) */
    priority?: string;
    /** Agent ID handling the task */
    assignedAgent?: string;
    /** Timestamp when task was created */
    createdAt?: string;
    /** Timestamp when task started */
    startedAt?: string;
    /** Timestamp when task was paused */
    pausedAt?: string;
    /** Timestamp when task resumed */
    resumedAt?: string;
    /** Timestamp when task completed */
    completedAt?: string;
    /** Timestamp when task failed */
    failedAt?: string;
    /** Timestamp when task was canceled */
    canceledAt?: string;
    /** Timestamp when status changed */
    changedAt?: string;
    /** Total task duration in milliseconds */
    duration?: number;
    /** Time paused in milliseconds */
    pauseDuration?: number;
    /** Estimated duration in milliseconds */
    estimatedDuration?: number;
    /** Number of artifacts generated */
    artifactCount?: number;
    /** Number of messages in conversation */
    messageCount?: number;
    /** Agent or user ID who canceled task */
    canceledBy?: string;
    /** Human-readable reason for action */
    reason?: string;
    /** Type of input needed when paused */
    requiredInput?: string;
    /** Previous task status */
    previousStatus?: string;
    /** Structured error information */
    error?: {
};
    /** Complete Message object (for NEW_MESSAGE) */
    messageContent?: Message;
    /** Complete Artifact object (for NEW_ARTIFACT) */
    artifact?: Artifact;
}

export interface ErrorObject {
    /** Numeric error code */
    code: number;
    /** Human-readable error description */
    message: string;
    /** Optional additional error information */
    details?: {
};
}

