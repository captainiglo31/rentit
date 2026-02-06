using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentIt.Api.Data;
using RentIt.Api.Models;
using RentIt.Api.Services;

namespace RentIt.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly RentItDbContext _context;
    private readonly IBookingService _bookingService;
    private readonly ITenantProvider _tenantProvider;

    public OrdersController(RentItDbContext context, IBookingService bookingService, ITenantProvider tenantProvider)
    {
        _context = context;
        _bookingService = bookingService;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetOrders([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        // Fix for Postgres UTC requirement
        if (from.HasValue && from.Value.Kind != DateTimeKind.Utc) from = from.Value.ToUniversalTime();
        if (to.HasValue && to.Value.Kind != DateTimeKind.Utc) to = to.Value.ToUniversalTime();

        var query = _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.Bookings)
                .ThenInclude(b => b.Article)
            .Include(o => o.OrderPositions)
            .AsQueryable();

        if (from.HasValue)
        {
            query = query.Where(o => o.EndDate >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(o => o.StartDate <= to.Value);
        }

        var orders = await query.ToListAsync();
        
        return Ok(orders.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetOrder(Guid id)
    {
        var order = await _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.Bookings)
                .ThenInclude(b => b.Article)
                    .ThenInclude(a => a.Category)
            .Include(o => o.OrderPositions)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return NotFound();
        }

        return Ok(MapToDto(order));
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> CreateOrder(CreateOrderDto dto)
    {
        var tenantId = _tenantProvider.GetCurrentTenantId();

        // Check availability for all bookings
        foreach (var b in dto.Bookings)
        {
            var isAvailable = await _bookingService.IsArticleAvailableAsync(b.ArticleId, dto.StartDate, dto.EndDate, null);
            if (!isAvailable)
            {
                return BadRequest($"Article {b.ArticleId} is not available for the selected period.");
            }
        }

        var order = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            CustomerId = dto.CustomerId,
            CustomerName = dto.CustomerName ?? "", 
            CustomerEmail = dto.CustomerEmail,
            CustomerPhone = dto.CustomerPhone,
            StartDate = dto.StartDate.Kind == DateTimeKind.Utc ? dto.StartDate : DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc),
            EndDate = dto.EndDate.Kind == DateTimeKind.Utc ? dto.EndDate : DateTime.SpecifyKind(dto.EndDate, DateTimeKind.Utc),
            OrderNumber = string.IsNullOrEmpty(dto.OrderNumber) ? GenerateOrderNumber() : dto.OrderNumber,
            Status = OrderStatus.Confirmed
        };

        _context.Orders.Add(order);

        foreach (var item in dto.Bookings)
        {
            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                OrderId = order.Id,
                ArticleId = item.ArticleId,
                CustomerId = dto.CustomerId,
                UserId = GetCurrentUserId(), // Staff user logic needs refinement
                StartTime = dto.StartDate,
                EndTime = dto.EndDate,
                Status = BookingStatus.Confirmed
            };
            
            // Calculate buffer
            var article = await _context.Articles.FindAsync(item.ArticleId);
            if (article != null)
            {
                booking.BufferMinutes = article.BaseBufferMinutes;
                booking.TotalPrice = article.PricePerDay * (decimal)(dto.EndDate - dto.StartDate).TotalDays;
            }

            _context.Bookings.Add(booking);
        }

        foreach (var pos in dto.CustomPositions)
        {
            var position = new OrderPosition
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                OrderId = order.Id,
                Name = pos.Name,
                Quantity = pos.Quantity,
                Price = pos.Price
            };
            _context.OrderPositions.Add(position);
        }

        await _context.SaveChangesAsync();

        // Reload to get full graph
        var createdOrder = await _context.Orders
             .Include(o => o.Customer)
             .Include(o => o.Bookings)
                .ThenInclude(b => b.Article)
                    .ThenInclude(a => a.Category)
             .Include(o => o.OrderPositions)
             .FirstAsync(o => o.Id == order.Id);

        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, MapToDto(createdOrder));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<OrderDto>> UpdateOrder(Guid id, UpdateOrderDto dto)
    {
        var order = await _context.Orders
            .Include(o => o.Bookings)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return NotFound();
        }

        bool datesChanged = false;
        
        if (dto.StartDate.HasValue) 
        {
            var d = dto.StartDate.Value;
            order.StartDate = d.Kind == DateTimeKind.Utc ? d : DateTime.SpecifyKind(d, DateTimeKind.Utc);
            datesChanged = true;
        }
        
        if (dto.EndDate.HasValue)
        {
            var d = dto.EndDate.Value;
            order.EndDate = d.Kind == DateTimeKind.Utc ? d : DateTime.SpecifyKind(d, DateTimeKind.Utc);
            datesChanged = true;
        }

        if (datesChanged)
        {
            // Update all bookings to match new dates
            // Note: This needs availability check in a real scenario
            foreach (var booking in order.Bookings)
            {
                // Basic naive update - in prod usage, we must check for collisions again
                booking.StartTime = order.StartDate;
                booking.EndTime = order.EndDate;
            }
        }

        if (dto.Status.HasValue) order.Status = dto.Status.Value;
        if (dto.CustomerName != null) order.CustomerName = dto.CustomerName;
        if (dto.CustomerEmail != null) order.CustomerEmail = dto.CustomerEmail;
        if (dto.CustomerPhone != null) order.CustomerPhone = dto.CustomerPhone;

        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        
        // Return full DTO
        return await GetOrder(id);
    } 

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteOrder(Guid id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
        {
            return NotFound();
        }

        _context.Orders.Remove(order);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private OrderDto MapToDto(Order order)
    {
        // Use CustomerName from property if available, otherwise fallback to relation or Unknown
        string customerDisplay = !string.IsNullOrEmpty(order.CustomerName) 
            ? order.CustomerName 
            : (order.Customer?.Email ?? "Unknown");

        return new OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            CustomerId = order.CustomerId,
            CustomerName = customerDisplay,
            CustomerEmail = order.CustomerEmail,
            CustomerPhone = order.CustomerPhone,
            StartDate = order.StartDate,
            EndDate = order.EndDate,
            Status = order.Status,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            Bookings = order.Bookings.Select(b => new BookingDto
            {
                Id = b.Id,
                ArticleId = b.ArticleId,
                ArticleName = b.Article?.Name ?? "Unknown Article",
                CategoryName = b.Article?.Category?.Name,
                ArticleType = b.Article?.Type ?? ArticleType.Individual,
                StartTime = b.StartTime,
                EndTime = b.EndTime
            }).ToList(),
            CustomPositions = order.OrderPositions.Select(p => new OrderPositionDto
            {
                Id = p.Id,
                Name = p.Name,
                Quantity = p.Quantity,
                Price = p.Price
            }).ToList()
        };
    }

    private string GenerateOrderNumber()
    {
        return DateTime.UtcNow.ToString("yyyyMMdd") + "-" + new Random().Next(1000, 9999);
    }
    
    private Guid GetCurrentUserId()
    {
        // Simple extraction from claims for now
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return claim != null ? Guid.Parse(claim.Value) : Guid.Empty;
    }
}
