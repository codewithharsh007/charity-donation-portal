import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="bg-gray-50 min-h-screen">

      {/* Top Banner / Hero */}
      <section className="relative bg-gradient-to-r from-teal-400 to-blue-500 h-36 md:h-48 flex items-center justify-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white text-center drop-shadow-lg">
          About Our Charity Portal
        </h1>
      </section>

      {/* About Section */}
      <section className="py-16 px-6 md:px-16 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
        {/* Left Image */}
        <div className="w-full md:w-1/2 relative h-[400px]">
          <Image
            src="/img/about.png"
            alt="Children learning and enjoying donations"
            fill
            className="rounded-lg shadow-lg object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Right Text */}
        <div className="w-full md:w-1/2 space-y-6">
          <h2 className="text-3xl font-bold text-gray-800">Who We Are</h2>
          <p className="text-gray-600 text-lg">
            Our Charity Portal connects generous donors with NGOs and children who
            need support. Donors can contribute books, food, and essential items,
            while NGO children can learn, grow, and thrive from these donations.
          </p>
          <p className="text-gray-600 text-lg">
            We believe every child deserves the opportunity to learn and stay
            nourished. By bridging the gap between donors and NGOs, we make a
            meaningful impact in the community and help shape a brighter future
            for children.
          </p>
        </div>
      </section>

      {/* Mission, Vision, Values Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Our Core Values</h2>
          <p className="text-gray-600 mt-4 text-lg">Driving education and nourishment for every child</p>
        </div>

        

  <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
    
    {/* Mission */}
    <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🎯</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Mission</h3>
      </div>
      <p className="text-slate-600">
        To provide children with essential resources like books and food, enabling learning and growth.
      </p>
    </div>

    {/* Vision */}
    <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
      <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">👁️</span>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-4">Vision</h3>
      </div>
      <p className="text-slate-600">
        To create a future where every child is educated, nourished, and empowered to reach their potential.
      </p>
    </div>

    {/* Values */}
    <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
      <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">💎</span>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-4">Values</h3>
      </div>
      <p className="text-slate-600">
        Compassion, transparency, and community impact guide everything we do.
      </p>
    </div>
    
  </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-teal-400 to-blue-500 text-white text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Be Part of the Change</h2>
        <p className="mb-8 max-w-2xl mx-auto text-lg px-6">
          Join us in empowering children through donations of books, food, and essentials. Every contribution matters.
        </p>
        <Link 
          href="/donate"
          className="inline-block bg-white text-teal-600 font-bold px-8 py-3 rounded-full shadow-lg hover:bg-gray-100 transition"
        >
          Donate Now
        </Link>
      </section>

    </main>
  );
}