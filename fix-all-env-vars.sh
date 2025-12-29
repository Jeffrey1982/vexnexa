#!/bin/bash
# Fix all environment variables by removing newlines

echo "Fixing all Vercel Production environment variables..."
echo ""

# Get values from .env.local (without newlines)
GOOGLE_CLIENT_EMAIL="vexnexa-google-health@vincamor-9cfec.iam.gserviceaccount.com"
GSC_SITE_URL="sc-domain:vexnexa.com"
GA4_PROPERTY_ID="517433349"

# Read the private key properly (it should have \n for line breaks in the key itself, but not at the end)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8sWeoK4q3+MC6\nITTwccr61NS0gVnSEtsCgUou66e+H4znem5TnUDDVoNem232rHQ5VIwLyib4u2Dz\nWu7U2NaZGtZFatT41KIpDyD2s2+NlDGz7RNu6R3mhJQKGm50scgG678fYfIN2Ov+\n/tE6VwUAf0hNSroHcc7xQf92nWi91cpnN4uvYN+BQ6HICJghpiNn6ci8eXbM2p0F\nwINo8TDa7gH2O6DIoeJX0fHOMahsVp3KoQO4GxO9/LNC3PQf01eL93ejRUvYPn2L\nytsDMdoM43ZYbJK3msECr4+aXjWcawmwbBkTHKIfxTBKZAQxJebvMXi1D9WSB/B+\nG35eS+KlAgMBAAECggEAV0bTRDTHl+qF8lGzs9deZICW1drSmdlA1brJfkRftQ/Q\n06yMZT5iGzfj0Zmg1izUIURa9oUNW5UH9efEekzFjdGc9ETCt0larBUkUReT7G90\nQd3RVEadHueJtdad6nnkpFbccv6RwBfqqGpiilJ/rMgywBVlUFYyuuKk789FCDCU\nVKw1V4f2G6AK8pSqFKwFNa0uulTSLj7DeFtRzUQUxADc/tO78k2i0imSVt6EgSe0\nbgnPKi/6zA2wSNpPGe8Q2pzZsyHt1mlk6PgnXTBc+I8ZOATsAhXLgoEFAY6zqIJT\nJq4GKIlpbeYTipayOgOxVXrSWl8fCibCt1ydFBvhrQKBgQDkNTI53o7mkILduTp1\nvebuncyq99cDhhNiXFIEpsueBvSswplopCujo6lesjdn2RwmrsnHHe+AMu0QzFp3\nk7eHPeQl0EP51OnqQQhBcXZi5TBPCRqb+A89IW4K5teTxXybcglHJfMp4TOgYG2s\n00SvnuiJouebnFl+u86beD3IXwKBgQDTrELEU6Asi1MZjU84739g01DSrWOA9QmT\nxDAXkdl7WX78pdC6oz697JyKSeu3AVXddWRSJWFJv6MNMpAZwMezecgwNDZ5jyFv\n09WBg66GqUHjW80PqVxtktRCGxeViqMrcSPr37Q1RWv+fXKWxHbr6/Im9bOAY/pK\nwgb9bWyDewKBgAx3S3MV0UCPDFcIU0UzRnYqcI+2UiyDGnP5DxHp+p17S8pUJwUs\nUqXxvsLJgXVOytbiHWufGwIpxgFw6FA35YKhwuC967iuBMkjHExW4lysoGLw4F88\nwbhZJyW5TnVoCFKFfDRCwnG7N5K/Mb6LG+lsCM/b8kLx24GsyLB9dQKJAoGAR3Tj\npTtF20O9bebSU7omGh28LyLxcFtIPGYChjJqZMW1pLylVhw91gfGYLjLpiABSJ2U\nnFaaHTdgZ9gl5Uu7Hs+B0SQPL8It2357mRlHFZaV85bOBvd5iFQE67wRnh4LL2Mm\naT4/q6wf5O2cfWEddE9Wk+hmDHWzzQDrMyp5c3kCgYEA03P7YD+bvPeQLdVlmgeb\nvpM0fKZ6z/0/VhCn07+L48ZG58UPZmuIIpPAbBwKXnoXGWEElZ1pAwFdHp5sN+1t\nCv7aoVKfgdbwAHKfCjatmVCw9WoI0yBVfG8A38CqzGaZCybmyAMZePGY8arKgXiH\nBEtgEJ/mw3oFfHoqep3w6Bs=\n-----END PRIVATE KEY-----"

echo "1. Updating GOOGLE_CLIENT_EMAIL..."
echo "y" | vercel env rm GOOGLE_CLIENT_EMAIL production 2>&1 | grep -v "^?"
printf '%s' "$GOOGLE_CLIENT_EMAIL" | vercel env add GOOGLE_CLIENT_EMAIL production 2>&1 | grep -v "^?"

echo ""
echo "2. Updating GSC_SITE_URL..."
echo "y" | vercel env rm GSC_SITE_URL production 2>&1 | grep -v "^?"
printf '%s' "$GSC_SITE_URL" | vercel env add GSC_SITE_URL production 2>&1 | grep -v "^?"

echo ""
echo "3. Updating GA4_PROPERTY_ID..."
echo "y" | vercel env rm GA4_PROPERTY_ID production 2>&1 | grep -v "^?"
printf '%s' "$GA4_PROPERTY_ID" | vercel env add GA4_PROPERTY_ID production 2>&1 | grep -v "^?"

echo ""
echo "4. Updating GOOGLE_PRIVATE_KEY..."
echo "y" | vercel env rm GOOGLE_PRIVATE_KEY production 2>&1 | grep -v "^?"
printf '%s' "$GOOGLE_PRIVATE_KEY" | vercel env add GOOGLE_PRIVATE_KEY production 2>&1 | grep -v "^?"

echo ""
echo "✅ All environment variables updated!"
