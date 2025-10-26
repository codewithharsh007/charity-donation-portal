import Link from 'next/link';
import Image from 'next/image';

export default function AboutPreview() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 text-center">
          <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-4xl md:text-5xl font-bold text-teal-500 mb-2">5,000+</h3>
            <p className="text-lg text-gray-600">Children Supported</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-4xl md:text-5xl font-bold text-blue-500 mb-2">15K+</h3>
            <p className="text-lg text-gray-600">Items Donated</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-4xl md:text-5xl font-bold text-pink-500 mb-2">100+</h3>
            <p className="text-lg text-gray-600">NGO Partners</p>
          </div>
        </div>

        {/* Mission & Vision Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Image */}
          <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-xl">
            <Image
              src="/img/about.png"
              alt="Children learning and enjoying donations"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Right Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
              Connecting Generosity with Need
            </h2>
            
            <p className="text-lg text-gray-600 leading-relaxed">
              Our Charity Portal bridges the gap between generous donors and NGOs 
              supporting children who need essential resources. We connect communities 
              to provide books, food, and supplies that enable learning and growth.
            </p>

            <p className="text-lg text-gray-600 leading-relaxed">
              Every child deserves the opportunity to learn, grow, and thrive. 
              Through transparency and compassion, we're building a brighter future 
              for children across communities.
            </p>
            
            {/* Core Values Icons */}
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-teal-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl">🤝</span>
                </div>
                <p className="text-sm font-semibold text-gray-700">Compassion</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl">🔍</span>
                </div>
                <p className="text-sm font-semibold text-gray-700">Transparency</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-pink-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl">🌍</span>
                </div>
                <p className="text-sm font-semibold text-gray-700">Impact</p>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Link 
                href="/about" 
                className="inline-block bg-teal-500  text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-teal-600 shadow-md"
              >
                Learn More
              </Link>
              
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
