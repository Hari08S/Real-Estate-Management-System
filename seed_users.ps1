$ErrorActionPreference = "Stop"
$gateway = "http://localhost:8090/api"

function Register-User ($name, $email, $password, $phone) {
    try {
        $body = @{name=$name; email=$email; password=$password; phone=$phone} | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$gateway/auth/register" -Method Post -Body $body -ContentType "application/json"
        Write-Host "Registered: $($response.user.email)"
        return $response.user
    } catch {
        Write-Host "User $email already exists or error: $_"
    }
}

function Login-User ($email, $password) {
    $body = @{email=$email; password=$password} | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$gateway/auth/login" -Method Post -Body $body -ContentType "application/json" -SessionVariable session
    Write-Host "Logged in: $($email)"
    return $session
}

# 1. Create Users
Write-Host "Creating users..."
$seller = Register-User "Priya Sharma" "priya@example.com" "password123" "+91 87654 32109"
$manager = Register-User "Ravi Menon" "manager@example.com" "manager123" "+91 76543 21098"
$admin = Register-User "Admin User" "admin@example.com" "admin123" "+91 99999 00000"

# Wait a second for DB
Start-Sleep -Seconds 2

# 2. Update roles via SQL*Plus
Write-Host "Updating roles via SQL*Plus..."
$sql = @"
CONNECT RMS/hari2005@localhost:1521/XE;
UPDATE sfx_users SET active_role = 'MANAGER' WHERE email = 'manager@example.com';
DELETE FROM sfx_user_roles WHERE user_id = (SELECT id FROM sfx_users WHERE email = 'manager@example.com');
INSERT INTO sfx_user_roles (user_id, role) VALUES ((SELECT id FROM sfx_users WHERE email = 'manager@example.com'), 'MANAGER');
INSERT INTO sfx_manager_cities (manager_id, city) VALUES ((SELECT id FROM sfx_users WHERE email = 'manager@example.com'), 'Hyderabad');

UPDATE sfx_users SET active_role = 'ADMIN' WHERE email = 'admin@example.com';
DELETE FROM sfx_user_roles WHERE user_id = (SELECT id FROM sfx_users WHERE email = 'admin@example.com');
INSERT INTO sfx_user_roles (user_id, role) VALUES ((SELECT id FROM sfx_users WHERE email = 'admin@example.com'), 'ADMIN');
COMMIT;
EXIT;
"@
$sql | sqlplus -S /nolog

# 3. Create properties using Seller session
Write-Host "Creating properties..."
$sellerSession = Login-User "priya@example.com" "password123"

$prop1 = @{
    title="Luxury 3BHK in Banjara Hills"
    description="Spacious 3BHK apartment with modern amenities, swimming pool, gym, and 24/7 security. Located in the heart of Banjara Hills with excellent connectivity to IT hubs and shopping centers."
    propertyType="apartment"
    listingType="SALE"
    price=12500000
    bedrooms=3
    bathrooms=3
    area=1850
    location=@{ address="Road No. 12, Banjara Hills"; city="Hyderabad"; state="Telangana"; pincode="500034" }
    images=@("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800")
}
Invoke-RestMethod -Uri "$gateway/properties" -Method Post -Body ($prop1 | ConvertTo-Json -Depth 10) -ContentType "application/json" -WebSession $sellerSession | Out-Null
Write-Host "Created Property 1"

$prop2 = @{
    title="Modern Villa with Garden in Jubilee Hills"
    description="Beautiful 4BHK independent villa with a lush garden, private parking for 3 cars, and a dedicated home office space."
    propertyType="villa"
    listingType="SALE"
    price=35000000
    bedrooms=4
    bathrooms=4
    area=3200
    location=@{ address="Film Nagar, Jubilee Hills"; city="Hyderabad"; state="Telangana"; pincode="500033" }
    images=@("https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800")
}
Invoke-RestMethod -Uri "$gateway/properties" -Method Post -Body ($prop2 | ConvertTo-Json -Depth 10) -ContentType "application/json" -WebSession $sellerSession | Out-Null
Write-Host "Created Property 2"

$prop3 = @{
    title="Cozy 2BHK for Rent in Gachibowli"
    description="Well-maintained 2BHK apartment in a gated community near IT corridor. Fully furnished with air conditioning, washing machine, and modular kitchen. Walking distance to DLF Cyber City."
    propertyType="apartment"
    listingType="RENT"
    monthlyRent=28000
    securityDeposit=100000
    bedrooms=2
    bathrooms=2
    area=1100
    location=@{ address="Nanakramguda Road, Gachibowli"; city="Hyderabad"; state="Telangana"; pincode="500032" }
    images=@("https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800")
}
Invoke-RestMethod -Uri "$gateway/properties" -Method Post -Body ($prop3 | ConvertTo-Json -Depth 10) -ContentType "application/json" -WebSession $sellerSession | Out-Null
Write-Host "Created Property 3"

Write-Host "Approving properties..."
$adminSession = Login-User "admin@example.com" "admin123"

# We can query admin-service or just property-service
$propsResponse = Invoke-RestMethod -Uri "$gateway/admin/properties" -Method Get -WebSession $adminSession
foreach ($p in $propsResponse.properties) {
    if ($p.status -eq 'PENDING') {
        $body = @{status="APPROVED"} | ConvertTo-Json
        Invoke-RestMethod -Uri "$gateway/admin/properties/$($p.id)/status" -Method Put -Body $body -ContentType "application/json" -WebSession $adminSession | Out-Null
        Write-Host "Approved property: $($p.title)"
    }
}

Write-Host "Seed complete!"
