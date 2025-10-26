// app/api/admin/expenses/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/config/JWT';
import dbConnect from '@/lib/mongodb';
import Expense from '@/models/expenseModel';
import User from '@/models/authModel';

export const runtime = 'nodejs';

// GET - Get all expenses (Admin only)
export async function GET(req) {
  try {
    await dbConnect();
    
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }


    // Check if user is admin
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }


    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    let query = {};
    if (category && category !== 'all') query.category = category;
    if (status && status !== 'all') query.status = status;

    const expenses = await Expense.find(query)
      .populate('addedBy', 'userName email')
      .sort({ date: -1 })
      .lean();


    // Calculate totals
    const paidExpenses = await Expense.find({ status: 'paid' }).lean();
    const totalAmount = paidExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate by category
    const byCategory = {};
    paidExpenses.forEach(exp => {
      if (!byCategory[exp.category]) {
        byCategory[exp.category] = {
          _id: exp.category,
          total: 0,
          count: 0,
        };
      }
      byCategory[exp.category].total += exp.amount;
      byCategory[exp.category].count += 1;
    });

    const byCategoryArray = Object.values(byCategory).sort((a, b) => b.total - a.total);

    return NextResponse.json({
      success: true,
      expenses,
      totals: {
        total: totalAmount,
        count: paidExpenses.length,
      },
      byCategory: byCategoryArray,
    });
  } catch (error) {
    console.error('❌ Error fetching expenses:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error', 
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Add new expense (Admin only)
export async function POST(req) {
  try {
    await dbConnect();
    
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }


    // Check if user is admin
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }


    const body = await req.json();
    const { title, description, amount, category, date, paymentMethod, receipt, notes, status } = body;

    if (!title || !amount || !category) {
      return NextResponse.json(
        { success: false, message: 'Title, amount, and category are required' },
        { status: 400 }
      );
    }

    const expense = new Expense({
      title,
      description,
      amount: parseFloat(amount),
      category,
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'bank_transfer',
      receipt,
      notes,
      status: status || 'paid',
      addedBy: decoded.id,
    });

    await expense.save();
    await expense.populate('addedBy', 'userName email');


    return NextResponse.json({
      success: true,
      message: 'Expense added successfully',
      expense,
    });
  } catch (error) {
    console.error('❌ Error adding expense:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error', 
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete an expense (Admin only)
export async function DELETE(req) {
  try {
    await dbConnect();
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get('id');

    if (!expenseId) {
      return NextResponse.json(
        { success: false, message: 'Expense ID required' },
        { status: 400 }
      );
    }

    const expense = await Expense.findByIdAndDelete(expenseId);

    if (!expense) {
      return NextResponse.json(
        { success: false, message: 'Expense not found' },
        { status: 404 }
      );
    }


    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting expense:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
