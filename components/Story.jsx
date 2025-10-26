"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const stories = [
  {
    name: "Anita Sharma",
    story: "Donating books through this portal was an amazing experience. Seeing children learn and enjoy was heartwarming.",
    role: "Donor",
    location: "Mumbai, India",
    impact: "50+ Books Donated",
  },
  {
    name: "Rohit Verma",
    story: "I donated food items and it felt incredible to help kids stay nourished and happy. The transparency in distribution is commendable.",
    role: "Donor",
    location: "Delhi, India",
    impact: "100+ Meals Provided",
  },
  {
    name: "Priya Singh",
    story: "This platform makes it so easy to contribute to children's education. I love being part of this community that cares.",
    role: "Donor",
    location: "Bangalore, India",
    impact: "30+ Students Helped",
  },
  {
    name: "Sandeep Kumar",
    story: "Organizing donations and helping children with books and meals gives me immense satisfaction. Every smile matters.",
    role: "NGO",
    location: "Kolkata, India",
    impact: "200+ Hours Volunteered",
  },
  {
    name: "Neha Joshi",
    story: "I assist in distributing food and books. The smiles on children's faces are priceless and keep me motivated.",
    role: "NGO",
    location: "Chennai, India",
    impact: "150+ Families Served",
  },
  {
    name: "Vineet Pancheshwar",
    story: "Collaborating with donors and volunteers motivates me to make a bigger impact in the community. Together we grow.",
    role: "NGO",
    location: "Hyderabad, India",
    impact: "500+ Lives Touched",
  },
];

export default function UserStories() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredStories =
    activeFilter === "all"
      ? stories
      : stories.filter((story) =>
          story.role.toLowerCase().includes(activeFilter),
        );

  return (
    <section className="w-full bg-gradient-to-b from-white via-sky-50 to-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Real Impact Stories
          </span>

          <h2 className="mb-4 text-4xl font-extrabold text-slate-900 md:text-5xl">
            Stories of Impact
          </h2>

          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Real experiences from our community of donors and NGOs making a
            lasting difference
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {[
            { key: "all", label: "All Stories" },
            { key: "donor", label: "Donors" },
            { key: "ngo", label: "NGOs" },
          ].map((filter) => (
            <motion.button
              key={filter.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(filter.key)}
              className={`rounded-md px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                activeFilter === filter.key
                  ? "bg-emerald-600 text-white shadow"
                  : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
              }`}
            >
              {filter.label}
            </motion.button>
          ))}
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStories.map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:shadow-lg">
                <div className="mb-4 flex items-center gap-3">
                  {/* Avatar with initials */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-white shadow text-lg">
                    {item.name.split(" ").map((n) => n[0]).join("")}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-900">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          item.role === "Donor"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {item.role}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {item.location}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-700">
                  "{item.story}"
                </p>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-600">
                      {item.impact}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className="h-4 w-4 text-emerald-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
