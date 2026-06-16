import API_BASE_URL from "../api";
import { getToken } from "./authService";

function authHeaders(method?: string): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (method && method !== "GET") headers["Content-Type"] = "application/json";
  return headers;
}

function authHeadersWithBody(): Record<string, string> {
  return authHeaders("POST");
}

export type Ticket = {
  ticketId: number;
  ticketReference: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  category: string;
  categoryId: number;
  priority: string;
  priorityId: number;
  status: string;
  statusId: number;
  createdBy: string;
  createdByUserId: number;
  assignedTo: string | null;
  assignedToUserId: number | null;
};

export type CreateTicketRequest = {
  title: string;
  description: string;
  categoryId: number;
  priorityId: number;
};

export type UpdateTicketRequest = {
  title: string;
  description: string;
  categoryId: number;
  priorityId: number;
  statusId: number;
  assignedToUserId: number | null;
};

export type LookupItem = {
  categoryId?: number;
  priorityId?: number;
  statusId?: number;
  categoryName?: string;
  priorityName?: string;
  statusName?: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type Comment = {
  ticketCommentId: number;
  ticketId: number;
  commentText: string;
  isInternal: boolean;
  createdAt: string;
  user: string;
  userId: number;
};

export type ActivityLog = {
  activityLogId: number;
  action: string;
  description: string | null;
  createdAt: string;
  user: string;
  userId: number;
};

export type AgentUser = {
  userId: number;
  fullName: string;
  email: string;
};

export type StatBucket = {
  id: number;
  label: string;
  count: number;
};

export type TicketStats = {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  byStatus: StatBucket[];
  byPriority: StatBucket[];
  byCategory: StatBucket[];
};

export type NotificationItem = {
  notificationId: number;
  userId: number;
  ticketId: number;
  ticketReference: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
};

export type TicketAttachment = {
  ticketAttachmentId: number;
  ticketId: number;
  fileName: string;
  fileType: string | null;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByUserId: number;
};

async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: authHeaders("GET") });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Request failed: ${response.status} ${text}`);
  }
  return response.json();
}

async function parseResponseSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders("POST"),
    body: JSON.stringify(body),
  });
  const result = await parseResponseSafe(response);
  if (!response.ok) throw new Error(typeof result === "object" && result !== null ? (result as Record<string, unknown>).message as string || "Request failed" : `Request failed: ${response.status}`);
  return result as T;
}

async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PUT",
    headers: authHeaders("PUT"),
    body: JSON.stringify(body),
  });
  const result = await parseResponseSafe(response);
  if (!response.ok) throw new Error(typeof result === "object" && result !== null ? (result as Record<string, unknown>).message as string || "Request failed" : `Request failed: ${response.status}`);
  return result as T;
}

async function apiPostForm<T>(url: string, body: FormData): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders("GET"),
    body,
  });
  const result = await parseResponseSafe(response);
  if (!response.ok) throw new Error(typeof result === "object" && result !== null ? (result as Record<string, unknown>).message as string || "Request failed" : `Request failed: ${response.status}`);
  return result as T;
}

async function apiDelete(url: string): Promise<void> {
  const response = await fetch(url, { method: "DELETE", headers: authHeaders("DELETE") });
  const result = await parseResponseSafe(response);
  if (!response.ok) throw new Error(typeof result === "object" && result !== null ? (result as Record<string, unknown>).message as string || "Request failed" : `Request failed: ${response.status}`);
}

export async function getTickets(): Promise<Ticket[]> {
  return apiGet(`${API_BASE_URL}/Tickets`);
}

export async function getTicketStats(): Promise<TicketStats> {
  return apiGet(`${API_BASE_URL}/Tickets/stats`);
}

export async function getTicket(id: number): Promise<Ticket> {
  return apiGet(`${API_BASE_URL}/Tickets/${id}`);
}

export async function createTicket(data: CreateTicketRequest): Promise<Ticket> {
  return apiPost(`${API_BASE_URL}/Tickets`, data);
}

export async function updateTicket(id: number, data: UpdateTicketRequest): Promise<Ticket> {
  return apiPut(`${API_BASE_URL}/Tickets/${id}`, data);
}

export async function deleteTicket(id: number): Promise<void> {
  return apiDelete(`${API_BASE_URL}/Tickets/${id}`);
}

export async function getCategories(): Promise<LookupItem[]> {
  const response = await fetch(`${API_BASE_URL}/Lookups/categories`);
  if (!response.ok) throw new Error("Failed to fetch categories");
  return response.json();
}

export async function getStatuses(): Promise<LookupItem[]> {
  const response = await fetch(`${API_BASE_URL}/Lookups/statuses`);
  if (!response.ok) throw new Error("Failed to fetch statuses");
  return response.json();
}

export async function getPriorities(): Promise<LookupItem[]> {
  const response = await fetch(`${API_BASE_URL}/Lookups/priorities`);
  if (!response.ok) throw new Error("Failed to fetch priorities");
  return response.json();
}

export async function getComments(ticketId: number): Promise<Comment[]> {
  return apiGet(`${API_BASE_URL}/Tickets/${ticketId}/TicketComments`);
}

export async function addComment(ticketId: number, commentText: string, isInternal: boolean): Promise<Comment> {
  return apiPost(`${API_BASE_URL}/Tickets/${ticketId}/TicketComments`, { commentText, isInternal });
}

export async function deleteComment(ticketId: number, commentId: number): Promise<void> {
  return apiDelete(`${API_BASE_URL}/Tickets/${ticketId}/TicketComments/${commentId}`);
}

export async function getActivityLogs(ticketId: number): Promise<ActivityLog[]> {
  return apiGet(`${API_BASE_URL}/Tickets/${ticketId}/activitylogs`);
}

export async function getAgents(): Promise<AgentUser[]> {
  return apiGet(`${API_BASE_URL}/Users/agents`);
}

export async function getNotifications(unreadOnly = false): Promise<NotificationItem[]> {
  const query = unreadOnly ? "?unreadOnly=true" : "";
  return apiGet(`${API_BASE_URL}/Notifications${query}`);
}

export async function markNotificationAsRead(notificationId: number): Promise<NotificationItem> {
  return apiPut(`${API_BASE_URL}/Notifications/${notificationId}/read`, {});
}

export async function markAllNotificationsAsRead(): Promise<{ markedRead: number }> {
  return apiPut(`${API_BASE_URL}/Notifications/read-all`, {});
}

export async function getAttachments(ticketId: number): Promise<TicketAttachment[]> {
  return apiGet(`${API_BASE_URL}/Tickets/${ticketId}/TicketAttachments`);
}

export async function uploadAttachment(ticketId: number, file: File): Promise<TicketAttachment> {
  const formData = new FormData();
  formData.append("file", file);
  return apiPostForm(`${API_BASE_URL}/Tickets/${ticketId}/TicketAttachments`, formData);
}

export async function downloadAttachment(ticketId: number, attachmentId: number, fileName: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/Tickets/${ticketId}/TicketAttachments/${attachmentId}/download`, {
    headers: authHeaders("GET"),
  });

  if (!response.ok) {
    const result = await parseResponseSafe(response);
    throw new Error(typeof result === "object" && result !== null ? (result as Record<string, unknown>).message as string || "Download failed" : `Download failed: ${response.status}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
