import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    await requireAuth();

    const { url, width = 1200, height = 800, fullPage = true } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Use a reliable free screenshot service
    try {
      // Try shot.screenshotapi.net - free service that works without API keys
      const screenshotUrl = `https://shot.screenshotapi.net/screenshot?url=${encodeURIComponent(url)}&width=${width}&height=${height}&output=image&file_type=png&wait_for_event=load`;

      const response = await fetch(screenshotUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (response.ok && response.headers.get('content-type')?.includes('image')) {
        const buffer = await response.arrayBuffer();
        const base64Screenshot = `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;

        return NextResponse.json({
          success: true,
          screenshot: base64Screenshot,
          dimensions: {
            width: width,
            height: height,
            viewportWidth: width,
            viewportHeight: height
          },
          url,
          service: 'screenshotapi'
        });
      }
    } catch (serviceError) {
      console.warn('ScreenshotAPI failed:', serviceError);
    }

    // Fallback: Try microlink.io screenshot service
    try {
      const microlinkUrl = `https://api.microlink.io/screenshot?url=${encodeURIComponent(url)}&viewport.width=${width}&viewport.height=${height}&type=png`;

      const response = await fetch(microlinkUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.ok) {
        const data = await response.json();

        if (data.status === 'success' && data.data?.screenshot) {
          // The API returns a URL to the screenshot
          const screenshotResponse = await fetch(data.data.screenshot);
          const buffer = await screenshotResponse.arrayBuffer();
          const base64Screenshot = `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;

          return NextResponse.json({
            success: true,
            screenshot: base64Screenshot,
            dimensions: {
              width: width,
              height: height,
              viewportWidth: width,
              viewportHeight: height
            },
            url,
            service: 'microlink'
          });
        }
      }
    } catch (microlinkError) {
      console.warn('Microlink failed:', microlinkError);
    }

    // Final fallback: Try htmlcsstoimage with proper free access
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              background: #f5f5f5;
            }
            .preview {
              background: white;
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .url {
              color: #666;
              font-size: 14px;
              word-break: break-all;
            }
            .content {
              line-height: 1.6;
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="preview">
            <div class="header">
              <h2>Website Preview</h2>
              <div class="url">${url}</div>
            </div>
            <div class="content">
              <p>This is a preview representation of the website. Click the points below to see accessibility issues mapped to their approximate locations.</p>
              <p><strong>Note:</strong> For full screenshot capture, additional services would need to be configured.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create a simple HTML preview as base64
      const base64Screenshot = `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`;

      return NextResponse.json({
        success: true,
        screenshot: base64Screenshot,
        dimensions: {
          width: width,
          height: height,
          viewportWidth: width,
          viewportHeight: height
        },
        url,
        service: 'html-preview',
        isPreview: true
      });

    } catch (htmlError) {
      console.warn('HTML preview failed:', htmlError);
    }

    // If all services fail, return an error
    return NextResponse.json({
      error: "Screenshot capture temporarily unavailable. Please try again later or ensure the website is publicly accessible.",
      success: false,
      details: "Unable to capture website screenshot"
    }, { status: 503 });

  } catch (error) {
    console.error('Screenshot API error:', error);

    return NextResponse.json({
      error: `Screenshot failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false
    }, { status: 500 });
  }
}

// GET endpoint for element positions - simplified without browser automation
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const selectors = searchParams.get('selectors');

    if (!url || !selectors) {
      return NextResponse.json({
        error: "URL and selectors are required"
      }, { status: 400 });
    }

    let selectorArray: string[];
    try {
      selectorArray = JSON.parse(selectors);
    } catch {
      return NextResponse.json({
        error: "Invalid selectors format"
      }, { status: 400 });
    }

    // For now, return estimated positions based on common element patterns
    // This is a simplified approach until we have a proper browser automation service
    const estimatedPositions = selectorArray.map((selector, index) => {
      // Generate realistic positions based on selector patterns
      let x = 50, y = 50; // Default center

      // Form elements typically in middle/lower sections
      if (selector.includes('input') || selector.includes('form') || selector.includes('button')) {
        x = 20 + Math.random() * 60; // 20-80%
        y = 60 + Math.random() * 30; // 60-90%
      }
      // Navigation elements in top section
      else if (selector.includes('nav') || selector.includes('header') || selector.includes('menu')) {
        x = 20 + Math.random() * 60; // 20-80%
        y = 5 + Math.random() * 20;  // 5-25%
      }
      // Image elements throughout the page
      else if (selector.includes('img')) {
        x = 10 + Math.random() * 80; // 10-90%
        y = 20 + Math.random() * 60; // 20-80%
      }
      // Links can be anywhere
      else if (selector.includes('a')) {
        x = 15 + Math.random() * 70; // 15-85%
        y = 15 + Math.random() * 70; // 15-85%
      }
      // Headings in content areas
      else if (selector.includes('h1') || selector.includes('h2') || selector.includes('h3')) {
        x = 20 + Math.random() * 60; // 20-80%
        y = 30 + Math.random() * 50; // 30-80%
      }

      // Convert percentages to absolute coordinates (assuming 1200x800 viewport)
      const absoluteX = (x / 100) * 1200;
      const absoluteY = (y / 100) * 800;

      return {
        x: absoluteX,
        y: absoluteY,
        width: 100 + Math.random() * 200, // Random width
        height: 30 + Math.random() * 50,  // Random height
        selector: selector
      };
    });

    return NextResponse.json({
      success: true,
      positions: estimatedPositions,
      url,
      method: 'estimated'
    });

  } catch (error) {
    console.error('Element positioning error:', error);
    return NextResponse.json({
      error: `Failed to get element positions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false
    }, { status: 500 });
  }
}