$files = @(
  "src/components/marketing/home/EnterpriseHero.tsx",
  "src/components/marketing/home/VisibilityHook.tsx",
  "src/components/marketing/home/EnterpriseTrustBar.tsx",
  "src/components/marketing/home/EnterpriseFeatures.tsx",
  "src/components/marketing/home/EfficiencyCalculator.tsx",
  "src/components/marketing/home/EnterprisePricingTeaser.tsx"
)

# Order matters: most specific first.
$pairs = @(
  # text-white opacity variants
  @{ from = 'text-white/85'; to = 'text-slate-700 dark:text-white/85' },
  @{ from = 'text-white/80'; to = 'text-slate-700 dark:text-white/80' },
  @{ from = 'text-white/75'; to = 'text-slate-700 dark:text-white/75' },
  @{ from = 'text-white/70'; to = 'text-slate-600 dark:text-white/70' },
  @{ from = 'text-white/65'; to = 'text-slate-600 dark:text-white/65' },
  @{ from = 'text-white/60'; to = 'text-slate-500 dark:text-white/60' },
  @{ from = 'text-white/55'; to = 'text-slate-500 dark:text-white/55' },
  @{ from = 'text-white/50'; to = 'text-slate-500 dark:text-white/50' },
  @{ from = 'text-white/40'; to = 'text-slate-400 dark:text-white/40' },
  # bg-white opacity variants
  @{ from = 'bg-white/\[0\.05\]'; to = 'bg-slate-50 dark:bg-white/[0.05]' },
  @{ from = 'bg-white/\[0\.04\]'; to = 'bg-slate-50 dark:bg-white/[0.04]' },
  @{ from = 'bg-white/\[0\.03\]'; to = 'bg-slate-50 dark:bg-white/[0.03]' },
  @{ from = 'bg-white/\[0\.02\]'; to = 'bg-slate-50 dark:bg-white/[0.02]' },
  @{ from = 'bg-white/\[0\.01\]'; to = 'bg-white dark:bg-white/[0.01]' },
  # border-white opacity variants
  @{ from = 'border-white/\[0\.06\]'; to = 'border-slate-200 dark:border-white/[0.06]' },
  @{ from = 'border-white/15'; to = 'border-slate-200 dark:border-white/15' },
  @{ from = 'border-white/10'; to = 'border-slate-200 dark:border-white/10' },
  # Section background hardcoded navy
  @{ from = 'bg-\[#0A0F1E\]'; to = 'bg-white dark:bg-[#0A0F1E]' },
  # bg-black variants
  @{ from = 'bg-black/40'; to = 'bg-slate-100 dark:bg-black/40' },
  # Standalone text-white (negative lookahead avoids matching /X already replaced)
  @{ from = 'text-white(?![/\w\-])'; to = 'text-slate-900 dark:text-white' }
)

foreach ($f in $files) {
  $content = Get-Content $f -Raw
  foreach ($p in $pairs) {
    $content = $content -replace $p.from, $p.to
  }
  Set-Content -NoNewline -Path $f -Value $content
  Write-Host "Updated $f"
}
