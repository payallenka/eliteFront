import React, { useState } from "react";
// import { useNavigate } from "react-router-dom"; // Uncomment if routing is needed
// import { supabase } from "../supabaseClient"; // Uncomment if submitting to Supabase

const initialState = {
  email: "",
  lastName: "",
  firstName: "",
  fullAddress: "",
  countryOfResidence: "",
  currentCity: "",
  gender: "",
  phoneNumber: "",
  country: "",
  nationality: "",
  dob: "",
  profession: "",
  lastDiploma: "",
  languageRefresher: "",
  hasOffer: "",
  financePlan: [],
  financePlanOther: "",
  projectStart: [],
  projectStartOther: "",
  goAbroadSoon: "",
  appliedVisa: "",
  liveWithRelative: "",
  monthlyBudget: "",
  sharedAccommodation: "",
  hearAbout: "",
  documents: {},
  declaration: false
};

const COUNTRIES = ["USA", "FR", "UK", "CANADA", "Other"];
const FINANCE_OPTIONS = [
  "Self-funded",
  "Parental support",
  "Sponsor/Guarantor",
  "Other (please specify)"
];
const PROJECT_START_OPTIONS = [
  "January",
  "June",
  "August",
  "December",
  "Other"
];
const GO_ABROAD_OPTIONS = [
  "3 months",
  "6 months",
  "1 year",
  "Other"
];

function SpecialForm() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper to update form state
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Helper for multi-select (checkbox group)
  const handleMultiSelect = (name, value) => {
    setForm((prev) => {
      const arr = prev[name] || [];
      return {
        ...prev,
        [name]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value]
      };
    });
  };

  // File upload handler
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setForm((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [name]: files[0]
      }
    }));
  };

  // Validation logic
  const validate = () => {
    const required = [
      "email",
      "lastName",
      "firstName",
      "fullAddress",
      "countryOfResidence",
      "currentCity",
      "gender",
      "country",
      "nationality",
      "dob",
      "hasOffer",
      "financePlan",
      "goAbroadSoon",
      "appliedVisa",
      "monthlyBudget",
      "declaration"
    ];
    const newErrors = {};
    required.forEach((field) => {
      if (!form[field] || (Array.isArray(form[field]) && form[field].length === 0)) {
        newErrors[field] = "Required";
      }
    });
    if (!form.declaration) newErrors.declaration = "You must accept the declaration.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess("");
    if (!validate()) return;
    setLoading(true);
    // TODO: Submit to backend
    setTimeout(() => {
      setLoading(false);
      setSuccess("Form submitted successfully!");
      setForm(initialState);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center">Special Form</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block font-medium">Email *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
          </div>
          {/* Last Name */}
          <div>
            <label className="block font-medium">Last Name *</label>
            <input type="text" name="lastName" value={form.lastName} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            {errors.lastName && <span className="text-red-500 text-xs">{errors.lastName}</span>}
          </div>
          {/* First Name */}
          <div>
            <label className="block font-medium">First Name *</label>
            <input type="text" name="firstName" value={form.firstName} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            {errors.firstName && <span className="text-red-500 text-xs">{errors.firstName}</span>}
          </div>
          {/* Full Address */}
          <div>
            <label className="block font-medium">Full Address *</label>
            <input type="text" name="fullAddress" value={form.fullAddress} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            {errors.fullAddress && <span className="text-red-500 text-xs">{errors.fullAddress}</span>}
          </div>
          {/* Country of Residence */}
          <div>
            <label className="block font-medium">Country of Residence *</label>
            <input type="text" name="countryOfResidence" value={form.countryOfResidence} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            {errors.countryOfResidence && <span className="text-red-500 text-xs">{errors.countryOfResidence}</span>}
          </div>
          {/* Current City */}
          <div>
            <label className="block font-medium">Current City *</label>
            <input type="text" name="currentCity" value={form.currentCity} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            {errors.currentCity && <span className="text-red-500 text-xs">{errors.currentCity}</span>}
          </div>
          {/* Gender */}
          <div>
            <label className="block font-medium">Gender *</label>
            <select name="gender" value={form.gender} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && <span className="text-red-500 text-xs">{errors.gender}</span>}
          </div>
          {/* Phone Number (optional) */}
          <div>
            <label className="block font-medium">Phone Number</label>
            <input type="text" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          {/* Country (dropdown) */}
          <div>
            <label className="block font-medium">Country *</label>
            <select name="country" value={form.country} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
              <option value="">Select</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.country && <span className="text-red-500 text-xs">{errors.country}</span>}
          </div>
          {/* Nationality */}
          <div>
            <label className="block font-medium">Nationality *</label>
            <input type="text" name="nationality" value={form.nationality} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            {errors.nationality && <span className="text-red-500 text-xs">{errors.nationality}</span>}
          </div>
          {/* DOB */}
          <div>
            <label className="block font-medium">Date of Birth *</label>
            <input type="date" name="dob" value={form.dob} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            {errors.dob && <span className="text-red-500 text-xs">{errors.dob}</span>}
          </div>
          {/* Profession (optional) */}
          <div>
            <label className="block font-medium">Profession</label>
            <input type="text" name="profession" value={form.profession} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          {/* Last diploma obtained (optional) */}
          <div>
            <label className="block font-medium">Last Diploma Obtained</label>
            <input type="text" name="lastDiploma" value={form.lastDiploma} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          {/* Language refresher (optional) */}
          <div>
            <label className="block font-medium">Would you like to take a language refresher course before starting your project?</label>
            <select name="languageRefresher" value={form.languageRefresher} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          {/* Already have offer/admission letter? */}
          <div>
            <label className="block font-medium">Do you already have an offer/admission letter? *</label>
            <select name="hasOffer" value={form.hasOffer} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            {errors.hasOffer && <span className="text-red-500 text-xs">{errors.hasOffer}</span>}
          </div>
          {/* Finance plan (multi-select) */}
          <div>
            <label className="block font-medium">How do you plan to finance your stay abroad? *</label>
            <div className="flex flex-col gap-1">
              {FINANCE_OPTIONS.map((opt) => (
                <label key={opt} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.financePlan.includes(opt)}
                    onChange={() => handleMultiSelect("financePlan", opt)}
                  />
                  {opt}
                </label>
              ))}
              {form.financePlan.includes("Other (please specify)") && (
                <input
                  type="text"
                  name="financePlanOther"
                  value={form.financePlanOther}
                  onChange={handleChange}
                  placeholder="Please specify"
                  className="border rounded px-2 py-1 mt-1"
                />
              )}
            </div>
            {errors.financePlan && <span className="text-red-500 text-xs">{errors.financePlan}</span>}
          </div>
          {/* Project start (multi-select) */}
          <div>
            <label className="block font-medium">When would you like to start your project abroad?</label>
            <div className="flex flex-col gap-1">
              {PROJECT_START_OPTIONS.map((opt) => (
                <label key={opt} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.projectStart.includes(opt)}
                    onChange={() => handleMultiSelect("projectStart", opt)}
                  />
                  {opt}
                </label>
              ))}
              {form.projectStart.includes("Other") && (
                <input
                  type="text"
                  name="projectStartOther"
                  value={form.projectStartOther}
                  onChange={handleChange}
                  placeholder="Please specify"
                  className="border rounded px-2 py-1 mt-1"
                />
              )}
            </div>
          </div>
          {/* How soon to go abroad? */}
          <div>
            <label className="block font-medium">How soon would you like to go abroad? *</label>
            <select name="goAbroadSoon" value={form.goAbroadSoon} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
              <option value="">Select</option>
              {GO_ABROAD_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.goAbroadSoon && <span className="text-red-500 text-xs">{errors.goAbroadSoon}</span>}
          </div>
          {/* Applied for VISA? */}
          <div>
            <label className="block font-medium">Have you ever applied for a VISA abroad? *</label>
            <select name="appliedVisa" value={form.appliedVisa} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            {errors.appliedVisa && <span className="text-red-500 text-xs">{errors.appliedVisa}</span>}
          </div>
          {/* Live with relative? (optional) */}
          <div>
            <label className="block font-medium">Would you like to live with a relative?</label>
            <select name="liveWithRelative" value={form.liveWithRelative} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          {/* Monthly budget */}
          <div>
            <label className="block font-medium">Estimated monthly budget for living abroad? *</label>
            <input type="number" name="monthlyBudget" value={form.monthlyBudget} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
            {errors.monthlyBudget && <span className="text-red-500 text-xs">{errors.monthlyBudget}</span>}
          </div>
          {/* Shared accommodation? (optional) */}
          <div>
            <label className="block font-medium">Would you like to live in shared accommodation?</label>
            <select name="sharedAccommodation" value={form.sharedAccommodation} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          {/* How did you hear about Elite Scholars? (optional) */}
          <div>
            <label className="block font-medium">How did you hear about Elite Scholars?</label>
            <input type="text" name="hearAbout" value={form.hearAbout} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          {/* Document uploads */}
          <div>
            <label className="block font-medium">Upload Documents</label>
            <div className="flex flex-col gap-2">
              <label>Most recent diploma obtained (PDF or photo):
                <input type="file" name="diploma" accept=".pdf,image/*" onChange={handleFileChange} className="block mt-1" />
              </label>
              <label>Transcripts (if available):
                <input type="file" name="transcripts" accept=".pdf,image/*" onChange={handleFileChange} className="block mt-1" />
              </label>
              <label>Copy of passport (identity page):
                <input type="file" name="passport" accept=".pdf,image/*" onChange={handleFileChange} className="block mt-1" />
              </label>
              <label>Proof of enrollment or school certificates (for students still enrolled):
                <input type="file" name="enrollment" accept=".pdf,image/*" onChange={handleFileChange} className="block mt-1" />
              </label>
              <label>Any other useful documents:
                <input type="file" name="other" accept=".pdf,image/*" onChange={handleFileChange} className="block mt-1" />
              </label>
            </div>
          </div>
          {/* Declaration */}
          <div className="flex items-start gap-2">
            <input type="checkbox" name="declaration" checked={form.declaration} onChange={handleChange} required />
            <span className="text-xs">
              I hereby declare on my honor that the information provided in this form is accurate, and I am aware that any false declaration may result in the cancellation of admission or a refusal of admission. The company reserves the right to verify all documents attached to my application.
            </span>
            {errors.declaration && <span className="text-red-500 text-xs">{errors.declaration}</span>}
          </div>
          {/* Submit */}
          <button type="submit" className="w-full bg-[#6c47ff] text-white font-semibold py-2 rounded-lg hover:bg-[#4b2bbd] transition" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
          {success && <div className="text-green-600 text-center mt-2">{success}</div>}
        </form>
      </div>
    </div>
  );
}

export default SpecialForm;
