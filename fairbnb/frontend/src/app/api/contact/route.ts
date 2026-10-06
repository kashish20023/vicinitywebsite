import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, reason, website_url } = body;

    // 1. Honeypot Check (anti-spam)
    if (website_url) {
      // Spam bot filled hidden field — silently acknowledge without processing
      return NextResponse.json({
        success: true,
        message: 'Thank you for reaching out! We will get back to you shortly.',
      });
    }

    // 2. Validate mandatory fields
    if (!name || !email || !reason) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide all required fields (Name, Email, and Reason).',
        },
        { status: 400 },
      );
    }

    // 3. Log contact request
    console.log('[Contact Form Submission]', {
      name,
      email,
      phone,
      reason,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for contacting Fair Stay! Our team will get back to you within 24 hours.',
    });
  } catch (error) {
    console.error('Error handling contact submission:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process request. Please try again later.',
      },
      { status: 500 },
    );
  }
}
