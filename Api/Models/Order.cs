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

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Draft;

    // Navigation properties
    public List<Booking> Bookings { get; set; } = new();
    public List<OrderPosition> OrderPositions { get; set; } = new();
}
