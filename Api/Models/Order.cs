using System.ComponentModel.DataAnnotations;

namespace RentIt.Api.Models;

public enum OrderStatus
{
    Draft,
    Confirmed,
    Completed,
    Cancelled
}

public class Order
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    
    [Required]
    public string OrderNumber { get; set; } = string.Empty;
    
    public Guid CustomerId { get; set; }
    public Customer? Customer { get; set; }
    
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Draft;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public List<Booking> Bookings { get; set; } = new();
    public List<OrderPosition> OrderPositions { get; set; } = new();
}
