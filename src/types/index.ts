/**
 * ARC Protocol TypeScript type definitions
 * 
 * This file contains the TypeScript type definitions for the ARC Protocol,
 * based on the official protocol specification.
 * 
 * @version 1.0.0
 */

// === Core Types ===

/**
 * Role of a message sender (user, agent, or system)
 */
export enum Role {
  USER = 'user',
  AGENT = 'agent',
  SYSTEM = 'system'
}

/**
 * Type of content in a message part
 */
export enum PartType {
  TEXT_PART = 'TextPart',
  DATA_PART = 'DataPart',
  FILE_PART = 'FilePart',
  IMAGE_PART = 'ImagePart',
  AUDIO_PART = 'AudioPart'
}

/**
 * Data encoding format
 */
export enum Encoding {
  BASE64 = 'base64',
  UTF8 = 'utf8',
  BINARY = 'binary'
}

/**
 * Status of an asynchronous task
 */
export enum TaskStatus {
  SUBMITTED = 'SUBMITTED',
  WORKING = 'WORKING',
  INPUT_REQUIRED = 'INPUT_REQUIRED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED'
}

/**
 * Status of a chat session
 */
export enum ChatStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED'
}

/**
 * Priority level for tasks
 */
export enum Priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

/**
 * Types of task notification events
 */
export enum EventType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_STARTED = 'TASK_STARTED',
  TASK_PAUSED = 'TASK_PAUSED',
  TASK_RESUMED = 'TASK_RESUMED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_FAILED = 'TASK_FAILED',
  TASK_CANCELED = 'TASK_CANCELED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  NEW_ARTIFACT = 'NEW_ARTIFACT',
  STATUS_CHANGE = 'STATUS_CHANGE'
}

/**
 * Result type indicator
 */
export enum ResultType {
  TASK = 'task',
  CHAT = 'chat',
  SUBSCRIPTION = 'subscription',
  SUCCESS = 'success'
}

// === Base Models ===

/**
 * Message part containing text or binary content
 */
export interface Part {
  type: PartType;
  content?: any;
  mimeType?: string;
  filename?: string;
  size?: number;
  encoding?: Encoding;
}

/**
 * Message object containing content from a user, agent, or system
 */
export interface Message {
  role: Role;
  parts: Part[];
  timestamp?: string;
  agentId?: string;
}

/**
 * Artifact generated during task execution
 */
export interface Artifact {
  artifactId: string;
  name: string;
  description?: string;
  parts: Part[];
  createdAt?: string;
  createdBy?: string;
  version?: string;
  metadata?: Record<string, any>;
}

/**
 * Task object representing an asynchronous agent task
 */
export interface TaskObject {
  taskId: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt?: string;
  assignedAgent?: string;
  messages?: Message[];
  artifacts?: Artifact[];
  metadata?: Record<string, any>;
}

/**
 * Chat object representing a real-time communication session
 */
export interface ChatObject {
  chatId: string;
  status: ChatStatus;
  message?: Message;
  participants?: string[];
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Subscription for task notifications
 */
export interface SubscriptionObject {
  subscriptionId: string;
  taskId: string;
  callbackUrl: string;
  events: EventType[];
  createdAt?: string;
  active?: boolean;
}

/**
 * Error information for failed requests
 */
export interface ErrorObject {
  code: number;
  message: string;
  details?: any;
}

// === Method Parameter Types ===

/**
 * Parameters for task.create method
 */
export interface TaskCreateParams {
  initialMessage: Message;
  priority?: Priority;
  metadata?: Record<string, any>;
}

/**
 * Parameters for task.send method
 */
export interface TaskSendParams {
  taskId: string;
  message: Message;
}

/**
 * Parameters for task.info method
 */
export interface TaskInfoParams {
  taskId: string;
  includeMessages?: boolean;
  includeArtifacts?: boolean;
}

/**
 * Parameters for task.cancel method
 */
export interface TaskCancelParams {
  taskId: string;
  reason?: string;
}

/**
 * Parameters for task.subscribe method
 */
export interface TaskSubscribeParams {
  taskId: string;
  callbackUrl: string;
  events?: EventType[];
}

/**
 * Parameters for task.notification method
 */
export interface TaskNotificationParams {
  taskId: string;
  event: EventType;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Parameters for chat.start method
 */
export interface ChatStartParams {
  initialMessage: Message;
  chatId?: string;
  stream?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Parameters for chat.message method
 */
export interface ChatMessageParams {
  chatId: string;
  message: Message;
  stream?: boolean;
}

/**
 * Parameters for chat.end method
 */
export interface ChatEndParams {
  chatId: string;
  reason?: string;
}

// === Result Types ===

/**
 * Result containing task data
 */
export interface TaskResult {
  type: ResultType.TASK;
  task: TaskObject;
}

/**
 * Result containing chat data
 */
export interface ChatResult {
  type: ResultType.CHAT;
  chat: ChatObject;
}

/**
 * Result containing subscription data
 */
export interface SubscriptionResult {
  type: ResultType.SUBSCRIPTION;
  subscription: SubscriptionObject;
}

/**
 * Simple success result
 */
export interface SuccessResult {
  success: boolean;
  message?: string;
}

/**
 * Combined result type for all possible results
 */
export type MethodResult = TaskResult | ChatResult | SubscriptionResult | SuccessResult;

// === Request/Response Types ===

/**
 * ARC protocol request
 */
export interface ARCRequest {
  arc: string;
  id: string | number;
  method: string;
  requestAgent: string;
  targetAgent: string;
  params: Record<string, any>;
  traceId?: string;
}

/**
 * ARC protocol response
 */
export interface ARCResponse {
  arc: string;
  id: string | number;
  responseAgent: string;
  targetAgent: string;
  result?: Record<string, any> | null;
  error?: ErrorObject | null;
  traceId?: string;
}

// === Method-Specific Types ===

export interface TaskMethods {
  create: (params: TaskCreateParams) => Promise<TaskResult>;
  send: (params: TaskSendParams) => Promise<SuccessResult>;
  info: (params: TaskInfoParams) => Promise<TaskResult>;
  cancel: (params: TaskCancelParams) => Promise<TaskResult>;
  subscribe: (params: TaskSubscribeParams) => Promise<SubscriptionResult>;
  notification: (params: TaskNotificationParams) => Promise<SuccessResult>;
}

export interface ChatMethods {
  start: (params: ChatStartParams) => Promise<ChatResult>;
  message: (params: ChatMessageParams) => Promise<ChatResult>;
  end: (params: ChatEndParams) => Promise<ChatResult>;
}

// === SSE Types ===

/**
 * Server-Sent Event data for chat streaming
 */
export interface ChatStreamEvent {
  chatId: string;
  message: Message;
}

/**
 * Server-Sent Event data for completion
 */
export interface ChatDoneEvent {
  chatId: string;
  status: ChatStatus;
  done: boolean;
}