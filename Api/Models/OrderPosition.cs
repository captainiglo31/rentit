using System.ComponentModel.DataAnnotations;

namespace RentIt.Api.Models;

public class OrderPosition
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;
    
    public int Quantity { get; set; }

    // Optional: Price tracking for custom items
    public decimal Price { get; set; }
}
