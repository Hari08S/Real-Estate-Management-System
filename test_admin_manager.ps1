$gateway = "http://localhost:8002/api"

# 1. Login as admin
$loginBody = @{ email="admin@example.com"; password="admin123" } | ConvertTo-Json
$loginResponse = Invoke-WebRequest -Uri "$gateway/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -SessionVariable session

$cookies = $session.Cookies.GetCookies([System.Uri]::new($gateway))
$accessToken = ""
foreach ($cookie in $cookies) {
    if ($cookie.Name -eq "accessToken") {
        $accessToken = $cookie.Value
    }
}

if (-not $accessToken) {
    Write-Host "Failed to get access token"
    exit 1
}

Write-Host "Got access token"

# 2. Add Manager via Admin endpoint
$managerBody = @{
    name = "PowerShell Manager"
    email = "psmanager@example.com"
    phone = "+91 99999 88888"
    password = "Manager@123"
    cities = @("Hyderabad", "Chennai")
} | ConvertTo-Json

$headers = @{ "Authorization" = "Bearer $accessToken" }

Write-Host "Creating manager..."
try {
    $response = Invoke-RestMethod -Uri "$gateway/admin/managers/create" -Method Post -Headers $headers -Body $managerBody -ContentType "application/json"
    Write-Host "Manager created successfully!"
    $response | ConvertTo-Json
} catch {
    Write-Host "Failed to create manager:"
    $_.Exception.Response
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $reader.ReadToEnd()
}
