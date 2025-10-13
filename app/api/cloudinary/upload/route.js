import { NextResponse } from 'next/server';
import cloudinary from '@/config/cloudinary';
import { protect } from '@/middlewares/authMiddleware';

// POST - upload image (expects { data: dataUrl, filename })
export async function POST(request) {
  try {
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

    // cloudinary.uploader.upload accepts data URLs directly
    const result = await cloudinary.uploader.upload(data, {
      folder: 'charity_uploads',
      public_id: filename ? filename.replace(/\.[^/.]+$/, '') : undefined,
      resource_type: 'image',
      overwrite: false,
    });

    return NextResponse.json({
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
    }, { status: 200 });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return NextResponse.json({ message: 'Upload failed', error: err.message }, { status: 500 });
  }
}
