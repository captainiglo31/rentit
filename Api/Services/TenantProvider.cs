using System.Security.Claims;

namespace RentIt.Api.Services;

public interface ITenantProvider
{
    Guid GetCurrentTenantId();
    void SetTenantId(Guid tenantId);
}

public class TenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private Guid _tenantId;

    public TenantProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid GetCurrentTenantId()
    {
        // Try to get from HttpContext claims first
        var user = _httpContextAccessor.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated == true)
        {
            var tenantIdClaim = user.FindFirst("TenantId");
            if (tenantIdClaim != null && Guid.TryParse(tenantIdClaim.Value, out var claimTenantId))
            {
                return claimTenantId;
            }
        }

        // Fallback to manually set tenantId (useful for background jobs or tests)
        return _tenantId;
    }

    public void SetTenantId(Guid tenantId)
    {
        _tenantId = tenantId;
    }
}
