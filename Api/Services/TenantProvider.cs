namespace RentIt.Api.Services;

public interface ITenantProvider
{
    Guid GetCurrentTenantId();
    void SetTenantId(Guid tenantId);
}

public class TenantProvider : ITenantProvider
{
    private Guid _tenantId;

    public Guid GetCurrentTenantId()
    {
        return _tenantId;
    }

    public void SetTenantId(Guid tenantId)
    {
        _tenantId = tenantId;
    }
}
