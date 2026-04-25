// Script to load and parse all CSV files in 'training data' folder
const fs = require('fs');
const path = require('path');
const csvParse = require('csv-parse/sync');

const TRAINING_DATA_DIR = path.join(__dirname, '../training data');

function getCsvFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.csv'));
}

function parseCsvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return csvParse.parse(content, { columns: true, skip_empty_lines: true });
}

function loadAllCsvs() {
  const csvFiles = getCsvFiles(TRAINING_DATA_DIR);
  const allData = {};
  for (const file of csvFiles) {
    const filePath = path.join(TRAINING_DATA_DIR, file);
    try {
      const rows = parseCsvFile(filePath);
      allData[file] = rows;
      console.log(`Loaded ${rows.length} rows from ${file}`);
    } catch (err) {
      console.error(`Error parsing ${file}:`, err);
    }
  }
  return allData;
}

function parseWeights(weightRows) {
  // Returns { factor: weight } for scoring
  const weights = {};
  for (const row of weightRows) {
    const factor = row.Factor.replace(/\"|\'/g, '').trim();
    const weight = parseFloat(row.Weight.replace('%', '')) || 0;
    weights[factor] = weight;
  }
  return weights;
}

// Helper function to clean strings for consistent matching
function cleanStr(str) {
  return (str || '')
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[^\w\s\/]/g, '')
    .toLowerCase()
    .trim();
}

// Enhanced function to analyze user profile against university requirements
function analyzeProfile(userProfile, allCsvData) {
  const universities = allCsvData['universities_600.csv'] || [];
  const criteriaRows = allCsvData['acceptance criteria , eligibility criteria.csv'] || [];
  
  // Filter universities by selected country
  const selectedCountries = Array.isArray(userProfile.Country) ? userProfile.Country : [userProfile.Country];
  const relevantUniversities = universities.filter(uni => 
    selectedCountries.some(country => 
      cleanStr(uni.Country).includes(cleanStr(country))
    )
  );

  if (relevantUniversities.length === 0) {
    return { profileAnalysis: [], visaReadiness: 'No data', idealCategoryFit: 'Unknown' };
  }

  // Sample university for analysis (take first relevant one)
  const sampleUni = relevantUniversities[0];
  
  const profileAnalysis = [];

  // 1. GPA vs Academic Requirement
  const gpaAnalysis = analyzeGPA(userProfile.gpa, sampleUni.Typical_Academic_Requirement);
  profileAnalysis.push({
    case: 'GPA vs Academic Requirement',
    rule: gpaAnalysis.requirement,
    message: gpaAnalysis.message
  });

  // 2. IELTS vs Typical English Requirement
  const ieltsAnalysis = analyzeIELTS(userProfile.languageTestScore, sampleUni.Typical_English_Requirement);
  profileAnalysis.push({
    case: 'IELTS vs English Requirement',
    rule: ieltsAnalysis.requirement,
    message: ieltsAnalysis.message
  });

  // 3. Budget vs Estimated Tuition
  const budgetAnalysis = analyzeBudget(userProfile.budget, sampleUni.Estimated_Tuition_USD_per_year);
  profileAnalysis.push({
    case: 'Budget vs Estimated Tuition',
    rule: budgetAnalysis.requirement,
    message: budgetAnalysis.message
  });

  // 4. Country Preference vs Country
  const countryAnalysis = analyzeCountryMatch(userProfile.Country, sampleUni.Country);
  profileAnalysis.push({
    case: 'Country Preference',
    rule: countryAnalysis.rule,
    message: countryAnalysis.message
  });

  // 5. Level Match vs Levels
  const levelAnalysis = analyzeLevelMatch(userProfile.education, sampleUni.Levels);
  profileAnalysis.push({
    case: 'Level Match',
    rule: levelAnalysis.requirement,
    message: levelAnalysis.message
  });

  // 6. Language-specific recommendations
  const languageAnalysis = analyzeLanguageForCountry(userProfile, sampleUni.Country);
  if (languageAnalysis) {
    profileAnalysis.push(languageAnalysis);
  }

  // Calculate Visa Readiness and Ideal Category Fit
  const visaReadiness = calculateVisaReadiness(userProfile, sampleUni);
  const idealCategoryFit = calculateIdealCategoryFit(userProfile, relevantUniversities);

  return {
    profileAnalysis,
    visaReadiness,
    idealCategoryFit
  };
}

function analyzeGPA(userGPA, academicRequirement) {
  const gpa = parseFloat(userGPA);
  const requirement = academicRequirement || "Standard academic requirements apply";
  
  // Extract GPA requirement from text
  const gpaMatch = academicRequirement?.match(/GPA[\s\w]*?([\d\.]+)[+\-–]?([\d\.]+)?/i);
  
  if (!userGPA || isNaN(gpa)) {
    return {
      requirement: requirement,
      message: "Please provide your GPA for accurate assessment."
    };
  }
  
  if (gpaMatch) {
    const minGPA = parseFloat(gpaMatch[1]);
    if (gpa >= minGPA) {
      return {
        requirement: requirement,
        message: `Your GPA (${gpa}) meets the minimum requirement.`
      };
    } else {
      return {
        requirement: requirement,
        message: `Your GPA (${gpa}) is below the typical requirement. Consider improving academic credentials.`
      };
    }
  }
  
  return {
    requirement: requirement,
    message: `Your GPA (${gpa}) will be evaluated against program requirements.`
  };
}

function analyzeIELTS(userScore, englishRequirement) {
  const score = parseFloat(userScore);
  const requirement = englishRequirement || "English proficiency required";
  
  // Extract IELTS score from requirement
  const ieltsMatch = englishRequirement?.match(/IELTS[\s]*([\d\.]+)[+\-–]?([\d\.]+)?/i);
  
  if (!userScore || isNaN(score)) {
    return {
      requirement: requirement,
      message: "Please provide your IELTS score for language assessment."
    };
  }
  
  if (ieltsMatch) {
    const minIELTS = parseFloat(ieltsMatch[1]);
    if (score >= minIELTS) {
      return {
        requirement: requirement,
        message: `Your IELTS score (${score}) meets the requirement. Strong language proficiency.`
      };
    } else if (score >= minIELTS - 0.5) {
      return {
        requirement: requirement,
        message: `Your IELTS score (${score}) is slightly below requirement. Consider a short English upgrade program.`
      };
    } else {
      return {
        requirement: requirement,
        message: `Your IELTS score (${score}) is below requirement. We recommend an English upgrade program.`
      };
    }
  }
  
  return {
    requirement: requirement,
    message: `Your IELTS score (${score}) will be evaluated against specific program requirements.`
  };
}

function analyzeBudget(userBudget, estimatedTuition) {
  const budget = parseFloat(userBudget);
  const tuitionRange = estimatedTuition || "$10,000–50,000";
  
  if (!userBudget || isNaN(budget)) {
    return {
      requirement: `Estimated tuition: ${tuitionRange}`,
      message: "Please provide your budget for financial planning."
    };
  }
  
  // Extract tuition range
  const tuitionMatch = estimatedTuition?.match(/\$?([\d,]+)[–\-]?\$?([\d,]+)?/);
  if (tuitionMatch) {
    const minTuition = parseFloat(tuitionMatch[1].replace(/,/g, ''));
    const maxTuition = tuitionMatch[2] ? parseFloat(tuitionMatch[2].replace(/,/g, '')) : minTuition;
    
    if (budget >= maxTuition) {
      return {
        requirement: `Estimated tuition: ${tuitionRange}`,
        message: `Your budget ($${budget.toLocaleString()}) comfortably covers tuition costs.`
      };
    } else if (budget >= minTuition) {
      return {
        requirement: `Estimated tuition: ${tuitionRange}`,
        message: `Your budget ($${budget.toLocaleString()}) covers basic tuition. Consider additional living costs.`
      };
    } else {
      return {
        requirement: `Estimated tuition: ${tuitionRange}`,
        message: `Your budget ($${budget.toLocaleString()}) may be insufficient. Consider scholarships or financial aid.`
      };
    }
  }
  
  return {
    requirement: `Estimated tuition: ${tuitionRange}`,
    message: `Your budget ($${budget.toLocaleString()}) will be considered for program selection.`
  };
}

function analyzeCountryMatch(userCountries, universityCountry) {
  const countries = Array.isArray(userCountries) ? userCountries : [userCountries];
  const targetCountry = universityCountry;
  
  if (countries.some(country => cleanStr(country) === cleanStr(targetCountry))) {
    return {
      rule: `Target country: ${targetCountry}`,
      message: `Perfect match! This aligns with your preference for ${targetCountry}.`
    };
  }
  
  return {
    rule: `Target country: ${targetCountry}`,
    message: `Universities available in ${targetCountry} based on your selection.`
  };
}

function analyzeLevelMatch(userEducation, universityLevels) {
  const levels = universityLevels || "Bachelor|Master";
  const education = userEducation?.toLowerCase() || "";
  
  if (!userEducation) {
    return {
      requirement: `Available levels: ${levels}`,
      message: "Please specify your intended level of study."
    };
  }
  
  if (levels.toLowerCase().includes(education)) {
    return {
      requirement: `Available levels: ${levels}`,
      message: `Great! ${userEducation} programs are available at these institutions.`
    };
  }
  
  return {
    requirement: `Available levels: ${levels}`,
    message: `Your intended level (${userEducation}) will be checked against program availability.`
  };
}

function analyzeLanguageForCountry(userProfile, country) {
  const userLanguages = Array.isArray(userProfile.language) ? userProfile.language : [userProfile.language || ""];
  const countryLower = cleanStr(country);
  
  // Country-specific language recommendations
  if (countryLower === "france") {
    const hasFrench = userLanguages.some(lang => cleanStr(lang) === "french");
    const hasEnglish = userLanguages.some(lang => cleanStr(lang) === "english");
    
    if (!hasFrench && hasEnglish) {
      return {
        case: 'Language for France',
        rule: 'French proficiency recommended for France',
        message: 'You can apply to bilingual or French-taught programs in Canada or France. English pathway required for USA/UK.'
      };
    } else if (hasFrench && hasEnglish) {
      return {
        case: 'Language for France',
        rule: 'French + English proficiency',
        message: 'Excellent! You can access both French and English programs in France.'
      };
    } else if (hasFrench && !hasEnglish) {
      return {
        case: 'Language for France',
        rule: 'French proficiency available',
        message: 'Good French skills! Consider adding English for broader program access.'
      };
    }
  }
  
  return null;
}

function calculateVisaReadiness(userProfile, sampleUni) {
  let score = 0;
  const factors = [];
  
  // IELTS strength (40% weight)
  const ieltsScore = parseFloat(userProfile.languageTestScore);
  if (ieltsScore >= 7.0) {
    score += 40;
    factors.push("Strong IELTS");
  } else if (ieltsScore >= 6.5) {
    score += 30;
    factors.push("Good IELTS");
  } else if (ieltsScore >= 6.0) {
    score += 20;
    factors.push("Adequate IELTS");
  } else {
    score += 10;
    factors.push("IELTS needs improvement");
  }
  
  // Financial readiness (30% weight)
  const budget = parseFloat(userProfile.budget);
  if (budget >= 50000) {
    score += 30;
    factors.push("Strong finances");
  } else if (budget >= 30000) {
    score += 25;
    factors.push("Good finances");
  } else if (budget >= 15000) {
    score += 15;
    factors.push("Moderate finances");
  } else {
    score += 5;
    factors.push("Limited finances");
  }
  
  // Academic readiness (30% weight)
  const gpa = parseFloat(userProfile.gpa);
  if (gpa >= 3.5) {
    score += 30;
    factors.push("Strong academics");
  } else if (gpa >= 3.0) {
    score += 25;
    factors.push("Good academics");
  } else if (gpa >= 2.5) {
    score += 15;
    factors.push("Moderate academics");
  } else {
    score += 5;
    factors.push("Academic improvement needed");
  }
  
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Very Good";
  if (score >= 55) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Improvement";
}

function calculateIdealCategoryFit(userProfile, universities) {
  // Analyze university types user would fit best
  const gpa = parseFloat(userProfile.gpa);
  const ielts = parseFloat(userProfile.languageTestScore);
  
  if (gpa >= 3.7 && ielts >= 7.0) {
    return "Top-tier Universities";
  } else if (gpa >= 3.3 && ielts >= 6.5) {
    return "Mid-tier Universities";
  } else if (gpa >= 2.8 && ielts >= 6.0) {
    return "Pathway Programs";
  } else {
    return "Foundation/Preparation Programs";
  }
}

// Checks user eligibility for each university based on criteria
function checkEligibility(userProfile, allCsvData) {
  const criteriaRows = allCsvData['acceptance criteria , eligibility criteria.csv'] || [];
  const universities = allCsvData['universities_600.csv'] || [];
  const weights = parseWeights(allCsvData['weight -.csv'] || []);
  const eligible = [];
  const ineligible = [];

  // Set default age if missing (typical university student age)
  if (!userProfile.age) {
    userProfile.age = '22';
    console.log('[Age] Setting default age to 22 for university applications');
  }

  // Check if selected countries are supported
  const supportedCountries = ['USA', 'Canada', 'UK', 'France', 'Other'];
  if (userProfile.Country) {
    const selectedCountries = Array.isArray(userProfile.Country) ? userProfile.Country : [userProfile.Country];
    const unsupportedCountries = selectedCountries.filter(country => 
      !supportedCountries.some(supported => 
        supported.toLowerCase() === country.toLowerCase()
      )
    );
    
    if (unsupportedCountries.length > 0) {
      return { 
        eligible: [], 
        ineligible: [], 
        error: `Sorry, we don't have university data for: ${unsupportedCountries.join(', ')}. Available countries: ${supportedCountries.join(', ')}.` 
      };
    }
  }

  // Filter universities by user selection before scoring
  const filteredUniversities = universities.filter(uni => {
    // Support multi-country selection with flexible matching
    if (userProfile.Country && Array.isArray(userProfile.Country) && userProfile.Country.length > 0) {
      const uniCountry = cleanStr(uni.Country || '');
      const matchesCountry = userProfile.Country.some(selectedCountry => {
        const cleanSelected = cleanStr(selectedCountry);
        return uniCountry.includes(cleanSelected) || cleanSelected.includes(uniCountry);
      });
      if (!matchesCountry) return false;
    } else if (userProfile.Country && typeof userProfile.Country === 'string') {
      const uniCountry = cleanStr(uni.Country || '');
      const selectedCountry = cleanStr(userProfile.Country);
      if (!uniCountry.includes(selectedCountry) && !selectedCountry.includes(uniCountry)) return false;
    }
    // Other filters can be added here
    return true;
  });

  console.log(`[Filter] Universities filtered from ${universities.length} to ${filteredUniversities.length} based on user profile`);

  // Helper to check and score with proportional scoring
  function scoreUniversity(uni, crit) {
    let score = 0;
    let reasons = [];
    let eligible = true;
    
    // GPA - Proportional scoring based on how much user exceeds minimum
    if (crit.Acceptance_Criteria.match(/GPA/i)) {
      const gpaMatch = crit.Acceptance_Criteria.match(/GPA\s*([\d\.]+)[+\u2013-]?([\d\.]+)?/);
      if (gpaMatch) {
        const minGpa = parseFloat(gpaMatch[1]);
        const userGpa = parseFloat(userProfile.gpa);
        const maxGpaWeight = weights['Academic Standing (GPA/Score)'] || 30;
        
        if (!userProfile.gpa || isNaN(userGpa)) {
          eligible = false;
          reasons.push('GPA missing');
          score += 0;
        } else if (userGpa < minGpa) {
          eligible = false;
          reasons.push('GPA below minimum');
          // Give partial score based on how close they are
          const ratio = Math.max(0, userGpa / minGpa);
          score += Math.round(maxGpaWeight * ratio * 0.4); // Reduced penalty for clearer distinction
        } else {
          // Give full score if eligible, with bonus for exceeding
          const exceedRatio = Math.min(2, userGpa / minGpa);
          score += Math.round(maxGpaWeight * Math.min(1.2, 0.85 + 0.35 * (exceedRatio - 1))); // 85% base + 35% bonus
        }
      } else {
        reasons.push('No GPA requirement found in criteria');
        score += Math.round((weights['Academic Standing (GPA/Score)'] || 30) * 0.8); // Higher default for missing criteria
      }
    } else {
      // If no GPA requirement, give high default score
      score += Math.round((weights['Academic Standing (GPA/Score)'] || 30) * 0.9);
    }
    
    // Language - Proportional scoring based on test score vs requirement
    if (crit.Acceptance_Criteria.match(/IELTS|TOEFL|French/i)) {
      const maxLangWeight = weights['Language Proficiency (e.g., IELTS/TOEFL)'] || 40;
      
      if (!userProfile.languageTestScore) {
        eligible = false;
        reasons.push('Missing language test score');
        score += 0;
      } else {
        // Example: IELTS 6.0+
        const langMatch = crit.Acceptance_Criteria.match(/IELTS\s*([\d\.]+)/);
        if (langMatch) {
          const minIelts = parseFloat(langMatch[1]);
          const userIelts = parseFloat(userProfile.languageTestScore);
          
          if (isNaN(userIelts)) {
            eligible = false;
            reasons.push('Invalid language test score');
            score += 0;
          } else if (userIelts < minIelts) {
            eligible = false;
            reasons.push('IELTS below minimum');
            // Give partial score
            const ratio = Math.max(0, userIelts / minIelts);
            score += Math.round(maxLangWeight * ratio * 0.4); // Reduced penalty
          } else {
            // Give full score if eligible, with bonus for high scores
            const exceedRatio = Math.min(9, userIelts) / Math.max(minIelts, 6);
            score += Math.round(maxLangWeight * Math.min(1.2, 0.85 + 0.35 * (exceedRatio - 1)));
          }
        } else {
          // No specific requirement found, assume good score
          score += Math.round(maxLangWeight * 0.9);
        }
      }
    } else {
      // If no language requirement, give high default score
      score += Math.round((weights['Language Proficiency (e.g., IELTS/TOEFL)'] || 40) * 0.9);
    }
    
    // Financial - More realistic scoring
    const maxFinancialWeight = weights['Financial Capability'] || 20;
    if (crit.Eligibility_Criteria.match(/funds|financial/i)) {
      if (!userProfile.budget) {
        reasons.push('Missing financial info');
        score += Math.round(maxFinancialWeight * 0.5); // Higher default for missing info
      } else {
        score += Math.round(maxFinancialWeight * 1.0); // Full score if they have budget info
      }
    } else {
      score += Math.round(maxFinancialWeight * 0.95); // Very high default if not required
    }
    
    // Education level - More realistic
    if (crit.Eligibility_Criteria.match(/high school|bachelor/i)) {
      if (!userProfile.education) {
        reasons.push('Missing education level');
        score += 5;
      } else {
        score += 10; // Higher education match score
      }
    } else {
      score += 8; // Higher default education score
    }
    
    // Age (for language schools) - Simplified since we always have age now
    if (crit.Eligibility_Criteria && crit.Eligibility_Criteria.match(/age|16\+|18\+/i)) {
      // Only fail if there's an explicit age requirement AND user doesn't meet it
      const age = parseInt(userProfile.age);
      if (age < 16) {
        eligible = false;
        reasons.push('Age below minimum (16+)');
        score += 0;
      } else {
        // Age requirements met
        if (age >= 18 && age <= 25) {
          score += 8;
        } else if (age >= 16 && age <= 35) {
          score += 6;
        } else {
          score += 4;
        }
      }
    } else {
      // No age requirement - give default score
      const age = parseInt(userProfile.age);
      if (age >= 18 && age <= 25) {
        score += 8;
      } else if (age >= 16 && age <= 35) {
        score += 6;
      } else {
        score += 4;
      }
    }
    
    return { eligible, score, reasons };
  }

  console.log(`[Filter] Universities filtered from ${universities.length} to ${filteredUniversities.length} based on user profile`);

  for (const uni of filteredUniversities) {
    // Find matching criteria by country/type (robust, ignore emoji, case-insensitive, substring)
    let matchedCriteria = criteriaRows.find(row => {
      const criteriaCountry = cleanStr(row.Country);
      const criteriaType = cleanStr(row.Type);
      const uniCountry = cleanStr(uni.Country);
      const uniType = cleanStr(uni.Type);
      
      // Country matching - handle cases like "🇫🇷 France" -> "france"
      const countryMatch = uniCountry.includes(criteriaCountry) || criteriaCountry.includes(uniCountry);
      
      // Type matching - more flexible for different formats across all countries
      let typeMatch = false;
      
      // University types - handle various formats including French École
      if ((criteriaType.includes('university') || criteriaType.includes('ecole')) && 
          (uniType.includes('university') || uniType.includes('college'))) {
        typeMatch = true;
      }
      // College types - including community colleges and pathways
      else if (criteriaType.includes('college') && 
               (uniType.includes('college') || uniType.includes('pathway') || uniType.includes('institute'))) {
        typeMatch = true;
      }
      // Language schools
      else if ((criteriaType.includes('school') || criteriaType.includes('language')) && 
               (uniType.includes('school') || uniType.includes('language') || uniType.includes('english') || uniType.includes('pathway'))) {
        typeMatch = true;
      }
      // French specific mappings
      else if (criteriaType.includes('university') && criteriaType.includes('ecole') && uniType.includes('university')) {
        typeMatch = true; // "University / École" matches "University"
      }
      else if (criteriaType.includes('language') && criteriaType.includes('school') && uniType.includes('pathway')) {
        typeMatch = true; // "Language School" matches "College/Pathway"
      }
      // Canadian specific: Institute/College variations
      else if ((criteriaType.includes('institute') || criteriaType.includes('college')) && 
               (uniType.includes('institute') || uniType.includes('college') || uniType.includes('university'))) {
        typeMatch = true;
      }
      // USA specific: Community college variations
      else if (criteriaType.includes('non-selective') && 
               (uniType.includes('community') || uniType.includes('college') || uniType.includes('state'))) {
        typeMatch = true;
      }
      // Generic fallback: check for common words
      else if (uniType.includes(criteriaType) || criteriaType.includes(uniType)) {
        typeMatch = true;
      }
      // Additional fallback: partial word matching
      else {
        const criteriaWords = criteriaType.split(/[\s\/]+/);
        const uniWords = uniType.split(/[\s\/]+/);
        typeMatch = criteriaWords.some(cWord => 
          uniWords.some(uWord => 
            (cWord.length > 3 && uWord.includes(cWord)) || 
            (uWord.length > 3 && cWord.includes(uWord))
          )
        );
      }
      
      const match = countryMatch && typeMatch;
      console.log(`[CriteriaMatch] Uni: ${uni.Name} | UniCountry: ${uniCountry} | UniType: ${uniType} | CriteriaCountry: ${criteriaCountry} | CriteriaType: ${criteriaType} | CountryMatch: ${countryMatch} | TypeMatch: ${typeMatch} | Match: ${match}`);
      return match;
    });
    if (!matchedCriteria) {
      console.log(`[CriteriaMatch] No matching criteria for university: ${uni.Name} | Country: ${uni.Country} | Type: ${uni.Type}`);
      ineligible.push({ ...uni, reasons: ['No matching criteria'] });
      continue;
    }
    const result = scoreUniversity(uni, matchedCriteria);
    
    // Convert score to percentage with updated max possible score
    // Max: Academic(36) + Language(48) + Financial(20) + Education(10) + Age(8) = 122
    const maxPossibleScore = 122;
    let percentScore = Math.min(100, Math.round((result.score / maxPossibleScore) * 100));
    
    // Ensure eligible universities have high scores (minimum 70%)
    if (result.eligible && percentScore < 70) {
      percentScore = Math.max(70, percentScore);
    }
    
    // Cap ineligible universities at lower scores (maximum 65%)
    if (!result.eligible && percentScore > 65) {
      percentScore = Math.min(65, percentScore);
    }
    
    if (result.eligible) {
      eligible.push({ ...uni, score: result.score, percent: percentScore, reasons: result.reasons });
    } else {
      console.log(`Ineligible: ${uni.Name || uni.name} | Score: ${result.score} (${percentScore}%) | Reasons: ${result.reasons.join(', ')}`);
      ineligible.push({ ...uni, score: result.score, percent: percentScore, reasons: result.reasons });
    }
  }

  // Handle inappropriate/missing data
  if (eligible.length === 0 && ineligible.length === 0) {
    return { eligible: [], ineligible: [], error: 'No matching institutions found for your profile. Please check your inputs.' };
  }
  return { eligible, ineligible };
}

// Example usage
if (require.main === module) {
  const allCsvData = loadAllCsvs();
  // For demo, print keys and row counts
  for (const [file, rows] of Object.entries(allCsvData)) {
    console.log(`${file}: ${rows.length} rows`);
  }

  // Demo user profile (fill with realistic field names/values from your CSVs)
  const userProfile = {
    gpa: '3.7',
    sat_score: '1400',
    major: 'Computer Science',
    // Add more fields as needed based on your eligibility criteria.csv
  };

  const eligibilityResults = checkEligibility(userProfile, allCsvData);
  console.log(`\nEligible universities for user: ${eligibilityResults.eligible.length}`);
  if (eligibilityResults.eligible.length > 0) {
    console.log('Sample university object keys:', Object.keys(eligibilityResults.eligible[0]));
  }
  eligibilityResults.eligible.forEach(u => {
    // Print all fields for inspection
    console.log(u);
  });
}

module.exports = { loadAllCsvs, checkEligibility, cleanStr, analyzeProfile };
