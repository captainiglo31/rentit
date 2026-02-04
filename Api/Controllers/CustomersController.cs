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
public class CustomersController : ControllerBase
{
    private readonly RentItDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public CustomersController(RentItDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Customer>>> GetCustomers()
    {
        return await _context.Customers.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Customer>> GetCustomer(Guid id)
    {
        var customer = await _context.Customers.FindAsync(id);

        if (customer == null)
        {
            return NotFound();
        }

        return customer;
    }

    [HttpPost]
    public async Task<ActionResult<Customer>> CreateCustomer(Customer customer)
    {
        customer.TenantId = _tenantProvider.GetCurrentTenantId();
        customer.Id = Guid.NewGuid();
        customer.CreatedAt = DateTime.UtcNow;

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, customer);
    }
    
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCustomer(Guid id, Customer customer)
    {
         if (id != customer.Id) return BadRequest();
         
         var existing = await _context.Customers.FindAsync(id);
         if (existing == null) return NotFound();
         
         existing.Name = customer.Name;
         existing.Email = customer.Email;
         existing.Phone = customer.Phone;
         existing.InternalNote = customer.InternalNote;
         
         await _context.SaveChangesAsync();
         return NoContent();
    }
    
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCustomer(Guid id)
    {
        var customer = await _context.Customers.FindAsync(id);
        if (customer == null) return NotFound();

        _context.Customers.Remove(customer);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
