namespace HelpDesk.API.DTOs;

public class UserProfileDto
{
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public int CreatedTicketsCount { get; set; }

    public int? AssignedTicketsCount { get; set; }

    public List<ProfileTicketDto> RecentTickets { get; set; } = [];
}

public class ProfileTicketDto
{
    public int TicketId { get; set; }

    public string TicketReference { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string Priority { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}

public class UserListItemDto
{
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public string? Department { get; set; }

    public DateTime CreatedAt { get; set; }

    public int CreatedTicketsCount { get; set; }

    public int AssignedTicketsCount { get; set; }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;

    public string NewPassword { get; set; } = string.Empty;

    public string ConfirmPassword { get; set; } = string.Empty;
}

public class UpdateUserRoleDto
{
    public string Role { get; set; } = string.Empty;
}

public class UpdateUserActiveDto
{
    public bool IsActive { get; set; }
}

public class SystemCountsDto
{
    public int TotalUsers { get; set; }

    public int ActiveUsers { get; set; }

    public int AdminUsers { get; set; }

    public int AgentUsers { get; set; }

    public int EmployeeUsers { get; set; }

    public int TotalTickets { get; set; }

    public int UnassignedTickets { get; set; }

    public int Categories { get; set; }

    public int Priorities { get; set; }

    public int Statuses { get; set; }
}
