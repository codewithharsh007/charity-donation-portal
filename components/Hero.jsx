import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-white to-amber-50 h-[90vh] w-full flex items-center">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-5 ml-16 md:ml-12">
            <h1 className="text-4xl md:text-7xl font-bold text-gray-900 leading-tight">
              Help those
              <br />
              in need
            </h1>
            
            <p className="text-lg text-gray-600 max-w-md">
              We're committed to providing support and resources to those in need.
            </p>
            
            <Link 
              href="/donate" 
              className="inline-block bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors shadow-lg"
            >
              Donate Now
            </Link>
          </div>

          {/* Right Image */}
          <div className="relative h-[350px] lg:h-[450px] rounded-lg overflow-hidden">
            <Image
              src="/img/hero.jpeg"
              alt="Child smiling"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
