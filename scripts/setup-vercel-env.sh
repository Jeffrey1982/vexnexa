#!/bin/bash
# Quick script to add Google Analytics environment variables to Vercel
# Run: bash scripts/setup-vercel-env.sh

echo "🚀 Adding environment variables to Vercel..."
echo ""

# Add GOOGLE_CLIENT_EMAIL
echo "vexnexa-google-health@vincamor-9cfec.iam.gserviceaccount.com" | vercel env add GOOGLE_CLIENT_EMAIL production

# Add GOOGLE_PRIVATE_KEY
echo "-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8sWeoK4q3+MC6
ITTwccr61NS0gVnSEtsCgUou66e+H4znem5TnUDDVoNem232rHQ5VIwLyib4u2Dz
Wu7U2NaZGtZFatT41KIpDyD2s2+NlDGz7RNu6R3mhJQKGm50scgG678fYfIN2Ov+
/tE6VwUAf0hNSroHcc7xQf92nWi91cpnN4uvYN+BQ6HICJghpiNn6ci8eXbM2p0F
wINo8TDa7gH2O6DIoeJX0fHOMahsVp3KoQO4GxO9/LNC3PQf01eL93ejRUvYPn2L
ytsDMdoM43ZYbJK3msECr4+aXjWcawmwbBkTHKIfxTBKZAQxJebvMXi1D9WSB/B+
G35eS+KlAgMBAAECggEAV0bTRDTHl+qF8lGzs9deZICW1drSmdlA1brJfkRftQ/Q
06yMZT5iGzfj0Zmg1izUIURa9oUNW5UH9efEekzFjdGc9ETCt0larBUkUReT7G90
Qd3RVEadHueJtdad6nnkpFbccv6RwBfqqGpiilJ/rMgywBVlUFYyuuKk789FCDCU
VKw1V4f2G6AK8pSqFKwFNa0uulTSLj7DeFtRzUQUxADc/tO78k2i0imSVt6EgSe0
bgnPKi/6zA2wSNpPGe8Q2pzZsyHt1mlk6PgnXTBc+I8ZOATsAhXLgoEFAY6zqIJT
Jq4GKIlpbeYTipayOgOxVXrSWl8fCibCt1ydFBvhrQKBgQDkNTI53o7mkILduTp1
vebuncyq99cDhhNiXFIEpsueBvSswplopCujo6lesjdn2RwmrsnHHe+AMu0QzFp3
k7eHPeQl0EP51OnqQQhBcXZi5TBPCRqb+A89IW4K5teTxXybcglHJfMp4TOgYG2s
00SvnuiJouebnFl+u86beD3IXwKBgQDTrELEU6Asi1MZjU84739g01DSrWOA9QmT
xDAXkdl7WX78pdC6oz697JyKSeu3AVXddWRSJWFJv6MNMpAZwMezecgwNDZ5jyFv
09WBg66GqUHjW80PqVxtktRCGxeViqMrcSPr37Q1RWv+fXKWxHbr6/Im9bOAY/pK
wgb9bWyDewKBgAx3S3MV0UCPDFcIU0UzRnYqcI+2UiyDGnP5DxHp+p17S8pUJwUs
UqXxvsLJgXVOytbiHWufGwIpxgFw6FA35YKhwuC967iuBMkjHExW4lysoGLw4F88
wbhZJyW5TnVoCFKFfDRCwnG7N5K/Mb6LG+lsCM/b8kLx24GsyLB9dQKJAoGAR3Tj
pTtF20O9bebSU7omGh28LyLxcFtIPGYChjJqZMW1pLylVhw91gfGYLjLpiABSJ2U
nFaaHTdgZ9gl5Uu7Hs+B0SQPL8It2357mRlHFZaV85bOBvd5iFQE67wRnh4LL2Mm
aT4/q6wf5O2cfWEddE9Wk+hmDHWzzQDrMyp5c3kCgYEA03P7YD+bvPeQLdVlmgeb
vpM0fKZ6z/0/VhCn07+L48ZG58UPZmuIIpPAbBwKXnoXGWEElZ1pAwFdHp5sN+1t
Cv7aoVKfgdbwAHKfCjatmVCw9WoI0yBVfG8A38CqzGaZCybmyAMZePGY8arKgXiH
BEtgEJ/mw3oFfHoqep3w6Bs=
-----END PRIVATE KEY-----" | vercel env add GOOGLE_PRIVATE_KEY production

# Add GSC_SITE_URL
echo "sc-domain:vexnexa.com" | vercel env add GSC_SITE_URL production

# Add GA4_PROPERTY_ID
echo "517433349" | vercel env add GA4_PROPERTY_ID production

# Add NEXT_PUBLIC_GA4_MEASUREMENT_ID
echo "G-8RD0R3P0EN" | vercel env add NEXT_PUBLIC_GA4_MEASUREMENT_ID production

# Add CRON_TOKEN (generated secure token)
echo "vGsiw1+JJ7YB+IWwWqerbB8o3bDk2Ryib9grk8LyHrU=" | vercel env add CRON_TOKEN production

echo ""
echo "✅ All environment variables added to Vercel production!"
echo ""
echo "Next steps:"
echo "1. Redeploy your app: vercel --prod"
echo "2. Run migrations: npx prisma migrate deploy"
echo "3. Test the integration!"
