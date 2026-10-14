# Downloads themed landing images into public/landing (run from repo root or apps/web).
$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot "..\public\landing"
@("popular", "categories", "providers") | ForEach-Object {
  New-Item -ItemType Directory -Force -Path (Join-Path $root $_) | Out-Null
}

$files = @{
  "popular/cleaning.jpg"       = "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=900&q=85"
  "popular/ac.jpg"             = "https://images.pexels.com/photos/4108710/pexels-photo-4108710.jpeg?auto=compress&cs=tinysrgb&w=900"
  "popular/makeup.jpg"         = "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&q=85"
  "popular/plumbing.jpg"       = "https://images.pexels.com/photos/8486020/pexels-photo-8486020.jpeg?auto=compress&cs=tinysrgb&w=900"
  "categories/home-cleaning.jpg" = "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=700&q=85"
  "categories/beauty.jpg"      = "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700&q=85"
  "categories/repairs.jpg"     = "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=700&q=85"
  "categories/fitness.jpg"     = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=700&q=85"
  "categories/events.jpg"      = "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=700&q=85"
  "categories/tutoring.jpg"    = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=700&q=85"
  "providers/sparkle-home-co.jpg" = "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=900"
  "providers/coolair-experts.jpg" = "https://images.pexels.com/photos/4108710/pexels-photo-4108710.jpeg?auto=compress&cs=tinysrgb&w=900"
  "providers/glow-studio.jpg"  = "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=85"
}

foreach ($rel in $files.Keys) {
  $out = Join-Path $root $rel
  $url = $files[$rel]
  Write-Host "Fetching $rel ..."
  curl.exe -fsSL -o $out $url
  if (-not (Test-Path $out) -or (Get-Item $out).Length -lt 5000) {
    throw "Download failed or file too small: $rel"
  }
}
Write-Host "Done. All landing images updated."
