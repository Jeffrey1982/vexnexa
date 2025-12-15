import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/blog/upload-image
 * Uploads an image to Supabase storage for blog posts
 *
 * Request: multipart/form-data with 'file' field
 * Response: { ok: true, url: string, path: string } | { ok: false, error: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if admin client is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { ok: false, error: 'Storage service not configured. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Check authentication
    let user;
    try {
      user = await getCurrentUser();
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { ok: false, error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = `blog/${fileName}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from('blog-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { ok: false, error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      path: filePath,
      fileName: fileName,
      fileSize: file.size,
      fileType: file.type
    });

  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/blog/upload-image?path=<path>
 * Deletes an image from Supabase storage
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check if admin client is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { ok: false, error: 'Storage service not configured. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Check authentication
    let user;
    try {
      user = await getCurrentUser();
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { ok: false, error: 'No path provided' },
        { status: 400 }
      );
    }

    // Delete from Supabase storage using admin client (bypasses RLS)
    const { error } = await supabaseAdmin.storage
      .from('blog-images')
      .remove([path]);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { ok: false, error: `Delete failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Image deleted successfully'
    });

  } catch (error: any) {
    console.error('Image delete error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
}
