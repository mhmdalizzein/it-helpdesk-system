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

        modelBuilder.Entity<Role>().HasData(
    new Role { RoleId = 1, RoleName = "Admin", Description = "System administrator with full access" },
    new Role { RoleId = 2, RoleName = "Agent", Description = "Support agent who handles tickets" },
    new Role { RoleId = 3, RoleName = "User", Description = "Regular user who creates tickets" }
);

modelBuilder.Entity<Status>().HasData(
    new Status { StatusId = 1, StatusName = "Open", Description = "Ticket has been created and is waiting for action", SortOrder = 1 },
    new Status { StatusId = 2, StatusName = "In Progress", Description = "Ticket is currently being handled", SortOrder = 2 },
    new Status { StatusId = 3, StatusName = "Resolved", Description = "Ticket issue has been resolved", SortOrder = 3 },
    new Status { StatusId = 4, StatusName = "Closed", Description = "Ticket is closed", SortOrder = 4 }
);

modelBuilder.Entity<Priority>().HasData(
    new Priority { PriorityId = 1, PriorityName = "Low", Description = "Low priority issue", SortOrder = 1 },
    new Priority { PriorityId = 2, PriorityName = "Medium", Description = "Normal priority issue", SortOrder = 2 },
    new Priority { PriorityId = 3, PriorityName = "High", Description = "Important issue that needs quick attention", SortOrder = 3 },
    new Priority { PriorityId = 4, PriorityName = "Critical", Description = "Urgent issue affecting major work", SortOrder = 4 }
);

modelBuilder.Entity<Category>().HasData(
    new Category { CategoryId = 1, CategoryName = "Hardware", Description = "Issues related to physical devices", IsActive = true },
    new Category { CategoryId = 2, CategoryName = "Software", Description = "Issues related to applications or software", IsActive = true },
    new Category { CategoryId = 3, CategoryName = "Network", Description = "Issues related to internet, Wi-Fi, or connectivity", IsActive = true },
    new Category { CategoryId = 4, CategoryName = "Account Access", Description = "Issues related to login, password, or permissions", IsActive = true },
    new Category { CategoryId = 5, CategoryName = "Other", Description = "General support requests", IsActive = true }
);
    }
}
