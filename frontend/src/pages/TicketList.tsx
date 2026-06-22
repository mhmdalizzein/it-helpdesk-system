import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logoutUser } from "../services/authService";
import { getTickets, type Ticket } from "../services/ticketService";
import NotificationBell from "../components/NotificationBell";

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

function SparkIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function TicketList() {
  const navigate = useNavigate();

  // FIX: store currentUser once so it does not create a new object every render
  const [currentUser] = useState(() => getCurrentUser());

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/dashboard");
  }

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    const loadTickets = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getTickets();
        setTickets(data);
      } catch (err) {
        console.error("TicketList error:", err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [currentUser, navigate]);

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
              <p className="text-[rgba(247,251,247,0.7)] text-xs m-0">Tickets</p>
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
              onClick={() => navigate("/tickets/create")}
              className="px-3 py-1.5 rounded-md text-xs font-bold bg-white text-[#143a34] hover:bg-white/90 transition-colors"
            >
              + New Ticket
            </button>

            <button
              type="button"
              onClick={() => {
                logoutUser();
                navigate("/");
              }}
              className="px-3 py-1.5 rounded-md text-xs font-bold bg-white/10 text-white hover:bg-white/15 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-[1440px] mx-auto">
            <button
              type="button"
              onClick={handleBack}
              className="mb-4 text-sm text-[#586760] hover:text-[#143a34] font-medium transition-colors"
            >
              &larr; Back to Dashboard
            </button>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-[clamp(24px,3vw,32px)] font-[850] text-[#17211d] m-0">
                  Tickets
                </h1>
                <p className="text-[#6b716d] text-sm mt-1 m-0">
                  Manage all support requests
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/tickets/create")}
                className="px-5 py-2.5 rounded-lg text-sm font-bold bg-[#143a34] text-white hover:bg-[#0d2d28] transition-colors shadow-[0_4px_12px_rgba(20,58,52,0.2)]"
              >
                + Create Ticket
              </button>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-[#fdeef2] text-[#b83d5e] border border-[#f5ccd8] text-sm font-medium">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12 text-[#8a9690] text-sm">
                Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-[#8a9690] text-sm">
                No tickets found.
              </div>
            ) : (
              <div className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] shadow-[0_22px_52px_rgba(50,36,22,0.08)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(22,35,31,0.09)] bg-[#faf9f5]">
                        {[
                          "Reference",
                          "Title",
                          "Category",
                          "Priority",
                          "Status",
                          "Created By",
                          "Assigned To",
                          "Updated",
                        ].map((col) => (
                          <th
                            key={col}
                            className="px-4 py-3 text-left text-xs font-bold text-[#586760] uppercase tracking-wide whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {tickets.map((ticket) => (
                        <tr
                          key={ticket.ticketId}
                          onClick={() => navigate(`/tickets/${ticket.ticketId}`)}
                          className="border-b border-[rgba(22,35,31,0.06)] hover:bg-[#faf9f5] transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3.5 font-bold text-[#143a34] whitespace-nowrap">
                            {ticket.ticketReference}
                          </td>

                          <td className="px-4 py-3.5 font-medium text-[#26322e] max-w-[200px] truncate">
                            {ticket.title}
                          </td>

                          <td className="px-4 py-3.5 text-[#586760] whitespace-nowrap">
                            {ticket.category}
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${
                                priorityStyles[ticket.priority] || ""
                              }`}
                            >
                              {ticket.priority}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${
                                statusStyles[ticket.status] || ""
                              }`}
                            >
                              {ticket.status}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-[#586760] whitespace-nowrap">
                            {ticket.createdBy}
                          </td>

                          <td className="px-4 py-3.5 text-[#586760] whitespace-nowrap">
                            {ticket.assignedTo || "Unassigned"}
                          </td>

                          <td className="px-4 py-3.5 text-[#8a9690] whitespace-nowrap">
                            {ticket.updatedAt
                              ? new Date(ticket.updatedAt).toLocaleDateString()
                              : new Date(ticket.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
