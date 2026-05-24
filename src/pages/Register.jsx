import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { processApplicationFromMetadata } from "../lib/onboarding";
import { ReportPDF } from "./ReportPDF";
import { pdf } from '@react-pdf/renderer';
import { getAvailableCountries, getAvailableLanguages, getEducationCountries } from '../utils/countries';
import { COUNTRY_CODES } from '../utils/countryCodes';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
import Tesseract from 'tesseract.js';

const BASE_API_URL = "https://elite-scholars-eight.vercel.app";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function Register() {
    // File upload component
    function FileUploadField({ label, documentType, isUploading, uploadedDoc }) {
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
        <div className="mb-3">
          <label className="input-label">{label}</label>
          <div
            onClick={!uploadedDoc ? handleClick : undefined}
            className={`upload-zone ${uploadedDoc ? "!border-emerald-300 !bg-emerald-50 cursor-default" : ""}`}
          >
            {isUploading && uploadingDocument === documentType ? (
              <div className="flex items-center justify-center gap-2 text-brand-600 text-sm font-medium">
                <span className="w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                Uploading…
              </div>
            ) : uploadedDoc ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">✓</span>
                  <span className="truncate max-w-[200px]">{uploadedDoc.fileName}</span>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(); }} className="text-xs text-rose-500 hover:text-rose-700 font-semibold">
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600">Click to upload <span className="text-slate-400 font-normal">or drag & drop</span></p>
                <p className="text-xs text-slate-400">PDF, JPG, PNG, SVG — max 10 MB</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.svg" className="hidden" />
        </div>
      );
    }
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState(COUNTRY_CODES[0]?.code || "");
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappCountryCode, setWhatsappCountryCode] = useState(COUNTRY_CODES[0]?.code || "");
  const [role, setRole] = useState("");
  
  // Application Tracker form fields
  const [country, setCountry] = useState([]);
  const [customCountry, setCustomCountry] = useState("");
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
  const [customSchoolingCountry, setCustomSchoolingCountry] = useState("");
  const [bachelorCountry, setBachelorCountry] = useState("");
  const [customBachelorCountry, setCustomBachelorCountry] = useState("");
  const [masterCountry, setMasterCountry] = useState("");
  const [customMasterCountry, setCustomMasterCountry] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(""); // Store Supabase UUID
  const [pendingReport, setPendingReport] = useState(null); // Store reportObj for onboarding after registration
  const [pendingPdfBlob, setPendingPdfBlob] = useState(null); // Store PDF blob for onboarding after registration

  const isValidUuid = (value) => typeof value === 'string' && UUID_REGEX.test(value.trim());

  const resolveTrackerUserId = async (candidateId) => {
    if (isValidUuid(candidateId)) return candidateId.trim();

    const { data: { session } } = await supabase.auth.getSession();
    const sessionUserId = session?.user?.id;
    if (isValidUuid(sessionUserId)) return sessionUserId.trim();

    const { data: { user } } = await supabase.auth.getUser();
    const authUserId = user?.id;
    if (isValidUuid(authUserId)) return authUserId.trim();

    return null;
  };

  const COUNTRY_OPTIONS = getAvailableCountries();
  const LANGUAGE_OPTIONS = getAvailableLanguages();
  const EDUCATION_COUNTRIES = getEducationCountries();

  // Multi-select dropdown component
  function MultiCheckboxDropdown({ options, selected, onChange, label }) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      function handleClickOutside(event) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => setOpen(o => !o);
    const handleOptionChange = (option) => {
      if (selected.includes(option)) {
        onChange(selected.filter(o => o !== option));
      } else {
        onChange([...selected, option]);
      }
    };

    return (
      <div className="relative mb-3" ref={dropdownRef}>
        <button
          type="button"
          onClick={handleToggle}
          className="input flex items-center justify-between"
        >
          <span className={selected.length > 0 ? "text-slate-900" : "text-slate-400"}>
            {selected.length > 0 ? selected.join(", ") : `Select ${label}`}
          </span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl shadow-card-md mt-1 max-h-52 overflow-y-auto animate-scale-in">
            {options.map((option) => (
              option === "Other" ? (
                <div key={option}>
                  <div className="border-t border-slate-100 my-1" />
                  <label className="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer hover:bg-slate-50 text-sm font-semibold text-rose-600">
                    <input type="checkbox" checked={selected.includes(option)} onChange={() => handleOptionChange(option)} className="rounded" />
                    {option}
                  </label>
                </div>
              ) : (
                <label key={option} className="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer hover:bg-slate-50 text-sm text-slate-700">
                  <input type="checkbox" checked={selected.includes(option)} onChange={() => handleOptionChange(option)} className="rounded" />
                  {option}
                </label>
              )
            ))}
          </div>
        )}
      </div>
    );
  }

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

  // Document upload function with text extraction
  const uploadDocument = async (file, documentType) => {
    if (!file) return null;
    setUploadingDocument(documentType);
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop().toLowerCase();
      const timestamp = Date.now();
      const fileName = `${documentType}_${timestamp}.${fileExt}`;
      const userFolder = userId || email;
      const filePath = `user_documents/${userFolder}/${fileName}`;

      // Upload to Supabase Storage
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
        data = { path: filePath };
        error = null;
      }

      if (error) {
        console.error(`[LOG] Upload error for ${documentType}:`, error);
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

      // Update document status in backend
      try {
        if (userId) {
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

      return uploadedDoc;
    } catch (error) {
      console.error(`[LOG] Error uploading ${documentType}:`, error);
      setError(`Failed to upload ${documentType}. Please try again.`);
      return null;
    } finally {
      setUploadingDocument(null);
    }

    return (
      <div className="mb-4">
        <label className="block text-[#e60023] text-sm md:text-base font-medium mb-2">
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
    console.log('[DEBUG] handleRegister called');
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Ensure custom country fields are handled
    let finalCountry = country.includes('Other')
      ? country.filter(c => c !== 'Other').concat(customCountry ? [customCountry] : [])
      : country;
    let finalSchoolingCountry = schoolingCountry === 'Other' ? customSchoolingCountry : schoolingCountry;
    let finalBachelorCountry = bachelorCountry === 'Other' ? customBachelorCountry : bachelorCountry;
    let finalMasterCountry = masterCountry === 'Other' ? customMasterCountry : masterCountry;
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

      const userMetadata = {
        name,
        role,
        phone: phoneCountryCode + phone,
        whatsapp: whatsappCountryCode + whatsapp,
        application_data: step === 2 && role === "student" ? {
          country: finalCountry,
          language,
          degreeLevel,
          gpa,
          languageScore,
          budget,
          schoolingCountry: finalSchoolingCountry,
          bachelorCountry: finalBachelorCountry,
          masterCountry: finalMasterCountry,
          documents: documentUrls
        } : null
      };

      const usingPassword = password && password.length >= 6;
      const { data: userData, error: signupError } = usingPassword
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: userMetadata,
              emailRedirectTo: window.location.origin + "/profile"
            }
          })
        : await supabase.auth.signInWithOtp({
            email,
            options: {
              data: userMetadata,
              shouldCreateUser: true,
              emailRedirectTo: window.location.origin + "/profile"
            }
          });
      console.log('[DEBUG] Signup result:', { mode: usingPassword ? 'password' : 'magic-link', userData, signupError });

      if (signupError) {
        console.log('[DEBUG] Registration failed with error:', signupError.message);
        setError(signupError.message);
      } else {
        console.log('[DEBUG] Registration successful, proceeding with welcome email...');
        // Store onboarding data in localStorage for post-login processing
        if (step === 2 && role === "student") {
          const pendingData = {
            applicationData: {
              country: finalCountry, 
              language, 
              degreeLevel, 
              gpa, 
              languageScore, 
              budget, 
              schoolingCountry: finalSchoolingCountry, 
              bachelorCountry: finalBachelorCountry, 
              masterCountry: finalMasterCountry,
              documents: documentUrls
            },
            email: email,
            name: name,
            role: role
          };
          localStorage.setItem('pendingApplicationData', JSON.stringify(pendingData));
        }

        console.log('[DEBUG] Tracker creation deferred until authenticated session is available in Profile/onboarding flow.');

        // Send welcome email after successful registration
        try {
          console.log('[DEBUG] Sending welcome email to:', email, 'with name:', name);
          const response = await fetch('https://elite-scholars-eight.vercel.app/api/send-welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: email, name })
          });
          const result = await response.json();
          console.log('[DEBUG] Welcome email response:', response.status, result);
        } catch (emailErr) {
          console.error('[DEBUG] Welcome email failed:', emailErr);
        }

        setSuccess(usingPassword
          ? "Registration successful! Please check your email to confirm your account, then sign in with your password."
          : "Registration successful! A magic link has been sent to your email. Please check your inbox to complete your registration and access your account!");
        setTimeout(() => navigate('/login'), 2000);
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
        const advisorMetadata = { name, role, phone, whatsapp };
        const usingPassword = password && password.length >= 6;
        console.log(`[DEBUG] Advisor signup mode: ${usingPassword ? 'password' : 'magic-link'} for ${email}`);
        const { data: userData, error: signupError } = usingPassword
          ? await supabase.auth.signUp({
              email,
              password,
              options: {
                data: advisorMetadata,
                emailRedirectTo: window.location.origin + "/profile"
              }
            })
          : await supabase.auth.signInWithOtp({
              email,
              options: {
                data: advisorMetadata,
                shouldCreateUser: true,
                emailRedirectTo: window.location.origin + "/profile"
              }
            });
        if (signupError) {
          setError(signupError.message);
        } else {
          // Send welcome email after successful registration
          try {
            console.log('[DEBUG] Sending welcome email to advisor:', email, 'with name:', name);
            const response = await fetch('https://elite-scholars-eight.vercel.app/api/send-welcome-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to: email, name })
            });
            const result = await response.json();
            console.log('[DEBUG] Welcome email response for advisor:', response.status, result);
          } catch (emailErr) {
            console.error('[DEBUG] Welcome email failed for advisor:', emailErr);
          }

          setSuccess(usingPassword
            ? "Advisor registration successful! Please check your email to confirm your account, then sign in with your password."
            : "A signup link has been sent to your email. Please check your inbox and verify your account.");
          setTimeout(() => navigate('/login'), 1500);
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
    <div className="min-h-screen bg-slate-50 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-xl animate-fade-in">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Elite Scholars</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">Create your account</h1>
          <p className="text-slate-500 text-sm">Join thousands of students achieving their global education goals.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-6 px-1">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-all duration-200 ${step >= 1 ? "bg-brand-600 text-white shadow-glow-brand" : "bg-slate-200 text-slate-500"}`}>
            {step > 1 ? "✓" : 1}
          </div>
          <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-300 ${step > 1 ? "bg-brand-500" : "bg-slate-200"}`} />
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-all duration-200 ${step >= 2 ? "bg-brand-600 text-white shadow-glow-brand" : "bg-slate-200 text-slate-500"}`}>
            2
          </div>
        </div>

        {/* Card */}
        <div className="card p-6 sm:p-8">
          <form className="space-y-3" onSubmit={step === 1 ? handleNextStep : handleRegister}>
            {step === 1 && (
              <>
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Step 1 of 2</p>
                  <h2 className="text-lg font-bold text-slate-900">Basic information</h2>
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="reg-name">Full name</label>
                  <input id="reg-name" type="text" placeholder="Your full name" required value={name} onChange={e => setName(e.target.value)} className="input" />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="reg-email">Email address</label>
                  <input id="reg-email" type="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} className="input" />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="reg-password">Password <span className="text-slate-400 font-normal">(optional — leave blank to use magic link)</span></label>
                  <input id="reg-password" type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} className="input" minLength={6} autoComplete="new-password" />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="reg-role">I am a…</label>
                  <select id="reg-role" required value={role} onChange={e => setRole(e.target.value)} className="input">
                    <option value="" disabled>Select role</option>
                    <option value="student">Student</option>
                    <option value="advisor">Advisor</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-rose btn-lg w-full mt-2">Continue →</button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Step 2 of 2</p>
                  <h2 className="text-lg font-bold text-slate-900">Academic profile</h2>
                  <p className="text-xs text-slate-500 mt-0.5">We use this to generate your personalised admissions report.</p>
                </div>

                <div className="grid grid-cols-[5.5rem_1fr] gap-2">
                  <input type="text" placeholder="+91" value={phoneCountryCode} onChange={e => setPhoneCountryCode(e.target.value)} className="input" required pattern="^[+0-9]{1,}$" title="e.g. +91" />
                  <input type="tel" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} className="input" required pattern="^[0-9]{6,15}$" />
                </div>
                <div className="grid grid-cols-[5.5rem_1fr] gap-2">
                  <input type="text" placeholder="+91" value={whatsappCountryCode} onChange={e => setWhatsappCountryCode(e.target.value)} className="input" required pattern="^[+0-9]{1,}$" title="e.g. +91" />
                  <input type="tel" placeholder="WhatsApp number" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="input" required pattern="^[0-9]{6,15}$" />
                </div>

                <MultiCheckboxDropdown options={COUNTRY_OPTIONS} selected={country} onChange={setCountry} label="Target countries" />
                <MultiCheckboxDropdown options={LANGUAGE_OPTIONS} selected={language} onChange={setLanguage} label="Languages you speak" />

                <select value={degreeLevel} onChange={e => setDegreeLevel(e.target.value)} className="input" required>
                  <option value="">Degree level seeking</option>
                  {["Foundation","Pathway","Language","Associate","Bachelor","Diploma","Certificate","Master","Doctorate","PhD"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                {degreeLevel && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Education background</p>
                    <select value={schoolingCountry} onChange={e => setSchoolingCountry(e.target.value)} className="input" required>
                      <option value="">High school / schooling country</option>
                      {EDUCATION_COUNTRIES.concat(["Other"]).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {schoolingCountry === "Other" && <input type="text" placeholder="Type your country" value={customSchoolingCountry} onChange={e => setCustomSchoolingCountry(e.target.value)} className="input" />}

                    {(degreeLevel === "Master" || degreeLevel === "Diploma" || degreeLevel === "Certificate") && (
                      <>
                        <select value={bachelorCountry} onChange={e => setBachelorCountry(e.target.value)} className="input" required>
                          <option value="">Bachelor's / undergraduate country</option>
                          {EDUCATION_COUNTRIES.concat(["Other"]).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {bachelorCountry === "Other" && <input type="text" placeholder="Type your country" value={customBachelorCountry} onChange={e => setCustomBachelorCountry(e.target.value)} className="input" />}
                      </>
                    )}

                    {(degreeLevel === "Doctorate" || degreeLevel === "PhD") && (
                      <>
                        <select value={bachelorCountry} onChange={e => setBachelorCountry(e.target.value)} className="input" required>
                          <option value="">Bachelor's degree country</option>
                          {EDUCATION_COUNTRIES.concat(["Other"]).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {bachelorCountry === "Other" && <input type="text" placeholder="Type your country" value={customBachelorCountry} onChange={e => setCustomBachelorCountry(e.target.value)} className="input" />}
                        <select value={masterCountry} onChange={e => setMasterCountry(e.target.value)} className="input" required>
                          <option value="">Master's degree country</option>
                          {EDUCATION_COUNTRIES.concat(["Other"]).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {masterCountry === "Other" && <input type="text" placeholder="Type your country" value={customMasterCountry} onChange={e => setCustomMasterCountry(e.target.value)} className="input" />}
                      </>
                    )}
                  </div>
                )}

                <input value={gpa} onChange={e => setGpa(e.target.value)} placeholder="CGPA / GPA (e.g. 3.5 or 85%)" className="input" required />
                <input value={languageScore} onChange={e => setLanguageScore(e.target.value)} placeholder="Language test score (e.g. IELTS 7.0, TOEFL 100)" className="input" required />
                <input value={budget} onChange={e => setBudget(e.target.value)} placeholder="Annual budget (USD)" type="number" min="0" className="input" required />

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-1">Documents <span className="normal-case text-slate-400 font-normal">(optional — upload later if needed)</span></p>
                  <FileUploadField label="Most recent diploma (PDF or photo)" documentType="diploma" isUploading={uploadingDocument === "diploma"} uploadedDoc={uploadedDocuments.diploma} />
                  <FileUploadField label="Transcripts" documentType="transcripts" isUploading={uploadingDocument === "transcripts"} uploadedDoc={uploadedDocuments.transcripts} />
                  <FileUploadField label="Passport identity page" documentType="passport" isUploading={uploadingDocument === "passport"} uploadedDoc={uploadedDocuments.passport} />
                  <FileUploadField label="Proof of enrollment / school certificate" documentType="enrollment" isUploading={uploadingDocument === "enrollment"} uploadedDoc={uploadedDocuments.enrollment} />
                  <FileUploadField label="Any other supporting documents" documentType="other" isUploading={uploadingDocument === "other"} uploadedDoc={uploadedDocuments.other} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handlePreviousStep} className="btn btn-outline flex-1">← Back</button>
                  <button type="submit" disabled={loading} className="btn btn-rose flex-1">
                    {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating account…</> : "Create account →"}
                  </button>
                </div>
              </>
            )}
          </form>

          {error && (
            <div className="mt-4 flex items-start gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm animate-fade-in">
              <span className="mt-0.5 flex-shrink-0">⚠</span>{error}
            </div>
          )}
          {success && (
            <div className="mt-4 flex items-start gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm animate-fade-in">
              <span className="mt-0.5 flex-shrink-0">✓</span>{success}
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <button onClick={() => navigate("/login")} className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
            Sign in →
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;