$p = Get-Process -Name "RentIt.Api" -ErrorAction SilentlyContinue
if ($p) {
    Write-Host "Found RentIt.Api (Id: $($p.Id)). Killing..."
    Stop-Process -InputObject $p -Force
    Write-Host "Killed."
} else {
    Write-Host "RentIt.Api not running."
}
$p = Get-Process -Name "RentIt.Api" -ErrorAction SilentlyContinue
if ($p) { Write-Host "Still running!" } else { Write-Host "Confirmed dead." }
