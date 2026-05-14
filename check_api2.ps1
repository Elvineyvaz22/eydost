$r = Invoke-WebRequest -Uri 'https://bot.eydost.az/api/public/packages?country_code=TR' -UseBasicParsing
Write-Host "Status (no key):" $r.StatusCode
Write-Host "Length (no key):" $r.Content.Length
Write-Host $r.Content.Substring(0, [Math]::Min(200, $r.Content.Length))