import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-white to-amber-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              About Our Mission
            </h1>
            <p className="text-xl text-gray-600">
              Dedicated to making a positive impact in communities worldwide through compassion and action.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <h3 className="text-5xl font-bold text-red-600 mb-3">5,000+</h3>
              <p className="text-xl text-gray-600">Lives changed</p>
            </div>
            <div className="p-6">
              <h3 className="text-5xl font-bold text-red-600 mb-3">3.2M</h3>
              <p className="text-xl text-gray-600">People supported</p>
            </div>
            <div className="p-6">
              <h3 className="text-5xl font-bold text-red-600 mb-3">10,000+</h3>
              <p className="text-xl text-gray-600">Volunteers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
              <Image
                src="/img/hero.jpeg"
                alt="Mother and child"
                fill
                className="object-cover"
              />
            </div>
            
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900">Our Mission</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                We believe in making a difference in the lives of those who need it most. Our organization is dedicated to providing aid and support to communities around the world.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Through our various programs and initiatives, we work tirelessly to ensure that no one is left behind. From providing essential resources to offering educational opportunities, we are committed to creating lasting change.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 order-2 lg:order-1">
              <h2 className="text-4xl font-bold text-gray-900">Our Vision</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                We envision a world where everyone has access to basic necessities, education, and opportunities to thrive. A world where compassion drives action and communities support one another.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our vision extends beyond immediate relief. We aim to empower communities to become self-sufficient and create sustainable solutions that will benefit generations to come.
              </p>
            </div>
            
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden order-1 lg:order-2">
              <Image
                src="/img/aboutRandom.jpeg"
                alt="Community support"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600">
              The principles that guide our work and inspire our team every day.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Compassion</h3>
              <p className="text-gray-600">
                We lead with empathy and understanding, putting the needs of others at the forefront of everything we do.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Integrity</h3>
              <p className="text-gray-600">
                We operate with transparency and honesty, ensuring every donation makes a real difference.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Impact</h3>
              <p className="text-gray-600">
                We focus on creating measurable, lasting change that transforms lives and communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Join Us in Making a Difference</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Your support can change lives. Whether through donations or volunteering, every contribution matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/donate" 
              className="bg-white text-red-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Donate Now
            </Link>
            <Link 
              href="/volunteer" 
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-red-600 transition-colors"
            >
              Become a Volunteer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
