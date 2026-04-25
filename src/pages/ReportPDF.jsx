import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Use system fonts to avoid loading issues
const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#f9fafb' },
  heading: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#1a0841', textAlign: 'left' },
  subheading: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#1a0841', textAlign: 'left' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 20, marginBottom: 16, border: '1px solid #e5e7eb' },
  summaryPanel: { backgroundColor: '#fff', borderRadius: 8, padding: 20, marginBottom: 16, border: '1px solid #e5e7eb' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 12, color: '#6b7280' },
  summaryValue: { fontSize: 14, fontWeight: 'bold', color: '#1a0841' },
  topMatchCard: { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 12, marginBottom: 8, border: '1px solid #bbf7d0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topMatchName: { fontWeight: 'bold', color: '#1a0841', fontSize: 13, flex: 1 },
  topMatchPercent: { color: '#6c47ff', fontWeight: 'bold', fontSize: 15 },
  lockedCard: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, marginBottom: 8, border: '1px solid #d1d5db', opacity: 0.6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lockedText: { fontSize: 13, color: '#9ca3af' },
  countryStatsContainer: { marginBottom: 16 },
  countryStatRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8 },
  countryName: { fontSize: 14, fontWeight: 'bold', color: '#1a0841' },
  countryPercent: { fontSize: 16, fontWeight: 'bold', color: '#10b981' },
  countryStats: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  dynamicSummaryCard: { backgroundColor: '#eff6ff', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #bfdbfe' },
  dynamicSummaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a0841', marginBottom: 8 },
  dynamicSummaryText: { fontSize: 12, color: '#374151', lineHeight: 1.6 },
  promotionCard: { backgroundColor: '#faf5ff', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #e9d5ff' },
  promotionTitle: { fontSize: 14, fontWeight: 'bold', color: '#7c3aed', marginBottom: 8 },
  promotionText: { fontSize: 12, color: '#374151', lineHeight: 1.6 },
  educationBackground: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 14, marginBottom: 16 },
  educationTitle: { fontSize: 14, fontWeight: 'bold', color: '#1a0841', marginBottom: 10 },
  educationRow: { flexDirection: 'row', marginBottom: 6 },
  educationLabel: { fontSize: 11, color: '#6b7280', width: 140 },
  educationValue: { fontSize: 11, color: '#1a0841', fontWeight: 'bold', flex: 1 },
  profileAnalysisCard: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #e5e7eb' },
  profileAnalysisTitle: { fontSize: 14, fontWeight: 'bold', color: '#1a0841', marginBottom: 8 },
  profileAnalysisText: { fontSize: 11, color: '#374151', lineHeight: 1.5 },
  footer: { fontSize: 10, color: '#9ca3af', marginTop: 20, textAlign: 'center' },
});

function getStrengthPercent(label) {
  switch ((label || '').toLowerCase()) {
    case 'excellent': return 100;
    case 'strong': return 90;
    case 'very good': return 80;
    case 'good': return 70;
    case 'adequate': return 60;
    case 'average': return 50;
    case 'fair': return 40;
    case 'weak': return 30;
    case 'poor': return 20;
    default: return 0;
  }
}


// Render a circular progress bar using SVG for PDF
function renderCircularBar(percent, color = '#6c47ff', label = '') {
  // Circle params
  const radius = 18;
  const stroke = 4;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const progress = Math.max(0, Math.min(percent, 100));
  const offset = circumference - (progress / 100) * circumference;
  return (
    <View style={{ alignItems: 'center', marginBottom: 8, width: 50 }}>
      {/* SVG Circle */}
      <svg width={radius * 2} height={radius * 2} style={{ display: 'block' }}>
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          stroke="#f3f4f6"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <Text style={{ fontSize: 10, fontWeight: 'bold', color }}>{progress}%</Text>
      {label && (
        <Text style={{ fontSize: 9, color: '#374151', marginTop: 1, textAlign: 'center' }}>{label}</Text>
      )}
    </View>
  );
}

function renderSummary(report) {
  if (!report.summary) return null;
  const academicLabel = report.summary.strengths?.academic || 'N/A';
  const languageLabel = report.summary.strengths?.language || 'N/A';
  const financialLabel = report.summary.strengths?.financial || 'N/A';
  const academicPercent = getStrengthPercent(academicLabel);
  const languagePercent = getStrengthPercent(languageLabel);
  const financialPercent = getStrengthPercent(financialLabel);
  return (
    <View style={styles.summaryPanel}>
      <Text style={styles.subheading}>AI Admission Assessment</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Profile Strength</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <View style={{ alignItems: 'center', flex: 1 }}>
          {renderCircularBar(academicPercent, '#6c47ff', 'Academics')}
          <Text style={styles.summaryValue}>{academicLabel}</Text>
        </View>
        <View style={{ alignItems: 'center', flex: 1 }}>
          {renderCircularBar(languagePercent, '#10b981', 'Language')}
          <Text style={styles.summaryValue}>{languageLabel}</Text>
        </View>
        <View style={{ alignItems: 'center', flex: 1 }}>
          {renderCircularBar(financialPercent, '#f59e42', 'Financial')}
          <Text style={styles.summaryValue}>{financialLabel}</Text>
        </View>
      </View>
    </View>
  );
}

function renderCountryStats(report) {
  if (!report.summary?.countryStats) return null;
  const stats = report.summary.countryStats;
  if (Object.keys(stats).length === 0) return null;
  
  return (
    <View style={styles.countryStatsContainer}>
      <Text style={styles.subheading}>Acceptance by Country</Text>
      {Object.entries(stats).map(([country, data]) => (
        <View key={country} style={styles.countryStatRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.countryName}>{country}</Text>
            <Text style={styles.countryStats}>
              Eligible: {data.eligible}/{data.total} ({data.eligibilityRatio}%)
            </Text>
          </View>
          <Text style={styles.countryPercent}>{data.acceptancePercent}%</Text>
        </View>
      ))}
    </View>
  );
}

function renderEducationBackground(report) {
  if (!report.form) return null;
  // Determine countries from form
  let countries = [];
  if (Array.isArray(report.form.country) && report.form.country.length > 0) {
    countries = report.form.country;
  } else if (Array.isArray(report.form.target_countries) && report.form.target_countries.length > 0) {
    countries = report.form.target_countries;
  } else if (typeof report.form.country === 'string' && report.form.country) {
    countries = [report.form.country];
  } else if (typeof report.form.target_countries === 'string' && report.form.target_countries) {
    countries = [report.form.target_countries];
  }
  return (
    <View style={styles.educationBackground}>
      <Text style={styles.educationTitle}>Education Background</Text>
      {/* Target Countries Section */}
      <View style={styles.educationRow}>
        <Text style={styles.educationLabel}>Target Countries:</Text>
        <Text style={styles.educationValue}>
          {countries.length > 0 ? countries.join(', ') : 'Not specified'}
        </Text>
      </View>
      <View style={styles.educationRow}>
        <Text style={styles.educationLabel}>Degree Level:</Text>
        <Text style={styles.educationValue}>{report.form.education || 'Not specified'}</Text>
      </View>
      {report.form.schoolingCountry && (
        <View style={styles.educationRow}>
          <Text style={styles.educationLabel}>Schooling Country:</Text>
          <Text style={styles.educationValue}>{report.form.schoolingCountry}</Text>
        </View>
      )}
      {report.form.bachelorCountry && (
        <View style={styles.educationRow}>
          <Text style={styles.educationLabel}>Bachelor's Country:</Text>
          <Text style={styles.educationValue}>{report.form.bachelorCountry}</Text>
        </View>
      )}
      {report.form.masterCountry && (
        <View style={styles.educationRow}>
          <Text style={styles.educationLabel}>Master's Country:</Text>
          <Text style={styles.educationValue}>{report.form.masterCountry}</Text>
        </View>
      )}
      <View style={styles.educationRow}>
        <Text style={styles.educationLabel}>GPA:</Text>
        <Text style={styles.educationValue}>{report.form.gpa || 'Not specified'}</Text>
      </View>
      <View style={styles.educationRow}>
        <Text style={styles.educationLabel}>Language Score:</Text>
        <Text style={styles.educationValue}>{report.form.languageTestScore || 'Not specified'}</Text>
      </View>
    </View>
  );
}

function renderTopMatches(report) {
  const eligible = report.eligible || [];
  const top5 = eligible.slice(0, 5);
  if (!top5.length) return null;
  
  return (
    <View style={styles.card}>
      <Text style={styles.subheading}>Your Top University Matches</Text>
      {top5.map((c, i) => 
        i < 2 ? (
          <View key={i} style={styles.topMatchCard}>
            <Text style={styles.topMatchName}>
              {i+1}. {c.Name || c.name || 'Unnamed University'} ({c.Country || c.country || 'Unknown'})
            </Text>
            <Text style={styles.topMatchPercent}>
              {c.percent !== undefined ? `${c.percent}%` : c.score !== undefined ? `${c.score}%` : 'Match'}
            </Text>
          </View>
        ) : (
          <View key={i} style={styles.lockedCard}>
            <Text style={styles.lockedText}>{i+1}. Locked</Text>
            <Text style={styles.lockedText}>🔒</Text>
          </View>
        )
      )}
      <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 8 }}>
        Unlock more matches by upgrading your plan or visiting Application Tracker.
      </Text>
    </View>
  );
}

function renderDynamicSummary(report) {
  if (!report.dynamicSummary) return null;
  return (
    <View style={styles.dynamicSummaryCard}>
      <Text style={styles.dynamicSummaryTitle}>Summary</Text>
      <Text style={styles.dynamicSummaryText}>{report.dynamicSummary}</Text>
    </View>
  );
}

function renderPromotion(report) {
  if (!report.promotion) return null;
  return (
    <View style={styles.promotionCard}>
      <Text style={styles.promotionTitle}>Unlock Your Full Potential</Text>
      <Text style={styles.promotionText}>{report.promotion}</Text>
    </View>
  );
}

function renderProfileAnalysis(report) {
  if (!report.profileAnalysis) return null;
  const analysis = report.profileAnalysis;
  
  return (
    <View style={styles.profileAnalysisCard}>
      <Text style={styles.profileAnalysisTitle}>Profile Analysis</Text>
      {analysis.strengths && (
        <Text style={styles.profileAnalysisText}>
          Strengths: {analysis.strengths.join(', ')}
        </Text>
      )}
      {analysis.improvements && (
        <Text style={styles.profileAnalysisText}>
          Areas for Improvement: {analysis.improvements.join(', ')}
        </Text>
      )}
      {analysis.recommendations && (
        <Text style={styles.profileAnalysisText}>
          Recommendations: {analysis.recommendations.join(', ')}
        </Text>
      )}
    </View>
  );
}

export function ReportPDF({ report }) {
  // Handle missing or invalid report data
  if (!report) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.heading}>AI Report Analysis</Text>
          <View style={styles.card}>
            <Text style={{ fontSize: 14, color: '#ef4444', textAlign: 'center' }}>
              Report data not available. Please complete your profile and try again.
            </Text>
          </View>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>AI Report Analysis</Text>
        
        {renderSummary(report)}
        {renderEducationBackground(report)}
        {renderProfileAnalysis(report)}
        {renderTopMatches(report)}
        {renderCountryStats(report)}
        {renderDynamicSummary(report)}
        {renderPromotion(report)}
        
        <Text style={styles.footer}>
          Report generated on: {report.generated_at ? new Date(report.generated_at).toLocaleDateString() : new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  );
}

// Helper to generate dynamic PDF filename
export function getPDFFileName(report) {
  // Use username if available, else fallback to 'user'
  const username = report?.form?.name || 'user';
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${username}_${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}.pdf`;
}
