using HelpDesk.API.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpDesk.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Role> Roles { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Priority> Priorities { get; set; }
    public DbSet<Status> Statuses { get; set; }
    public DbSet<TicketComment> TicketComments { get; set; }
    public DbSet<TicketAttachment> TicketAttachments { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Role>()
            .HasIndex(role => role.RoleName)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(user => user.Email)
            .IsUnique();

        modelBuilder.Entity<Category>()
            .HasIndex(category => category.CategoryName)
            .IsUnique();

        modelBuilder.Entity<Priority>()
            .HasIndex(priority => priority.PriorityName)
            .IsUnique();

        modelBuilder.Entity<Status>()
            .HasIndex(status => status.StatusName)
            .IsUnique();

        modelBuilder.Entity<Ticket>()
            .HasIndex(ticket => ticket.TicketReference)
            .IsUnique();

        modelBuilder.Entity<Role>()
            .HasMany(role => role.Users)
            .WithOne(user => user.Role)
            .HasForeignKey(user => user.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
            .HasOne(ticket => ticket.CreatedByUser)
            .WithMany(user => user.CreatedTickets)
            .HasForeignKey(ticket => ticket.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
            .HasOne(ticket => ticket.AssignedToUser)
            .WithMany(user => user.AssignedTickets)
            .HasForeignKey(ticket => ticket.AssignedToUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Ticket>()
            .HasOne(ticket => ticket.Category)
            .WithMany(category => category.Tickets)
            .HasForeignKey(ticket => ticket.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
            .HasOne(ticket => ticket.Priority)
            .WithMany(priority => priority.Tickets)
            .HasForeignKey(ticket => ticket.PriorityId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
            .HasOne(ticket => ticket.Status)
            .WithMany(status => status.Tickets)
            .HasForeignKey(ticket => ticket.StatusId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TicketComment>()
            .HasOne(comment => comment.Ticket)
            .WithMany(ticket => ticket.TicketComments)
            .HasForeignKey(comment => comment.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TicketComment>()
            .HasOne(comment => comment.User)
            .WithMany(user => user.TicketComments)
            .HasForeignKey(comment => comment.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TicketAttachment>()
            .HasOne(attachment => attachment.Ticket)
            .WithMany(ticket => ticket.TicketAttachments)
            .HasForeignKey(attachment => attachment.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TicketAttachment>()
            .HasOne(attachment => attachment.UploadedByUser)
            .WithMany(user => user.TicketAttachments)
            .HasForeignKey(attachment => attachment.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Notification>()
            .HasOne(notification => notification.User)
            .WithMany(user => user.Notifications)
            .HasForeignKey(notification => notification.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Notification>()
            .HasOne(notification => notification.Ticket)
            .WithMany(ticket => ticket.Notifications)
            .HasForeignKey(notification => notification.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ActivityLog>()
            .HasOne(log => log.User)
            .WithMany(user => user.ActivityLogs)
            .HasForeignKey(log => log.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ActivityLog>()
            .HasOne(log => log.Ticket)
            .WithMany(ticket => ticket.ActivityLogs)
            .HasForeignKey(log => log.TicketId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
