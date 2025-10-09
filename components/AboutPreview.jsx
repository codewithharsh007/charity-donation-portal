import Link from 'next/link';
import Image from 'next/image';

export default function AboutPreview() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 text-center ">
          <div>
            <h3 className="text-4xl md:text-5xl font-bold text-red-500 mb-2">5,000+</h3>
            <p className="text-lg text-gray-600">Lives changed</p>
          </div>
          <div>
            <h3 className="text-4xl md:text-5xl font-bold text-red-600 mb-2">3.2M</h3>
            <p className="text-lg text-gray-600">People supported</p>
          </div>
          <div>
            <h3 className="text-4xl md:text-5xl font-bold text-red-600 mb-2">10,000+</h3>
            <p className="text-lg text-gray-600">Volunteers</p>
          </div>
        </div>

        {/* Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Our mission
            </h2>
            
            <p className="text-lg text-gray-600 leading-relaxed">
              We believe in making a difference in the lives of those who need it most. Our organization is dedicated to providing aid and support to communities around the world.
            </p>
            
            <Link 
              href="/about" 
              className="inline-block bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Learn More
            </Link>
          </div>

          {/* Right Image */}
          <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
            <Image
              src="/img/hero.jpeg"
              alt="Mother and child"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
