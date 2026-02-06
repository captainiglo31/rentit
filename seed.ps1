Write-Host "Waiting for Backend to start..."
Start-Sleep -Seconds 10
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5052/api/test/seed" -Method Post
    Write-Host "Seeding result: $response"
} catch {
    Write-Host "Seeding failed: $_"
}
