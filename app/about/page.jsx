import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top Banner / Hero */}
      <section className="relative flex h-36 items-center justify-center bg-gradient-to-r from-teal-400 to-blue-500 md:h-48">
        <h1 className="text-center text-4xl font-extrabold text-white drop-shadow-lg md:text-6xl">
          About Our Charity Portal
        </h1>
      </section>

      {/* About Section */}
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 py-16 md:flex-row md:px-16">
        {/* Left Image */}
        <div className="relative h-[400px] w-full md:w-1/2">
          <Image
            src="/img/about.png"
            alt="Children learning and enjoying donations"
            fill
            className="rounded-lg object-cover shadow-lg"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Right Text */}
        <div className="w-full space-y-6 md:w-1/2">
          <h2 className="text-3xl font-bold text-gray-800">Who We Are</h2>
          <p className="text-lg text-gray-600">
            Our Charity Portal connects generous donors with NGOs and children
            who need support. Donors can contribute books, food, and essential
            items, while NGO children can learn, grow, and thrive from these
            donations.
          </p>
          <p className="text-lg text-gray-600">
            We believe every child deserves the opportunity to learn and stay
            nourished. By bridging the gap between donors and NGOs, we make a
            meaningful impact in the community and help shape a brighter future
            for children.
          </p>
        </div>
      </section>

      {/* Mission, Vision, Values Cards */}
      <section className="bg-white py-16">
        <div className="mx-auto mb-12 max-w-6xl text-center">
          <h2 className="text-3xl font-bold text-gray-800 md:text-4xl">
            Our Core Values
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Driving education and nourishment for every child
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 md:grid-cols-3">
          {/* Mission */}
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-lg transition-all hover:scale-105 hover:shadow-xl">
            <div className="flex items-center gap-4">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="mb-4 text-xl font-bold text-slate-900">Mission</h3>
            </div>
            <p className="text-slate-600">
              Our mission is to build a transparent and efficient donation
              platform that connects donors, NGOs, and beneficiaries. We aim to
              simplify the process of giving by enabling individuals to donate
              their unused items with just a few clicks, ensuring that every
              contribution reaches the right hands and creates
              real social impact.
            </p>
          </div>

          {/* Vision */}
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-lg transition-all hover:scale-105 hover:shadow-xl">
            <div className="flex items-center gap-4">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <span className="text-2xl">👁️</span>
              </div>
              <h3 className="mb-4 text-xl font-bold text-slate-900">Vision</h3>
            </div>
            <p className="text-slate-600">
              To create a world where no usable item goes to waste — every
              unused resource finds a new purpose in the hands of those
              who need it most.
            </p>
          </div>

          {/* Values */}
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-lg transition-all hover:scale-105 hover:shadow-xl">
            <div className="flex items-center gap-4">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="mb-4 text-xl font-bold text-slate-900">Values</h3>
            </div>
            <p className="text-slate-600">
              Compassion, transparency, and community impact guide everything we
              do.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-teal-400 to-blue-500 py-16 text-center text-white">
        <h2 className="mb-6 text-3xl font-bold md:text-4xl">
          Be Part of the Change
        </h2>
        <p className="mx-auto mb-8 max-w-2xl px-6 text-lg">
          Join us in empowering children through donations of books, food, and
          essentials. Every contribution matters.
        </p>
        <Link
          href="/donate"
          className="inline-block rounded-full bg-white px-8 py-3 font-bold text-teal-600 shadow-lg transition hover:bg-gray-100"
        >
          Donate Now
        </Link>
      </section>
    </main>
  );
}
