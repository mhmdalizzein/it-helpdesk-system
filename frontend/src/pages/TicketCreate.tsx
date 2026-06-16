import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logoutUser } from "../services/authService";
import { createTicket, getCategories, getPriorities, type LookupItem } from "../services/ticketService";
import NotificationBell from "../components/NotificationBell";

function SparkIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export default function TicketCreate() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priorityId, setPriorityId] = useState("");
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [priorities, setPriorities] = useState<LookupItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }
    (async () => {
      try {
        const [cats, pris] = await Promise.all([getCategories(), getPriorities()]);
        setCategories(cats);
        setPriorities(pris);
      } catch {
        setError("Failed to load form data.");
      }
    })();
  }, []);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required.";
    if (!description.trim()) errs.description = "Description is required.";
    if (!categoryId) errs.categoryId = "Please select a category.";
    if (!priorityId) errs.priorityId = "Please select a priority.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setError("");
      await createTicket({
        title: title.trim(),
        description: description.trim(),
        categoryId: parseInt(categoryId),
        priorityId: parseInt(priorityId),
      });
      navigate("/tickets");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!currentUser) return null;

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
              <p className="text-[rgba(247,251,247,0.7)] text-xs m-0">Create Ticket</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
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
          <div className="max-w-[720px] mx-auto">
            <button
              type="button"
              onClick={() => navigate("/tickets")}
              className="mb-4 text-sm text-[#586760] hover:text-[#143a34] font-medium transition-colors"
            >
              &larr; Back to Tickets
            </button>

            <h1 className="text-[clamp(24px,3vw,32px)] font-[850] text-[#17211d] m-0">Create New Ticket</h1>
            <p className="text-[#6b716d] text-sm mt-1 mb-6">Fill in the details below to submit a support request.</p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-[#fdeef2] text-[#b83d5e] border border-[#f5ccd8] text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="title" className="block text-sm font-bold text-[#26322e] mb-1.5">Title</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border bg-white text-sm text-[#17211d] focus:outline-none focus:ring-2 focus:ring-[#19b99a] focus:border-transparent transition-colors ${errors.title ? "border-[#b83d5e]" : "border-[#dde0dc]"}`}
                  placeholder="Brief summary of the issue"
                />
                {errors.title && <p className="mt-1 text-xs text-[#b83d5e] font-medium">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-bold text-[#26322e] mb-1.5">Category</label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border bg-white text-sm text-[#17211d] focus:outline-none focus:ring-2 focus:ring-[#19b99a] focus:border-transparent transition-colors ${errors.categoryId ? "border-[#b83d5e]" : "border-[#dde0dc]"}`}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="mt-1 text-xs text-[#b83d5e] font-medium">{errors.categoryId}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                      <option key={pri.priorityId} value={pri.priorityId}>
                        {pri.priorityName}
                      </option>
                    ))}
                  </select>
                  {errors.priorityId && <p className="mt-1 text-xs text-[#b83d5e] font-medium">{errors.priorityId}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-bold text-[#26322e] mb-1.5">Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className={`w-full px-4 py-2.5 rounded-lg border bg-white text-sm text-[#17211d] focus:outline-none focus:ring-2 focus:ring-[#19b99a] focus:border-transparent transition-colors resize-y ${errors.description ? "border-[#b83d5e]" : "border-[#dde0dc]"}`}
                  placeholder="Detailed explanation of the issue..."
                />
                {errors.description && <p className="mt-1 text-xs text-[#b83d5e] font-medium">{errors.description}</p>}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold bg-[#143a34] text-white hover:bg-[#0d2d28] transition-colors shadow-[0_4px_12px_rgba(20,58,52,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/tickets")}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold bg-[#faf9f5] text-[#26322e] border border-[#ddded8] hover:bg-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
