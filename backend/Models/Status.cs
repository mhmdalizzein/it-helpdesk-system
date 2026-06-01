using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HelpDesk.API.Models;

public class Status
{
    public int StatusId { get; set; }

    [Required]
    [MaxLength(100)]
    public string StatusName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public int SortOrder { get; set; }

    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
