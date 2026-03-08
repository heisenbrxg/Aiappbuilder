# Set Supabase env vars in Vercel via REST API
$TOKEN = "vca_2dTN1xJsR4penPVIAVVmBM4a7JPrZpcMtjphtErGalTc10CD9V0VpUMW"
$PROJECT_ID = "prj_wSATdrnHVvdii0zRyQwC7gBSdA8r"
$TEAM_ID = "team_JFCXgWUGaBt7IAkEQ5aZXRSx"

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

$envVars = @(
    @{
        key = "VITE_SUPABASE_URL"
        value = "https://yzmefbgfcoetomejhujf.supabase.co"
        type = "plain"
        target = @("production", "preview", "development")
    },
    @{
        key = "VITE_SUPABASE_ANON_KEY"
        value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bWVmYmdmY29ldG9tZWpodWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MjgzMjYsImV4cCI6MjA4MjQwNDMyNn0.xNTviNSYN4hSylE3OO4VYGUVWwf7CdKDoSvKzzBa02c"
        type = "encrypted"
        target = @("production", "preview", "development")
    },
    @{
        key = "SUPABASE_SERVICE_ROLE_KEY"
        value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bWVmYmdmY29ldG9tZWpodWpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgyODMyNiwiZXhwIjoyMDgyNDA0MzI2fQ.VcDKCD0IfbTRyGxcb_-KV4_3EVbAbn3KrZMildgv9_0"
        type = "secret"
        target = @("production", "preview", "development")
    }
)

$apiUrl = "https://api.vercel.com/v10/projects/$PROJECT_ID/env?teamId=$TEAM_ID"

foreach ($envVar in $envVars) {
    $body = $envVar | ConvertTo-Json
    Write-Host "Setting $($envVar.key)..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Headers $headers -Body $body
        Write-Host "  ✅ Successfully set $($envVar.key)" -ForegroundColor Green
        Write-Host "  ID: $($response.id)"
    } catch {
        $errorBody = $_.ErrorDetails.Message
        Write-Host "  ❌ Failed to set $($envVar.key): $_" -ForegroundColor Red
        Write-Host "  Response: $errorBody" -ForegroundColor Yellow
        
        # Try to update if already exists
        if ($errorBody -like "*already exists*") {
            Write-Host "  Variable already exists, trying to update..." -ForegroundColor Yellow
        }
    }
}

Write-Host "`n✅ Done! Now redeploy the project to apply the new environment variables." -ForegroundColor Green
Write-Host "Run: npx vercel --prod" -ForegroundColor Cyan
