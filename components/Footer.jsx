'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    };

    // Check on mount
    checkUser();

    // Listen for storage changes (for multi-tab sync)
    window.addEventListener('storage', checkUser);
    
    // Listen for custom login event
    window.addEventListener('userLoggedIn', checkUser);

    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('userLoggedIn', checkUser);
    };
  }, []);

  // Don't show footer for admin users
  if (user && user.role === 'admin') {
    return null;
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-red-600 text-xl font-bold mb-4">Charity</h3>
            <p className="text-sm">
              Making a difference in lives through compassionate giving and support for those in need.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm hover:text-red-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm hover:text-red-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/donate" className="text-sm hover:text-red-600 transition-colors">
                  Donate Now
                </Link>
              </li>
              <li>
                <Link href="/campaigns" className="text-sm hover:text-red-600 transition-colors">
                  Campaigns
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-sm hover:text-red-600 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm hover:text-red-600 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm hover:text-red-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm hover:text-red-600 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Get In Touch</h4>
            <ul className="space-y-2 text-sm">
              <li>Email: info@charity.org</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Address: 123 Charity Street, City, State 12345</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Charity Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
