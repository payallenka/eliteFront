import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register Montserrat fonts from public directory
Font.register({
  family: 'Montserrat',
  fonts: [
    { src: '/fonts/Montserrat/static/Montserrat-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Montserrat/static/Montserrat-Bold.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Montserrat', backgroundColor: '#f9fafb' },
  heading: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#1a0841', textAlign: 'left', fontFamily: 'Montserrat' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#1a0841', textAlign: 'left', fontFamily: 'Montserrat' },
  row: { flexDirection: 'row', marginBottom: 8, fontFamily: 'Montserrat' },
  label: { width: 180, fontSize: 12, color: '#6b7280', fontFamily: 'Montserrat' },
  value: { fontSize: 12, color: '#1a0841', fontWeight: 'bold', fontFamily: 'Montserrat' },
  footer: { fontSize: 10, color: '#9ca3af', marginTop: 20, textAlign: 'center', fontFamily: 'Montserrat' },
  section: { marginBottom: 18 },
});

function formatFieldName(key) {
  return key.replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ');
}

function formatValue(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (value === '' || value === null || value === undefined) return 'Not provided';
  return String(value);
}

export function ApplicationFormPDF({ formData, generatedAt }) {
  if (!formData) return null;
  // Exclude any fields you don't want to show
  const exclude = ['aiAnalysis', 'submittedAt'];
  const keys = Object.keys(formData).filter(key => !exclude.includes(key));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>Application Form Data</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Submitted Fields</Text>
          {keys.map((key) => (
            <View style={styles.row} key={key}>
              <Text style={styles.label}>{formatFieldName(key)}:</Text>
              <Text style={styles.value}>{formatValue(formData[key])}</Text>
            </View>
          ))}
        </View>
        {formData.submittedAt && (
          <Text style={styles.footer}>
            Submitted on: {new Date(formData.submittedAt).toLocaleString()}
          </Text>
        )}
        <Text style={styles.footer}>
          Report generated on: {new Date(generatedAt || Date.now()).toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  );
}

export function getApplicationPDFFileName(formData) {
  const username = formData?.name || formData?.firstName || 'user';
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${username}_application_form_${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}.pdf`;
}
