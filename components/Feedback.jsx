"use client"

import React, { useState, useEffect } from 'react'

export default function FeedbackCard() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [userFeedbacks, setUserFeedbacks] = useState([])

  const sampleFeedbacks = [
    {
      id: 1,
      name: 'Sarah Johnson',
      rating: 5,
      message: 'This platform transformed how I donate! The transparency and ease of use are incredible. I can track exactly where my donations are going.',
      date: '2 hours ago',
      address: 'New York, USA',
      profession: 'Software Engineer'
    },
    {
      id: 2,
      name: 'Mike Chen',
      rating: 4,
      message: 'As a regular donor, I appreciate the variety of causes available. The impact reports make me feel connected to the communities I support.',
      date: '1 day ago',
      address: 'California, USA',
      profession: 'Marketing Manager'
    },
    {
      id: 3,
      name: 'Priya Sharma',
      rating: 5,
      message: 'The verification process for NGOs gives me confidence that my donations are making a real difference. Highly recommended platform!',
      date: '3 days ago',
      address: 'Delhi, India',
      profession: 'Teacher'
    },
    {
      id: 4,
      name: 'David Wilson',
      rating: 4,
      message: 'Excellent customer support and user-friendly interface. Made my first donation experience smooth and hassle-free.',
      date: '1 week ago',
      address: 'London, UK',
      profession: 'Banker'
    },
    {
      id: 5,
      name: 'Maria Garcia',
      rating: 5,
      message: 'I love how this platform connects donors directly with verified organizations. The transparency is unmatched in the donation space.',
      date: '2 weeks ago',
      address: 'Madrid, Spain',
      profession: 'Doctor'
    },
    {
      id: 6,
      name: 'James Anderson',
      rating: 5,
      message: 'The real-time tracking and updates about how my donation is being used is fantastic. It builds trust and encourages more giving.',
      date: '3 weeks ago',
      address: 'Sydney, Australia',
      profession: 'Entrepreneur'
    }
  ]

  useEffect(() => {
    setUserFeedbacks(sampleFeedbacks)
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(sampleFeedbacks.length / 2))
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(userFeedbacks.length / 2))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(userFeedbacks.length / 2)) % Math.ceil(userFeedbacks.length / 2))
  }

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-emerald-500 fill-current' : 'text-slate-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  if (userFeedbacks.length === 0) return null

  const startIndex = currentSlide * 2
  const currentCards = userFeedbacks.slice(startIndex, startIndex + 2)

  return (
    <div className="w-full bg-gradient-to-b from-white via-sky-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 mb-4">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            What Our Users Say
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Hear from our community of donors and volunteers about their experiences
          </p>
        </div>

        {/* Feedback Cards Slider */}
        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute -left-4 top-1/2 transform -translate-y-1/2 bg-white border border-slate-200 rounded-full p-3 shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all duration-300 z-10"
          >
            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white border border-slate-200 rounded-full p-3 shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all duration-300 z-10"
          >
            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Cards Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentCards.map((feedback) => (
              <div key={feedback.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
                {/* Rating Stars */}
                <div className="flex justify-between items-start mb-4">
                  {renderStars(feedback.rating)}
                  <span className="text-sm text-slate-500">{feedback.date}</span>
                </div>

                {/* Feedback Message */}
                <blockquote className="text-base text-slate-700 leading-relaxed mb-6">
                  "{feedback.message}"
                </blockquote>

                {/* User Info */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {/* Avatar with initials */}
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold shadow">
                      {feedback.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{feedback.name}</h4>
                    <p className="text-slate-600 text-sm">{feedback.profession}</p>
                    <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {feedback.address}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: Math.ceil(userFeedbacks.length / 2) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-emerald-600 w-8' 
                    : 'bg-slate-300 w-2 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
