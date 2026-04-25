import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  CreditCard, 
  User, 
  FileText, 
  Upload, 
  MapPin, 
  Phone,
  ShieldCheck,
  Star,
  Zap,
  ArrowRight,
  Info
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const plans = [
  {
    key: 'standard',
    name: 'Standard',
    tagline: 'Get Started with Basics',
    priceLabel: 'Free',
    features: ['Basic Profile', 'Generic Resources', 'Email Support', '1 Country Access'],
    badge: null,
    color: 'bg-blue-500'
  },
  {
    key: 'premium',
    name: 'Premium',
    tagline: 'Most Popular Choice',
    priceLabel: '$49/mo',
    features: ['Personal Advisor', 'Full Resource Library', 'Priority Support', 'Unlimited Countries', 'Document Review'],
    badge: 'Popular',
    color: 'bg-[#6c47ff]'
  },
  {
    key: 'apex',
    name: 'Apex Elite',
    tagline: 'Concierge Experience',
    priceLabel: 'Custom',
    features: ['Dedicated Specialist', 'Visa Concierge', 'Scholarship Assistance', 'Interview Coaching', '24/7 Priority'],
    badge: 'Premium',
    color: 'bg-amber-500'
  }
];

const UpgradePlanForm = () => {
  const [carouselIndex, setCarouselIndex] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
    selectedPlan: '', // Do not preselect a plan
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    transcripts: null,
    passport: null,
    financialDocs: null
  });

  const [errors, setErrors] = useState({});

  const steps = [
    { id: 0, title: 'Details', icon: User },
    { id: 1, title: 'Payment', icon: CreditCard },
    { id: 2, title: 'Documents', icon: FileText },
    { id: 3, title: 'Choose Plan', icon: Star },
    { id: 4, title: 'Finished', icon: ShieldCheck }
  ];

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.fullName) newErrors.fullName = 'Full name is required';
      if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    }
    // Payment validation skipped for now
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    console.log('Next button clicked, currentStep:', currentStep);
    if (validateStep(currentStep)) {
      setCurrentStep(prev => {
        console.log('Advancing to step:', prev + 1);
        return prev + 1;
      });
    } else {
      console.log('Validation failed for step:', currentStep, errors);
    }
  };

  // Submit the form when a plan is chosen
  const handlePlanSubmit = async (planKey) => {
    setFormData(prev => ({ ...prev, selectedPlan: planKey }));
    console.log('Plan selected:', planKey);
    // Only submit when a plan is chosen, not before
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Supabase user:', user);
      if (user) {
        const updateRes = await supabase
          .from('user_roles')
          .update({ 
            upgrade_form_submitted: true,
            plan_type: planKey,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        console.log('Upgrade form DB update result:', updateRes);
      }
    } catch (error) {
      console.error('Error marking upgrade form as submitted:', error);
    }
    setCurrentStep(steps.length - 1); // Go to finished step
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleFileUpload = async (field, file) => {
    try {
      console.log('Uploading file:', file, 'for field:', field);
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Supabase user:', user);
      if (!user || !file) {
        console.log('No user or file, aborting upload.');
        return;
      }
      const userId = user.id;
      const filePath = `${userId}/upgrade-forms/${file.name}`;
      console.log('Uploading to path:', filePath);
      const uploadRes = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      console.log('Upload result:', uploadRes);
      if (uploadRes.error) {
        alert(`Upload failed: ${uploadRes.error.message}`);
      } else {
        setFormData(prev => ({ ...prev, [field]: file }));
        alert('File uploaded successfully!');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload error: ' + err.message);
    }
  };

  // Content Renderers
  const renderPlanGrid = () => (
    <div className="py-4 sm:py-6">
      <div className="flex flex-col gap-4 w-full lg:flex-row lg:gap-6 lg:justify-center px-0 sm:px-4">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className="w-full lg:w-[280px] xl:w-[320px] lg:flex-shrink-0"
          >
            <div className="bg-white rounded-2xl lg:rounded-3xl p-4 sm:p-6 shadow-xl border-2 transition-colors duration-300 h-full flex flex-col relative border-gray-100 hover:border-gray-200">
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#6c47ff] to-[#a084ff] text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-lg">
                  {plan.badge}
                </div>
              )}
              <div className="text-center mb-4 sm:mb-6 mt-2">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{plan.tagline}</p>
                <div className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-black text-[#6c47ff]">{plan.priceLabel}</div>
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start text-xs sm:text-sm text-gray-600">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePlanSubmit(plan.key)}
                className="w-full py-2.5 sm:py-3 rounded-2xl font-bold transition-all text-sm sm:text-base bg-[#6c47ff] text-white shadow-lg shadow-indigo-200 hover:bg-[#5a3ecc]"
              >
                {plan.key === 'apex' ? 'Contact Us' : 'Choose Plan'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFormContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-900">Personal Details</h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="relative">
                <label className="text-xs font-semibold uppercase text-gray-400 mb-1 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="John Doe"
                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-[#6c47ff]/20 transition-all ${errors.fullName ? 'border-red-400' : 'border-gray-200'}`}
                  />
                </div>
              </div>
              <div className="relative">
                <label className="text-xs font-semibold uppercase text-gray-400 mb-1 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="+1 234 567 890"
                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-[#6c47ff]/20 transition-all ${errors.phoneNumber ? 'border-red-400' : 'border-gray-200'}`}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-gray-400 mb-1 block">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your current address"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6c47ff]/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
            <div className="p-4 bg-indigo-50 rounded-2xl flex items-start gap-3 border border-indigo-100">
              <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-sm text-indigo-700">You are upgrading to the <strong>{plans.find(p => p.key === formData.selectedPlan)?.name}</strong> plan.</p>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs font-semibold uppercase text-gray-400 mb-1 block">Card Number</label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-[#6c47ff]/20 transition-all ${errors.cardNumber ? 'border-red-400' : 'border-gray-200'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-gray-400 mb-1 block">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-[#6c47ff]/20 transition-all ${errors.expiryDate ? 'border-red-400' : 'border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-gray-400 mb-1 block">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={formData.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-[#6c47ff]/20 transition-all ${errors.cvv ? 'border-red-400' : 'border-gray-200'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
            <div className="space-y-3">
              {[
                { label: 'Academic Transcripts', field: 'transcripts' },
                { label: 'Passport Copy', field: 'passport' }
              ].map((doc) => (
                <div key={doc.field} className="group relative p-4 border-2 border-dashed border-gray-200 rounded-2xl hover:border-[#6c47ff] hover:bg-indigo-50/50 transition-all cursor-pointer text-center">
                  <Upload className="w-6 h-6 mx-auto text-gray-400 group-hover:text-[#6c47ff] mb-2" />
                  <p className="text-sm font-medium text-gray-700">{doc.label}</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG up to 10MB</p>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={e => handleFileUpload(doc.field, e.target.files[0])} />
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
            <p className="text-gray-500 mb-4">Select a plan to complete your upgrade</p>
            {renderPlanGrid()}
          </div>
        );
      case 4:
        return (
          <div className="text-center py-8 animate-in zoom-in-95 duration-700">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">You're All Set!</h2>
            <p className="text-gray-500 max-w-xs mx-auto mb-8">
              Your upgrade to {plans.find(p => p.key === formData.selectedPlan)?.name} is successful. Let's get to work!
            </p>
            <button 
              onClick={() => {
                window.location.href = '/profile';
              }}
              className="px-8 py-3 bg-[#6c47ff] text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:scale-105 transition-transform"
            >
              Go to Dashboard
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col font-sans">
      {/* Top Progress Bar */}
      <div className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="w-full px-2 sm:px-6 h-16 flex items-center justify-between overflow-x-auto max-w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#6c47ff] rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 hidden sm:inline">Upgrade Hub</span>
          </div>
          <div className="flex items-center gap-4 min-w-max">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                    idx <= currentStep ? 'bg-[#6c47ff] text-white shadow-md' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <step.icon className="w-4 h-4" />
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-4 h-[2px] ml-4 ${idx < currentStep ? 'bg-[#6c47ff]' : 'bg-gray-100'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center p-2 sm:p-6 pb-20 sm:pb-6 overflow-y-auto max-h-[calc(100vh-4rem)] sm:max-h-none">
        <div className="w-full">
          <div className="bg-white w-full rounded-lg sm:rounded-2xl md:rounded-[2rem] shadow-2xl shadow-indigo-100/50 overflow-hidden flex flex-col md:flex-row mx-2 sm:mx-4 md:mx-auto md:max-w-3xl">
            {/* Sidebar Info */}
            <div className="w-full md:w-1/3 bg-[#1a0841] p-4 sm:p-6 md:p-8 text-white flex flex-col justify-between">
              <div>
                <h3 className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">Active Step</h3>
                <p className="text-xl font-bold mb-4">{steps[currentStep].title}</p>
                <p className="text-sm text-indigo-100/70 leading-relaxed">
                  We're setting up your new experience. This information helps us personalize your advisor matching.
                </p>
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/10">
                <p className="text-xs text-indigo-100/50 mb-4 italic">"Your future is worth the investment."</p>
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-[#1a0841] flex items-center justify-center overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="User" />
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full bg-[#6c47ff] border-2 border-[#1a0841] flex items-center justify-center text-[8px] font-bold">
                    +1k
                  </div>
                </div>
              </div>
            </div>

            {/* Form Area */}
            <div className="flex-1 p-4 sm:p-6 md:p-12">
              {renderFormContent()}

              {currentStep < 3 && (
                <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-100">
                  <button
                    onClick={handlePrevious}
                    className="flex items-center gap-2 text-gray-400 font-semibold hover:text-[#6c47ff] transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="group bg-[#6c47ff] hover:bg-[#5a3ecc] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all hover:scale-105"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-8 text-center text-gray-400 text-sm">
        &copy; 2024 StudyPortal. All Rights Reserved. Secure & Encrypted Payment.
      </footer>
    </div>
  );
};

export default UpgradePlanForm;
