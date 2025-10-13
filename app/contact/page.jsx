import ContactUs from '@/components/contactUs';
import Link from 'next/link';

export const metadata = {
  title: 'Contact Us - Charity',
  description: 'Get in touch with the Charity team',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">Contact Us</h1>
          <p className="text-gray-400 mt-2">Send us a message and we'll get back to you as soon as possible.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ContactUs />
          </div>

          <div className="rounded-2xl bg-gray-800 p-8 text-gray-300">
            <h3 className="text-2xl font-bold text-white mb-4">Other ways to reach us</h3>
            <p className="mb-4">You can also contact us via:</p>
            <ul className="space-y-3 text-sm">
              <li><strong>Email:</strong> <a href="mailto:info@charity.org" className="text-red-500">vineetpancheshwar1611@gmail.com</a></li>
              <li><strong>Phone:</strong> +91 6268923703</li>
              <li><strong>Address:</strong>Minal Mall , Bhopal</li>
            </ul>

            <div className="mt-6">
              <Link href="/" className="text-red-500 hover:text-red-400">← Back to Home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
