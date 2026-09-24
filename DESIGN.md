# VexNexa Studio Design

## Approved north star
The user-approved mockup from 24 September 2026: warm ivory header, oversized navy condensed headline on a sky-cyan hero, two tilted actual IpiWow screens and a large smiling globe mascot. Mint hills establish a playful horizon. A product spotlight, navy studio strip and compact seven-language footer follow.

## Tokens and typography
Full palette based on IpiWow's existing sky blue, mint green and sunshine yellow, with dark navy text and warm ivory surfaces. Use OKLCH tokens and strong text contrast. Barlow Condensed bold for display headings, Atkinson Hyperlegible Next for body and interface text. No gradient text. Existing IpiWow SVG wordmark is preserved as supplied.

## Composition
Asymmetric desktop hero: headline and call to action on the left, actual app screens and mascot on the right. On narrow screens, stack text above the scene without clipping controls or shrinking type excessively. Preserve real semantic text and links. Phone frames and landscape shapes are code-native; app screens and mascot are sourced assets.

## Interaction and accessibility
Visible focus, skip link, native-language navigation and correct document language. At least44px targets. Subtle transform/opacity feedback only; no motion necessary for understanding. Respect reduced motion. Contact has visible labels, server validation, explicit pending/success/error states, safe retries and no marketing consent.

## Implementation boundary
Active routes live in root app/ and use studio/ modules. Existing src/ is legacy SaaS source, excluded from active routing and typechecking. Browser verification must cover narrow mobile, tablet and desktop, all seven languages, contact validation and retired route isolation.
