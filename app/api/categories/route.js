import { NextResponse } from 'next/server';
import { verifyToken } from '@/middlewares/authMiddleware';
import { getAllCategories, getCategoriesByTier } from '@/controllers/categoryController';
import dbConnect from '@/lib/mongodb';

// GET - Get all categories or user's accessible categories
export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'accessible' or 'all'
    
    // If requesting accessible categories, verify auth
    if (filter === 'accessible') {
      const authResult = await verifyToken(req);
      if (!authResult.success) {
        return NextResponse.json(
          { message: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const userId = authResult.user.userId;
      const result = await getCategoriesByTier(userId);
      
      return NextResponse.json(
        {
          success: result.success,
          categories: result.categories,
        },
        { status: result.status }
      );
    }
    
    // Default: get all categories
    const result = await getAllCategories();
    
    return NextResponse.json(
      {
        success: result.success,
        categories: result.categories,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

