"use client";

import { useState } from "react";

export default function ContactUs() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ type: "error", text: "Please fill all required fields." });
      return false;
    }
    // simple email check
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setStatus({ type: "error", text: "Please enter a valid email address." });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", text: "" });

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', text: data.message || 'Message sent successfully!' });
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus({ type: 'error', text: data.message || 'Failed to send message.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: 'Server error. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-2xl p-8">
      <h3 className="text-2xl font-bold text-white mb-4">Contact Us</h3>

      {status.text && (
        <div className={`mb-4 p-3 rounded ${status.type === 'success' ? 'bg-green-500/10 border border-green-500 text-green-400' : 'bg-red-500/10 border border-red-500 text-red-400'}`}>
          {status.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Name *</label>
          <input name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Email *</label>
          <input name="email" value={form.email} onChange={handleChange} className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Subject</label>
          <input name="subject" value={form.subject} onChange={handleChange} className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Message *</label>
          <textarea name="message" value={form.message} onChange={handleChange} rows={5} className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600" />
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </form>
    </div>
  );
}
