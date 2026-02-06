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
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
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
             .Include(o => o.Bookings).ThenInclude(b => b.Article)
             .Include(o => o.OrderPositions)
             .FirstAsync(o => o.Id == order.Id);

        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, MapToDto(createdOrder));
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
        return new OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            CustomerId = order.CustomerId,
            CustomerName = order.Customer?.Email ?? "Unknown", // Temporarily use Email, ideally Name
            StartDate = order.StartDate,
            EndDate = order.EndDate,
            Status = order.Status,
            Bookings = order.Bookings.Select(b => new BookingDto
            {
                Id = b.Id,
                ArticleId = b.ArticleId,
                ArticleName = b.Article?.Name ?? "Unknown Article",
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
