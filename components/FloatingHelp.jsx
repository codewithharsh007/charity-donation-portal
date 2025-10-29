"use client";
import { useState } from "react";

const faqs = [
  {
    question: "How do I register an NGO?",
    answer:
      "To register an NGO, go to the Register page and choose 'NGO' as the account type. Fill in your organisation details, upload required documents, and submit. Our team will review and verify your NGO within 2-3 business days.",
    category: "Registration",
    icon: "🏢",
  },
  {
    question: "How do I register as a donor?",
    answer:
      "To register as a donor, visit the Register page, choose 'Donor' and complete the sign up form. Verify your email and then you can start donating immediately.",
    category: "Registration",
    icon: "👤",
  },
  {
    question: "How can I make a financial donation?",
    answer:
      "Open the Make a Donation page, select 'Financial Donation', enter the amount, optionally add a note, and proceed. You'll be redirected to a thank-you page after payment.",
    category: "Donations",
    icon: "💰",
  },
  {
    question: "How can I donate items?",
    answer:
      "Choose 'Item Donation' on the donation page, add the items, upload images/videos showing condition, provide a pickup address and submit. Our admin will review and coordinate pickup with an NGO.",
    category: "Donations",
    icon: "📦",
  },
  {
    question: "How do I contact support?",
    answer:
      "Use the Contact page to send us a message, or email support@charity-portal.example (replace with your real support email). We reply within 24-48 hours.",
    category: "Support",
    icon: "💬",
  },
];

export default function AIPage() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const toggleOpen = () => setIsOpen((v) => !v);

  const categories = ["All", ...new Set(faqs.map((faq) => faq.category))];
  const filteredFaqs =
    selectedCategory === "All"
      ? faqs
      : faqs.filter((faq) => faq.category === selectedCategory);

  const onQuestionClick = (idx) => {
    setLoading(true);
    setActiveIndex(null);
    setTimeout(() => {
      setLoading(false);
      setActiveIndex(idx);
    }, 600);
  };

  const backToQuestions = () => {
    setActiveIndex(null);
  };

  return (
    <>
      {/* Enhanced Floating Button */}
      <button
        aria-label={isOpen ? "Close help" : "Open help"}
        onClick={toggleOpen}
        className="hover:shadow-3xl fixed right-6 bottom-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 p-3 text-white shadow-2xl transition-all duration-300 hover:scale-110"
      >
        <div className="relative">
          {/* AI-inspired pulsing effect */}
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20"></div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.227 9.274a3.5 3.5 0 116.546 1.452c0 1.657-1 2.376-1.5 2.75-.5.375-1 1-1 2.5M12 17h.01"
            />
          </svg>
        </div>
      </button>

      {/* AI Chart-like Panel */}
      <div
        className={`fixed right-6 bottom-28 z-40 w-96 transform rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 p-0 shadow-2xl transition-all duration-300 ease-in-out ${
          isOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        {/* Header with gradient */}
        <div className="rounded-t-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                AI Help Assistant
              </h2>
              <p className="mt-1 text-xs text-blue-100">
                Interactive knowledge base
              </p>
            </div>
            <button
              onClick={toggleOpen}
              className="text-white transition-colors hover:text-gray-200"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="border-b border-gray-700 p-3">
          <div className="flex gap-1 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-3 py-1 text-xs whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="max-h-80 overflow-auto p-4">
          {loading && (
            <div className="flex flex-col items-center justify-center space-y-3 py-8">
              <div className="relative">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <div className="animation-delay-500 absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
              </div>
              <p className="text-sm text-gray-400">Analyzing your query...</p>
            </div>
          )}

          {!loading && activeIndex !== null && (
            <div className="space-y-4">
              {/* Answer Card */}
              <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm text-white">
                    {faqs[activeIndex].icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-sm font-semibold text-white">
                      {faqs[activeIndex].question}
                    </h3>
                    <p className="text-xs leading-relaxed text-gray-300">
                      {faqs[activeIndex].answer}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={backToQuestions}
                  className="rounded-lg bg-gray-700 px-4 py-2 text-xs text-gray-300 transition-colors hover:bg-gray-600"
                >
                  ← Back to Questions
                </button>
              </div>
            </div>
          )}

          {!loading && activeIndex === null && (
            <div className="space-y-3">
              {filteredFaqs.map((f, idx) => (
                <button
                  key={idx}
                  onClick={() => onQuestionClick(idx)}
                  className="group w-full rounded-xl border border-gray-700 bg-gray-800/50 p-3 text-left transition-all duration-200 hover:border-gray-600 hover:bg-gray-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-white transition-transform group-hover:scale-110">
                      <span className="text-sm">{f.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 text-sm font-medium text-white">
                        {f.question}
                      </h3>
                      <p className="text-xs text-gray-400">{f.category}</p>
                    </div>
                    <svg
                      className="h-4 w-4 text-gray-500 transition-colors group-hover:text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Powered by AI Assistant</span>
            <span>{filteredFaqs.length} topics</span>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={toggleOpen}
        />
      )}

      <div className="sr-only">
        AI Help Assistant - Interactive knowledge base
      </div>
    </>
  );
}
