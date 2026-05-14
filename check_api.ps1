$r = Invoke-WebRequest -Uri 'https://bot.eydost.az/api/public/packages?country_code=US' -Headers @{'x-api-key'='0283e222ea829a8300d3f2ce4b42855d'} -UseBasicParsing
Write-Host "Status:" $r.StatusCode
Write-Host "Length:" $r.Content.Length
Write-Host $r.Content.Substring(0, [Math]::Min(1500, $r.Content.Length))