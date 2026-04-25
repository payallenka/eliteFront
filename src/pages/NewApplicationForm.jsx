import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowRight, UploadCloud, CheckCircle2 } from 'lucide-react';
import UpgradePlanForm from './UpgradePlanForm';
import PlanSelectionModal from '../components/PlanSelectionModal';

// New Application Form Component

function NewApplicationForm() {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingSubmission, setPendingSubmission] = useState(false);
    const selectedPlanRef = useRef(null);
  // Stepper states
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    'Who is completing',
    'Personal Information', 
    'Academic Goals',
    'Visa & Sponsor',
    'Parent Information',
    'Academic & Financial',
    'Documents'
  ];

  // Section 0: Who is completing
  const [completingFor, setCompletingFor] = useState('');
  const [completingOther, setCompletingOther] = useState('');

  // Section 1: Personal Info
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [countryOfResidence, setCountryOfResidence] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [gender, setGender] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [profession, setProfession] = useState('');

  // Section 2: Academic Goals
  const [academicLevel, setAcademicLevel] = useState('');
  const [academicLevelOther, setAcademicLevelOther] = useState('');
  const [academicGoals, setAcademicGoals] = useState('');

  // Section 3: Visa & Sponsor
  const [appliedVisa, setAppliedVisa] = useState('');
  const [visaCountry, setVisaCountry] = useState('');
  const [visaResult, setVisaResult] = useState('');
  const [visaRefusalReason, setVisaRefusalReason] = useState('');
  const [sponsorType, setSponsorType] = useState('');
  const [sponsorFullName, setSponsorFullName] = useState('');
  const [sponsorRelationship, setSponsorRelationship] = useState('');
  const [sponsorProfession, setSponsorProfession] = useState('');
  const [sponsorNationality, setSponsorNationality] = useState('');
  const [sponsorCity, setSponsorCity] = useState('');

  // Section 4: Parent Info
  const [fatherName, setFatherName] = useState('');
  const [fatherProfession, setFatherProfession] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [fatherAddress, setFatherAddress] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherProfession, setMotherProfession] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [motherAddress, setMotherAddress] = useState('');

  // Section 5: Academic & Financial (existing)
  const [lastDiploma, setLastDiploma] = useState('');
  const [languageRefresher, setLanguageRefresher] = useState('');
  const [offerLetter, setOfferLetter] = useState('');
  const [financePlan, setFinancePlan] = useState('');
  const [financeOther, setFinanceOther] = useState('');
  const [projectStart, setProjectStart] = useState('');
  const [projectStartOther, setProjectStartOther] = useState('');
  const [goAbroadSoon, setGoAbroadSoon] = useState('');
  const [goAbroadSoonOther, setGoAbroadSoonOther] = useState('');
  const [liveWithRelative, setLiveWithRelative] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [sharedAccommodation, setSharedAccommodation] = useState('');
  const [heardAbout, setHeardAbout] = useState('');
  const [declaration, setDeclaration] = useState(false);

  // File upload states
  const [diplomaFile, setDiplomaFile] = useState(null);
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [passportFile, setPassportFile] = useState(null);
  const [enrollmentFile, setEnrollmentFile] = useState(null);
  const [otherDocsFile, setOtherDocsFile] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});


  // Navigation helpers
  // Step validation logic
  const stepMandatoryFields = [
    // Step 0
    [completingFor, completingFor === 'other' ? completingOther : true],
    // Step 1
    [email, name, fullAddress, countryOfResidence, currentCity, gender, country, nationality, dob],
    // Step 2
    [academicLevel],
    // Step 3
    [appliedVisa],
    // Step 4
    [],
    // Step 5
    [financePlan, goAbroadSoon, monthlyBudget],
    // Step 6
    [declaration]
  ];

  const isStepValid = (step) => {
    const fields = stepMandatoryFields[step];
    return fields.every(f => typeof f === 'boolean' ? f : f && f.trim());
  };

  const [stepError, setStepError] = useState('');
  const nextStep = () => {
    if (!isStepValid(currentStep)) {
      setStepError('Please fill all required fields before proceeding.');
      return;
    }
    setStepError('');
    setCurrentStep(prev => Math.min(steps.length - 1, prev + 1));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(0, prev - 1));
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Calculate real-time progress based on filled fields
  const calculateProgress = () => {
    let totalFields = 0;
    let filledFields = 0;
    
    // Section 0: Who is completing (1 field)
    totalFields += 1;
    if (completingFor) filledFields += 1;
    
    // Section 1: Personal Information (11 main fields)
    const section1Fields = [email, name, fullAddress, countryOfResidence, currentCity, gender, phoneNumber, country, nationality, dob, profession];
    totalFields += section1Fields.length;
    section1Fields.forEach(field => {
      if (field && field.trim()) filledFields += 1;
    });
    
    // Section 2: Academic Goals (2 fields)
    const section2Fields = [academicLevel, academicGoals];
    totalFields += section2Fields.length;
    section2Fields.forEach(field => {
      if (field && field.trim()) filledFields += 1;
    });
    
    // Section 3: Visa & Sponsor (key fields)
    totalFields += 3;
    if (appliedVisa) filledFields += 1;
    if (sponsorType) filledFields += 1;
    if (sponsorFullName && sponsorFullName.trim()) filledFields += 1;
    
    // Section 4: Parent Info (6 main fields)
    const section4Fields = [fatherName, fatherProfession, fatherPhone, motherName, motherProfession, motherPhone];
    totalFields += section4Fields.length;
    section4Fields.forEach(field => {
      if (field && field.trim()) filledFields += 1;
    });
    
    // Section 5: Academic & Financial (key fields)
    const section5Fields = [lastDiploma, financePlan, projectStart, goAbroadSoon, monthlyBudget];
    totalFields += section5Fields.length;
    section5Fields.forEach(field => {
      if (field && field.trim()) filledFields += 1;
    });
    
    // File uploads (5 files)
    const fileFields = [diplomaFile, transcriptFile, passportFile, enrollmentFile, otherDocsFile];
    totalFields += fileFields.length;
    fileFields.forEach(file => {
      if (file) filledFields += 1;
    });
    
    // Declaration checkbox
    totalFields += 1;
    if (declaration) filledFields += 1;
    
    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  };

  const progressPercentage = calculateProgress();

  // Fetch existing user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // First try to get data from user_roles table
          const { data: userRoleData } = await supabase
            .from('user_roles')
            .select('name, email')
            .eq('user_id', user.id)
            .single();

          if (userRoleData) {
            // Pre-fill with existing data
            if (userRoleData.name) {
              setName(userRoleData.name);
            }
            if (userRoleData.email) {
              setEmail(userRoleData.email);
            }
          } else {
            // Fallback to auth user data
            if (user.email) {
              setEmail(user.email);
            }
            if (user.user_metadata?.full_name) {
              setName(user.user_metadata.full_name);
            } else if (user.user_metadata?.name) {
              setName(user.user_metadata.name);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // Optionally, prevent background scroll when modal is open
  useEffect(() => {
    if (showPaymentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showPaymentModal]);

  const handleFileUpload = async (fieldName, file) => {
    if (!file) {
      console.log('No file provided for upload:', fieldName);
      return;
    }
    setUploading(true);
    try {
      const userObj = await supabase.auth.getUser();
      const userId = userObj.data.user?.id || 'anonymous';
      // Add document type to filename for better categorization
      // Standardize document type keywords for filename
      let docType = '';
      switch(fieldName) {
        case 'diplomaFile': docType = 'diploma'; break;
        case 'transcriptFile': docType = 'transcript'; break;
        case 'passportFile': docType = 'passport'; break;
        case 'enrollmentFile': docType = 'enrollment'; break;
        case 'otherDocsFile':
          // Try to infer type from filename for otherDocsFile
          const lowerName = file.name.toLowerCase();
          if (lowerName.includes('certificate')) docType = 'certificate';
          else if (lowerName.includes('report')) docType = 'report';
          else if (lowerName.includes('resume')) docType = 'resume';
          else if (lowerName.includes('assessment')) docType = 'assessment';
          else docType = 'other';
          break;
        default: docType = 'other';
      }
      // Use only recognized keywords for document types
      const recognizedTypes = ['diploma', 'transcript', 'passport', 'enrollment', 'certificate', 'report', 'resume', 'assessment'];
      if (!recognizedTypes.includes(docType)) docType = 'other';
      const filePath = `${userId}/${Date.now()}_${docType}_${file.name}`;
      console.log('Uploading file:', file.name, 'for field:', fieldName, 'to path:', filePath);
      const { data, error } = await supabase.storage.from('user-uploads').upload(filePath, file);
      console.log('Upload result:', { data, error });
      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: 'Upload failed' }));
        console.error('Upload failed for', fieldName, ':', error.message);
      } else {
        // Set the appropriate file state based on fieldName
        switch(fieldName) {
          case 'diplomaFile':
            setDiplomaFile(data.path);
            break;
          case 'transcriptFile':
            setTranscriptFile(data.path);
            break;
          case 'passportFile':
            setPassportFile(data.path);
            break;
          case 'enrollmentFile':
            setEnrollmentFile(data.path);
            break;
          case 'otherDocsFile':
            setOtherDocsFile(data.path);
            break;
        }
        setErrors(prev => ({ ...prev, [fieldName]: '' }));
        console.log('File uploaded successfully for', fieldName, 'path:', data.path);
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, [fieldName]: 'Upload failed' }));
      console.error('Exception during upload for', fieldName, ':', err);
    }
    setUploading(false);
  };

  const validateForm = () => {
    const newErrors = {};
    const mandatoryFields = [
      // Section 0
      { field: 'completingFor', value: completingFor },
      // Section 1
      { field: 'email', value: email },
      { field: 'name', value: name },
      { field: 'fullAddress', value: fullAddress },
      { field: 'countryOfResidence', value: countryOfResidence },
      { field: 'currentCity', value: currentCity },
      { field: 'gender', value: gender },
      { field: 'country', value: country },
      { field: 'nationality', value: nationality },
      { field: 'dob', value: dob },
      // Section 2
      { field: 'academicLevel', value: academicLevel },
      // Section 3
      { field: 'appliedVisa', value: appliedVisa },
      // Section 5 (existing)
      { field: 'financePlan', value: financePlan },
      { field: 'goAbroadSoon', value: goAbroadSoon },
      { field: 'monthlyBudget', value: monthlyBudget }
    ];

    mandatoryFields.forEach(({ field, value }) => {
      if (!value || value.trim() === '') {
        newErrors[field] = 'This field is required';
      }
    });

    // Conditional required fields
    if (completingFor === 'other' && (!completingOther || completingOther.trim() === '')) {
      newErrors.completingOther = 'Please specify';
    }
    if (academicLevel === 'Other' && (!academicLevelOther || academicLevelOther.trim() === '')) {
      newErrors.academicLevelOther = 'Please specify';
    }
    if (appliedVisa === 'Yes') {
      if (!visaCountry || visaCountry.trim() === '') newErrors.visaCountry = 'Required';
      if (!visaResult || visaResult.trim() === '') newErrors.visaResult = 'Required';
      if (visaResult === 'Refused' && (!visaRefusalReason || visaRefusalReason.trim() === '')) newErrors.visaRefusalReason = 'Required';
    }
    if (sponsorType === 'other') {
      if (!sponsorFullName || sponsorFullName.trim() === '') newErrors.sponsorFullName = 'Required';
      if (!sponsorRelationship || sponsorRelationship.trim() === '') newErrors.sponsorRelationship = 'Required';
      if (!sponsorProfession || sponsorProfession.trim() === '') newErrors.sponsorProfession = 'Required';
      if (!sponsorNationality || sponsorNationality.trim() === '') newErrors.sponsorNationality = 'Required';
      if (!sponsorCity || sponsorCity.trim() === '') newErrors.sponsorCity = 'Required';
    }

    if (!declaration) {
      newErrors.declaration = 'You must accept the declaration';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (uploading) return; // Prevent double submission
    setUploading(true);
    if (!validateForm()) {
      setUploading(false);
      return;
    }
    // Instead of submitting, show the plan selection modal
    setPendingSubmission(true);
    setShowPaymentModal(true);
    setUploading(false);
  };

  // This function will be called after the user selects a plan
  const handlePlanSelectAndSubmit = async (planKey) => {
    selectedPlanRef.current = planKey;
    setShowPaymentModal(false);
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrors({ submit: 'Please login to submit the application' });
        setUploading(false);
        return;
      }
      // Collect all form data (same as before)
      const formData = {
        completingFor, completingOther, email, name, fullAddress, countryOfResidence,
        currentCity, gender, phoneNumber, country, nationality, dob, profession,
        academicLevel, academicLevelOther, academicGoals,
        appliedVisa, visaCountry, visaResult, visaRefusalReason,
        sponsorType, sponsorFullName, sponsorRelationship, sponsorProfession, sponsorNationality, sponsorCity,
        fatherName, fatherProfession, fatherPhone, fatherAddress,
        motherName, motherProfession, motherPhone, motherAddress,
        lastDiploma, languageRefresher, offerLetter,
        financePlan, financeOther, projectStart, projectStartOther,
        goAbroadSoon, goAbroadSoonOther, liveWithRelative,
        monthlyBudget, sharedAccommodation, heardAbout, declaration,
        selectedPlan: planKey,
        submittedAt: new Date().toISOString()
      };
      // ...existing document upload and DB logic here (copy from previous handleSubmit)...
      // Prepare documents object for user_roles table and for AI
      const documentsObject = {};
      const aiDocuments = {};
      if (diplomaFile) {
        const { data: diplomaUrl } = supabase.storage.from('user-uploads').getPublicUrl(diplomaFile);
        documentsObject.diploma = { url: diplomaUrl.publicUrl, fileName: 'diploma.pdf', uploadedAt: new Date().toISOString() };
        aiDocuments.diploma = { url: diplomaUrl.publicUrl };
      }
      if (transcriptFile) {
        const { data: transcriptUrl } = supabase.storage.from('user-uploads').getPublicUrl(transcriptFile);
        documentsObject.transcript = { url: transcriptUrl.publicUrl, fileName: 'transcript.pdf', uploadedAt: new Date().toISOString() };
        aiDocuments.transcript = { url: transcriptUrl.publicUrl };
      }
      if (passportFile) {
        const { data: passportUrl } = supabase.storage.from('user-uploads').getPublicUrl(passportFile);
        documentsObject.passport = { url: passportUrl.publicUrl, fileName: 'passport.pdf', uploadedAt: new Date().toISOString() };
        aiDocuments.passport = { url: passportUrl.publicUrl };
      }
      if (enrollmentFile) {
        const { data: enrollmentUrl } = supabase.storage.from('user-uploads').getPublicUrl(enrollmentFile);
        documentsObject.enrollment = { url: enrollmentUrl.publicUrl, fileName: 'enrollment.pdf', uploadedAt: new Date().toISOString() };
        aiDocuments.enrollment = { url: enrollmentUrl.publicUrl };
      }
      if (otherDocsFile) {
        const { data: otherUrl } = supabase.storage.from('user-uploads').getPublicUrl(otherDocsFile);
        documentsObject.other = { url: otherUrl.publicUrl, fileName: 'other.pdf', uploadedAt: new Date().toISOString() };
        aiDocuments.other = { url: otherUrl.publicUrl };
      }
      // Get existing user data from user_roles to preserve original info (do this early)
      const { data: existingUserData, error: fetchError } = await supabase
        .from('user_roles')
        .select('name, email')
        .eq('user_id', user.id)
        .single();
      // Use existing user data if available, otherwise fall back to form data
      const userName = existingUserData?.name || name;
      const userEmail = existingUserData?.email || email;
      // --- FAST TRACK: Save form data first ---
      // Update user_roles table with basic info and documents (immediate feedback)
      const { error: userRolesError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          name: userName, // Use existing name to preserve original
          email: userEmail, // Use existing email to preserve original
          target_countries: [country],
          documents: documentsObject,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });
      if (userRolesError) {
        console.error('Error updating user data:', userRolesError);
        setErrors({ submit: 'Failed to save user data' });
        setUploading(false);
        return;
      }
      // Create basic form record without AI analysis first
      const basicFormData = { ...formData, submittedAt: new Date().toISOString() };
      const basicFormBlob = new Blob([JSON.stringify(basicFormData, null, 2)], { type: 'application/json' });
      const reportFileName = `application_form_${user.id}_${Date.now()}.json`;
      // Upload form data as a report file
      const { error: uploadError } = await supabase.storage
        .from('user_analysis_report')
        .upload(reportFileName, basicFormBlob, { contentType: 'application/json', upsert: true });
      if (uploadError) {
        console.error('Error uploading form report:', uploadError);
        setErrors({ submit: 'Failed to save application data' });
        setUploading(false);
        return;
      }
      // Get public URL for the form report
      const { data: reportUrlData } = supabase.storage
        .from('user_analysis_report')
        .getPublicUrl(reportFileName);
      // Insert form data report into user_reports table
      const { error: reportError } = await supabase
        .from('user_reports')
        .insert({
          user_id: user.id,
          file_name: reportFileName,
          url: reportUrlData.publicUrl,
          report_type: 'application_form',
          generated_at: new Date().toISOString(),
          created_at: new Date().toISOString() // Add created_at for consistency
        });
      if (reportError) {
        console.error('Error saving form report:', reportError);
        setErrors({ submit: 'Failed to save application report' });
        setUploading(false);
        return;
      }
      // Show success immediately
      setSubmitSuccess(true);
      setUploading(false);
      // --- BACKGROUND: AI Analysis (async, non-blocking) ---
      // Run AI analysis in background without blocking user
      setTimeout(async () => {
        try {
          console.log('Starting background AI analysis...');
          const backendUrl = 'https://elite-scholars-eight.vercel.app/api/analyze-profile';
          const aiRes = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formData: basicFormData, userDocuments: aiDocuments })
          });
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const aiAnalysis = aiData.aiAnalysis || null;
            if (aiAnalysis) {
              // Update the stored report with AI analysis
              const combinedFormData = { ...basicFormData, aiAnalysis, aiAnalysisCompletedAt: new Date().toISOString() };
              const updatedFormBlob = new Blob([JSON.stringify(combinedFormData, null, 2)], { type: 'application/json' });
              // Update the stored file with AI results
              await supabase.storage
                .from('user_analysis_report')
                .update(reportFileName, updatedFormBlob, { contentType: 'application/json', upsert: true });
              console.log('✅ Background AI analysis completed and saved');
            }
          } else {
            console.log('⚠️ Background AI analysis failed, but form was saved successfully');
          }
        } catch (err) {
          console.log('⚠️ Background AI analysis error:', err);
          // Don't show error to user since form was already saved successfully
        }
      }, 100); // Start after 100ms to ensure UI updates first
      console.log('✅ Application submitted successfully');
    } catch (err) {
      console.error('Error submitting application:', err);
      setErrors({ submit: 'An unexpected error occurred' });
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-0 sm:px-4 ml-0 sm:ml-14 lg:ml-16" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif' }}>
      {/* Upgrade Plan Modal Overlay (multi-plan) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-7xl">
            <PlanSelectionModal onSelect={handlePlanSelectAndSubmit} onClose={() => setShowPaymentModal(false)} />
          </div>
        </div>
      )}
      
      
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        {/* Step Indicator */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center mb-2">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                index <= currentStep ? 'bg-[#6c47ff] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-6 sm:w-12 h-1 mx-1 sm:mx-2 ${
                  index < currentStep ? 'bg-[#6c47ff]' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#1a0841]">{steps[currentStep]}</h2>
          <span className="text-sm text-gray-500">{progressPercentage}% Complete</span>
        </div>
        
        {/* Step Content */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Step 0: Who is completing this form */}
          {currentStep === 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#1a0841] mb-4">Who is completing this form?</h3>
              <div className="flex flex-wrap gap-4 mb-2">
                {['myself','my child','my ward','other'].map(opt => (
                  <label key={opt} className={`flex items-center px-4 py-2 rounded-full border cursor-pointer transition-all ${completingFor === opt ? 'bg-[#6c47ff] text-white border-[#6c47ff]' : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-[#6c47ff]'}`}>
                    <input
                      type="radio"
                      name="completingFor"
                      value={opt}
                      checked={completingFor === opt}
                      onChange={() => setCompletingFor(opt)}
                      className="mr-2 accent-[#6c47ff]"
                    />
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </label>
                ))}
              </div>
              {completingFor === 'other' && (
                <input
                  type="text"
                  className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full mt-2"
                  value={completingOther}
                  onChange={e => setCompletingOther(e.target.value)}
                  placeholder="Please specify (e.g. guardian, agent, etc.)"
                />
              )}
            </div>
          )}
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#1a0841] mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email * <span className="text-xs text-gray-500">(from registration)</span></label>
              <input
                type="email"
                className="bg-gray-100 text-gray-700 border border-gray-300 rounded-xl px-4 py-3 w-full text-base cursor-not-allowed"
                value={email}
                readOnly
                disabled
                placeholder="Loading your email..."
              />
              <p className="text-[10px] text-gray-500 mt-1">This is your registered email and cannot be changed here.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name * <span className="text-xs text-gray-500">(from registration)</span></label>
              <input
                type="text"
                className="bg-gray-100 text-gray-700 border border-gray-300 rounded-xl px-4 py-3 w-full text-base cursor-not-allowed"
                value={name}
                readOnly
                disabled
                placeholder="Loading your name..."
              />
              <p className="text-[10px] text-gray-500 mt-1">This is your registered name and cannot be changed here.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Address *</label>
              <input
                type="text"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full placeholder:text-[#a3a3b3] focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={fullAddress}
                onChange={e => setFullAddress(e.target.value)}
                placeholder="Enter your full address"
              />
              {errors.fullAddress && <p className="text-[10px] text-red-500 mt-1">{errors.fullAddress}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Country of Residence *</label>
              <input
                type="text"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full placeholder:text-[#a3a3b3] focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={countryOfResidence}
                onChange={e => setCountryOfResidence(e.target.value)}
                placeholder="Enter country of residence"
              />
              {errors.countryOfResidence && <p className="text-[10px] text-red-500 mt-1">{errors.countryOfResidence}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Current City *</label>
              <input
                type="text"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full placeholder:text-[#a3a3b3] focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={currentCity}
                onChange={e => setCurrentCity(e.target.value)}
                placeholder="Enter current city"
              />
              {errors.currentCity && <p className="text-[10px] text-red-500 mt-1">{errors.currentCity}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Gender *</label>
              <select
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={gender}
                onChange={e => setGender(e.target.value)}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="text-[10px] text-red-500 mt-1">{errors.gender}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full placeholder:text-[#a3a3b3] focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Country *</label>
              <select
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={country}
                onChange={e => setCountry(e.target.value)}
              >
                <option value="">Select</option>
                <option value="USA">USA</option>
                <option value="FR">France</option>
                <option value="UK">UK</option>
                <option value="CANADA">Canada</option>
                <option value="Other">Other</option>
              </select>
              {errors.country && <p className="text-[10px] text-red-500 mt-1">{errors.country}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nationality *</label>
              <input
                type="text"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full placeholder:text-[#a3a3b3] focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={nationality}
                onChange={e => setNationality(e.target.value)}
                placeholder="Enter nationality"
              />
              {errors.nationality && <p className="text-[10px] text-red-500 mt-1">{errors.nationality}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth *</label>
              <input
                type="date"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={dob}
                onChange={e => setDob(e.target.value)}
              />
              {errors.dob && <p className="text-[10px] text-red-500 mt-1">{errors.dob}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Profession</label>
              <input
                type="text"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full placeholder:text-[#a3a3b3] focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={profession}
                onChange={e => setProfession(e.target.value)}
                placeholder="Enter profession"
              />
            </div>
          </div>
        </div>
          )}

          {/* Step 2: Academic Level & Goals */}
          {currentStep === 2 && (
            <>
              <div className="mb-8 text-center text-purple-700 font-semibold">Awesome! Now let's talk about your academic journey and goals.</div>
              <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#1a0841] mb-4">Academic Level & Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Current Academic Level *</label>
              <select
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={academicLevel}
                onChange={e => setAcademicLevel(e.target.value)}
              >
                <option value="">Select</option>
                <option value="High School">High School</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Graduate">Graduate</option>
                <option value="PhD">PhD</option>
                <option value="Other">Other</option>
              </select>
              {academicLevel === 'Other' && (
                <input
                  type="text"
                  className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full mt-2"
                  value={academicLevelOther}
                  onChange={e => setAcademicLevelOther(e.target.value)}
                  placeholder="Please specify"
                />
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">What are your academic/career goals?</label>
              <textarea
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full min-h-[60px] focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={academicGoals}
                onChange={e => setAcademicGoals(e.target.value)}
                placeholder="Describe your goals, dream university, field, etc."
              />
            </div>
          </div>
        </div>
            </>
          )}

          {/* Step 3: Visa & Sponsor */}
          {currentStep === 3 && (
            <>
              <div className="mb-8 text-center text-purple-700 font-semibold">You're doing great! Let's cover your visa and sponsor details.</div>
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#1a0841] mb-4">Visa & Sponsor Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Have you ever applied for a VISA abroad? *</label>
              <select
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={appliedVisa}
                onChange={e => setAppliedVisa(e.target.value)}
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            {appliedVisa === 'Yes' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Which country?</label>
                  <input
                    type="text"
                    className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                    value={visaCountry}
                    onChange={e => setVisaCountry(e.target.value)}
                    placeholder="Country applied to"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">What was the result?</label>
                  <select
                    className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                    value={visaResult}
                    onChange={e => setVisaResult(e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Granted">Granted</option>
                    <option value="Refused">Refused</option>
                  </select>
                </div>
                {visaResult === 'Refused' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">What were the specific reasons? (e.g., clause 9, insufficient funds, etc.)</label>
                    <input
                      type="text"
                      className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                      value={visaRefusalReason}
                      onChange={e => setVisaRefusalReason(e.target.value)}
                      placeholder="Reason for refusal"
                    />
                  </div>
                )}
              </>
            )}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Who is your sponsor?</label>
              <select
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                value={sponsorType}
                onChange={e => setSponsorType(e.target.value)}
              >
                <option value="">Select</option>
                <option value="myself">Myself</option>
                <option value="parent">Parent</option>
                <option value="other">Other (full sponsor profile required)</option>
              </select>
            </div>
            {sponsorType === 'other' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sponsor Full Name</label>
                  <input
                    type="text"
                    className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                    value={sponsorFullName}
                    onChange={e => setSponsorFullName(e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Relationship</label>
                  <input
                    type="text"
                    className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                    value={sponsorRelationship}
                    onChange={e => setSponsorRelationship(e.target.value)}
                    placeholder="Relationship to you"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Profession/Job Title</label>
                  <input
                    type="text"
                    className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                    value={sponsorProfession}
                    onChange={e => setSponsorProfession(e.target.value)}
                    placeholder="Profession or job title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sponsor Nationality</label>
                  <input
                    type="text"
                    className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                    value={sponsorNationality}
                    onChange={e => setSponsorNationality(e.target.value)}
                    placeholder="Nationality"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Current City of Residence</label>
                  <input
                    type="text"
                    className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                    value={sponsorCity}
                    onChange={e => setSponsorCity(e.target.value)}
                    placeholder="Current city"
                  />
                </div>
              </>
            )}
          </div>
        </div>
            </>
          )}

          {/* Step 4: Parent Information */}
          {currentStep === 4 && (
            <>
              <div className="mb-8 text-center text-purple-700 font-semibold">Almost there! Please provide your parent information.</div>
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#1a0841] mb-4">Parent Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Father's Full Name</label>
              <input
                type="text"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                value={fatherName}
                onChange={e => setFatherName(e.target.value)}
                placeholder="Father's full name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Father's Profession</label>
              <input
                type="text"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                value={fatherProfession}
                onChange={e => setFatherProfession(e.target.value)}
                placeholder="Father's profession"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Father's Phone Number</label>
              <input
                type="text"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                value={fatherPhone}
                onChange={e => setFatherPhone(e.target.value)}
                placeholder="Father's phone number"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Father's Address</label>
              <input
                type="text"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                value={fatherAddress}
                onChange={e => setFatherAddress(e.target.value)}
                placeholder="Father's address"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mother's Full Name</label>
              <input
                type="text"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                value={motherName}
                onChange={e => setMotherName(e.target.value)}
                placeholder="Mother's full name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mother's Profession</label>
              <input
                type="text"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                value={motherProfession}
                onChange={e => setMotherProfession(e.target.value)}
                placeholder="Mother's profession"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mother's Phone Number</label>
              <input
                type="text"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                value={motherPhone}
                onChange={e => setMotherPhone(e.target.value)}
                placeholder="Mother's phone number"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mother's Address</label>
              <input
                type="text"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full"
                value={motherAddress}
                onChange={e => setMotherAddress(e.target.value)}
                placeholder="Mother's address"
              />
            </div>
          </div>
        </div>
            </>
          )}

          {/* Step 5: Academic & Financial Information */}
          {currentStep === 5 && (
            <>
              <div className="mb-8 text-center text-purple-700 font-semibold">Last step! Upload your documents and finish your application.</div>
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#1a0841] mb-4">Academic & Financial Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Last Diploma Obtained</label>
              <input
                type="text"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full placeholder:text-[#a3a3b3] focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={lastDiploma}
                onChange={e => setLastDiploma(e.target.value)}
                placeholder="Enter last diploma"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Language Refresher Course?</label>
              <select
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={languageRefresher}
                onChange={e => setLanguageRefresher(e.target.value)}
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Do you already have an offer/admission letter?</label>
              <select
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={offerLetter}
                onChange={e => setOfferLetter(e.target.value)}
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">How do you plan to finance your stay abroad? *</label>
              <select
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={financePlan}
                onChange={e => setFinancePlan(e.target.value)}
              >
                <option value="">Select</option>
                <option value="Self-funded">Self-funded</option>
                <option value="Parental support">Parental support</option>
                <option value="Sponsor/Guarantor">Sponsor/Guarantor</option>
                <option value="Other">Other</option>
              </select>
              {errors.financePlan && <p className="text-[10px] text-red-500 mt-1">{errors.financePlan}</p>}
              {financePlan === 'Other' && (
                <input
                  type="text"
                  className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full placeholder:text-[#a3a3b3] focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base mt-2"
                  value={financeOther}
                  onChange={e => setFinanceOther(e.target.value)}
                  placeholder="Please specify"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">When would you like to start your project abroad?</label>
              <select
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={projectStart}
                onChange={e => setProjectStart(e.target.value)}
              >
                <option value="">Select</option>
                <option value="January">January</option>
                <option value="June">June</option>
                <option value="August">August</option>
                <option value="December">December</option>
                <option value="Other">Other</option>
              </select>
              {projectStart === 'Other' && (
                <input
                  type="text"
                  className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full placeholder:text-[#a3a3b3] focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base mt-2"
                  value={projectStartOther}
                  onChange={e => setProjectStartOther(e.target.value)}
                  placeholder="Please specify"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">How soon would you like to go abroad? *</label>
              <select
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={goAbroadSoon}
                onChange={e => setGoAbroadSoon(e.target.value)}
              >
                <option value="">Select</option>
                <option value="3 months">3 months</option>
                <option value="6 months">6 months</option>
                <option value="1 year">1 year</option>
                <option value="Other">Other</option>
              </select>
              {errors.goAbroadSoon && <p className="text-[10px] text-red-500 mt-1">{errors.goAbroadSoon}</p>}
              {goAbroadSoon === 'Other' && (
                <input
                  type="text"
                  className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full placeholder:text-[#a3a3b3] focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base mt-2"
                  value={goAbroadSoonOther}
                  onChange={e => setGoAbroadSoonOther(e.target.value)}
                  placeholder="Please specify"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Have you ever applied for a VISA abroad? *</label>
              <select
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={appliedVisa}
                onChange={e => setAppliedVisa(e.target.value)}
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              {errors.appliedVisa && <p className="text-[10px] text-red-500 mt-1">{errors.appliedVisa}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Would you like to live with a relative?</label>
              <select
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={liveWithRelative}
                onChange={e => setLiveWithRelative(e.target.value)}
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated monthly budget for living abroad? *</label>
              <input
                type="number"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full placeholder:text-[#a3a3b3] focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={monthlyBudget}
                onChange={e => setMonthlyBudget(e.target.value)}
                placeholder="Enter monthly budget"
              />
              {errors.monthlyBudget && <p className="text-[10px] text-red-500 mt-1">{errors.monthlyBudget}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Would you like to live in shared accommodation?</label>
              <select
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={sharedAccommodation}
                onChange={e => setSharedAccommodation(e.target.value)}
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">How did you hear about Elite Scholars?</label>
              <input
                type="text"
                className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 py-3 w-full placeholder:text-[#a3a3b3] focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] text-base"
                value={heardAbout}
                onChange={e => setHeardAbout(e.target.value)}
                placeholder="How did you hear about us?"
              />
            </div>
          </div>
        </div>
            </>
          )}

          {/* Step 6: Document Upload & Declaration */}
          {currentStep === 6 && (
            <>
              {/* Document Upload Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#1a0841] mb-4">Document Upload</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Most recent diploma', field: 'diplomaFile', state: diplomaFile },
              { label: 'Transcripts (if available)', field: 'transcriptFile', state: transcriptFile },
              { label: 'Copy of passport (identity page)', field: 'passportFile', state: passportFile },
              { label: 'Proof of enrollment or school certificates', field: 'enrollmentFile', state: enrollmentFile },
              { label: 'Any other useful documents', field: 'otherDocsFile', state: otherDocsFile }
            ].map(({ label, field, state }) => (
              <div key={field} className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col items-center justify-center text-center space-y-2 hover:bg-white hover:border-purple-200 transition-all cursor-pointer relative">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={e => handleFileUpload(field, e.target.files[0])}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                {state ? (
                  <>
                    <CheckCircle2 className="text-green-500 w-8 h-8" />
                    <span className="text-xs font-semibold text-gray-700">File Uploaded</span>
                    <span className="text-[10px] text-green-600">✓ Ready</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="text-gray-400 w-8 h-8" />
                    <span className="text-sm font-semibold text-[#1a0841]">Upload {label}</span>
                    <span className="text-[10px] text-gray-500">PDF/JPEG (Max 5MB)</span>
                  </>
                )}
                {errors[field] && <p className="text-[10px] text-red-500">{errors[field]}</p>}
              </div>
            ))}
          </div>
          {uploading && <div className="text-xs text-purple-600 mt-4">Uploading files...</div>}
        </div>

        {/* Declaration */}
        <div className="mb-8">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-gray-700 mb-4">
            I hereby declare on my honor that the information provided in this form is accurate, and I am aware that any false declaration may result in the cancellation of admission or a refusal of admission. The company reserves the right to verify all documents attached to my application.
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={declaration}
              onChange={e => setDeclaration(e.target.checked)}
            />
            <span className="text-xs text-gray-700">I accept the declaration *</span>
          </label>
          {errors.declaration && <p className="text-[10px] text-red-500 mt-1">{errors.declaration}</p>}
        </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={isFirstStep}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            
            {isLastStep ? (
              <button
                type="submit"
                disabled={uploading || !declaration}
                className="px-10 py-3 bg-[#1a0841] text-white font-bold rounded-full hover:bg-[#6c47ff] shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Submitting...' : 'Submit Application'} <ArrowRight className="w-4 h-4 ml-2 inline" />
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className="px-6 py-3 bg-[#6c47ff] text-white font-semibold rounded-lg hover:bg-[#5a3fd4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
            {stepError && (
              <div className="text-red-600 mt-2 text-center text-sm">{stepError}</div>
            )}
          </div>

          {errors.submit && (
            <div className="text-red-600 mt-4 text-center">{errors.submit}</div>
          )}
          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-green-800 font-semibold">Application Submitted Successfully!</h4>
                  <p className="text-green-700 text-sm mt-1">
                    Your application has been saved. AI analysis is running in the background and will be available shortly in your reports.
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default NewApplicationForm;
