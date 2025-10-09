"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    userName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setFormData({
        userName: parsedUser.userName || "",
        lastName: parsedUser.lastName || "",
        phone: parsedUser.phone || "",
        address: parsedUser.address || "",
        city: parsedUser.city || "",
        state: parsedUser.state || "",
        pincode: parsedUser.pincode || "",
      });
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = { ...user, ...formData };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event("userLoggedIn"));

        setMessage({ type: "success", text: "Profile updated successfully!" });
        setIsEditing(false);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to update profile",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      localStorage.removeItem("user");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 rounded-2xl bg-gray-800 p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500 text-3xl font-bold text-white">
                {user.userName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-white">
                    {user.userName}
                  </h1>
                  {user.userType === 'ngo' && user.isVerified && (
                    <span className="flex items-center gap-1 text-green-500 font-bold text-sm">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-gray-400">{user.email}</p>
                <span className="mt-2 inline-block rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-500 capitalize">
                  {user.userType || user.role || "Donor"}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-all hover:bg-red-700 hover:shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              message.type === "success"
                ? "border border-green-500 bg-green-500/10 text-green-500"
                : "border border-red-500 bg-red-500/10 text-red-500"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Details */}
        <div className="rounded-2xl bg-gray-800 p-8 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              Profile Information
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-all hover:bg-blue-700"
              >
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            {/* Username */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Username
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="userName"
                  value={formData.userName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              ) : (
                <div className="rounded-lg bg-gray-700 px-4 py-3 text-white">
                  {user.userName}
                </div>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              ) : (
                <div className="rounded-lg bg-gray-700 px-4 py-3 text-white">
                  {user.lastName || "."}
                </div>
              )}
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Email
              </label>
              <div className="rounded-lg bg-gray-700/50 px-4 py-3 text-gray-400">
                {user.email}{" "}
                {/* <span className="text-xs">(Cannot be changed)</span> */}
              </div>
            </div>

            {/* User Type (Read-only) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                User Type
              </label>
              <div className="rounded-lg bg-gray-700/50 px-4 py-3 text-gray-400 capitalize">
                {user.userType || "donor"}{" "}
                {/* <span className="text-xs">(Cannot be changed)</span> */}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  pattern="[0-9]{10}"
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              ) : (
                <div className="rounded-lg bg-gray-700 px-4 py-3 text-white">
                  {user.phone || "Not provided"}
                </div>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Address
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              ) : (
                <div className="rounded-lg bg-gray-700 px-4 py-3 text-white">
                  {user.address || "Not provided"}
                </div>
              )}
            </div>

            {/* City, State, Pincode */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                ) : (
                  <div className="rounded-lg bg-gray-700 px-4 py-3 text-white">
                    {user.city || "N/A"}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  State
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                ) : (
                  <div className="rounded-lg bg-gray-700 px-4 py-3 text-white">
                    {user.state || "N/A"}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Pincode
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    pattern="[0-9]{6}"
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                ) : (
                  <div className="rounded-lg bg-gray-700 px-4 py-3 text-white">
                    {user.pincode || "N/A"}
                  </div>
                )}
              </div>
            </div>

            {/* Edit Mode Buttons */}
            {isEditing && (
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-green-600 py-3 font-semibold text-white transition-all hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      userName: user.userName || "",
                      phone: user.phone || "",
                      address: user.address || "",
                      city: user.city || "",
                      state: user.state || "",
                      pincode: user.pincode || "",
                    });
                  }}
                  className="flex-1 rounded-lg bg-gray-600 py-3 font-semibold text-white transition-all hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-red-500 transition-colors hover:text-red-400"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
