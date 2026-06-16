using HelpDesk.API.Data;
using HelpDesk.API.Models;

namespace HelpDesk.API.Services;

public class NotificationService
{
    private readonly ApplicationDbContext _context;

    public NotificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public void QueueTicketAssigned(Ticket ticket, int actorUserId)
    {
        if (!ticket.AssignedToUserId.HasValue)
        {
            return;
        }

        QueueForUsers(
            new int?[] { ticket.AssignedToUserId.Value },
            actorUserId,
            ticket.TicketId,
            $"Ticket {ticket.TicketReference} assigned to you",
            $"{ticket.TicketReference} is now assigned to you."
        );
    }

    public void QueueStatusChanged(Ticket ticket, int actorUserId, string oldStatus, string newStatus)
    {
        QueueForUsers(
            new int?[] { ticket.CreatedByUserId, ticket.AssignedToUserId },
            actorUserId,
            ticket.TicketId,
            $"{ticket.TicketReference} status changed",
            $"Status changed from {oldStatus} to {newStatus}."
        );
    }

    public void QueueCommentAdded(Ticket ticket, int actorUserId, string actorName, bool isInternal)
    {
        var recipients = isInternal
            ? new int?[] { ticket.AssignedToUserId }
            : new int?[] { ticket.CreatedByUserId, ticket.AssignedToUserId };

        QueueForUsers(
            recipients,
            actorUserId,
            ticket.TicketId,
            $"New comment on {ticket.TicketReference}",
            $"{actorName} added a {(isInternal ? "internal note" : "comment")}."
        );
    }

    public void QueueAttachmentUploaded(Ticket ticket, int actorUserId, string actorName, string fileName)
    {
        QueueForUsers(
            new int?[] { ticket.CreatedByUserId, ticket.AssignedToUserId },
            actorUserId,
            ticket.TicketId,
            $"New attachment on {ticket.TicketReference}",
            $"{actorName} uploaded {fileName}."
        );
    }

    private void QueueForUsers(
        IEnumerable<int?> userIds,
        int actorUserId,
        int ticketId,
        string title,
        string message)
    {
        var recipientIds = userIds
            .Where(userId => userId.HasValue)
            .Select(userId => userId!.Value)
            .Where(userId => userId != actorUserId)
            .Distinct()
            .ToList();

        if (recipientIds.Count == 0)
        {
            return;
        }

        foreach (var recipientId in recipientIds)
        {
            _context.Notifications.Add(new Notification
            {
                UserId = recipientId,
                TicketId = ticketId,
                Title = title,
                Message = message,
                CreatedAt = DateTime.UtcNow
            });
        }
    }
}
