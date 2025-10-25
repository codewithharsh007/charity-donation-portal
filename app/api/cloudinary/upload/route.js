import { NextResponse } from 'next/server';
import cloudinary from '@/config/cloudinary';
import { protect } from '@/middlewares/authMiddleware';

// POST - upload image (expects { data: dataUrl, filename })
export async function POST(request) {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ 
        message: 'Server configuration error. Please contact administrator.',
        error: 'Cloudinary credentials not configured'
      }, { status: 500 });
    }

    // Protect route - only authenticated users
    const auth = await protect(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const body = await request.json();
    const { data, filename } = body;

    if (!data) {
      return NextResponse.json({ message: 'No file data provided' }, { status: 400 });
    }

    // Validate data URL format
    if (!data.startsWith('data:')) {
      return NextResponse.json({ message: 'Invalid file data format' }, { status: 400 });
    }

    // Determine resource type based on file data or filename
    let resourceType = 'auto'; // auto-detect by default
    if (filename) {
      const ext = filename.toLowerCase().split('.').pop();
      if (['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv'].includes(ext)) {
        resourceType = 'video';
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
        resourceType = 'image';
      }
    }

    // cloudinary.uploader.upload accepts data URLs directly
    const result = await cloudinary.uploader.upload(data, {
      folder: 'charity_uploads',
      public_id: filename ? filename.replace(/\.[^/.]+$/, '') : undefined,
      resource_type: resourceType,
      overwrite: false,
    });

    return NextResponse.json({
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ 
      message: 'Upload failed', 
      error: err.message,
      details: err.toString()
    }, { status: 500 });
  }
}
