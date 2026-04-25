import { supabase } from '../supabaseClient';
import { getPDFFileName } from '../pages/ReportPDF';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value.trim());
}


// Upload and save PDF report (accepts a PDF blob)
async function uploadAndSavePDF(report, userId, pdfBlob) {
  try {
    const fileName = getPDFFileName(report);
    const { error: uploadError } = await supabase.storage
      .from('user_analysis_report')
      .upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: true });
    if (uploadError) return null;
    const { data: urlData, error: urlError } = supabase.storage
      .from('user_analysis_report')
      .getPublicUrl(fileName);
    if (urlError || !urlData?.publicUrl) return null;
    const userReportsPayload = {
      user_id: userId,
      file_name: fileName,
      url: urlData.publicUrl,
      created_at: new Date().toISOString()
    };
    const { error: insertError } = await supabase.from('user_reports').insert(userReportsPayload);
    if (insertError) return null;
    return urlData.publicUrl;
  } catch {
    return null;
  }
}

// Main onboarding pipeline

export async function processApplicationFromMetadata(user, pdfBlob, fromForm = false) {
  try {
    console.log('🟢 [onboarding] processApplicationFromMetadata called with user:', user);
    const applicationData = user.user_metadata?.application_data;
    if (!applicationData) {
      console.log('🟡 [onboarding] No application data found in user metadata');
      return { error: 'No application data found' };
    }
    // Ensure both 'country' and 'target_countries' are set for downstream consumers
    // Always set both 'country' and 'target_countries' as arrays for frontend compatibility
    let countryVal = applicationData.country || applicationData.target_countries || [];
    if (typeof countryVal === 'string') countryVal = [countryVal];
    if (!Array.isArray(countryVal)) countryVal = [];
    const payload = {
      user_id: user.id,
      country: countryVal,
      target_countries: countryVal,
      language: applicationData.language,
      education: applicationData.degreeLevel,
      gpa: applicationData.gpa,
      languageTestScore: applicationData.languageScore,
      budget: applicationData.budget,
      documents: applicationData.documents,
      schoolingCountry: applicationData.schoolingCountry,
      bachelorCountry: applicationData.bachelorCountry,
      masterCountry: applicationData.masterCountry
    };
    console.log('🟢 [onboarding] analyze-application payload:', payload);
    const response = await fetch('https://elite-scholars-eight.vercel.app/api/analyze-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      console.error('❌ [onboarding] analyze-application error:', result);
      return { error: result.error || 'Analysis failed' };
    }
    // Store the report data in the user's profile
    console.log('🟢 [onboarding] About to upsert user_roles for user:', user.id);
    const userRolesPayload = {
      user_id: user.id,
      name: user.user_metadata?.name,
      email: user.email,
      role: user.user_metadata?.role || 'student',
      target_countries: applicationData.country,
      languages: applicationData.language,
      degree_level: applicationData.degreeLevel,
      gpa: applicationData.gpa,
      language_score: applicationData.languageScore,
      budget: applicationData.budget,
      schooling_country: applicationData.schoolingCountry,
      bachelor_country: applicationData.bachelorCountry,
      master_country: applicationData.masterCountry,
      application_report: {
        summary: result.summary,
        eligible: result.eligible,
        ineligible: result.ineligible,
        profileAnalysis: result.profileAnalysis,
        visaReadiness: result.visaReadiness,
        idealCategoryFit: result.idealCategoryFit,
        form: payload,
        generated_at: new Date().toISOString()
      },
      documents: applicationData.documents
    };
    console.log('🟢 [onboarding] user_roles payload:', userRolesPayload);
    const { data: upsertData, error: updateError } = await supabase
      .from('user_roles')
      .upsert(userRolesPayload)
      .select();
    console.log('🟢 [onboarding] user_roles upsert result:', { upsertData, updateError });
    if (updateError) {
      console.error('❌ [onboarding] Failed to upsert user_roles:', updateError);
      return { error: updateError.message || 'Failed to store application report' };
    }
    console.log('✅ [onboarding] Successfully upserted user_roles');
    // Verify the data was actually stored
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_roles')
      .select('user_id, name, email')
      .eq('user_id', user.id)
      .single();
    console.log('🟢 [onboarding] Verification query result:', { verifyData, verifyError });
    // Upload and save PDF (pdfBlob must be provided)
    const pdfResult = await uploadAndSavePDF({
      summary: result.summary,
      eligible: result.eligible,
      ineligible: result.ineligible,
      profileAnalysis: result.profileAnalysis,
      visaReadiness: result.visaReadiness,
      idealCategoryFit: result.idealCategoryFit,
      form: payload,
      generated_at: new Date().toISOString()
    }, user.id, pdfBlob);
    if (!pdfResult) {
      console.error('❌ [onboarding] Failed to upload and save PDF report');
      return { error: 'Failed to upload and save PDF report' };
    }
    // Create application tracker steps for the user
    try {
      const { data: existingTracker, error: trackerFetchError } = await supabase
        .from('application_tracker')
        .select('user_id')
        .eq('user_id', user.id);
      if (trackerFetchError) {
        console.error('❌ [onboarding] Error checking for existing tracker:', trackerFetchError);
      }
      if (!existingTracker || existingTracker.length === 0) {
        // Prepare payload as required by backend
        let targetCountries = [];
        if (Array.isArray(applicationData.country)) {
          targetCountries = applicationData.country;
        } else if (Array.isArray(applicationData.target_countries)) {
          targetCountries = applicationData.target_countries;
        } else if (applicationData.country) {
          targetCountries = [applicationData.country];
        } else if (applicationData.target_countries) {
          targetCountries = [applicationData.target_countries];
        }
        const trackerPayload = {
          user_id: user.id,
          target_countries: targetCountries,
          documents: applicationData.documents || {},
          email: user.email,
          name: user.user_metadata?.name || '',
        };
        if (!isValidUuid(trackerPayload.user_id)) {
          console.error('❌ [onboarding] Cannot create tracker: invalid user_id', trackerPayload.user_id);
          return { error: 'Cannot create tracker: valid user_id is required' };
        }
        console.log('🟢 [onboarding] Sending trackerPayload:', trackerPayload);
        const trackerResponse = await fetch('https://elite-scholars-eight.vercel.app/api/create-user-tracker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trackerPayload)
        });
        const trackerResult = await trackerResponse.json();
        console.log('🟢 [onboarding] Tracker API response:', trackerResponse.status, trackerResult);
        if (!trackerResponse.ok) {
          console.error('❌ [onboarding] Failed to create application tracker:', trackerResult);
          return { error: trackerResult.error || 'Failed to create application tracker' };
        }
      }
    } catch (trackerError) {
      console.error('❌ [onboarding] Exception creating tracker:', trackerError);
      return { error: trackerError.message || 'Failed to create application tracker' };
    }
    // Do not clear application_data here; let caller handle it
    return { success: true };
  } catch (err) {
    console.error('❌ [onboarding] Exception in onboarding pipeline:', err);
    return { error: err.message || 'Unknown onboarding error' };
  }
}
