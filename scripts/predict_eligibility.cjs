const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { parse } = require('csv-parse/sync');

// --- Load CSV Data ---
function loadCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return parse(content, { columns: true, skip_empty_lines: true });
}

const universities = loadCSV(path.join(__dirname, '../training data/universities_600.csv'));
const weights = loadCSV(path.join(__dirname, '../training data/weight -.csv'));

// --- Weights ---
const WEIGHTS = {
  language: parseFloat(weights.find(w => w.Factor.includes('Language'))?.Weight) || 40,
  academic: parseFloat(weights.find(w => w.Factor.includes('Academic'))?.Weight) || 30,
  financial: parseFloat(weights.find(w => w.Factor.includes('Financial'))?.Weight) || 20,
  docs: parseFloat(weights.find(w => w.Factor.includes('Eligibility'))?.Weight) || 10,
};

// --- User Input ---
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

async function main() {
  console.log('--- University Eligibility Predictor ---');
  const country = await ask('Country of Interest (e.g., USA, Canada, France): ');
  const degreeLevel = await ask('Degree Level (e.g., Bachelor, Master, Diploma): ');
  const gpa = parseFloat(await ask('Your GPA (e.g., 3.5): '));
  const languageScore = parseFloat(await ask('Language Test Score (IELTS/TOEFL, e.g., 6.5): '));
  const budget = parseFloat(await ask('Annual Budget in USD (e.g., 30000): '));
  const hasDocs = await ask('Do you have all required documents? (yes/no): ');

  // --- Eligibility Logic ---
  const eligible = [];
  const ineligible = [];
  for (const uni of universities) {
    // Strict country and degree level match
    if (country && uni.Country && !uni.Country.toLowerCase().includes(country.toLowerCase())) continue;
    if (degreeLevel && (!uni.Levels || !uni.Levels.toLowerCase().includes(degreeLevel.toLowerCase()))) continue;
    // Academic check
    let academicReq = parseFloat((uni.Typical_Academic_Requirement.match(/([\d\.]+)/) || [])[1] || '0');
    let academicScore = 0;
    if (gpa >= academicReq) {
      academicScore = WEIGHTS.academic;
    } else if (gpa >= academicReq - 0.25) {
      academicScore = WEIGHTS.academic * 0.75;
    } else if (gpa >= academicReq - 0.5) {
      academicScore = WEIGHTS.academic * 0.5;
    } else if (gpa >= academicReq - 1) {
      academicScore = WEIGHTS.academic * 0.25;
    }
    // Language check
    let langReq = parseFloat((uni.Typical_English_Requirement.match(/([\d\.]+)/) || [])[1] || '0');
    let langScore = 0;
    if (languageScore >= langReq) {
      langScore = WEIGHTS.language;
    } else if (languageScore >= langReq - 0.25) {
      langScore = WEIGHTS.language * 0.75;
    } else if (languageScore >= langReq - 0.5) {
      langScore = WEIGHTS.language * 0.5;
    } else if (languageScore >= langReq - 1) {
      langScore = WEIGHTS.language * 0.25;
    }
    // Financial check
    let tuitionRange = uni.Estimated_Tuition_USD_per_year.match(/([\d,\.]+)/g);
    let tuition = 0;
    if (tuitionRange && tuitionRange.length > 1) {
      tuition = Math.max(...tuitionRange.map(t => parseFloat(t.replace(/,/g, ''))));
    } else if (tuitionRange && tuitionRange.length === 1) {
      tuition = parseFloat(tuitionRange[0].replace(/,/g, ''));
    }
    let financialScore = 0;
    if (budget >= tuition) {
      financialScore = WEIGHTS.financial;
    } else if (budget >= tuition * 0.9) {
      financialScore = WEIGHTS.financial * 0.75;
    } else if (budget >= tuition * 0.8) {
      financialScore = WEIGHTS.financial * 0.5;
    } else if (budget >= tuition * 0.6) {
      financialScore = WEIGHTS.financial * 0.25;
    }
    // Docs check (no weight, just a note)
    let docsNote = hasDocs.toLowerCase() === 'no' ? "Documents are required for application." : "";
    // Total (exclude docsScore)
    let totalScore = academicScore + langScore + financialScore;
    let percent = Math.round((totalScore / (WEIGHTS.academic + WEIGHTS.language + WEIGHTS.financial)) * 100);
    const breakdown = `Academic: ${academicScore}/${WEIGHTS.academic}, Language: ${langScore}/${WEIGHTS.language}, Financial: ${financialScore}/${WEIGHTS.financial}`;
    const uniObj = {
      name: uni.Name,
      country: uni.Country,
      type: uni.Type,
      percent,
      tuition: uni.Estimated_Tuition_USD_per_year,
      notes: docsNote || uni.Notes_for_International_Students,
      breakdown
    };
    if (percent >= 50) {
      eligible.push(uniObj);
    } else {
      ineligible.push(uniObj);
    }
  }
  // --- Output ---
  console.log('\nEligible Universities:');
  if (eligible.length === 0) {
    console.log('None');
  } else {
    eligible.sort((a, b) => b.percent - a.percent);
    eligible.forEach(u => {
      console.log(`- ${u.name} (${u.country}, ${u.type}): Acceptance Chance ${u.percent}%, Tuition: ${u.tuition}`);
      console.log(`  Breakdown: ${u.breakdown}`);
    });
  }
  console.log('\nIneligible Universities:');
  if (ineligible.length === 0) {
    console.log('None');
  } else {
    ineligible.sort((a, b) => b.percent - a.percent);
    ineligible.forEach(u => {
      console.log(`- ${u.name} (${u.country}, ${u.type}): Acceptance Chance ${u.percent}%, Tuition: ${u.tuition}`);
      console.log(`  Breakdown: ${u.breakdown}`);
    });
  }
  rl.close();
}

main();
