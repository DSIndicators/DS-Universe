# DS Universe site - catalogue export (2026-11-01).
# Reads the two business workbooks READ-ONLY through Excel and writes content\catalog\sheet.json, the one file
# the site's catalogue is generated from (tools\catalog\sync.mjs). Nothing in the workbooks is changed.
#   Master Product & Pricing Sheet: Product Catalog, Product Details, Markets, NT8 Listings (cover line)
#   Patch Notes & Versions:         Current Versions (version, assembly)
param([string]$BD = '')
$ErrorActionPreference = 'Stop'
$SITE = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not $BD) { $BD = Join-Path (Split-Path (Split-Path $SITE -Parent) -Parent) 'DS Master Folder\00 Business Documents' }
$MASTER = Join-Path $BD 'DS Universe - Master Product & Pricing Sheet.xlsx'
$PATCH  = Join-Path $BD 'DS Universe - Patch Notes & Versions.xlsx'
foreach ($f in $MASTER, $PATCH) { if (-not (Test-Path $f)) { throw "Not found: $f" } }
function Section([string]$a) {
  if ($a -match '^ON THE PRICE CHART') { return 'chart' }
  if ($a -match '^IN A PANEL') { return 'panel' }
  if ($a -match '^ADD-ONS') { return 'addon' }
  if ($a -match '^FREE VAULT') { return 'vault' }
  if ($a -match '^THE BUNDLE|^THE VAULT') { return 'bundle' }
  return $null
}
function ReadTab($wb, $name, [string[]]$keep) {   # only the columns the site uses: sheet.json is published with the site
  $ws = $wb.Worksheets.Item($name); $v = $ws.UsedRange.Value2; $n = $v.GetLength(0); $m = $v.GetLength(1)
  $out = @(); $sec = $null; $hdr = $null
  for ($r = 1; $r -le $n; $r++) {
    $a = [string]$v[$r, 1]; $b = [string]$v[$r, 2]
    if ($a -eq 'ID' -and $b -eq 'Product') { $hdr = $r; continue }
    if (-not $hdr) { continue }
    $s = Section $a; if ($s) { $sec = $s; continue }
    if (-not $b -or -not $b.StartsWith('DS ')) { continue }
    $row = [ordered]@{ section = $sec; id = $a; product = $b }
    for ($c = 3; $c -le $m; $c++) { $h = [string]$v[$hdr, $c]; if ($h -and ($keep -contains $h)) { $row[$h] = [string]$v[$r, $c] } }
    $out += [pscustomobject]$row
  }
  return ,$out
}
$xl = New-Object -ComObject Excel.Application; $xl.Visible = $false; $xl.DisplayAlerts = $false
try {
  $wb = $xl.Workbooks.Open($MASTER, 0, $true)          # read-only
  $cat = ReadTab $wb 'Product Catalog' @('Type', 'Category', 'Purpose', 'Hook 1', 'Hook 2', 'Hook 3', 'Hook 4')
  $det = ReadTab $wb 'Product Details' @('How It Helps Traders', 'Full Description')
  $mkt = ReadTab $wb 'Markets' @('What It Reads')
  $nt8 = ReadTab $wb 'NT8 Listings' @("Cover Line  (250$([char]0x00D7)250 image)")
  $wb.Close($false)
  $wb = $xl.Workbooks.Open($PATCH, 0, $true)
  $ws = $wb.Worksheets.Item('Current Versions'); $v = $ws.UsedRange.Value2; $ver = @{}
  for ($r = 1; $r -le $v.GetLength(0); $r++) { $b = [string]$v[$r, 2]; if ($b.StartsWith('DS ')) { $ver[$b] = @{ version = [string]$v[$r, 4]; assembly = [string]$v[$r, 9]; tier = [string]$v[$r, 3] } } }
  $wb.Close($false)
} finally { $xl.Quit(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($xl) }
$o = [ordered]@{ exported = (Get-Date).ToString('s'); catalog = $cat; details = $det; markets = $mkt; nt8 = $nt8; versions = $ver }
$dst = Join-Path $SITE 'content\catalog\sheet.json'
New-Item -ItemType Directory -Force (Split-Path $dst) | Out-Null
[IO.File]::WriteAllText($dst, ($o | ConvertTo-Json -Depth 6), (New-Object Text.UTF8Encoding($false)))
"catalogue exported: $($cat.Count) products, $($ver.Count) versions -> $dst"
