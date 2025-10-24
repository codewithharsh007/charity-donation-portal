'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function NgoVerificationModal() {
  const router = useRouter();
  const modalBackdropRef = useRef(null);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true); // Welcome screen
  const [step, setStep] = useState(1); // 1-4 steps
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    ngoName: '',
    registrationNumber: '',
    contactPersonName: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
    ngoAddress: '',
    yearEstablished: '',
    typeOfWork: '',
    website: '',

    // Step 2: Bank Details
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    bankDocumentImage: null,

    // Step 3: Documents
    documents: [],

    // Step 4: NGO Image & Location
    ngoImage: null,
    latitude: null,
    longitude: null,
    locationAddress: '',
  });

  // Document upload state
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBankDoc, setUploadingBankDoc] = useState(false);

  useEffect(() => {
    checkVerificationStatus();

    // Listen for login events
    window.addEventListener('userLoggedIn', checkVerificationStatus);
    return () => {
      window.removeEventListener('userLoggedIn', checkVerificationStatus);
    };
  }, []);

  // Lock body scroll when modal is shown
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const checkVerificationStatus = async () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      setShowModal(false);
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Only check if user is NGO
    if (parsedUser.userType !== 'ngo') {
      setShowModal(false);
      return;
    }

    // Fetch verification status from API
    try {
      const response = await fetch('/api/ngo/verification');
      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data.verification);

        // Show modal only if:
        // - No verification record exists OR
        // - Verification is rejected and attempts remaining > 0
        // Don't show modal if status is 'pending' or 'accepted'
        if (!data.verification) {
          setShowModal(true);
        } else if (
          data.verification.verificationStatus === 'rejected' &&
          data.verification.attemptsRemaining > 0
        ) {
          setShowModal(true);
        } else {
          // For 'pending' or 'accepted' status, always hide the modal
          setShowModal(false);
        }
      } else {
        // If API fails or user not authenticated, hide modal
        setShowModal(false);
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
      setShowModal(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSkip = () => {
    setShowModal(false);
  };

  // Upload to Cloudinary via server-side endpoint
  // We convert the file to a data URL on the client and send that to a protected server API
  // which uses server-side Cloudinary credentials. This avoids exposing secrets and
  // prevents 401 caused by missing/incorrect client-side credentials or signed uploads.
  const uploadToCloudinary = async (file) => {
    // helper to read file as data URL
    const readFileAsDataURL = (f) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });

    const dataUrl = await readFileAsDataURL(file);

    const response = await fetch('/api/cloudinary/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: dataUrl, filename: file.name }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Upload failed');
    }

    return await response.json();
  };

  // Handle document upload (Step 3)
  const handleDocumentUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploadingDoc(true);
    setError('');

    try {
      const result = await uploadToCloudinary(file);
      
      setFormData({
        ...formData,
        documents: [
          ...formData.documents,
          {
            type: docType,
            url: result.secure_url,
            publicId: result.public_id,
          },
        ],
      });
      setSuccess(`${docType} uploaded successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload document. Please try again.');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Handle bank document upload (Step 2)
  const handleBankDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploadingBankDoc(true);
    setError('');

    try {
      const result = await uploadToCloudinary(file);
      
      setFormData({
        ...formData,
        bankDocumentImage: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      });
      setSuccess('Bank document uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload bank document. Please try again.');
    } finally {
      setUploadingBankDoc(false);
    }
  };

  // Handle NGO image upload with geolocation (Step 4)
  const handleNgoImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      // Get geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            // Upload image
            const result = await uploadToCloudinary(file);
            
            setFormData({
              ...formData,
              ngoImage: {
                url: result.secure_url,
                publicId: result.public_id,
              },
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            
            // Get address from coordinates (reverse geocoding)
            try {
              const geoResponse = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
              );
              const geoData = await geoResponse.json();
              setFormData(prev => ({
                ...prev,
                locationAddress: geoData.display_name || '',
              }));
            } catch (err) {
              console.error('Could not get address from coordinates');
            }

            setSuccess('NGO image uploaded with location!');
            setTimeout(() => setSuccess(''), 3000);
            setUploadingImage(false);
          },
          (error) => {
            setError('Please enable location access to upload NGO image');
            setUploadingImage(false);
          }
        );
      } else {
        setError('Geolocation is not supported by your browser');
        setUploadingImage(false);
      }
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      setUploadingImage(false);
    }
  };

  // Remove document
  const removeDocument = (index) => {
    setFormData({
      ...formData,
      documents: formData.documents.filter((_, i) => i !== index),
    });
  };

  // Validate step
  const validateStep = (currentStep) => {
    setError('');

    if (currentStep === 1) {
      if (
        !formData.ngoName ||
        !formData.registrationNumber ||
        !formData.contactPersonName ||
        !formData.contactPersonPhone ||
        !formData.contactPersonEmail ||
        !formData.ngoAddress ||
        !formData.yearEstablished ||
        !formData.typeOfWork
      ) {
        setError('Please fill all required fields');
        return false;
      }

      // Validate phone
      if (!/^[0-9]{10}$/.test(formData.contactPersonPhone)) {
        setError('Please enter a valid 10-digit phone number');
        return false;
      }

      // Validate email
      if (!/\S+@\S+\.\S+/.test(formData.contactPersonEmail)) {
        setError('Please enter a valid email address');
        return false;
      }

      // Validate year
      const currentYear = new Date().getFullYear();
      if (formData.yearEstablished < 1800 || formData.yearEstablished > currentYear) {
        setError(`Year must be between 1800 and ${currentYear}`);
        return false;
      }
    }

    if (currentStep === 2) {
      if (
        !formData.accountHolderName ||
        !formData.bankName ||
        !formData.accountNumber ||
        !formData.ifscCode ||
        !formData.branchName ||
        !formData.bankDocumentImage
      ) {
        setError('Please fill all bank details and upload bank document');
        return false;
      }

      // Validate IFSC
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) {
        setError('Please enter a valid IFSC code');
        return false;
      }
    }

    if (currentStep === 3) {
      if (formData.documents.length === 0) {
        setError('Please upload at least one document');
        return false;
      }
    }

    if (currentStep === 4) {
      if (!formData.ngoImage || !formData.latitude || !formData.longitude) {
        setError('Please upload NGO image with location');
        return false;
      }
    }

    return true;
  };

  const scrollToTop = () => {
    if (modalBackdropRef.current) {
      modalBackdropRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleStartVerification = () => {
    setShowWelcome(false);
    scrollToTop();
  };

  const handleNext = () => {
    scrollToTop(); // Pehle scroll karo
    if (validateStep(step)) {
      setStep(step + 1);
      setError('');
    }
  };

  const handleBack = () => {
    scrollToTop(); // Pehle scroll karo
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ngo/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ngoName: formData.ngoName,
          registrationNumber: formData.registrationNumber,
          contactPersonName: formData.contactPersonName,
          contactPersonPhone: formData.contactPersonPhone,
          contactPersonEmail: formData.contactPersonEmail,
          ngoAddress: formData.ngoAddress,
          yearEstablished: parseInt(formData.yearEstablished),
          typeOfWork: formData.typeOfWork,
          website: formData.website || undefined,
          bankDetails: {
            accountHolderName: formData.accountHolderName,
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            ifscCode: formData.ifscCode.toUpperCase(),
            branchName: formData.branchName,
            bankDocumentImage: formData.bankDocumentImage,
          },
          documents: formData.documents,
          ngoImage: {
            url: formData.ngoImage.url,
            publicId: formData.ngoImage.publicId,
            latitude: formData.latitude,
            longitude: formData.longitude,
            address: formData.locationAddress,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Application submitted successfully! We will review it soon.');
        setTimeout(() => {
          setShowModal(false);
          checkVerificationStatus();
        }, 2000);
      } else {
        setError(data.message || 'Failed to submit application');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!showModal || !user || user.userType !== 'ngo') {
    return null;
  }

  const typeOfWorkOptions = [
    'Education',
    'Healthcare',
    'Environment',
    'Animal Welfare',
    'Women Empowerment',
    'Child Welfare',
    'Elderly Care',
    'Disaster Relief',
    'Poverty Alleviation',
    'Skill Development',
    'Other',
  ];

  const documentTypes = [
    'Registration Certificate',
    'PAN Card',
    'Trust Deed',
    '80G Certificate',
    'Other',
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        ref={modalBackdropRef}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 overflow-y-scroll"
        style={{
          scrollbarColor: '#ef4444 transparent',
          scrollbarWidth: 'thin'
        }}
      >
        <div className="min-h-screen flex items-start justify-center px-4 py-16">
          {/* Modal */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full relative border border-gray-700">
          
          {/* Welcome Screen */}
          {showWelcome ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">NGO Verification Process</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Get verified to start receiving donations
                    </p>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Skip"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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

              {/* Welcome Content */}
              <div className="p-8 pt-10">
                <div className="text-center mb-8 mt-4">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3">
                    Welcome to NGO Verification!
                  </h3>
                  <p className="text-gray-400 text-base">
                    Complete this 4-step process to become a verified NGO and start receiving donations
                  </p>
                </div>

                <div className="space-y-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 flex-shrink-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-red-500 font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Basic Information</h4>
                      <p className="text-sm text-gray-400">
                        NGO name, registration number, contact details, address, establishment year, and type of work
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 flex-shrink-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-red-500 font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Bank Account Details</h4>
                      <p className="text-sm text-gray-400">
                        Bank account information for receiving donations and upload bank document (passbook/cancelled cheque)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 flex-shrink-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-red-500 font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Upload Documents</h4>
                      <p className="text-sm text-gray-400">
                        Registration certificate, PAN card, trust deed, 80G certificate, and other relevant documents
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 flex-shrink-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-red-500 font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">NGO Image & Location</h4>
                      <p className="text-sm text-gray-400">
                        Upload an image of your NGO premises with automatic GPS location capture for verification
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm text-blue-400 font-semibold mb-1">Important Notes:</p>
                      <ul className="text-xs text-blue-300 space-y-1">
                        <li>• All documents should be clear and readable</li>
                        <li>• Maximum file size: 5MB per document</li>
                        <li>• You have 3 attempts to complete verification</li>
                        <li>• Admin will review your application within 3-5 business days</li>
                        <li>• You'll receive email notifications about your application status</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Attempts Warning */}
                {verificationStatus && verificationStatus.verificationStatus === 'rejected' && (
                  <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4 mb-6">
                    <p className="text-yellow-500 text-sm font-semibold">
                      ⚠️ Previous application was rejected. Attempts remaining: {verificationStatus.attemptsRemaining} out of 3
                    </p>
                    {verificationStatus.rejectionReason && (
                      <p className="text-yellow-400 text-xs mt-2">
                        Reason: {verificationStatus.rejectionReason}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={handleSkip}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
                  >
                    Skip for Now
                  </button>
                  <button
                    onClick={handleStartVerification}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
                  >
                    Start Verification →
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Header */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">NGO Verification</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Complete verification to receive donations
                    </p>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Skip"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">Step {step} of 4</span>
                    <span className="text-sm text-gray-400">{(step / 4) * 100}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(step / 4) * 100}%` }}
                    />
                  </div>
                </div>

            {/* Attempts Remaining Warning */}
            {verificationStatus && verificationStatus.verificationStatus === 'rejected' && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500 rounded-lg">
                <p className="text-yellow-500 text-sm">
                  ⚠️ Attempts remaining: {verificationStatus.attemptsRemaining} out of 3
                </p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 pt-8">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-500 text-sm">
                {success}
              </div>
            )}

            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-6">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    NGO Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ngoName"
                    value={formData.ngoName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter official NGO name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter registration number"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contact Person <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactPersonName"
                      value={formData.contactPersonName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="contactPersonPhone"
                      value={formData.contactPersonPhone}
                      onChange={handleChange}
                      required
                      pattern="[0-9]{10}"
                      className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="10-digit number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="contactPersonEmail"
                    value={formData.contactPersonEmail}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="contact@ngo.org"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    NGO Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="ngoAddress"
                    value={formData.ngoAddress}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter complete address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Year Established <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="yearEstablished"
                      value={formData.yearEstablished}
                      onChange={handleChange}
                      required
                      min="1800"
                      max={new Date().getFullYear()}
                      className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="YYYY"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Type of Work <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="typeOfWork"
                      value={formData.typeOfWork}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select</option>
                      {typeOfWorkOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="https://www.yourngo.org"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Bank Details */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-6">Bank Account Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="As per bank records"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="e.g., State Bank of India"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Branch Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="branchName"
                      value={formData.branchName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Branch name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Enter account number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      IFSC Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleChange}
                      required
                      maxLength={11}
                      className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 uppercase"
                      placeholder="e.g., SBIN0001234"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bank Document (Passbook/Cancelled Cheque) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleBankDocUpload}
                      className="hidden"
                      id="bankDocUpload"
                    />
                    <label
                      htmlFor="bankDocUpload"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-all"
                    >
                      {uploadingBankDoc ? 'Uploading...' : 'Choose File'}
                    </label>
                    {formData.bankDocumentImage && (
                      <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-500 text-sm">Uploaded</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-2">Max size: 5MB. Formats: JPG, PNG, PDF</p>
                </div>
              </div>
            )}

            {/* Step 3: Documents */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-6">Upload Documents</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Upload at least one document (Registration Certificate recommended)
                </p>

                {documentTypes.map((docType) => (
                  <div key={docType} className="border border-gray-700 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {docType}
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleDocumentUpload(e, docType)}
                        className="hidden"
                        id={`doc-${docType}`}
                      />
                      <label
                        htmlFor={`doc-${docType}`}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-all text-sm"
                      >
                        {uploadingDoc ? 'Uploading...' : 'Upload'}
                      </label>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">Max size: 5MB. Formats: JPG, PNG, PDF</p>
                  </div>
                ))}

                {/* Uploaded Documents List */}
                {formData.documents.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Uploaded Documents:</h4>
                    <div className="space-y-2">
                      {formData.documents.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-white text-sm">{doc.type}</span>
                          </div>
                          <button
                            onClick={() => removeDocument(index)}
                            className="text-red-500 hover:text-red-400 transition-colors"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: NGO Image & Location */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-6">NGO Image & Location</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Upload a photo of your NGO office/building. We'll automatically capture your location.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    NGO Image with Geotag <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col items-center space-y-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNgoImageUpload}
                      className="hidden"
                      id="ngoImageUpload"
                    />
                    <label
                      htmlFor="ngoImageUpload"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-all"
                    >
                      {uploadingImage ? 'Uploading & Getting Location...' : 'Choose & Upload Image'}
                    </label>
                    
                    {formData.ngoImage && (
                      <div className="w-full">
                        <img
                          src={formData.ngoImage.url}
                          alt="NGO"
                          className="w-full h-64 object-cover rounded-lg border-2 border-green-500"
                        />
                        <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-green-500 text-sm font-medium">Location Captured</span>
                          </div>
                          <p className="text-gray-300 text-xs">
                            <strong>Latitude:</strong> {formData.latitude?.toFixed(6)}
                          </p>
                          <p className="text-gray-300 text-xs">
                            <strong>Longitude:</strong> {formData.longitude?.toFixed(6)}
                          </p>
                          {formData.locationAddress && (
                            <p className="text-gray-300 text-xs mt-2">
                              <strong>Address:</strong> {formData.locationAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    Max size: 5MB. Please allow location access when prompted.
                  </p>
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500 rounded-lg">
                  <h4 className="text-blue-400 font-medium mb-2">📋 Before Submitting:</h4>
                  <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                    <li>Ensure all information is accurate</li>
                    <li>Documents are clear and readable</li>
                    <li>Bank details match your NGO registration</li>
                    <li>Photo shows your NGO premises</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="p-6 border-t border-gray-700 flex justify-between">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                ← Back
              </button>
            )}
            
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="ml-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="ml-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
          </>
          )}
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        /* Firefox */
        .fixed.overflow-y-scroll {
          scrollbar-color: #ef4444 transparent;
          scrollbar-width: thin;
        }

        /* WebKit browsers (Chrome, Safari, Edge) */
        .fixed.overflow-y-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .fixed.overflow-y-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .fixed.overflow-y-scroll::-webkit-scrollbar-thumb {
          background-color: #ef4444;
          border-radius: 4px;
        }

        .fixed.overflow-y-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #dc2626;
        }
      `}</style>
    </>
  );
}
