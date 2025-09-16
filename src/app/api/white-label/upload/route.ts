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

    // For this implementation, we'll save files to a public directory
    // In production, you might want to use a cloud storage service like AWS S3 or Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `${user.id}_${type}_${timestamp}.${fileExtension}`;
    const publicPath = `/uploads/white-label/${filename}`;
    
    // Create directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'white-label');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Write file
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: publicPath,
      filename,
      type
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