import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { assertWithinLimits } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Check authentication and white label permissions
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'logo' or 'favicon'

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!['logo', 'favicon'].includes(type)) {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'logo' or 'favicon'" },
        { status: 400 }
      );
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and SVG files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Convert image to base64 data URL for serverless compatibility
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Update the white label settings with the new image
    const fieldName = type === 'logo' ? 'logoUrl' : 'faviconUrl';

    const whiteLabel = await prisma.whiteLabel.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        [fieldName]: dataUrl,
        primaryColor: "#3B82F6",
        secondaryColor: "#1F2937",
        accentColor: "#10B981",
        showPoweredBy: true
      },
      update: {
        [fieldName]: dataUrl
      }
    });

    return NextResponse.json({
      success: true,
      url: dataUrl,
      type,
      message: `${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`
    });

  } catch (error: any) {
    console.error("File upload failed:", error);
    
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
      { error: "File upload failed" },
      { status: 500 }
    );
  }
}