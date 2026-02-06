using System.ComponentModel.DataAnnotations;

namespace RentIt.Api.Models;

public class CreateOrderDto
{
    [Required]
    public Guid CustomerId { get; set; }
    
    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public List<CreateOrderBookingDto> Bookings { get; set; } = new();
    public List<CreateOrderPositionDto> CustomPositions { get; set; } = new();
}

public class CreateOrderBookingDto
{
    [Required]
    public Guid ArticleId { get; set; }
    
    public int Quantity { get; set; } = 1; // Basic support for multi-quantity, though current Article model is 1:1 asset. 
                                           // Implies: If ArticleId is an "Asset Type" (Category?), we pick 1 available.
                                           // If ArticleId is specific Asset, Quantity must be 1.
                                           // For now, let's assume specific ArticleId per booking.
}

public class CreateOrderPositionDto
{
    [Required]
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal Price { get; set; }
}

public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public OrderStatus Status { get; set; }
    public List<BookingDto> Bookings { get; set; } = new();
    public List<OrderPositionDto> CustomPositions { get; set; } = new();
}

public class BookingDto
{
    public Guid Id { get; set; }
    public Guid ArticleId { get; set; }
    public string ArticleName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}

public class OrderPositionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}
