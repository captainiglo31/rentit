Set-Location $PSScriptRoot
dotnet ef migrations add FixOrderCustomerRelation -p Api
dotnet ef database update -p Api
Write-Host "Migration Complete"
