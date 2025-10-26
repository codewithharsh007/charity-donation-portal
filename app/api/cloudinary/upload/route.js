// app/api/cloudinary/upload/route.js
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { protect } from '@/middlewares/authMiddleware';

// Configure Cloudinary directly in this file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Prevent caching and set timeout
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300; // 5 minutes
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    // Check credentials
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary credentials missing');
      return NextResponse.json({ 
        success: false,
        message: 'Server configuration error',
        error: 'Cloudinary credentials not configured'
      }, { status: 500 });
    }

    // Authenticate user
    const auth = await protect(request);
    if (!auth.success) {
      console.error('❌ Authentication failed');
      return NextResponse.json({ 
        success: false,
        message: auth.message 
      }, { status: auth.status });
    }

    // Parse body
    const body = await request.json();
    const { data, filename } = body;

    // Validate
    if (!data || !data.startsWith('data:')) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid file data' 
      }, { status: 400 });
    }

    // Determine type
    let resourceType = 'auto';
    if (filename) {
      const ext = filename.toLowerCase().split('.').pop();
      if (['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv', 'mpeg', 'mpg'].includes(ext)) {
        resourceType = 'video';
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(ext)) {
        resourceType = 'image';
      }
    }


    // Upload config
    const uploadConfig = {
      folder: 'charity_uploads',
      resource_type: resourceType,
      chunk_size: 6000000,
      timeout: 300000, // 5 minutes
    };

    // Video specific
    if (resourceType === 'video') {
      uploadConfig.eager = [
        { 
          width: 1280, 
          height: 720, 
          crop: 'limit', 
          quality: 'auto',
          format: 'mp4' 
        }
      ];
      uploadConfig.eager_async = true;
    }

    // Upload
    const result = await cloudinary.uploader.upload(data, uploadConfig);


    // Return
    return NextResponse.json({
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      resource_type: result.resource_type,
      format: result.format,
      bytes: result.bytes,
    }, { status: 200 });

  } catch (err) {
    console.error('❌ Upload failed:', err);
    
    // Error handling
    let errorMessage = 'Upload failed';
    const errMsg = err?.message || '';
    const httpCode = err?.http_code || 500;
    
    // Check nested error
    if (err?.error) {
      if (err.error.name === 'TimeoutError' || err.error.http_code === 499) {
        errorMessage = 'Upload timeout. File too large. Please compress to under 50MB.';
      } else if (err.error.message) {
        errorMessage = err.error.message;
      }
    } else if (errMsg) {
      if (errMsg.toLowerCase().includes('timeout')) {
        errorMessage = 'Upload timeout. File may be too large.';
      } else if (errMsg.includes('size')) {
        errorMessage = 'File size exceeds limit';
      } else if (errMsg.includes('invalid')) {
        errorMessage = 'Invalid file format';
      }
    }
    
    if (httpCode === 401) errorMessage = 'Authentication failed';
    if (httpCode === 420) errorMessage = 'Rate limit exceeded';
    if (httpCode === 499) errorMessage = 'Upload timeout. File too large.';

    return NextResponse.json({ 
      success: false,
      message: errorMessage, 
      error: errMsg || err?.error?.message || 'Unknown error'
    }, { status: httpCode });
  }
}

export async function DELETE(request) {
  try {
    const auth = await protect(request);
    if (!auth.success) {
      return NextResponse.json({ 
        success: false,
        message: auth.message 
      }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json({ 
        success: false,
        message: 'Public ID required' 
      }, { status: 400 });
    }

    await cloudinary.uploader.destroy(publicId);

    return NextResponse.json({
      success: true,
      message: 'File deleted'
    }, { status: 200 });

  } catch (err) {
    console.error('❌ Delete failed:', err);
    return NextResponse.json({ 
      success: false,
      message: 'Delete failed',
      error: err?.message || 'Unknown error'
    }, { status: 500 });
  }
}
