using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RentIt.Api.Data;
using RentIt.Api.Models;
using BCrypt.Net;

namespace RentIt.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RegisterTenantAsync(RegisterRequest request);
}

public class AuthService : IAuthService
{
    private readonly RentItDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(RentItDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        // Don't use Global Filters for Login lookup, we need to find user first to get Tenant
        // Actually, we can't ignore filters easily on DbSet unless we use IgnoreQueryFilters()
        
        // We need to find the user by email across ALL tenants to log them in? 
        // OR the user logs in to a specific tenant domain?
        // Usually SaaS apps use email to find the user.
        
        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || !user.IsActive)
        {
            throw new Exception("Invalid credentials");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new Exception("Invalid credentials");
        }

        var token = GenerateJwtToken(user);

        return new AuthResponse
        {
            Token = token,
            FirstName = user.FirstName,
            LastName = user.LastName,
            TenantName = user.Tenant.Name
        };
    }

    public async Task<AuthResponse> RegisterTenantAsync(RegisterRequest request)
    {
        if (await _context.Tenants.AnyAsync(t => t.Domain == request.TenantDomain))
        {
            throw new Exception("Domain already taken");
        }

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = request.TenantName,
            Domain = request.TenantDomain,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tenants.Add(tenant);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Load tenant for response
        user.Tenant = tenant;

        return new AuthResponse
        {
            Token = GenerateJwtToken(user),
            FirstName = user.FirstName,
            LastName = user.LastName,
            TenantName = tenant.Name
        };
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("TenantId", user.TenantId.ToString()),
            new Claim("TenantDomain", user.Tenant.Domain)
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(double.Parse(_configuration["Jwt:ExpireDays"]!)),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
