$apiKey = $env:ESIM_BOT_API_KEY
if (-not $apiKey) {
  Write-Error "Set the ESIM_BOT_API_KEY env var first, e.g. `$env:ESIM_BOT_API_KEY = '<key>'"
  exit 1
}
$r = Invoke-WebRequest -Uri 'https://bot.eydost.az/api/public/packages?country_code=US' -Headers @{'x-api-key'=$apiKey} -UseBasicParsing
Write-Host "Status:" $r.StatusCode
Write-Host "Length:" $r.Content.Length
Write-Host $r.Content.Substring(0, [Math]::Min(1500, $r.Content.Length))
