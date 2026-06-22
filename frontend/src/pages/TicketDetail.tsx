import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser, logoutUser } from "../services/authService";
import {
  getTicket,
  updateTicket,
  deleteTicket,
  getCategories,
  getStatuses,
  getPriorities,
  getComments,
  addComment,
  deleteComment,
  getActivityLogs,
  getAgents,
  getAttachments,
  uploadAttachment,
  downloadAttachment,
  type Ticket,
  type LookupItem,
  type Comment,
  type ActivityLog,
  type AgentUser,
  type TicketAttachment,
} from "../services/ticketService";
import NotificationBell from "../components/NotificationBell";
import {
  generateTicketSummary,
  getTroubleshootingSuggestions,
} from "../services/aiService";

const statusStyles: Record<string, string> = {
  Open: "bg-[#e6faf5] text-[#0b8e79] border-[#b8ecdc]",
  "In Progress": "bg-[#e8f7fb] text-[#1a7a8c] border-[#c5e8ef]",
  Pending: "bg-[#fef6e8] text-[#9a6b1a] border-[#f0ddb0]",
  Resolved: "bg-[#d7ffe9] text-[#0b8e79] border-[#a8f0d0]",
  Closed: "bg-[#eef1ef] text-[#586760] border-[#dde0dc]",
};

const priorityStyles: Record<string, string> = {
  Low: "bg-[#eef1ef] text-[#586760] border-[#dde0dc]",
  Medium: "bg-[#e8f7fb] text-[#1a7a8c] border-[#c5e8ef]",
  High: "bg-[#fef6e8] text-[#9a6b1a] border-[#f0ddb0]",
  Critical: "bg-[#fdeef2] text-[#b83d5e] border-[#f5ccd8]",
};

const actionColors: Record<string, string> = {
  Created: "bg-[#12d9a8]",
  "Status Updated": "bg-[#17cae6]",
  Assigned: "bg-[#e8b84a]",
  Updated: "bg-[#8a9690]",
  "Comment Added": "bg-[#19b99a]",
  "Attachment Uploaded": "bg-[#8a9690]",
};

const allowedAttachmentExtensions = [".png", ".jpg", ".jpeg", ".pdf", ".doc", ".docx"];
const maxAttachmentSize = 10 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function hasAllowedAttachmentExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const extension = fileName.slice(dotIndex).toLowerCase();
  return allowedAttachmentExtensions.includes(extension);
}

function SparkIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentUser] = useState(() => getCurrentUser());
  const canAssign = currentUser?.role === "Admin";

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priorityId, setPriorityId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [statuses, setStatuses] = useState<LookupItem[]>([]);
  const [priorities, setPriorities] = useState<LookupItem[]>([]);
  const [agents, setAgents] = useState<AgentUser[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [comments, setComments] = useState<Comment[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentInternal, setCommentInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [attachmentInputKey, setAttachmentInputKey] = useState(0);
  const [aiAction, setAIAction] = useState<"summary" | "troubleshooting" | null>(null);
  const [aiSummary, setAISummary] = useState("");
  const [aiTroubleshooting, setAITroubleshooting] = useState("");
  const [aiError, setAIError] = useState("");

  function populateForm(t: Ticket) {
    setTitle(t.title);
    setDescription(t.description);
    setCategoryId(String(t.categoryId));
    setPriorityId(String(t.priorityId));
    setStatusId(String(t.statusId));
    setAssignedToUserId(t.assignedToUserId ? String(t.assignedToUserId) : "");
  }

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const [ticketData, cats, sts, pris, agts, cmts, logs, files] = await Promise.all([
          getTicket(Number(id)),
          getCategories(),
          getStatuses(),
          getPriorities(),
          canAssign ? getAgents().catch(() => [] as AgentUser[]) : Promise.resolve([] as AgentUser[]),
          getComments(Number(id)).catch(() => [] as Comment[]),
          getActivityLogs(Number(id)).catch(() => [] as ActivityLog[]),
          getAttachments(Number(id)).catch(() => [] as TicketAttachment[]),
        ]);
        setTicket(ticketData);
        setCategories(cats);
        setStatuses(sts);
        setPriorities(pris);
        setAgents(agts);
        setComments(cmts);
        setActivityLogs(logs);
        setAttachments(files);
        populateForm(ticketData);
      } catch {
        setError("Failed to load ticket.");
      } finally {
        setLoading(false);
      }
    })();
  }, [canAssign, currentUser, id, navigate]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required.";
    if (!description.trim()) errs.description = "Description is required.";
    if (!categoryId) errs.categoryId = "Please select a category.";
    if (!priorityId) errs.priorityId = "Please select a priority.";
    if (!statusId) errs.statusId = "Please select a status.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      setError("");
      const updated = await updateTicket(Number(id), {
        title: title.trim(),
        description: description.trim(),
        categoryId: parseInt(categoryId),
        priorityId: parseInt(priorityId),
        statusId: parseInt(statusId),
        assignedToUserId: canAssign ? (assignedToUserId ? parseInt(assignedToUserId) : null) : ticket?.assignedToUserId ?? null,
      });
      setTicket(updated);
      setEditing(false);
      const [cmts, logs] = await Promise.all([
        getComments(Number(id)).catch(() => [] as Comment[]),
        getActivityLogs(Number(id)).catch(() => [] as ActivityLog[]),
      ]);
      setComments(cmts);
      setActivityLogs(logs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update ticket.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      await deleteTicket(Number(id));
      navigate("/tickets");
    } catch {
      setError("Failed to delete ticket.");
      setDeleting(false);
    }
  }

  function cancelEdit() {
    if (ticket) {
      populateForm(ticket);
    }
    setEditing(false);
    setErrors({});
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await addComment(Number(id), newComment.trim(), commentInternal);
      setNewComment("");
      const [cmts, logs] = await Promise.all([
        getComments(Number(id)).catch(() => [] as Comment[]),
        getActivityLogs(Number(id)).catch(() => [] as ActivityLog[]),
      ]);
      setComments(cmts);
      setActivityLogs(logs);
    } catch {
      setError("Failed to add comment.");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await deleteComment(Number(id), commentId);
      setComments(comments.filter((c) => c.ticketCommentId !== commentId));
    } catch {
      setError("Failed to delete comment.");
    }
  }

  async function handleUploadAttachment(e: React.FormEvent) {
    e.preventDefault();
    setAttachmentError("");

    if (!selectedAttachment) {
      setAttachmentError("Please choose a file to upload.");
      return;
    }

    if (!hasAllowedAttachmentExtension(selectedAttachment.name)) {
      setAttachmentError("Only png, jpg, jpeg, pdf, doc, and docx files are allowed.");
      return;
    }

    if (selectedAttachment.size > maxAttachmentSize) {
      setAttachmentError("File size must be 10 MB or less.");
      return;
    }

    try {
      setUploadingAttachment(true);
      const uploaded = await uploadAttachment(Number(id), selectedAttachment);
      setAttachments((items) => [uploaded, ...items]);
      setSelectedAttachment(null);
      setAttachmentInputKey((key) => key + 1);
      const logs = await getActivityLogs(Number(id)).catch(() => [] as ActivityLog[]);
      setActivityLogs(logs);
    } catch (err: unknown) {
      setAttachmentError(err instanceof Error ? err.message : "Failed to upload attachment.");
    } finally {
      setUploadingAttachment(false);
    }
  }

  async function handleDownloadAttachment(attachment: TicketAttachment) {
    try {
      setAttachmentError("");
      await downloadAttachment(Number(id), attachment.ticketAttachmentId, attachment.fileName);
    } catch (err: unknown) {
      setAttachmentError(err instanceof Error ? err.message : "Failed to download attachment.");
    }
  }

  async function handleGenerateSummary() {
    try {
      setAIAction("summary");
      setAIError("");
      const response = await generateTicketSummary(Number(id));
      setAISummary(response.result);
    } catch (err: unknown) {
      setAIError(err instanceof Error ? err.message : "Unable to generate a ticket summary.");
    } finally {
      setAIAction(null);
    }
  }

  async function handleTroubleshootingSuggestions() {
    try {
      setAIAction("troubleshooting");
      setAIError("");
      const response = await getTroubleshootingSuggestions(Number(id));
      setAITroubleshooting(response.result);
    } catch (err: unknown) {
      setAIError(err instanceof Error ? err.message : "Unable to get troubleshooting suggestions.");
    } finally {
      setAIAction(null);
    }
  }

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/tickets");
  }

  if (!currentUser) return null;

  const isOwner = ticket?.createdByUserId === currentUser.userId;
  const isStaff = currentUser.role === "Admin" || currentUser.role === "Agent";
  const canEdit = isOwner || isStaff;
  const canDelete = currentUser.role === "Admin" || isOwner;

  const timelineLogs = [...activityLogs].reverse();

  return (
    <div className="min-h-screen flex bg-[#f6f2ec] text-[#17211d]">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-5 py-4 bg-[#143a34] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 grid place-items-center rounded-lg bg-white text-[#10251f]">
              <SparkIcon className="w-[18px] h-[18px]" />
            </div>
            <div>
              <p className="text-sm font-extrabold m-0">IT Help Desk</p>
              <p className="text-[rgba(247,251,247,0.7)] text-xs m-0">
                {ticket ? ticket.ticketReference : "Ticket Details"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-3 py-1.5 rounded-md text-xs font-bold bg-white/10 text-white hover:bg-white/15 transition-colors"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate("/tickets")}
              className="px-3 py-1.5 rounded-md text-xs font-bold bg-white/10 text-white hover:bg-white/15 transition-colors"
            >
              Tickets
            </button>
            <button
              type="button"
              onClick={() => { logoutUser(); navigate("/"); }}
              className="px-3 py-1.5 rounded-md text-xs font-bold bg-white/10 text-white hover:bg-white/15 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-[960px] mx-auto">
            <button
              type="button"
              onClick={handleBack}
              className="mb-4 text-sm text-[#586760] hover:text-[#143a34] font-medium transition-colors"
            >
              &larr; Back to Tickets
            </button>

            {loading && <div className="text-center py-12 text-[#8a9690] text-sm">Loading ticket...</div>}

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-[#fdeef2] text-[#b83d5e] border border-[#f5ccd8] text-sm font-medium">
                {error}
              </div>
            )}

            {!loading && ticket && !editing && (
              <>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="text-[#a3493d] text-xs font-extrabold uppercase tracking-wide m-0">
                      {ticket.ticketReference}
                    </p>
                    <h1 className="text-[clamp(22px,3vw,30px)] font-[850] text-[#17211d] m-0 mt-1">{ticket.title}</h1>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-[#143a34] text-white hover:bg-[#0d2d28] transition-colors shadow-[0_4px_12px_rgba(20,58,52,0.2)]"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-[#fdeef2] text-[#b83d5e] border border-[#f5ccd8] hover:bg-[#f5ccd8] transition-colors disabled:opacity-50"
                      >
                        {deleting ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                  <div className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-4 shadow-[0_4px_16px_rgba(50,36,22,0.06)]">
                    <p className="text-xs font-bold text-[#8a9690] uppercase tracking-wide m-0">Status</p>
                    <span className={`inline-block mt-1.5 px-2.5 py-1 rounded text-xs font-bold border ${statusStyles[ticket.status] || ""}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-4 shadow-[0_4px_16px_rgba(50,36,22,0.06)]">
                    <p className="text-xs font-bold text-[#8a9690] uppercase tracking-wide m-0">Priority</p>
                    <span className={`inline-block mt-1.5 px-2.5 py-1 rounded text-xs font-bold border ${priorityStyles[ticket.priority] || ""}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-4 shadow-[0_4px_16px_rgba(50,36,22,0.06)]">
                    <p className="text-xs font-bold text-[#8a9690] uppercase tracking-wide m-0">Category</p>
                    <p className="text-sm font-bold text-[#26322e] mt-1.5 m-0">{ticket.category}</p>
                  </div>
                  <div className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-4 shadow-[0_4px_16px_rgba(50,36,22,0.06)]">
                    <p className="text-xs font-bold text-[#8a9690] uppercase tracking-wide m-0">Assigned To</p>
                    <p className="text-sm font-bold text-[#26322e] mt-1.5 m-0">{ticket.assignedTo || "Unassigned"}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_4px_16px_rgba(50,36,22,0.06)] mb-6">
                  <h2 className="text-sm font-bold text-[#52625d] m-0 mb-3">Description</h2>
                  <p className="text-sm text-[#26322e] leading-relaxed whitespace-pre-wrap m-0">{ticket.description}</p>
                </div>

                <div className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_4px_16px_rgba(50,36,22,0.06)] mb-6">
                  <p className="text-sm font-bold text-[#52625d] m-0">AI Assistance</p>
                  <p className="text-[#8a9690] text-xs mt-1 mb-4">Generated guidance should be reviewed before taking action.</p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleGenerateSummary}
                      disabled={aiAction !== null}
                      className="px-4 py-2.5 rounded-lg text-sm font-bold bg-[#143a34] text-white hover:bg-[#0d2d28] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {aiAction === "summary" ? "Generating Summary..." : "Generate Summary"}
                    </button>
                    <button
                      type="button"
                      onClick={handleTroubleshootingSuggestions}
                      disabled={aiAction !== null}
                      className="px-4 py-2.5 rounded-lg text-sm font-bold bg-[#faf9f5] text-[#26322e] border border-[#ddded8] hover:bg-white hover:border-[#19b99a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {aiAction === "troubleshooting" ? "Getting Suggestions..." : "Get Troubleshooting Suggestions"}
                    </button>
                  </div>

                  {aiError && (
                    <div className="mt-4 px-4 py-3 rounded-lg bg-[#fdeef2] text-[#b83d5e] border border-[#f5ccd8] text-sm font-medium" role="alert">
                      {aiError}
                    </div>
                  )}

                  {aiSummary && (
                    <div className="mt-4 px-4 py-3 rounded-lg bg-[#faf9f5] border border-[#ddded8]">
                      <p className="text-xs font-bold text-[#8a9690] uppercase tracking-wide m-0 mb-2">AI Summary</p>
                      <p className="text-sm text-[#26322e] leading-relaxed whitespace-pre-wrap m-0">{aiSummary}</p>
                    </div>
                  )}

                  {aiTroubleshooting && (
                    <div className="mt-4 px-4 py-3 rounded-lg bg-[#faf9f5] border border-[#ddded8]">
                      <p className="text-xs font-bold text-[#8a9690] uppercase tracking-wide m-0 mb-2">Troubleshooting Suggestions</p>
                      <p className="text-sm text-[#26322e] leading-relaxed whitespace-pre-wrap m-0">{aiTroubleshooting}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-4 shadow-[0_4px_16px_rgba(50,36,22,0.06)]">
                    <p className="text-xs font-bold text-[#8a9690] uppercase tracking-wide m-0">Created By</p>
                    <p className="text-sm font-bold text-[#26322e] mt-1 m-0">{ticket.createdBy}</p>
                  </div>
                  <div className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-4 shadow-[0_4px_16px_rgba(50,36,22,0.06)]">
                    <p className="text-xs font-bold text-[#8a9690] uppercase tracking-wide m-0">Created At</p>
                    <p className="text-sm font-bold text-[#26322e] mt-1 m-0">{new Date(ticket.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-4 shadow-[0_4px_16px_rgba(50,36,22,0.06)]">
                    <p className="text-xs font-bold text-[#8a9690] uppercase tracking-wide m-0">Last Updated</p>
                    <p className="text-sm font-bold text-[#26322e] mt-1 m-0">
                      {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "Not updated"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-4 shadow-[0_4px_16px_rgba(50,36,22,0.06)]">
                    <p className="text-xs font-bold text-[#8a9690] uppercase tracking-wide m-0">
                      {ticket.resolvedAt ? "Resolved At" : ticket.closedAt ? "Closed At" : "Status Timeline"}
                    </p>
                    <p className="text-sm font-bold text-[#26322e] mt-1 m-0">
                      {ticket.resolvedAt
                        ? new Date(ticket.resolvedAt).toLocaleString()
                        : ticket.closedAt
                          ? new Date(ticket.closedAt).toLocaleString()
                          : "In progress"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] shadow-[0_4px_16px_rgba(50,36,22,0.06)] mb-8">
                  <div className="px-5 py-4 border-b border-[rgba(22,35,31,0.09)]">
                    <p className="text-sm font-bold text-[#52625d] m-0">Attachments</p>
                    <p className="text-[#8a9690] text-xs mt-1 mb-0">Screenshots and documents for this ticket</p>
                  </div>

                  <div className="px-5 py-4 border-b border-[rgba(22,35,31,0.09)] bg-[#faf9f5]">
                    <form onSubmit={handleUploadAttachment} className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <input
                        key={attachmentInputKey}
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                        onChange={(e) => {
                          setAttachmentError("");
                          setSelectedAttachment(e.target.files?.[0] || null);
                        }}
                        className="flex-1 min-w-0 px-4 py-2.5 rounded-lg border border-[#dde0dc] bg-white text-sm text-[#17211d] focus:outline-none focus:ring-2 focus:ring-[#19b99a] focus:border-transparent transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={uploadingAttachment || !selectedAttachment}
                        className="px-5 py-2.5 rounded-lg text-sm font-bold bg-[#143a34] text-white hover:bg-[#0d2d28] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingAttachment ? "Uploading..." : "Upload"}
                      </button>
                    </form>
                    <p className="text-[#8a9690] text-xs mt-2 mb-0">Allowed: png, jpg, jpeg, pdf, doc, docx. Max 10 MB.</p>
                    {attachmentError && (
                      <div className="mt-3 px-4 py-3 rounded-lg bg-[#fdeef2] text-[#b83d5e] border border-[#f5ccd8] text-sm font-medium">
                        {attachmentError}
                      </div>
                    )}
                  </div>

                  <div className="divide-y divide-[rgba(22,35,31,0.06)]">
                    {attachments.length === 0 ? (
                      <p className="px-5 py-6 text-center text-[#8a9690] text-sm m-0">No attachments yet.</p>
                    ) : (
                      attachments.map((attachment) => (
                        <div key={attachment.ticketAttachmentId} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#26322e] truncate m-0">{attachment.fileName}</p>
                            <p className="text-[#8a9690] text-xs mt-1 mb-0">
                              {formatFileSize(attachment.fileSize)} - uploaded by {attachment.uploadedBy} on {new Date(attachment.uploadedAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(attachment)}
                            className="shrink-0 px-4 py-2 rounded-lg text-sm font-bold bg-[#faf9f5] text-[#26322e] border border-[#ddded8] hover:bg-white transition-colors"
                          >
                            Download
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] shadow-[0_4px_16px_rgba(50,36,22,0.06)] mb-8">
                  <div className="px-5 py-4 border-b border-[rgba(22,35,31,0.09)]">
                    <p className="text-sm font-bold text-[#52625d] m-0">Comments</p>
                    <p className="text-[#8a9690] text-xs mt-1 mb-0">Discussion and notes on this ticket</p>
                  </div>

                  <div className="px-5 py-4 border-b border-[rgba(22,35,31,0.09)] bg-[#faf9f5]">
                    <form onSubmit={handleAddComment} className="space-y-3">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        placeholder="Write a comment..."
                        className="w-full px-4 py-2.5 rounded-lg border border-[#dde0dc] bg-white text-sm text-[#17211d] focus:outline-none focus:ring-2 focus:ring-[#19b99a] focus:border-transparent transition-colors resize-y"
                      />
                      <div className="flex items-center justify-between">
                        {isStaff && (
                          <label className="flex items-center gap-2 text-sm text-[#586760] cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={commentInternal}
                              onChange={(e) => setCommentInternal(e.target.checked)}
                              className="w-4 h-4 rounded border-[#dde0dc] text-[#19b99a] focus:ring-[#19b99a]"
                            />
                            <span className="font-medium">Internal note (agents only)</span>
                          </label>
                        )}
                        <button
                          type="submit"
                          disabled={submittingComment || !newComment.trim()}
                          className="px-5 py-2 rounded-lg text-sm font-bold bg-[#143a34] text-white hover:bg-[#0d2d28] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingComment ? "Posting..." : "Post Comment"}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="divide-y divide-[rgba(22,35,31,0.06)]">
                    {comments.length === 0 ? (
                      <p className="px-5 py-6 text-center text-[#8a9690] text-sm m-0">No comments yet.</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.ticketCommentId} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-[#26322e]">{comment.user}</span>
                                <span className="text-xs text-[#8a9690]">{new Date(comment.createdAt).toLocaleString()}</span>
                                {comment.isInternal && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-[#fef6e8] text-[#9a6b1a] border border-[#f0ddb0]">
                                    Internal
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-[#26322e] leading-relaxed whitespace-pre-wrap m-0">{comment.commentText}</p>
                            </div>
                            {(comment.userId === currentUser.userId || isStaff) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment.ticketCommentId)}
                                className="shrink-0 text-xs text-[#b83d5e] hover:text-[#8a2020] font-medium transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_4px_16px_rgba(50,36,22,0.06)] mb-8">
                  <p className="text-sm font-bold text-[#52625d] m-0">Activity & History</p>
                  <p className="text-[#8a9690] text-xs mt-1 mb-5">Audit trail of all actions taken on this ticket</p>

                  {activityLogs.length === 0 ? (
                    <p className="text-center text-[#8a9690] text-sm py-4 m-0">No activity recorded yet.</p>
                  ) : (
                    <ul className="m-0 p-0 list-none relative">
                      {activityLogs.map((log, idx) => (
                        <li key={log.activityLogId} className="flex gap-4 pb-5 last:pb-0 relative">
                          <div className="flex flex-col items-center shrink-0">
                            <span className={`w-3 h-3 rounded-full ${actionColors[log.action] || "bg-[#8a9690]"} z-10`} />
                            {idx < activityLogs.length - 1 && (
                              <div className="w-px flex-1 bg-[#dde0dc] mt-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-[#26322e]">{log.user}</span>
                              <span className="text-xs font-semibold text-[#586760] uppercase tracking-wide">{log.action}</span>
                              <time className="text-xs text-[#8a9690]">{new Date(log.createdAt).toLocaleString()}</time>
                            </div>
                            {log.description && (
                              <p className="text-sm text-[#586760] mt-0.5 m-0">{log.description}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {timelineLogs.length > 0 && (
                    <details className="mt-4">
                      <summary className="text-sm font-bold text-[#586760] cursor-pointer hover:text-[#143a34] transition-colors select-none">
                        View Status Timeline
                      </summary>
                      <ul className="m-0 p-0 list-none mt-3 space-y-2">
                        {timelineLogs.map((log) => (
                          <li key={`tl-${log.activityLogId}`} className="flex items-center gap-3 text-sm">
                            <span className="shrink-0 w-2 h-2 rounded-full bg-[#dde0dc]" />
                            <span className="font-medium text-[#26322e]">
                              {log.action === "Status Updated" || log.action === "Created" || log.action === "Assigned"
                                ? log.description || log.action
                                : `${log.action} - ${log.description || ""}`}
                            </span>
                            <span className="text-xs text-[#8a9690]">{new Date(log.createdAt).toLocaleString()}</span>
                            <span className="text-xs text-[#586760] font-medium">by {log.user}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </>
            )}

            {!loading && ticket && editing && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[#a3493d] text-xs font-extrabold uppercase tracking-wide m-0">{ticket.ticketReference}</p>
                    <h1 className="text-[clamp(22px,3vw,30px)] font-[850] text-[#17211d] m-0 mt-1">Edit Ticket</h1>
                  </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-5">
                  <div>
                    <label htmlFor="title" className="block text-sm font-bold text-[#26322e] mb-1.5">Title</label>
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-lg border bg-white text-sm text-[#17211d] focus:outline-none focus:ring-2 focus:ring-[#19b99a] focus:border-transparent transition-colors ${errors.title ? "border-[#b83d5e]" : "border-[#dde0dc]"}`}
                    />
                    {errors.title && <p className="mt-1 text-xs text-[#b83d5e] font-medium">{errors.title}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                    <div>
                      <label htmlFor="category" className="block text-sm font-bold text-[#26322e] mb-1.5">Category</label>
                      <select
                        id="category"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-lg border bg-white text-sm text-[#17211d] focus:outline-none focus:ring-2 focus:ring-[#19b99a] focus:border-transparent transition-colors ${errors.categoryId ? "border-[#b83d5e]" : "border-[#dde0dc]"}`}
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>
                        ))}
                      </select>
                      {errors.categoryId && <p className="mt-1 text-xs text-[#b83d5e] font-medium">{errors.categoryId}</p>}
                    </div>
                    <div>
                      <label htmlFor="priority" className="block text-sm font-bold text-[#26322e] mb-1.5">Priority</label>
                      <select
                        id="priority"
                        value={priorityId}
                        onChange={(e) => setPriorityId(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-lg border bg-white text-sm text-[#17211d] focus:outline-none focus:ring-2 focus:ring-[#19b99a] focus:border-transparent transition-colors ${errors.priorityId ? "border-[#b83d5e]" : "border-[#dde0dc]"}`}
                      >
                        <option value="">Select priority</option>
                        {priorities.map((pri) => (
                          <option key={pri.priorityId} value={pri.priorityId}>{pri.priorityName}</option>
                        ))}
                      </select>
                      {errors.priorityId && <p className="mt-1 text-xs text-[#b83d5e] font-medium">{errors.priorityId}</p>}
                    </div>
                    {isStaff && (
                      <div>
                        <label htmlFor="status" className="block text-sm font-bold text-[#26322e] mb-1.5">Status</label>
                        <select
                          id="status"
                          value={statusId}
                          onChange={(e) => setStatusId(e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-lg border bg-white text-sm text-[#17211d] focus:outline-none focus:ring-2 focus:ring-[#19b99a] focus:border-transparent transition-colors ${errors.statusId ? "border-[#b83d5e]" : "border-[#dde0dc]"}`}
                        >
                          <option value="">Select status</option>
                          {statuses.map((st) => (
                            <option key={st.statusId} value={st.statusId}>{st.statusName}</option>
                          ))}
                        </select>
                        {errors.statusId && <p className="mt-1 text-xs text-[#b83d5e] font-medium">{errors.statusId}</p>}
                      </div>
                    )}
                    {canAssign && (
                      <div>
                        <label htmlFor="assignedTo" className="block text-sm font-bold text-[#26322e] mb-1.5">Assign To</label>
                        <select
                          id="assignedTo"
                          value={assignedToUserId}
                          onChange={(e) => setAssignedToUserId(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-[#dde0dc] bg-white text-sm text-[#17211d] focus:outline-none focus:ring-2 focus:ring-[#19b99a] focus:border-transparent transition-colors"
                        >
                          <option value="">Unassigned</option>
                          {agents.map((agent) => (
                            <option key={agent.userId} value={agent.userId}>{agent.fullName}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-bold text-[#26322e] mb-1.5">Description</label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                      className={`w-full px-4 py-2.5 rounded-lg border bg-white text-sm text-[#17211d] focus:outline-none focus:ring-2 focus:ring-[#19b99a] focus:border-transparent transition-colors resize-y ${errors.description ? "border-[#b83d5e]" : "border-[#dde0dc]"}`}
                    />
                    {errors.description && <p className="mt-1 text-xs text-[#b83d5e] font-medium">{errors.description}</p>}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 rounded-lg text-sm font-bold bg-[#143a34] text-white hover:bg-[#0d2d28] transition-colors shadow-[0_4px_12px_rgba(20,58,52,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-6 py-2.5 rounded-lg text-sm font-bold bg-[#faf9f5] text-[#26322e] border border-[#ddded8] hover:bg-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
