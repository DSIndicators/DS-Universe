# DS Universe site - publish to dsuniverse.net (2026-11-01). Run from "PUBLISH THE SITE TO DSUNIVERSE.NET.bat".
# The site folder is not a git repo: like every launch since 2026-10-31, this pushes from a fresh temporary clone of
# github.com/DSIndicators/DS-Universe (main), so nothing here is touched and the secrets never leave the PC
# (.data, .env*, node_modules, .next and HANDOFF*.md are left out, as .gitignore says).
#   1 build the site here (a site that does not build is never pushed)
#   2 clone main into %TEMP%, mirror this folder into it, show what changed
#   3 push only after you type PUBLISH.  Rollback: git push --force origin before-1031-essentials:main (see the handoff)
param([string]$Message = '', [switch]$Yes)
$ErrorActionPreference = 'Continue'   # git writes notices to stderr; every step checks its own exit code
$SITE = Split-Path $PSScriptRoot -Parent
$CC = Split-Path $SITE -Parent
$repo = (& git -C (Join-Path $CC 'DS-Universe-3') remote get-url origin 2>$null)
if (-not $repo) { $repo = 'https://github.com/DSIndicators/DS-Universe.git' }
Write-Host "[1/3] Building the site here first..."
Push-Location $SITE
try { & npm.cmd run build --silent; if ($LASTEXITCODE -ne 0) { throw 'The site does not build - nothing was published. The reason is printed above.' } } finally { Pop-Location }
$tmp = Join-Path $env:TEMP ('ds-publish-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
Write-Host "[2/3] Cloning main into $tmp ..."
& git clone --quiet --depth 1 --branch main $repo $tmp; if ($LASTEXITCODE -ne 0) { throw "git clone failed ($repo)" }
$xd = @('.git', 'node_modules', '.next', '.data', '_to_delete')
$xf = @('.env', '.env.*', '*.tsbuildinfo', 'HANDOFF*.md')
& robocopy $SITE $tmp /MIR /NFL /NDL /NJH /NJS /NP /XD @xd /XF @xf | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($LASTEXITCODE)" }
Push-Location $tmp
try {
  & cmd /c "git add -A 2>nul"      # (line-ending notices are expected on Windows)
  if ($LASTEXITCODE -ne 0) { throw 'git add failed' }
  $st = @(& git status --porcelain)
  if ($st.Count -eq 0) { Write-Host "Nothing to publish: dsuniverse.net already has exactly this site."; return }
  Write-Host ""
  Write-Host ("{0} file(s) will change on dsuniverse.net:" -f $st.Count)
  $st | Select-Object -First 40 | ForEach-Object { Write-Host "   $_" }
  if ($st.Count -gt 40) { Write-Host "   ... and $($st.Count - 40) more" }
  if (-not $Yes) {
    $a = Read-Host "`n[3/3] Type PUBLISH to push these live (anything else cancels)"
    if ($a -cne 'PUBLISH') { Write-Host 'Cancelled. Nothing was published.'; return }
  }
  if (-not $Message) { $Message = 'Site update ' + (Get-Date -Format 'yyyy-MM-dd HH:mm') }
  & git -c user.name='DS Universe' -c user.email='support@dsuniverse.net' commit --quiet -m $Message 2>$null
  if ($LASTEXITCODE -ne 0) { throw 'git commit failed' }
  & cmd /c "git push --quiet origin main 2>&1"; if ($LASTEXITCODE -ne 0) { throw 'git push failed - nothing changed on the site.' }
  Write-Host ("Published: " + (& git log -1 --format='%h %s') + ". Hostinger rebuilds dsuniverse.net in a minute or two.")
} finally { Pop-Location }
