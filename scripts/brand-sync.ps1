$files = @(
  "src/components/marketing/home/EnterpriseHero.tsx",
  "src/components/marketing/home/VisibilityHook.tsx",
  "src/components/marketing/home/EnterpriseTrustBar.tsx",
  "src/components/marketing/home/EnterpriseFeatures.tsx",
  "src/components/marketing/home/EfficiencyCalculator.tsx",
  "src/components/marketing/home/EnterprisePricingTeaser.tsx"
)

$pairs = @(
  # Buttons: gold bg + dark navy text -> primary tokens
  @{ from = 'bg-\[#D4AF37\] px-7 font-semibold text-\[#0A0F1E\] hover:bg-\[#B8941F\] dark:hover:bg-\[#E5C158\]'; to = 'bg-primary px-7 font-semibold text-primary-foreground hover:bg-primary/90' },
  @{ from = 'focus-visible:ring-\[#D4AF37\]'; to = 'focus-visible:ring-primary' },
  @{ from = 'focus-visible:ring-offset-\[#0A0F1E\]'; to = 'focus-visible:ring-offset-secondary' },
  # Color utilities with opacity
  @{ from = 'text-\[#D4AF37\]'; to = 'text-primary' },
  @{ from = 'border-\[#D4AF37\]/40'; to = 'border-primary/40' },
  @{ from = 'border-\[#D4AF37\]/30'; to = 'border-primary/30' },
  @{ from = 'border-\[#D4AF37\]/25'; to = 'border-primary/25' },
  @{ from = 'border-\[#D4AF37\]'; to = 'border-primary' },
  @{ from = 'bg-\[#D4AF37\]/\[0\.12\]'; to = 'bg-primary/[0.12]' },
  @{ from = 'bg-\[#D4AF37\]/\[0\.07\]'; to = 'bg-primary/[0.07]' },
  @{ from = 'bg-\[#D4AF37\]/\[0\.05\]'; to = 'bg-primary/[0.05]' },
  @{ from = 'bg-\[#D4AF37\]/25'; to = 'bg-primary/25' },
  @{ from = 'bg-\[#D4AF37\]/20'; to = 'bg-primary/20' },
  @{ from = 'bg-\[#D4AF37\]/15'; to = 'bg-primary/15' },
  @{ from = 'bg-\[#D4AF37\]/10'; to = 'bg-primary/10' },
  @{ from = 'bg-\[#D4AF37\]'; to = 'bg-primary' },
  # SVG attributes
  @{ from = 'stroke="#D4AF37"'; to = 'className="stroke-[#D4AF37]"' },
  @{ from = 'fill="#D4AF37"'; to = 'className="fill-[#D4AF37]"' },
  @{ from = 'fill-\[#D4AF37\]'; to = 'fill-primary' },
  @{ from = 'stroke-\[#D4AF37\]'; to = 'stroke-primary' }
)

foreach ($f in $files) {
  $c = Get-Content $f -Raw
  foreach ($p in $pairs) {
    $c = $c -replace $p.from, $p.to
  }
  Set-Content -NoNewline -Path $f -Value $c
  Write-Host "Updated $f"
}
