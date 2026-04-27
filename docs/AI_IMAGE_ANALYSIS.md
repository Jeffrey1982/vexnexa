# AI Image Analysis Integration

## Overview

VexNexa now supports AI-powered image accessibility analysis using Google Gemini 1.5 Flash. This feature validates image alt-texts against their actual visual content to ensure accessibility compliance with WCAG 2.1/2.2 guidelines.

## How It Works

1. During a scan, Puppeteer extracts all `<img>` tags from the page
2. Images are analyzed by Google Gemini 1.5 Flash using a specialized accessibility prompt
3. For each image, Gemini evaluates:
   - Whether the current alt-text is accurate (score 0-100)
   - Whether it's descriptive enough
   - Suggests a better alt-text if necessary
4. Results are merged with the standard axe-core accessibility scan results

## Environment Variables

### Required

- `GOOGLE_GEMINI_API_KEY`: Your Google AI Studio API key for Gemini 1.5 Flash
  - Get your key at: https://aistudio.google.com/app/apikey
  - Required for AI image analysis to function

### Optional

- `ENABLE_AI_IMAGE_ANALYSIS`: Set to `"true"` to enable AI image analysis (default: disabled)
  - When disabled, scans run without AI analysis (faster, no API costs)
  - Recommended to enable for production environments

## Configuration

### Image Analysis Limits

To stay within Vercel function timeout limits (60s for the scan route), the AI analysis is configured with these defaults:

- **Maximum images analyzed per scan**: 5
- **Maximum total time for AI analysis**: 20 seconds
- **Maximum images extracted**: 20 (before filtering)

These limits ensure the scan completes within Vercel's timeout constraints while still providing valuable AI insights.

### Timeout Handling

The AI analysis includes robust timeout handling:

- Each individual image analysis has a 10-second timeout
- Total AI analysis is limited to 20 seconds
- If approaching the time limit, analysis stops gracefully
- AI analysis failures don't fail the entire scan (non-blocking)

## Response Format

The scan result now includes an `aiContentChecks` array in the raw JSON:

```typescript
{
  "aiContentChecks": [
    {
      "src": "https://example.com/image.jpg",
      "currentAlt": "A beautiful sunset",
      "isAccurate": true,
      "score": 95,
      "suggestedAlt": "",
      "error": null
    },
    {
      "src": "https://example.com/logo.png",
      "currentAlt": "logo",
      "isAccurate": false,
      "score": 30,
      "suggestedAlt": "VexNexa company logo",
      "error": null
    }
  ]
}
```

## Database Storage

AI analysis results are stored in the `raw` field of the scan record as JSON. No additional database schema changes are required.

## Cost Considerations

- Gemini 1.5 Flash pricing: ~$0.075 per 1M tokens (as of 2025)
- Each image analysis typically uses ~200-500 tokens
- Analyzing 5 images per scan ≈ $0.0002 - $0.0005 per scan
- Consider enabling/disabling based on your plan tier and usage

## Monitoring

The scanner logs include AI analysis status:

```
[a11y] Starting AI image analysis...
[a11y] Extracted 12 images for analysis
[a11y] AI image analysis completed in 8500ms (5 images analyzed)
```

## Future Enhancements

Potential improvements for the AI integration:

1. **Base64 image encoding**: Currently uses image URLs; could convert to base64 for better accuracy
2. **Batch processing**: Process multiple images in parallel for faster analysis
3. **Caching**: Cache AI results for images that appear across multiple scans
4. **Custom prompts**: Allow users to customize the accessibility prompt
5. **Score weighting**: Incorporate AI scores into the overall accessibility score

## Troubleshooting

### AI analysis not running

- Check that `ENABLE_AI_IMAGE_ANALYSIS` is set to `"true"`
- Verify `GOOGLE_GEMINI_API_KEY` is set correctly
- Check logs for AI-related errors

### Timeouts

- If scans are timing out, consider reducing the number of images analyzed
- Check Vercel function timeout limits for your plan
- Monitor scan duration in logs

### API errors

- Verify your Gemini API key has the correct permissions
- Check your Google AI Studio billing status
- Review error logs for specific API error messages
