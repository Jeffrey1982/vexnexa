# ============================================================
# WCAG AAA Contrast Regression Check (PowerShell)
# ============================================================
# Fails CI if any of the following anti-patterns appear in src/:
#
# 1. text-white combined with bg-[var(--vn-primary)]
#    Must use vn-primary-aaa-btn instead (7:1 with white)
#
# 2. disabled:opacity- on interactive controls (except opacity-100)
#    Must use vn-disabled-bg / vn-disabled-fg tokens
#
# Run: pwsh scripts/check-contrast-regressions.ps1
# ============================================================

$ErrorActionPreference = 'Stop'
$errors = 0

Write-Host ''
Write-Host 'Checking for WCAG AAA contrast regressions...' -ForegroundColor Cyan
Write-Host ''

# Rule 1: text-white on vn-primary background
$pattern1 = 'bg-\[var\(--vn-primary\)\]'
$hits = Get-ChildItem -Path 'src' -Recurse -Include '*.tsx','*.ts','*.jsx','*.css' |
  Select-String -Pattern $pattern1 |
  Where-Object { $_.Line -match 'text-white' }

if ($hits) {
  Write-Host 'FAIL: text-white used with bg-[var(--vn-primary)] - use vn-primary-aaa-btn instead' -ForegroundColor Red
  $hits | ForEach-Object { Write-Host ('  ' + $_.Filename + ':' + $_.LineNumber) }
  Write-Host ''
  $errors++
}

# Rule 2: disabled:opacity-{0..99} (not 100)
$hits = Get-ChildItem -Path 'src' -Recurse -Include '*.tsx','*.ts','*.jsx' |
  Select-String -Pattern 'disabled:opacity-' |
  Where-Object { $_.Line -notmatch 'disabled:opacity-100' }

if ($hits) {
  Write-Host 'FAIL: disabled:opacity-* (not 100) found - use vn-disabled-bg/fg tokens' -ForegroundColor Red
  $hits | ForEach-Object { Write-Host ('  ' + $_.Filename + ':' + $_.LineNumber) }
  Write-Host ''
  $errors++
}

# Rule 3: peer-disabled:opacity- (not 100)
$hits = Get-ChildItem -Path 'src' -Recurse -Include '*.tsx','*.ts','*.jsx' |
  Select-String -Pattern 'peer-disabled:opacity-' |
  Where-Object { $_.Line -notmatch 'peer-disabled:opacity-100' }

if ($hits) {
  Write-Host 'FAIL: peer-disabled:opacity-* (not 100) found - use vn-disabled-fg token' -ForegroundColor Red
  $hits | ForEach-Object { Write-Host ('  ' + $_.Filename + ':' + $_.LineNumber) }
  Write-Host ''
  $errors++
}

# Summary
Write-Host ''
if ($errors -gt 0) {
  Write-Host "$errors contrast regression(s) found. Fix before merging." -ForegroundColor Red
  exit 1
} else {
  Write-Host 'No contrast regressions detected. WCAG AAA tokens are enforced.' -ForegroundColor Green
  exit 0
}
