# Helper script to start Development Environment for RentIt

# Kill any existing processes on ports 5052 and 5173
$ports = @(5052, 5173);
$ports | ForEach-Object {
    $p = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
    if ($p) {
        Stop-Process -Id $p.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "Killed process on port $_"
    }
}

# Start Backend
Write-Host "Starting Backend..."
Start-Process -FilePath "dotnet" -ArgumentList "run --project Api/RentIt.Api.csproj --urls http://localhost:5052" -WorkingDirectory "$PSScriptRoot" -NoNewWindow

# Start Frontend
Write-Host "Starting Frontend..."
Set-Location "$PSScriptRoot/client"
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "$PSScriptRoot/client" -NoNewWindow

# Schedule Seeding
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 15
    try {
        Invoke-RestMethod -Uri "http://localhost:5052/api/test/seed" -Method Post -ErrorAction Stop
        Write-Host "TestData seeded successfully."
    } catch {
        Write-Host "Seeding failed (Backend might not be ready): $_"
    }
} | Out-Null

Write-Host "RentIt started. Backend: http://localhost:5052, Frontend: http://localhost:5173"
Write-Host "Seeding job scheduled in background (15s)..."
