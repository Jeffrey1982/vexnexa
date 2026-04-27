import { GoogleGenerativeAI } from '@google/generative-ai';

// Types for AI analysis results
export interface ImageAnalysisResult {
  src: string;
  currentAlt: string;
  isAccurate: boolean;
  score: number; // 0-100
  suggestedAlt: string;
  error?: string;
}

export interface ImageData {
  src: string;
  alt: string;
  base64?: string;
}

// Initialize Gemini client
function getGeminiClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenerativeAI(apiKey);
}

// System prompt for Gemini
const SYSTEM_PROMPT = `You are an expert in Web Accessibility (WCAG 2.1/2.2). Analyze this image. Compare its visual content with the provided alt-text: '[USER_ALT_TEXT]'. Determine:
1. Is the current alt-text accurate? (Score 0-100)
2. Is it descriptive enough?
3. Suggest a better alt-text if necessary.
Return a JSON object: { "is_accurate": boolean, "score": number, "suggested_alt": string }`;

/**
 * Analyze a single image's alt-text against its visual content using Gemini
 */
export async function analyzeImageAltText(
  imageData: ImageData,
  timeoutMs: number = 10000
): Promise<ImageAnalysisResult> {
  const startTime = Date.now();
  
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 200,
      }
    });

    // Prepare the prompt
    const prompt = SYSTEM_PROMPT.replace('[USER_ALT_TEXT]', imageData.alt || '');
    
    // If we have base64 image data, include it
    let imagePart: any = null;
    if (imageData.base64) {
      imagePart = {
        inlineData: {
          data: imageData.base64,
          mimeType: 'image/jpeg'
        }
      };
    }

    // Create content array
    const content: any[] = [{ text: prompt }];
    if (imagePart) {
      content.push(imagePart);
    }

    // Run analysis with timeout
    const result = await Promise.race([
      model.generateContent(content),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('AI analysis timeout')), timeoutMs)
      )
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    let parsed: any;
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('[AI Image Analysis] Failed to parse JSON response:', text);
      throw new Error('Failed to parse AI response as JSON');
    }

    return {
      src: imageData.src,
      currentAlt: imageData.alt,
      isAccurate: parsed.is_accurate || false,
      score: typeof parsed.score === 'number' ? parsed.score : 0,
      suggestedAlt: parsed.suggested_alt || '',
    };
  } catch (error: any) {
    console.error('[AI Image Analysis] Error analyzing image:', error?.message);
    return {
      src: imageData.src,
      currentAlt: imageData.alt,
      isAccurate: false,
      score: 0,
      suggestedAlt: '',
      error: error?.message || 'Unknown error',
    };
  }
}

/**
 * Analyze multiple images with timeout handling and limit checks
 * @param images Array of image data to analyze
 * @param maxImages Maximum number of images to analyze (to stay within Vercel timeout)
 * @param maxTotalTime Maximum total time in milliseconds for all analyses
 * @returns Array of analysis results
 */
export async function analyzeMultipleImages(
  images: ImageData[],
  maxImages: number = 5,
  maxTotalTime: number = 25000
): Promise<ImageAnalysisResult[]> {
  const results: ImageAnalysisResult[] = [];
  const startTime = Date.now();
  
  // Limit the number of images to analyze
  const imagesToAnalyze = images.slice(0, maxImages);
  
  console.log(`[AI Image Analysis] Analyzing ${imagesToAnalyze.length} images (limited from ${images.length} total)`);
  
  for (const imageData of imagesToAnalyze) {
    // Check if we're approaching the total time limit
    const elapsed = Date.now() - startTime;
    const remainingTime = maxTotalTime - elapsed;
    
    if (remainingTime <= 2000) { // Leave 2 seconds buffer
      console.warn(`[AI Image Analysis] Approaching time limit, stopping after ${results.length} images`);
      break;
    }
    
    // Analyze this image with remaining time as timeout
    const result = await analyzeImageAltText(imageData, remainingTime);
    results.push(result);
    
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`[AI Image Analysis] Completed ${results.length} analyses in ${Date.now() - startTime}ms`);
  return results;
}

/**
 * Extract image data from Puppeteer page
 */
export async function extractImageDataFromPage(page: any, maxImages: number = 20): Promise<ImageData[]> {
  try {
    const imageData = await page.evaluate((max: number) => {
      const images = Array.from(document.querySelectorAll('img'));
      const data: any[] = [];
      
      for (const img of images) {
        if (data.length >= max) break;
        
        const src = img.getAttribute('src');
        if (!src) continue;
        
        // Skip very small images (likely icons/decorative)
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        if (width < 32 || height < 32) continue;
        
        // Convert to absolute URL if relative
        let absoluteSrc = src;
        if (src.startsWith('//')) {
          absoluteSrc = window.location.protocol + src;
        } else if (src.startsWith('/')) {
          absoluteSrc = window.location.origin + src;
        } else if (!src.startsWith('http')) {
          absoluteSrc = new URL(src, window.location.href).href;
        }
        
        data.push({
          src: absoluteSrc,
          alt: img.getAttribute('alt') || '',
        });
      }
      
      return data;
    }, maxImages);
    
    return imageData;
  } catch (error: any) {
    console.error('[AI Image Analysis] Failed to extract image data:', error?.message);
    return [];
  }
}

/**
 * Convert image URL to base64 using Puppeteer
 */
export async function convertImageToBase64(page: any, imageUrl: string): Promise<string | null> {
  try {
    // Navigate to the image URL and get base64
    const response = await page.goto(imageUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
    if (!response) return null;
    
    const buffer = await response.buffer();
    return buffer.toString('base64');
  } catch (error: any) {
    console.error(`[AI Image Analysis] Failed to convert image to base64: ${imageUrl}`, error?.message);
    return null;
  }
}
