import dbConnect from '@/lib/mongodb';
import Donation from '@/models/donorModal';
import cloudinary from '@/config/cloudinary';
import { protect } from '@/middlewares/authMiddleware';

/** Create a donation (donor must be authenticated)
 * Expected body: { ngo, ngoType: 'money'|'items', amount?, items?, note?, images?, videos? }
 */
export const createDonation = async (request) => {
  try {
    const auth = await protect(request);
    if (!auth.success) return auth;

    await dbConnect();
    const body = await request.json();
  const { ngo, ngoType, amount, items = [], note = '', images = [], videos = [], imagesData = [], videosData = [] } = body;

    if (!ngo) return { success: false, message: 'NGO id is required', status: 400 };
    if (!['money', 'items'].includes(ngoType)) return { success: false, message: 'Invalid ngoType', status: 400 };

    if (ngoType === 'money' && (!amount || amount <= 0)) {
      return { success: false, message: 'Amount is required for money donations', status: 400 };
    }

    if (ngoType === 'items' && (!Array.isArray(items) || items.length === 0)) {
      return { success: false, message: 'Items list is required for item donations', status: 400 };
    }

    // Server-side checks: require media for item donations
    if (ngoType === 'items') {
      const hasClientImages = Array.isArray(images) && images.filter(Boolean).length > 0;
      const hasClientVideos = Array.isArray(videos) && videos.filter(Boolean).length > 0;
      const hasIncomingImageData = Array.isArray(imagesData) && imagesData.filter(Boolean).length > 0;
      const hasIncomingVideoData = Array.isArray(videosData) && videosData.filter(Boolean).length > 0;
      if (!hasClientImages && !hasClientVideos && !hasIncomingImageData && !hasIncomingVideoData) {
        return { success: false, message: 'Item donations require at least one image or video', status: 400 };
      }
    }

    // Ensure Cloudinary configuration is present before attempting uploads
    if ((Array.isArray(imagesData) && imagesData.length > 0) || (Array.isArray(videosData) && videosData.length > 0)) {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error('Cloudinary credentials missing in environment');
        return { success: false, message: 'Server email/upload configuration missing (CLOUDINARY_*). Please contact admin.', status: 500 };
      }
    }

    // Process uploads: imagesData and videosData contain data URLs (base64) from client
    const uploadedImages = [];
    const uploadedVideos = [];

    // Filter falsy entries to avoid Cloudinary errors
    const imageDataList = Array.isArray(imagesData) ? imagesData.filter(Boolean) : [];
    const videoDataList = Array.isArray(videosData) ? videosData.filter(Boolean) : [];

    // Upload imagesData to Cloudinary (if any)
    if (imageDataList.length > 0) {
      const imageUploads = imageDataList.map((data) =>
        cloudinary.uploader.upload(data, {
          folder: 'charity_uploads/images',
          resource_type: 'image',
          overwrite: false,
        })
      );
      const results = await Promise.allSettled(imageUploads);
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled' && r.value && r.value.secure_url) uploadedImages.push(r.value.secure_url);
        else console.error('Image upload failed:', r.reason || r);
      });
    }

    // Upload videosData to Cloudinary (if any)
    if (videoDataList.length > 0) {
      const videoUploads = videoDataList.map((data) =>
        cloudinary.uploader.upload(data, {
          folder: 'charity_uploads/videos',
          resource_type: 'video',
          overwrite: false,
        })
      );
      const results = await Promise.allSettled(videoUploads);
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value && r.value.secure_url) uploadedVideos.push(r.value.secure_url);
        else console.error('Video upload failed:', r.reason || r);
      });
    }

    // Combine provided URLs (images/videos) with uploaded ones
    const finalImages = Array.isArray(images) ? [...images.filter(Boolean), ...uploadedImages] : uploadedImages;
    const finalVideos = Array.isArray(videos) ? [...videos.filter(Boolean), ...uploadedVideos] : uploadedVideos;

    // Server-side enforcement: after uploads, ensure item donations have media
    if (ngoType === 'items' && finalImages.length === 0 && finalVideos.length === 0) {
      return { success: false, message: 'Item donations require at least one successful image or video upload', status: 400 };
    }

    const donation = new Donation({
      donor: auth.userId,
      ngo,
      ngoType,
      amount: ngoType === 'money' ? amount : undefined,
      items: ngoType === 'items' ? items : [],
      note,
      images: finalImages,
      videos: finalVideos,
      status: 'pending',
    });

    await donation.save();

    return { success: true, message: 'Donation created', donation, status: 201 };
  } catch (err) {
    console.error('❌ createDonation error:', err);
    return { success: false, message: 'Server error', error: err.message, status: 500 };
  }
};

/** Get donations for the authenticated donor */
export const getDonorDonations = async (request) => {
  try {
    const auth = await protect(request);
    if (!auth.success) return auth;

    await dbConnect();
    const donations = await Donation.find({ donor: auth.userId }).sort({ createdAt: -1 });

    return { success: true, donations, status: 200 };
  } catch (err) {
    console.error('❌ getDonorDonations error:', err);
    return { success: false, message: 'Server error', error: err.message, status: 500 };
  }
};

/** Get donations for a specific NGO (query param ngoId). No role checks here. */
export const getNgoDonations = async (request) => {
  try {
    const auth = await protect(request);
    if (!auth.success) return auth;

    await dbConnect();
    const url = new URL(request.url);
    const ngoId = url.searchParams.get('ngoId');
    if (!ngoId) return { success: false, message: 'ngoId is required', status: 400 };

    const donations = await Donation.find({ ngo: ngoId }).sort({ createdAt: -1 });

    return { success: true, donations, status: 200 };
  } catch (err) {
    console.error('❌ getNgoDonations error:', err);
    return { success: false, message: 'Server error', error: err.message, status: 500 };
  }
};



export default {
  createDonation,

};
