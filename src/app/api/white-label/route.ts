import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // TEMPORARY: Disable white-label loading to stop infinite auth requests
    return NextResponse.json({
      success: true,
      whiteLabel: null,
      hasAccess: false
    });

    // Try to get user, but don't fail if not authenticated
    let user = null;
    try {
      user = await requireAuth();
    } catch (authError) {
      // Not authenticated - return default settings
      return NextResponse.json({
        success: true,
        whiteLabel: null,
        hasAccess: false
      });
    }
    
    // Get white label settings for the authenticated user
    const whiteLabel = await prisma.whiteLabel.findUnique({
      where: { userId: user.id }
    });

    return NextResponse.json({
      success: true,
      whiteLabel: whiteLabel || null,
      hasAccess: user.plan === "BUSINESS"
    });

  } catch (error: any) {
    console.error("Failed to get white label settings:", error);
    return NextResponse.json(
      { error: "Failed to get white label settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Check if user has white label access (Business plan only)
    if (user.plan !== "BUSINESS") {
      return NextResponse.json(
        { 
          error: "White labeling is only available for Business plan users",
          code: "UPGRADE_REQUIRED",
          feature: "whiteLabel" 
        },
        { status: 402 }
      );
    }

    const body = await request.json();
    const {
      companyName,
      logoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      supportEmail,
      website,
      phone,
      footerText,
      showPoweredBy,
      customDomain,
      subdomain
    } = body;

    // Validate colors are valid hex codes
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const colors = { primaryColor, secondaryColor, accentColor };
    
    for (const [key, color] of Object.entries(colors)) {
      if (color && !hexColorRegex.test(color)) {
        return NextResponse.json(
          { error: `Invalid ${key}. Must be a valid hex color code (e.g., #3B82F6)` },
          { status: 400 }
        );
      }
    }

    // Validate email format if provided
    if (supportEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(supportEmail)) {
        return NextResponse.json(
          { error: "Invalid email format for support email" },
          { status: 400 }
        );
      }
    }

    // Validate URLs if provided
    const urls = { website, logoUrl, faviconUrl };
    for (const [key, url] of Object.entries(urls)) {
      if (url) {
        try {
          new URL(url);
        } catch {
          return NextResponse.json(
            { error: `Invalid URL format for ${key}` },
            { status: 400 }
          );
        }
      }
    }

    // Create or update white label settings
    const whiteLabel = await prisma.whiteLabel.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        companyName,
        logoUrl,
        faviconUrl,
        primaryColor: primaryColor || "#3B82F6",
        secondaryColor: secondaryColor || "#1F2937",
        accentColor: accentColor || "#10B981",
        supportEmail,
        website,
        phone,
        footerText,
        showPoweredBy: showPoweredBy !== undefined ? showPoweredBy : true,
        customDomain,
        subdomain
      },
      update: {
        companyName,
        logoUrl,
        faviconUrl,
        primaryColor: primaryColor || "#3B82F6",
        secondaryColor: secondaryColor || "#1F2937",
        accentColor: accentColor || "#10B981",
        supportEmail,
        website,
        phone,
        footerText,
        showPoweredBy: showPoweredBy !== undefined ? showPoweredBy : true,
        customDomain,
        subdomain
      }
    });

    return NextResponse.json({
      success: true,
      whiteLabel
    });

  } catch (error: any) {
    console.error("Failed to update white label settings:", error);
    
    if (error instanceof Error) {
      if ((error as any).code === "UPGRADE_REQUIRED") {
        return NextResponse.json(
          { 
            error: error.message,
            code: "UPGRADE_REQUIRED",
            feature: (error as any).feature
          },
          { status: 402 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to update white label settings" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Check if user has white label access
    if (user.plan !== "BUSINESS") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Delete white label settings
    await prisma.whiteLabel.delete({
      where: { userId: user.id }
    }).catch(() => {
      // Ignore error if record doesn't exist
    });

    return NextResponse.json({
      success: true,
      message: "White label settings reset to default"
    });

  } catch (error: any) {
    console.error("Failed to reset white label settings:", error);
    return NextResponse.json(
      { error: "Failed to reset white label settings" },
      { status: 500 }
    );
  }
}