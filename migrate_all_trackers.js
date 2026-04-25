// Script to migrate all existing trackers to include steps for all supported countries
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Import the same step generation logic as backend
const ALL_SUPPORTED_COUNTRIES = ['USA', 'Canada', 'UK', 'France', 'Other'];

// Copy-paste the COUNTRY_COMPLETE_STEPS_API and generateAllStepsAPI from backend
const COUNTRY_COMPLETE_STEPS_API = {
  USA: [
    { step_id: 'usa-1', step_label: 'Profile Created (USA)', status: 'done', manual: false, notes: 'Profile successfully created' },
    { step_id: 'usa-2', step_label: 'Documents Received (USA)', status: 'done', manual: false, notes: 'All documents uploaded and verified' },
    { step_id: 'usa-3', step_label: 'Eligibility & AI Analysis (USA)', status: 'in-progress', manual: true, notes: 'Analysis in progress' },
    { step_id: 'usa-4', step_label: 'University Selection (USA)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'usa-5', step_label: 'Application Submitted (USA)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'usa-6', step_label: 'Offer Letter / Decision (USA)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'usa-7', step_label: 'I-20 Issued by School (USA)', status: 'not-started', manual: false, notes: '' },
    { step_id: 'usa-8', step_label: 'Scholarship / Financial Prep (USA)', status: 'not-started', manual: false, notes: '' },
    { step_id: 'usa-9', step_label: 'Visa Process Started (USA)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'usa-10', step_label: 'SEVIS Fee Payment (USA)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'usa-11', step_label: 'Visa Interview Scheduled (USA)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'usa-12', step_label: 'Visa Approved / Ready to Travel (USA)', status: 'not-started', manual: true, notes: '' }
  ],
  Canada: [
    { step_id: 'ca-1', step_label: 'Profile Created (Canada)', status: 'done', manual: false, notes: 'Profile successfully created' },
    { step_id: 'ca-2', step_label: 'Documents Received (Canada)', status: 'done', manual: false, notes: 'All documents uploaded and verified' },
    { step_id: 'ca-3', step_label: 'Eligibility & AI Analysis (Canada)', status: 'in-progress', manual: true, notes: 'Analysis in progress' },
    { step_id: 'ca-4', step_label: 'University Selection (Canada)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'ca-5', step_label: 'Application Submitted (Canada)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'ca-6', step_label: 'Offer Letter / Decision (Canada)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'ca-7', step_label: 'LOA (Letter of Acceptance) (Canada)', status: 'not-started', manual: false, notes: '' },
    { step_id: 'ca-8', step_label: 'Scholarship / Financial Prep (Canada)', status: 'not-started', manual: false, notes: '' },
    { step_id: 'ca-9', step_label: 'Visa Process Started (Canada)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'ca-10', step_label: 'GIC Account / Proof of Funds Submitted (Canada)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'ca-11', step_label: 'Biometrics / Medical Exam Completed (Canada)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'ca-12', step_label: 'Visa Approved / Ready to Travel (Canada)', status: 'not-started', manual: true, notes: '' }
  ],
  UK: [
    { step_id: 'uk-1', step_label: 'Profile Created (UK)', status: 'done', manual: false, notes: 'Profile successfully created' },
    { step_id: 'uk-2', step_label: 'Documents Received (UK)', status: 'done', manual: false, notes: 'All documents uploaded and verified' },
    { step_id: 'uk-3', step_label: 'Eligibility & AI Analysis (UK)', status: 'in-progress', manual: true, notes: 'Analysis in progress' },
    { step_id: 'uk-4', step_label: 'University Selection (UK)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'uk-5', step_label: 'Application Submitted (UK)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'uk-6', step_label: 'Offer Letter / Decision (UK)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'uk-7', step_label: 'CAS Issued (UK)', status: 'not-started', manual: false, notes: '' },
    { step_id: 'uk-8', step_label: 'Scholarship / Financial Prep (UK)', status: 'not-started', manual: false, notes: '' },
    { step_id: 'uk-9', step_label: 'Visa Process Started (UK)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'uk-10', step_label: 'Visa Application Submitted (UK)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'uk-11', step_label: 'Visa Approved / Ready to Travel (UK)', status: 'not-started', manual: true, notes: '' }
  ],
  France: [
    { step_id: 'fr-1', step_label: 'Profile Created (France)', status: 'done', manual: false, notes: 'Profile successfully created' },
    { step_id: 'fr-2', step_label: 'Documents Received (France)', status: 'done', manual: false, notes: 'All documents uploaded and verified' },
    { step_id: 'fr-3', step_label: 'Eligibility & AI Analysis (France)', status: 'in-progress', manual: true, notes: 'Analysis in progress' },
    { step_id: 'fr-4', step_label: 'University Selection (France)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'fr-5', step_label: 'Application Submitted (France)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'fr-6', step_label: 'Campus France Application Submitted (France)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'fr-7', step_label: 'Offer Letter / Decision (France)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'fr-8', step_label: 'Scholarship / Financial Prep (France)', status: 'not-started', manual: false, notes: '' },
    { step_id: 'fr-9', step_label: 'Visa Process Started (France)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'fr-10', step_label: 'Campus France Interview Completed (France)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'fr-11', step_label: 'Visa Appointment Scheduled (France)', status: 'not-started', manual: true, notes: '' },
    { step_id: 'fr-12', step_label: 'Visa Approved / Ready to Travel (France)', status: 'not-started', manual: true, notes: '' }
  ]
};

function generateAllStepsAPI(targetCountries) {
  let allSteps = [];
  if (targetCountries && targetCountries.length > 0) {
    targetCountries.forEach(country => {
      if (COUNTRY_COMPLETE_STEPS_API[country]) {
        const countrySteps = COUNTRY_COMPLETE_STEPS_API[country].map(step => ({ ...step }));
        allSteps.push(...countrySteps);
      }
    });
  }
  return allSteps;
}

async function migrateAllTrackers() {
  const { data: trackers, error } = await supabase
    .from('application_tracker')
    .select('user_id');
  if (error) {
    console.error('Error fetching trackers:', error);
    return;
  }
  for (const tracker of trackers) {
    const allSteps = generateAllStepsAPI(ALL_SUPPORTED_COUNTRIES);
    const { error: updateError } = await supabase
      .from('application_tracker')
      .update({ steps: allSteps, last_updated: new Date().toISOString() })
      .eq('user_id', tracker.user_id);
    if (updateError) {
      console.error(`Failed to update tracker for user ${tracker.user_id}:`, updateError);
    } else {
      console.log(`Migrated tracker for user ${tracker.user_id}`);
    }
  }
  console.log('Migration complete!');
}

migrateAllTrackers();
