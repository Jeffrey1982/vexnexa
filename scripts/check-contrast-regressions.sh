#!/usr/bin/env bash
# ============================================================
# WCAG AAA Contrast Regression Check
# ============================================================
# Fails CI if any of the following anti-patterns appear in src/:
#
# 1. "text-white" combined with "bg-[var(--vn-primary)]"
#    → Must use --vn-primary-aaa-btn instead (7:1 with white)
#
# 2. "disabled:opacity-" on interactive controls (except opacity-100)
#    → Must use --vn-disabled-bg / --vn-disabled-fg tokens
#
# Run: bash scripts/check-contrast-regressions.sh
# ============================================================

set -euo pipefail

ERRORS=0

echo "🔍 Checking for WCAG AAA contrast regressions..."
echo ""

# ── Rule 1: text-white on --vn-primary background ──────────
# Matches bg-[var(--vn-primary)] ... text-white on the same line
HITS=$(grep -rn 'bg-\[var(--vn-primary)\]' src/ --include='*.tsx' --include='*.ts' --include='*.jsx' --include='*.css' | grep 'text-white' || true)
if [ -n "$HITS" ]; then
  echo "❌ FAIL: text-white used with bg-[var(--vn-primary)] — use --vn-primary-aaa-btn instead"
  echo "$HITS"
  echo ""
  ERRORS=$((ERRORS + 1))
fi

# ── Rule 2: disabled:opacity-{0..99} on interactive elements ─
# Allows disabled:opacity-100 (our explicit override)
HITS=$(grep -rn 'disabled:opacity-' src/ --include='*.tsx' --include='*.ts' --include='*.jsx' | grep -v 'disabled:opacity-100' || true)
if [ -n "$HITS" ]; then
  echo "❌ FAIL: disabled:opacity-* (not 100) found — use --vn-disabled-bg/--vn-disabled-fg tokens"
  echo "$HITS"
  echo ""
  ERRORS=$((ERRORS + 1))
fi

# Also check peer-disabled:opacity- (except 100)
HITS=$(grep -rn 'peer-disabled:opacity-' src/ --include='*.tsx' --include='*.ts' --include='*.jsx' | grep -v 'peer-disabled:opacity-100' || true)
if [ -n "$HITS" ]; then
  echo "❌ FAIL: peer-disabled:opacity-* (not 100) found — use --vn-disabled-fg token"
  echo "$HITS"
  echo ""
  ERRORS=$((ERRORS + 1))
fi

# ── Summary ─────────────────────────────────────────────────
if [ "$ERRORS" -gt 0 ]; then
  echo "💥 $ERRORS contrast regression(s) found. Fix before merging."
  exit 1
else
  echo "✅ No contrast regressions detected. WCAG AAA tokens are enforced."
  exit 0
fi
