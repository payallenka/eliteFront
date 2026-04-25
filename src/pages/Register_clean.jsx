import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { processApplicationFromMetadata } from "../lib/onboarding";
import { ReportPDF } from "./ReportPDF";
import { pdf } from '@react-pdf/renderer';
import { getAvailableCountries, getAvailableLanguages, getEducationCountries } from '../utils/countries';
import Select from 'react-select';

const BASE_API_URL = "https://elite-scholars-eight.vercel.app";

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  
  // Application Tracker form fields
  const [country, setCountry] = useState([]);
  const [language, setLanguage] = useState([]);
  const [degreeLevel, setDegreeLevel] = useState("");
  const [gpa, setGpa] = useState("");
  const [languageScore, setLanguageScore] = useState("");
  const [budget, setBudget] = useState("");
  
  // Document upload fields
  const [documents, setDocuments] = useState({
    diploma: null,
    transcripts: null,
    passport: null,
    enrollment: null,
    other: null
  });
  const [uploadedDocuments, setUploadedDocuments] = useState({
    diploma: null,
    transcripts: null,
    passport: null,
    enrollment: null,
    other: null
  });
  const [uploadingDocument, setUploadingDocument] = useState(null);
  
  // Education background fields - vary based on degree level
  const [schoolingCountry, setSchoolingCountry] = useState("");
  const [bachelorCountry, setBachelorCountry] = useState("");
  const [masterCountry, setMasterCountry] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(""); // Store Supabase UUID
  const [pendingReport, setPendingReport] = useState(null); // Store reportObj for onboarding after registration
  const [pendingPdfBlob, setPendingPdfBlob] = useState(null); // Store PDF blob for onboarding after registration

  const COUNTRY_OPTIONS = getAvailableCountries();
  const LANGUAGE_OPTIONS = getAvailableLanguages();
  const EDUCATION_COUNTRIES = getEducationCountries();

  // Fetch UUID after login (if session exists)
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id) {
        setUserId(user.id);
      }
    };
    fetchUserId();
  }, []);

  // Document upload function
  const uploadDocument = async (file, documentType) => {
    if (!file) return null;
    setUploadingDocument(documentType);
    try {
      // Create unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}_${timestamp}.${fileExt}`;
      // Use UUID if available, else fallback to email (for pre-login uploads)
      const userFolder = userId || email;
      const filePath = `user_documents/${userFolder}/${fileName}`;

      // Upload to Supabase Storage with fallback
      let data, error;
      try {
        const uploadResult = await supabase.storage
          .from('user-documents')
          .upload(filePath, file);
        data = uploadResult.data;
        error = uploadResult.error;
        console.log(`[LOG] Document upload result for ${documentType}:`, uploadResult);
      } catch (uploadError) {
        console.warn(`[LOG] Storage upload failed for ${documentType}, continuing without file:`, uploadError);
        // Create a mock upload result for testing
        data = { path: filePath };
        error = null;
      }

      if (error) {
        console.error(`[LOG] Upload error for ${documentType}:`, error);
        // For testing, continue without throwing
        console.warn(`[LOG] Continuing registration without file upload for ${documentType}...`);
      }

      // Get public URL (with fallback)
      let publicUrl = null;
      try {
        const { data: publicData } = supabase.storage
          .from('user-documents')
          .getPublicUrl(filePath);
        publicUrl = publicData?.publicUrl;
        console.log(`[LOG] Public URL for ${documentType}:`, publicUrl);
      } catch (urlError) {
        console.warn(`[LOG] Could not get public URL for ${documentType}:`, urlError);
        publicUrl = `placeholder_${fileName}`;
      }

      const uploadedDoc = {
        url: publicUrl || `placeholder_${fileName}`,
        fileName: file.name,
        filePath: filePath,
        uploadedAt: new Date().toISOString()
      };

      setUploadedDocuments(prev => ({
        ...prev,
        [documentType]: uploadedDoc
      }));
      console.log(`[LOG] Uploaded document state for ${documentType}:`, uploadedDoc);

      // --- NEW: Update document status in backend ---
      try {
        if (userId) { // Only update if UUID is available
          const resp = await fetch(`${BASE_API_URL}/api/update-document-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              documents: { ...uploadedDocuments, [documentType]: uploadedDoc }
            })
          });
          const respJson = await resp.json().catch(() => ({}));
          console.log(`[LOG] Document status API response for ${documentType}:`, resp.status, respJson);
        }
      } catch (err) {
        console.error(`[LOG] Failed to update document status for ${documentType}:`, err);
      }
      // --- END NEW ---

      return uploadedDoc;
    } catch (error) {
      console.error(`[LOG] Error uploading ${documentType}:`, error);
      setError(`Failed to upload ${documentType}. Please try again.`);
      return null;
    } finally {
      setUploadingDocument(null);
    }
  };

  // File upload component
  function FileUploadField({ label, documentType, fileName, isUploading, uploadedDoc }) {
    const fileInputRef = useRef(null);
    
    const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setDocuments(prev => ({ ...prev, [documentType]: file }));
        await uploadDocument(file, documentType);
      }
    };

    const handleClick = () => {
      fileInputRef.current?.click();
    };

    const removeFile = () => {
      setDocuments(prev => ({ ...prev, [documentType]: null }));
      setUploadedDocuments(prev => ({ ...prev, [documentType]: null }));
    };

    return (
      <div className="mb-4">
        <label className="block text-[#1a0841] text-sm md:text-base font-medium mb-2">
          {label}
        </label>
        <div 
          onClick={!uploadedDoc ? handleClick : undefined}
          className={`bg-[#f6f6fa] border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            uploadedDoc ? 'border-green-400 bg-green-50' : 'border-[#e6e6e6] cursor-pointer hover:border-[#6c47ff]'
          }`}
        >
          {isUploading && uploadingDocument === documentType ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-[#6c47ff] mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-[#6c47ff]">Uploading...</span>
            </div>
          ) : uploadedDoc ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-green-700 text-sm">{uploadedDoc.fileName}</span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(); }}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div className="text-[#6c47ff] mb-2">
                <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
              </div>
              <p className="text-[#1a0841] text-sm">
                Click here to upload your file or drag and drop
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Supported Format: SVG, JPG, PNG, PDF (10mb each)
              </p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.svg"
          className="hidden"
        />
      </div>
    );
  }

  // Registration only stores data in user metadata
  // The actual processing happens in the Profile.jsx onboarding pipeline
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validate application fields if on step 2
    if (step === 2) {
      if (!country.length || !language.length || !degreeLevel || !gpa || !languageScore || !budget) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      // Validate education background fields based on degree level
      if (degreeLevel && !schoolingCountry) {
        setError("Please specify your schooling/high school country");
        setLoading(false);
        return;
      }
      
      // Validate bachelor's country for programs that require it
      if ((degreeLevel === "Master" || degreeLevel === "Diploma" || degreeLevel === "Certificate" || degreeLevel === "Doctorate" || degreeLevel === "PhD") && !bachelorCountry) {
        setError("Please specify the country where you completed your undergraduate/bachelor's degree");
        setLoading(false);
        return;
      }
      
      // Validate master's country for doctoral programs
      if ((degreeLevel === "Doctorate" || degreeLevel === "PhD") && !masterCountry) {
        setError("Please specify the country where you completed your master's degree");
        setLoading(false);
        return;
      }
    }

    try {
      // Use already uploaded documents from state
      const documentUrls = {};
      if (step === 2 && role === "student") {
        for (const [docType, docData] of Object.entries(uploadedDocuments)) {
          if (docData && docData.url) {
            documentUrls[docType] = docData;
          }
        }
      }

      // Run onboarding pipeline immediately after registration data is ready
      let reportData = null;
      let pdfBlob = null;

      if (step === 2 && role === "student") {
        // Only run analysis and PDF generation before registration
        console.log("[LOG] Running analysis and generating PDF (pre-registration)...");
        const applicationData = {
          country,
          language,
          degreeLevel,
          gpa,
          languageScore,
          budget,
          schoolingCountry,
          bachelorCountry,
          masterCountry,
          documents: documentUrls
        };
        const payload = {
          country,
          language,
          education: degreeLevel,
          gpa,
          languageTestScore: languageScore,
          budget,
          documents: documentUrls,
          schoolingCountry,
          bachelorCountry,
          masterCountry
        };
        console.log("[LOG] Sending analysis API request:", payload);
        const response = await fetch('https://elite-scholars-eight.vercel.app/api/analyze-application', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        console.log("[LOG] Analysis API result:", result);
        if (!response.ok) {
          setError('Registration failed: ' + (result.error || 'Analysis failed'));
          setLoading(false);
          return;
        }
        const reportObj = {
          summary: result.summary,
          eligible: result.eligible,
          ineligible: result.ineligible,
          profileAnalysis: result.profileAnalysis,
          visaReadiness: result.visaReadiness,
          idealCategoryFit: result.idealCategoryFit,
          form: payload,
          generated_at: new Date().toISOString()
        };
        console.log("[LOG] Generating PDF blob...");
        pdfBlob = await pdf(<ReportPDF report={reportObj} />).toBlob();
        // Store in local variables for immediate use
        reportData = {
          applicationData,
          reportObj
        };
        console.log("[LOG] Generated report data and PDF blob for onboarding");
      }

      // Send magic link for registration/login (unified approach)
      console.log("[LOG] Sending magic link for registration...");
      const { data: userData, error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            name,
            role,
            application_data: step === 2 && role === "student" ? {
              country, 
              language, 
              degreeLevel, 
              gpa, 
              languageScore, 
              budget, 
              schoolingCountry, 
              bachelorCountry, 
              masterCountry,
              documents: documentUrls
            } : null
          },
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin + "/profile"
        }
      });
      console.log("[LOG] Magic link result:", { userData, otpError });

      if (otpError) {
        setError(otpError.message);
      } else {
        // Store the application data in pending state for processing after login
        if (step === 2 && role === "student" && reportData && pdfBlob) {
          console.log("[LOG] Storing application data for processing after login...");
          const pendingData = {
            applicationData: reportData.applicationData,
            reportObj: reportData.reportObj,
            email: email,
            name: name,
            role: role
          };
          console.log("[LOG] Pending data to store:", pendingData);
          // Store in localStorage temporarily so it can be processed when user logs in
          localStorage.setItem('pendingApplicationData', JSON.stringify(pendingData));
          console.log("[LOG] Application data stored in localStorage for post-login processing");
        }

        // Send welcome email after successful registration
        try {
          await fetch('https://elite-scholars-eight.vercel.app/api/send-welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: email, name })
          });
        } catch (emailErr) {
          console.warn('[DEBUG] Welcome email failed:', emailErr);
        }

        setSuccess("Registration successful! A magic link has been sent to your email. Please check your inbox to complete your registration and access your account!");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    if (!name || !email || !role) {
      setError("Please fill in all basic information fields");
      return;
    }
    setError("");
    if (role === "advisor") {
      // Only allow advisor registration for @elitescholarsinter.com emails
      if (!email.toLowerCase().endsWith('@elitescholarsinter.com')) {
        setError("You are not authorized to create an advisor account");
        return;
      }
      setLoading(true);
      try {
        const { data: userData, error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            data: { name, role },
            shouldCreateUser: true,
            emailRedirectTo: window.location.origin + "/profile"
          }
        });
        if (otpError) {
          setError(otpError.message);
        } else {
          setSuccess("A signup link has been sent to your email. Please check your inbox and verify your account.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setStep(2);
    }
  };

  const handlePreviousStep = () => {
    setStep(1);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-white text-[#1a0841] font-sans" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif' }}>
      {/* Navbar separation */}
      <div className="shadow-sm bg-white z-20 flex items-center px-6 py-2">
        <img src="/logo192.png" alt="Elite Scholars Logo" className="h-10 w-10 mr-3" style={{objectFit: 'contain'}} />
        <span className="text-xl font-bold tracking-tight mr-6" style={{fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif'}}>Elite Scholars</span>
        <div className="flex-1"></div>
      </div>
      <div className="flex flex-1 min-h-[80vh] md:min-h-[90vh] w-full">
        {/* Left Side - Branding/Welcome */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-[#6a11cb] to-[#7f53ac] text-white px-10 py-0 relative overflow-hidden shadow-2xl">
          <div className="absolute left-[-40px] top-[-40px] opacity-20 select-none pointer-events-none" style={{fontSize: '8rem', lineHeight: 1}}>✱</div>
          <div className="z-10 flex flex-col items-start justify-center h-full min-h-[60vh]">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-lg">Welcome<br/>Elite Scholars! <span className="inline-block">🎓</span></h1>
            <p className="text-lg md:text-xl font-medium max-w-md mb-8">Create your account, upload your documents, and get personalized recommendations for your academic journey!</p>
            <span className="text-xs opacity-80 mt-12">© 2025 Elite Scholars. All rights reserved.</span>
          </div>
        </div>
        {/* Right Side - Register Form */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-gradient-to-br from-white to-[#f6f6fa] p-6 md:p-16">
          <div className="form-section bg-white p-10 md:p-16 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col gap-10 border border-[#f0f0f0]">
            <h2 className="mb-6 text-2xl md:text-4xl font-bold leading-tight text-[#1a0841]" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>Create a new account</h2>
            {/* Step indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-[#e60023] text-white' : 'bg-gray-200 text-gray-500'} font-semibold`}>1</div>
              <div className={`w-12 h-0.5 ${step > 1 ? 'bg-[#e60023]' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-[#e60023] text-white' : 'bg-gray-200 text-gray-500'} font-semibold`}>2</div>
            </div>
            <form className="grid grid-cols-1 gap-6 md:gap-8" onSubmit={step === 1 ? handleNextStep : handleRegister}>
              {step === 1 && (
                <>
                  <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
                  <input
                    type="text"
                    placeholder="Name"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-5 md:px-6 py-4 md:py-5 w-full placeholder:text-[#a3a3b3] focus:outline-none text-base md:text-lg"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-5 md:px-6 py-4 md:py-5 w-full placeholder:text-[#a3a3b3] focus:outline-none text-base md:text-lg"
                  />
                  <select
                    required
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-5 md:px-6 py-4 md:py-5 w-full focus:outline-none text-base md:text-lg"
                  >
                    <option value="" disabled>Select Role</option>
                    <option value="student">Student</option>
                    <option value="advisor">Advisor</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-[#e60023] hover:bg-[#c2001a] text-white font-bold px-8 md:px-10 py-4 md:py-5 rounded-full w-full mt-2 flex items-center justify-center text-base md:text-lg transition-colors shadow-md"
                  >
                    Continue
                  </button>
                </>
              )}
              {step === 2 && (
                <>
                  <h3 className="text-lg font-semibold mb-2">Academic Profile (Get Your Personalized Report!)</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Target Countries</label>
                    <Select
                      isMulti
                      options={COUNTRY_OPTIONS.map(c => ({ value: c, label: c }))}
                      value={COUNTRY_OPTIONS.map(c => ({ value: c, label: c })).filter(opt => country.includes(opt.value))}
                      onChange={selected => setCountry(selected.map(opt => opt.value))}
                      classNamePrefix="custom-select"
                      placeholder="Select countries..."
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          backgroundColor: '#f6f6fa',
                          color: '#1a0841',
                          border: '1px solid #e6e6e6',
                          borderRadius: '0.75rem',
                          minHeight: '48px',
                          boxShadow: 'none',
                          paddingLeft: '0.5rem',
                          fontSize: '1rem',
                          fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif',
                          fontWeight: 400,
                        }),
                        multiValue: (provided) => ({
                          ...provided,
                          backgroundColor: '#e6e6e6',
                          color: '#1a0841',
                          borderRadius: '0.5rem',
                          fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif',
                          fontWeight: 400,
                        }),
                        multiValueLabel: (provided) => ({
                          ...provided,
                          color: '#1a0841',
                          fontWeight: 400,
                          fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif',
                        }),
                        placeholder: (provided) => ({
                          ...provided,
                          color: '#a3a3b3',
                          fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif',
                          fontWeight: 400,
                        }),
                      }}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Languages You Speak</label>
                    <Select
                      isMulti
                      options={LANGUAGE_OPTIONS.map(l => ({ value: l, label: l }))}
                      value={LANGUAGE_OPTIONS.map(l => ({ value: l, label: l })).filter(opt => language.includes(opt.value))}
                      onChange={selected => setLanguage(selected.map(opt => opt.value))}
                      classNamePrefix="custom-select"
                      placeholder="Select languages..."
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          backgroundColor: '#f6f6fa',
                          color: '#1a0841',
                          border: '1px solid #e6e6e6',
                          borderRadius: '0.75rem',
                          minHeight: '48px',
                          boxShadow: 'none',
                          paddingLeft: '0.5rem',
                          fontSize: '1rem',
                          fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif',
                          fontWeight: 400,
                        }),
                        multiValue: (provided) => ({
                          ...provided,
                          backgroundColor: '#e6e6e6',
                          color: '#1a0841',
                          borderRadius: '0.5rem',
                          fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif',
                          fontWeight: 400,
                        }),
                        multiValueLabel: (provided) => ({
                          ...provided,
                          color: '#1a0841',
                          fontWeight: 400,
                          fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif',
                        }),
                        placeholder: (provided) => ({
                          ...provided,
                          color: '#a3a3b3',
                          fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif',
                          fontWeight: 400,
                        }),
                      }}
                    />
                  </div>
                  
                  <select 
                    value={degreeLevel} 
                    onChange={e => setDegreeLevel(e.target.value)} 
                    className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-5 md:px-6 py-4 md:py-5 w-full focus:outline-none text-base md:text-lg" 
                    required
                  >
                    <option value="">Degree Level</option>
                    <option value="Foundation">Foundation</option>
                    <option value="Pathway">Pathway</option>
                    <option value="Language">Language</option>
                    <option value="Associate">Associate</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Master">Master</option>
                    <option value="Doctorate">Doctorate</option>
                    <option value="PhD">PhD</option>
                  </select>

                  {/* Education Background Fields - Conditional based on degree level */}
                  {degreeLevel && (
                    <>
                      {/* Schooling country for all degree levels */}
                      <select
                        value={schoolingCountry}
                        onChange={e => setSchoolingCountry(e.target.value)}
                        className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-5 md:px-6 py-4 md:py-5 w-full focus:outline-none text-base md:text-lg"
                        required
                      >
                        <option value="">Where did you complete your schooling/high school?</option>
                        {EDUCATION_COUNTRIES.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>

                      {/* Bachelor's country for Master's, Diploma, Certificate programs */}
                      {(degreeLevel === "Master" || degreeLevel === "Diploma" || degreeLevel === "Certificate") && (
                        <select
                          value={bachelorCountry}
                          onChange={e => setBachelorCountry(e.target.value)}
                          className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-5 md:px-6 py-4 md:py-5 w-full focus:outline-none text-base md:text-lg"
                          required
                        >
                          <option value="">Where did you complete your Bachelor's/Undergraduate degree?</option>
                          {EDUCATION_COUNTRIES.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      )}

                      {/* Master's country for advanced programs (if applicable) */}
                      {(degreeLevel === "Doctorate" || degreeLevel === "PhD") && (
                        <>
                          <select
                            value={bachelorCountry}
                            onChange={e => setBachelorCountry(e.target.value)}
                            className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-5 md:px-6 py-4 md:py-5 w-full focus:outline-none text-base md:text-lg"
                            required
                          >
                            <option value="">Where did you complete your Bachelor's degree?</option>
                            {EDUCATION_COUNTRIES.map(country => (
                              <option key={country} value={country}>{country}</option>
                            ))}
                          </select>
                          <select
                            value={masterCountry}
                            onChange={e => setMasterCountry(e.target.value)}
                            className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-5 md:px-6 py-4 md:py-5 w-full focus:outline-none text-base md:text-lg"
                            required
                          >
                            <option value="">Where did you complete your Master's degree?</option>
                            {EDUCATION_COUNTRIES.map(country => (
                              <option key={country} value={country}>{country}</option>
                            ))}
                          </select>
                        </>
                      )}
                    </>
                  )}
                  
                  <input 
                    value={gpa} 
                    onChange={e => setGpa(e.target.value)} 
                    placeholder="CGPA / GPA (e.g. 3.5 or 85%)" 
                    className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-5 md:px-6 py-4 md:py-5 w-full placeholder:text-[#a3a3b3] focus:outline-none text-base md:text-lg" 
                    required 
                  />
                  
                  <input 
                    value={languageScore} 
                    onChange={e => setLanguageScore(e.target.value)} 
                    placeholder="Language Test Score (e.g. IELTS, TOEFL)" 
                    className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-5 md:px-6 py-4 md:py-5 w-full placeholder:text-[#a3a3b3] focus:outline-none text-base md:text-lg" 
                    required 
                  />
                  
                  <input 
                    value={budget} 
                    onChange={e => setBudget(e.target.value)} 
                    placeholder="Annual Budget (USD)" 
                    type="number" 
                    min="0" 
                    className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-5 md:px-6 py-4 md:py-5 w-full placeholder:text-[#a3a3b3] focus:outline-none text-base md:text-lg" 
                    required 
                  />
                  
                  {/* Document Upload Section */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-[#1a0841] mb-4">Document Upload</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Please upload the required documents. You can skip this step and upload documents later if needed.
                    </p>
                    
                    <FileUploadField
                      label="Most recent diploma obtained (PDF file or clear photo)"
                      documentType="diploma"
                      isUploading={uploadingDocument === 'diploma'}
                      uploadedDoc={uploadedDocuments.diploma}
                    />
                    
                    <FileUploadField
                      label="Transcripts (if available)"
                      documentType="transcripts"
                      isUploading={uploadingDocument === 'transcripts'}
                      uploadedDoc={uploadedDocuments.transcripts}
                    />
                    
                    <FileUploadField
                      label="Copy of passport (identity page)"
                      documentType="passport"
                      isUploading={uploadingDocument === 'passport'}
                      uploadedDoc={uploadedDocuments.passport}
                    />
                    
                    <FileUploadField
                      label="Proof of enrollment or school certificates (for students still enrolled)"
                      documentType="enrollment"
                      isUploading={uploadingDocument === 'enrollment'}
                      uploadedDoc={uploadedDocuments.enrollment}
                    />
                    
                    <FileUploadField
                      label="Any other useful documents"
                      documentType="other"
                      isUploading={uploadingDocument === 'other'}
                      uploadedDoc={uploadedDocuments.other}
                    />
                  </div>

                  <div className="flex gap-4 mt-4">
                    <button
                      type="button"
                      onClick={handlePreviousStep}
                      className="bg-gray-200 hover:bg-gray-300 text-[#1a0841] font-bold px-8 md:px-10 py-4 md:py-5 rounded-full w-full flex items-center justify-center text-base md:text-lg transition-colors shadow-md"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="bg-[#e60023] hover:bg-[#c2001a] text-white font-bold px-8 md:px-10 py-4 md:py-5 rounded-full w-full flex items-center justify-center text-base md:text-lg transition-colors shadow-md"
                      disabled={loading}
                    >
                      {loading ? "Creating Account & Report..." : "Create Account"}
                    </button>
                  </div>
                </>
              )}
            </form>
            {error && <div className="mt-4 text-[#e60023] text-center text-base font-semibold">{error}</div>}
            {success && <div className="mt-4 text-green-600 text-center text-base font-semibold">{success}</div>}
            {step === 2 && (
              <button
                type="button"
                className="text-[#e60023] underline mt-2 font-semibold"
                onClick={handlePreviousStep}
              >
                Back to Basic Info
              </button>
            )}
            <div className="mt-8 text-center text-base">
              <span>Already have an account?</span>
              <button
                type="button"
                className="text-[#e60023] underline ml-1 font-semibold transition-colors duration-200 hover:text-[#c2001a]"
                onClick={() => navigate('/login')}
              >
                Log in here
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;