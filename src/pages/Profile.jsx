import React, { useState, useEffect, useRef } from 'react';
// ...existing code...
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { pdf } from '@react-pdf/renderer';
import { ReportPDF, getPDFFileName } from './ReportPDF';
import { processApplicationFromMetadata } from '../lib/onboarding';
import { documentExtractor } from '../utils/documentTextExtractor';
import AdminSentDocuments from '../components/AdminSentDocuments';
import { MdSchool, MdTranslate, MdAccountBalance } from 'react-icons/md';
// Using inline function instead
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value.trim());
}

// Inline getCountryFlag function (simplified version)
function getCountryFlag(country) {
  // Simplified flag mapping
  const flagMap = {
    'usa': '🇺🇸', 'canada': '🇨🇦', 'uk': '🇬🇧', 'australia': '🇦🇺', 
    'germany': '🇩🇪', 'france': '🇫🇷', 'netherlands': '🇳🇱', 'sweden': '🇸🇪'
  };
  return flagMap[country?.toLowerCase()] || '🏳️';
}

  // --- Circular Profile Strength Metric Helpers ---
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

  function MetricCircle({ label, value }) {
    const lbl = (label || '').toLowerCase();
    let Icon, colorClass, borderClass;

    if (lbl === 'academics') {
      Icon = MdSchool;
      colorClass = "text-purple-600";
      borderClass = "border-purple-100 bg-purple-50";
    } else if (lbl === 'language') {
      Icon = MdTranslate;
      colorClass = "text-blue-600";
      borderClass = "border-blue-100 bg-blue-50";
    } else {
      Icon = MdAccountBalance;
      colorClass = "text-green-600";
      borderClass = "border-green-100 bg-green-50";
    }

    return (
      <div className="flex flex-col items-center p-3 w-28">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 mb-2 ${borderClass} ${colorClass}`}>
          <Icon size={26} />
        </div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-bold text-gray-800">{value}</span>
      </div>
    );
  }

  // Dynamic Circle Progress Component
  function DynamicCircleProgress({ percent, country, stats, getCountryFlag }) {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (circumference * percent / 100);
    const color = percent > 75 ? "#10b981" : percent > 50 ? "#f59e0b" : "#ef4444";

    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="40" cy="40" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="6" />
            <circle 
              cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth="6" 
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-800 text-sm">
            {percent}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-800 flex items-center justify-center gap-1">
            <span>{getCountryFlag(country)}</span>
            <span className="truncate max-w-[80px]">{country}</span>
          </div>
          <div className="text-xs text-gray-500">{stats?.eligible}/{stats?.total} Eligible</div>
        </div>
      </div>
    );
  }

  // Profile Analysis Text Component
  const ProfileAnalysis = ({ profileAnalysis, visaReadiness }) => {
    if (!profileAnalysis) return null;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
          <span className="text-sm font-medium text-gray-600">Visa Readiness</span>
          <span className={`px-2 py-1 rounded text-xs font-bold ${visaReadiness === 'High' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {visaReadiness}
          </span>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Strengths</h4>
          <div className="flex flex-wrap gap-2">
            {profileAnalysis.strengths?.map((s, i) => (
              <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100">{s}</span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Recommendations</h4>
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 ml-1">
            {profileAnalysis.recommendations?.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      </div>
    );
  };

  // Clean Documents List with download/view buttons
  const DocumentsList = ({ documents }) => {
    if (!documents || Object.keys(documents).length === 0) return <div className="text-gray-400 text-sm italic">No documents uploaded yet.</div>;

    const getFileIcon = (fileName) => {
      const ext = fileName.split('.').pop().toLowerCase();
      if (ext === 'pdf') {
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      } else if (["jpg", "jpeg", "png", "svg"].includes(ext)) {
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      }
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    };

    const downloadDocument = (doc) => {
      if (doc.url) {
        const link = document.createElement('a');
        link.href = doc.url;
        link.download = doc.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    return (
      <div className="space-y-2 sm:space-y-3">
        {Object.entries(documents).map(([key, doc]) => {
          console.log('[DOCS] Iterating document:', key, doc);
          if (!(doc && doc.fileName)) {
            console.log('[DOCS] Skipping document (missing or invalid):', key, doc);
            return null;
          }
          console.log('[DOCS] Rendering document row for:', key, doc);
          return (
            <div key={key} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl hover:shadow-sm transition-all">
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-2 sm:mr-3 text-blue-600 flex-shrink-0">
                  {getFileIcon(doc.fileName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate break-anywhere" title={doc.fileName}>{doc.fileName}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                    <p className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}</p>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <p className="text-xs text-gray-400 hidden sm:block">•</p>
                      <p className="text-xs text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      {console.log('[DOCS] Rendered upload date for:', key, doc.uploadedAt)}
                      {doc.fileSize && (
                        <>
                          <p className="text-xs text-gray-400">•</p>
                          <p className="text-xs text-gray-400">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                          {console.log('[DOCS] Rendered file size for:', key, doc.fileSize)}
                        </>
                      )}
                      {doc.compressed && (
                        <>
                          <p className="text-xs text-gray-400 hidden sm:block">•</p>
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Optimized</span>
                          {console.log('[DOCS] Rendered compressed indicator for:', key)}
                        </>
                      )}
                    </div>
                  </div>
                  {/* Removed 'Processing text...' indicator for cleaner UI */}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 ml-2 sm:ml-3 flex-shrink-0">
                <button
                  onClick={() => {
                    console.log('[DOCS] Download button clicked for:', key, doc);
                    downloadDocument(doc);
                  }}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md sm:rounded-lg transition-colors duration-200 flex items-center gap-1 min-w-0"
                  title="Download document"
                >
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Download</span>
                  <span className="sm:hidden">DL</span>
                </button>
                <button
                  onClick={() => {
                    console.log('[DOCS] View button clicked for:', key, doc);
                    window.open(doc.url, '_blank');
                  }}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-md sm:rounded-lg transition-colors duration-200 flex items-center gap-1 min-w-0"
                  title="View document"
                >
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="hidden sm:inline">View</span>
                  <span className="sm:hidden">View</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  export default function Profile() {
    // Document types for upload
    const DOCUMENT_TYPES = [
      { key: 'diploma', label: 'Most recent diploma obtained (PDF file or clear photo)' },
      { key: 'transcripts', label: 'Transcripts (if available)' },
      { key: 'passport', label: 'Copy of passport (identity page)' },
      { key: 'enrollment', label: 'Proof of enrollment or school certificates (for students still enrolled)' },
      { key: 'other', label: 'Any other useful documents' },
    ];
    
    // Upgrade form document types
    const UPGRADE_DOCUMENT_TYPES = [
      { key: 'updated_transcripts', label: 'Updated Academic Transcripts' },
      { key: 'financial_statements', label: 'Financial Statements/Bank Documents' },
      { key: 'sop', label: 'Statement of Purpose' },
      { key: 'recommendation_letters', label: 'Recommendation Letters' },
      { key: 'portfolio', label: 'Portfolio/Work Samples' },
      { key: 'additional_docs', label: 'Additional Supporting Documents' },
    ];

    // --- Upgrade Plan Report Generation ---
    async function generateAndInsertUpgradePlanReport(upgradeDocs) {
      if (!userId || !upgradeDocs || Object.keys(upgradeDocs).length === 0) return;
      try {
        // Create a summary for the upgrade plan submission
        const summary = {
          title: 'Upgrade Plan Submission',
          submittedAt: new Date().toLocaleString(),
          documents: Object.values(upgradeDocs).map(doc => ({
            fileName: doc.fileName,
            uploadedAt: doc.uploadedAt,
            fileSize: doc.fileSize,
            url: doc.url,
            documentType: doc.documentType
          }))
        };
        // Generate a simple PDF (or fallback to a text blob)
        let pdfBlob;
        try {
          pdfBlob = await pdf(
            <div style={{padding: 24, fontSize: 14}}>
              <h1>Upgrade Plan Submission</h1>
              <p>Submitted: {summary.submittedAt}</p>
              <ul>
                {summary.documents.map((doc, i) => (
                  <li key={i}>{doc.documentType}: {doc.fileName} ({(doc.fileSize/1024/1024).toFixed(2)} MB)</li>
                ))}
              </ul>
            </div>
          ).toBlob();
        } catch (e) {
          pdfBlob = new Blob([`Upgrade Plan Submission\n${JSON.stringify(summary, null, 2)}`], {type: 'application/pdf'});
        }
        const fileName = `upgrade_plan_${userId}_${Date.now()}.pdf`;
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user_analysis_report')
          .upload(fileName, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true,
            cacheControl: '3600'
          });
        if (uploadError) {
          console.error('Upgrade plan PDF upload error:', uploadError);
          return;
        }
        // Get proxy URL
        const proxyUrl = `https://elite-scholars-eight.vercel.app/api/pdf-proxy/${encodeURIComponent(fileName)}`;
        // Insert into user_reports
        const userReportsPayload = {
          user_id: userId,
          file_name: fileName,
          url: proxyUrl,
          report_type: 'upgrade_plan',
          generated_at: new Date().toISOString()
        };
        const { data: insertData, error: insertError } = await supabase
          .from('user_reports')
          .insert(userReportsPayload)
          .select();
        if (insertError) {
          console.error('user_reports insert error (upgrade plan):', insertError);
        } else {
          setUserReports(prev => [userReportsPayload, ...prev]);
        }
      } catch (err) {
        console.error('Error generating upgrade plan report:', err);
      }
    }
    // Document upload state
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
    const [uploadingDocument, setUploadingDocument] = useState('');
    const [uploadProgress, setUploadProgress] = useState({});
    const [userId, setUserId] = useState("");
    const BASE_API_URL = "https://elite-scholars-eight.vercel.app";
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

    // Always fetch all user documents on load/user change
    useEffect(() => {
      const fetchAllUserDocuments = async () => {
        if (!userId) return;

        const { data: files, error } = await supabase.storage
          .from('user-documents')
          .list(`user_documents/${userId}`, { limit: 100 });

        if (error || !files) return;

        const allDocs = {};
        for (const file of files) {
          const { data: publicData } = supabase.storage
            .from('user-documents')
            .getPublicUrl(`user_documents/${userId}/${file.name}`);

          allDocs[file.name] = {
            url: publicData.publicUrl,
            fileName: file.name,
            filePath: `user_documents/${userId}/${file.name}`,
            uploadedAt: file.created_at,
            fileSize: file.metadata?.size || 0,
            extractedText: '',
          };
        }

        setUploadedDocuments(allDocs);
      };

      fetchAllUserDocuments();
    }, [userId]);

    // Check if user has filled upgrade form and fetch upgrade documents
    useEffect(() => {
      const checkUpgradeFormStatus = async () => {
        if (!userId) return;
        try {
          // Check if user has upgrade form data in user_roles (could be plan_type, subscription_status, etc.)
          const { data: userData, error } = await supabase
            .from('user_roles')
            .select('upgrade_form_submitted, plan_type')
            .eq('user_id', userId)
            .single();
          if (!error && (userData?.upgrade_form_submitted || userData?.plan_type)) {
            setHasFilledUpgradeForm(true);
            // Fetch existing upgrade form documents
            const { data: files, error: filesError } = await supabase.storage
              .from('user-uploads')
              .list(`${userId}/upgrade-forms/`, {
                limit: 100,
                sortBy: { column: 'created_at', order: 'desc' }
              });
            if (!filesError && files) {
              const upgradeDocuments = {};
              for (const file of files) {
                const { data: publicData } = supabase.storage
                  .from('user-uploads')
                  .getPublicUrl(`${userId}/upgrade-forms/${file.name}`);
                // Determine document type based on filename
                let docType = 'additional_docs';
                if (file.name.includes('transcript')) docType = 'updated_transcripts';
                else if (file.name.includes('financial')) docType = 'financial_statements';
                else if (file.name.includes('sop')) docType = 'sop';
                else if (file.name.includes('recommendation')) docType = 'recommendation_letters';
                else if (file.name.includes('portfolio')) docType = 'portfolio';
                upgradeDocuments[file.name] = {
                  url: publicData.publicUrl,
                  fileName: file.name,
                  filePath: `${userId}/upgrade-forms/${file.name}`,
                  uploadedAt: file.created_at,
                  fileSize: file.metadata?.size || 0,
                  documentType: docType
                };
              }
              setUpgradeFormDocuments(upgradeDocuments);
              // --- Removed userReports logic that was causing the error ---
            }
          }
        } catch (error) {
          console.error('Error checking upgrade form status:', error);
        }
      };
      checkUpgradeFormStatus();
    }, [userId]);

    // Background text extraction function (runs after upload for better UX)
    const extractTextInBackground = async (file, documentType, uploadedDoc) => {
      try {
        console.log(`🔍 Starting background text extraction for ${documentType}`);
        const fileExt = file.name.split('.').pop().toLowerCase();
        let extractedText = '';
        
        if (fileExt === 'pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let textContent = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const txt = await page.getTextContent();
            textContent += txt.items.map(item => item.str).join(' ') + '\\n';
          }
          extractedText = textContent;
        } else if (["jpg", "jpeg", "png", "svg"].includes(fileExt)) {
          const imageData = await file.arrayBuffer();
          const blob = new Blob([imageData], { type: file.type });
          const imageUrl = URL.createObjectURL(blob);
          const result = await Tesseract.recognize(imageUrl, 'eng', {
            logger: m => console.log(m) // Optional: log OCR progress
          });
          extractedText = result.data.text;
          URL.revokeObjectURL(imageUrl);
        }
        
        // Update the document with extracted text
        if (extractedText.trim() && userId) {
          const updatedDoc = { ...uploadedDoc, extractedText };
          
          // Update local state
          setUploadedDocuments(prev => ({
            ...prev,
            [documentType]: updatedDoc
          }));
          
          // Update profile data
          setProfileData(prev => {
            if (!prev) return { documents: { [documentType]: updatedDoc } };
            return {
              ...prev,
              documents: {
                ...(prev.documents || {}),
                [documentType]: updatedDoc
              }
            };
          });
          
          // Update backend
          await fetch(`${BASE_API_URL}/api/update-document-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              documents: {
                ...((profileData && profileData.documents) || {}),
                [documentType]: updatedDoc
              }
            })
          });
          
          console.log(`✅ Background text extraction completed for ${documentType}`);
        }
      } catch (error) {
        console.warn(`Background text extraction failed for ${documentType}:`, error);
      }
    };

    // File compression utility
    const compressFile = async (file) => {
      return new Promise((resolve) => {
        if (file.type.startsWith('image/') && file.size > 1024 * 1024) { // Only compress images > 1MB
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          img.onload = () => {
            // Calculate new dimensions (max 1920px width/height)
            let { width, height } = img;
            const maxDim = 1920;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = (height * maxDim) / width;
                width = maxDim;
              } else {
                width = (width * maxDim) / height;
                height = maxDim;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
              (blob) => {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile.size < file.size ? compressedFile : file);
              },
              'image/jpeg',
              0.8 // 80% quality
            );
          };
          
          img.src = URL.createObjectURL(file);
        } else {
          resolve(file);
        }
      });
    };

    // Optimized document upload function
    const uploadDocument = async (file, documentType) => {
      if (!file) return null;

      // Check file size limit (10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setUpdateError(`File size too large. Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
        return null;
      }

      // Compress file if needed
      const processedFile = await compressFile(file);

      const originalSize = file.size;
      const finalFileSize = processedFile.size;
      const compressionSaved = originalSize - finalFileSize;

      if (compressionSaved > 0) {
        console.log(`🗜️ Compressed ${documentType}: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(finalFileSize / 1024 / 1024).toFixed(2)}MB (saved ${(compressionSaved / 1024 / 1024).toFixed(2)}MB)`);
      }

      console.log(`📤 Starting upload for ${documentType} - File size: ${(finalFileSize / 1024 / 1024).toFixed(2)}MB`);
      const startTime = Date.now();
      setUploadingDocument(documentType);

      try {
        // Skip text extraction for faster uploads - can be done in background later
        const extractedText = '';
        console.log('⚡ Skipping text extraction for faster upload (will be processed in background)');

        // Create unique filename
        const fileExt = processedFile.name.split('.').pop().toLowerCase();
        const timestamp = Date.now();
        const fileName = `${documentType}_${timestamp}.${fileExt}`;
        const userFolder = userId || "unknown";
        const filePath = `user_documents/${userFolder}/${fileName}`;

        // Upload to Supabase Storage with better error handling
        console.log('☁️ Starting Supabase upload...');
        const uploadStart = Date.now();

        const uploadResult = await supabase.storage
          .from('user-documents')
          .upload(filePath, processedFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadResult.error) {
          console.error('Upload failed:', uploadResult.error);
          setUpdateError('Upload failed: ' + uploadResult.error.message);
          return null;
        }

        console.log(`✅ Supabase upload completed in ${Date.now() - uploadStart}ms`);

        // Get public URL
        const { data: publicData } = supabase.storage
          .from('user-documents')
          .getPublicUrl(filePath);

        const publicUrl = publicData?.publicUrl;

        const uploadedDoc = {
          url: publicUrl,
          fileName: file.name, // Keep original name for user display
          filePath: filePath,
          uploadedAt: new Date().toISOString(),
          extractedText: extractedText, // Will be populated later
          fileSize: processedFile.size,
          originalSize: originalSize,
          fileType: fileExt,
          compressed: compressionSaved > 0
        };

        // Update UI immediately for better UX
        setUploadedDocuments(prev => ({
          ...prev,
          [documentType]: uploadedDoc
        }));

        // Merge with existing documents and update profile data
        let mergedDocuments = { ...((profileData && profileData.documents) || {}) };
        mergedDocuments[documentType] = uploadedDoc;
        setProfileData(prev => prev ? { ...prev, documents: mergedDocuments } : { documents: mergedDocuments });

        // Defer backend update and text extraction to background
        setTimeout(async () => {
          try {
            // Update backend with new document status
            if (userId) {
              console.log('🔄 Updating document status in background...');
              await fetch(`${BASE_API_URL}/api/update-document-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: userId,
                  documents: mergedDocuments
                })
              });
              console.log('✅ Document status updated in background');
            }

            // Extract text in background and update backend/UI
            await extractTextInBackground(file, documentType, uploadedDoc);
          } catch (err) {
            console.warn('Background document status update or text extraction failed:', err);
          }
        }, 100);

        console.log(`🎉 Upload completed in ${Date.now() - startTime}ms`);
        setUploadNotification({
          type: 'success',
          message: `Successfully uploaded ${file.name}! Text extraction in progress...`,
          timestamp: Date.now()
        });
        // Auto-hide notification after 5 seconds
        setTimeout(() => setUploadNotification(null), 5000);
        return uploadedDoc;
      } catch (error) {
        console.error(`Error uploading ${documentType}:`, error);
        return null;
      } finally {
        setUploadingDocument(null);
      }
    };

    // File upload component (copied from Register.jsx)
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
        <div className="mb-4">
          <label className="block text-[#1a0841] text-sm md:text-base font-medium mb-2">
            {label}
          </label>
          <div 
            onClick={uploadedDoc ? undefined : handleClick}
            className={`bg-[#f6f6fa] border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              uploadedDoc 
                ? 'border-green-400 bg-green-50' 
                : 'border-[#e6e6e6] cursor-pointer hover:border-[#6c47ff]'
            }`}
          >
            {isUploading && uploadingDocument === documentType ? (
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 text-[#6c47ff] mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-[#6c47ff] font-medium">Uploading...</span>
                </div>
                {documents[documentType] && (
                  <div className="text-xs text-gray-500 text-center">
                    {documents[documentType].name}<br/>
                    ({(documents[documentType].size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
                <div className="text-xs text-blue-600 font-medium">
                  ⚡ Optimized upload - processing in background
                </div>
              </div>
            ) : uploadedDoc ? (
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="text-green-700 text-sm font-medium">{uploadedDoc.fileName}</span>
                  </div>
                  {/* Removed 'Processing text...' indicator for cleaner UI */}
                  {uploadedDoc.fileSize && (
                    <span className="text-xs text-gray-500 ml-7 mt-1">
                      {(uploadedDoc.fileSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeFile(); }}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
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
  // ...existing code...
    // Registration form state (for demo/testing, can be removed if not needed)
    const [regForm, setRegForm] = useState({
      name: '',
      email: '',
      password: '',
      role: 'student',
      country: [],
      language: [],
      degreeLevel: '',
      gpa: '',
      languageScore: '',
      budget: '',
      schoolingCountry: '',
      bachelorCountry: '',
      masterCountry: '',
      documents: {}
    });
    const [sessionUser, setSessionUser] = useState(null);

    // Registration handler: onboarding pipeline first, then Supabase Auth
    const handleRegistration = async (formData) => {
      setUpdateError('');
      setUpdateSuccess('');
      setLoading(true);
      try {
        // 1. Run onboarding pipeline (table inserts)
        const onboardingResult = await processApplicationFromMetadata({
          user_metadata: { application_data: formData }
        }, true); // pass true to indicate direct form usage
        if (onboardingResult && onboardingResult.error) {
          setUpdateError('Registration failed: ' + onboardingResult.error);
          setUpdateSuccess('');
          setLoading(false);
          return;
        }
        // 2. If onboarding succeeds, register user in Supabase Auth
        const { email, password, name, role } = formData;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
              // Optionally, you can clear application_data here
            }
          }
        });
        if (error) {
          setUpdateError('Registration failed: ' + error.message);
          setUpdateSuccess('');
          setLoading(false);
          return;
        }
        setUpdateSuccess('Registration successful! Please check your email to verify your account.');
      } catch (err) {
        setUpdateError('Registration failed: ' + (err.message || err));
        setUpdateSuccess('');
      } finally {
        setLoading(false);
      }
    };

    // Simple registration form submit handler
    const onRegFormChange = e => {
      const { name, value } = e.target;
      setRegForm(f => ({ ...f, [name]: value }));
    };
    const onRegFormSubmit = async e => {
      e.preventDefault();
      await handleRegistration(regForm);
    };

    // ...existing state and logic below...
    const [userDetails, setUserDetails] = useState({ name: '', role: '', email: '' });
    const [onboardingInProgress, setOnboardingInProgress] = useState(false);
    const [editName, setEditName] = useState('');
    const [editing, setEditing] = useState(false);
    const [updateError, setUpdateError] = useState('');
    const [updateSuccess, setUpdateSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [fetchingData, setFetchingData] = useState(false);
    const [error, setError] = useState('');
    const [processingApplication, setProcessingApplication] = useState(false);
    const [applicationReport, setApplicationReport] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [reportUrl, setReportUrl] = useState(null);
    const [userReports, setUserReports] = useState([]);
    const [showUploadDropdown, setShowUploadDropdown] = useState(false);
    const [showUploadedFilesDropdown, setShowUploadedFilesDropdown] = useState(false);
    const [notification, setNotification] = useState(null);
    const navigate = useNavigate();
    const [showUploadSection, setShowUploadSection] = useState(false);
    const [uploadNotification, setUploadNotification] = useState(null);
    // Upgrade form document states
    const [hasFilledUpgradeForm, setHasFilledUpgradeForm] = useState(false);
    const [upgradeFormDocuments, setUpgradeFormDocuments] = useState({});
    const [uploadingUpgradeDocument, setUploadingUpgradeDocument] = useState('');
    const [showUpgradeDocsSection, setShowUpgradeDocsSection] = useState(false);
    const [activeAnalysisTab, setActiveAnalysisTab] = useState('strength');

    // ReportsList component (similar to AdminUserDetails)
    const ReportsList = ({ reports }) => {
      // Validate reports data
      const validReports = (reports || []).filter(report => 
        report && 
        report.file_name && 
        report.url && 
        report.user_id // Ensure all required fields exist
      );

      // SVG icon components
      const FileText = ({ className = "w-4 h-4" }) => (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
      );
      const Download = ({ className = "w-4 h-4" }) => (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      );
      const Eye = ({ className = "w-4 h-4" }) => (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
      );
      
      return (
        <div className="p-6 bg-[#f0eeff] rounded-xl shadow border border-indigo-100 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-[#1a0841]">
            <FileText className="w-6 h-6 text-[#6c47ff]" /> Submitted Reports ({validReports.length})
          </h3>
          
          {validReports.length === 0 ? (
            <div className="text-gray-500 italic">
              {reports && reports.length > 0 
                ? `Found ${reports.length} reports but some have invalid data. Contact support if needed.`
                : 'No reports found for this user.'
              }
            </div>
          ) : (
            <ul className="space-y-3">
              {validReports.map((report, idx) => {
                // Safely parse dates with fallbacks
                const createdDate = report.created_at 
                  ? new Date(report.created_at).toLocaleDateString()
                  : 'Unknown date';
                const generatedDate = report.generated_at 
                  ? new Date(report.generated_at).toLocaleDateString() 
                  : createdDate;
                
                return (
                  <li key={report.id || report.file_name + idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-red-500" />
                      <div>
                        <div className="font-medium text-sm">{report.file_name}</div>
                        <div className="text-xs text-gray-400">
                          {report.report_type && (
                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-2">
                              {report.report_type.replace(/_/g, ' ')}
                            </span>
                          )}
                          Generated: {generatedDate}
                        </div>
                      </div>
                    </div>
                    <div className="space-x-3 flex items-center">
                      <a href={report.url} target="_blank" rel="noopener noreferrer" 
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors p-1 rounded-md hover:bg-blue-100">
                        <Download className="w-4 h-4" /> Download
                      </a>
                      <button onClick={() => window.open(report.url, '_blank')} 
                              className="flex items-center gap-1 text-sm text-[#6c47ff] hover:text-[#4d36b8] font-medium transition-colors p-1 rounded-md hover:bg-[#efeafc]">
                        <Eye className="w-4 h-4" /> Preview
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      );
    };

    // Use the imported getCountryFlag function

    // Check document completion status
    const getDocumentStatus = (documents) => {
      if (!documents || typeof documents !== 'object') return 'not-started';
      
      const uploadedDocs = Object.values(documents).filter(doc => doc && doc.url);
      const totalRequiredDocs = 3; // diploma, transcripts, passport are most important
      
      if (uploadedDocs.length === 0) return 'not-started';
      if (uploadedDocs.length < totalRequiredDocs) return 'in-progress';
      return 'done';
    };

    // ...existing code...

    // Helper to extract report data from stored application_report
    function extractReportFromFormData(applicationReport) {
      if (!applicationReport) {
        console.warn('⚠️ No application report data found');
        return null;
      }
      
      console.log('📝 Raw application report:', applicationReport);
      
      // Handle both direct report objects and nested structures
      let report;
      if (applicationReport.summary) {
        report = applicationReport;
      } else {
        // If it's a nested structure, extract the actual report
        report = {
          summary: applicationReport.summary || {},
          eligible: applicationReport.eligible || [],
          ineligible: applicationReport.ineligible || [],
          profileAnalysis: applicationReport.profileAnalysis || 'Profile analysis not available.',
          visaReadiness: applicationReport.visaReadiness || 'Visa readiness assessment not available.',
          idealCategoryFit: applicationReport.idealCategoryFit || 'Category fit analysis not available.',
          dynamicSummary: applicationReport.dynamicSummary || 'Summary not available.',
          promotion: applicationReport.promotion || '',
          form: applicationReport.form || {},
          generated_at: applicationReport.generated_at || new Date().toISOString()
        };
      }
      
      // Add fallback data if summary is missing or empty
      if (!report.summary || Object.keys(report.summary).length === 0) {
        report.summary = {
          strengths: {
            academic: 'Not assessed',
            language: 'Not assessed', 
            financial: 'Not assessed'
          },
          overall_score: 'N/A'
        };
      }
      
      console.log('✅ Processed report for PDF:', report);
      return report;
    }

    // Simplified: Generate PDF, upload, and save report link
    async function uploadAndSavePDF(userId) {
      try {
        const report = extractReportFromFormData(profileData.application_report);
        console.log('📊 Generating PDF for report:', report?.summary ? 'Valid' : 'Invalid');
        
        if (!report || !report.summary) {
          console.error('❌ Invalid report data for PDF generation');
          return null;
        }
        
        console.log('🔧 Starting PDF generation...');
        const pdfBlob = await pdf(<ReportPDF report={report} />).toBlob();
        
        if (!pdfBlob || pdfBlob.size === 0) {
          console.error('❌ PDF generation failed - empty blob');
          return null;
        }
        
        console.log('✅ PDF generated successfully, size:', pdfBlob.size, 'bytes');
        
        // Validate PDF content by checking if it starts with PDF header
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const header = String.fromCharCode(...uint8Array.slice(0, 4));
        
        if (header !== '%PDF') {
          console.error('❌ Generated blob is not a valid PDF');
          return null;
        }
        
        return await uploadPDFBlob(report, userId, pdfBlob);
      } catch (err) {
        console.error('❌ Error in uploadAndSavePDF:', err);
        return null;
      }
    }

    // Upload a pre-generated PDF blob
    async function uploadPDFBlob(report, userId, pdfBlob) {
      try {
        const fileName = getPDFFileName(report);
        console.log('📄 Uploading PDF:', fileName, 'Size:', pdfBlob.size, 'bytes');
        
        // Upload PDF to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user_analysis_report')
          .upload(fileName, pdfBlob, { 
            contentType: 'application/pdf', 
            upsert: true,
            cacheControl: '3600'
          });
        
        if (uploadError) {
          console.error('❌ PDF upload error:', uploadError);
          // Try alternative bucket name if main one fails
          const { data: altUploadData, error: altUploadError } = await supabase.storage
            .from('reports')
            .upload(fileName, pdfBlob, { 
              contentType: 'application/pdf', 
              upsert: true,
              cacheControl: '3600'
            });
          
          if (altUploadError) {
            console.error('❌ Alternative bucket upload also failed:', altUploadError);
            return null;
          }
          console.log('✅ Upload successful to alternative bucket');
        } else {
          console.log('✅ Upload successful to main bucket:', uploadData);
        }
        
        // Get URL using PDF proxy for better CORS handling
        const proxyUrl = `https://elite-scholars-eight.vercel.app/api/pdf-proxy/${encodeURIComponent(fileName)}`;
        const urlData = { publicUrl: proxyUrl };
        
        console.log('📄 PDF uploaded and proxy URL created:', {
          fileName,
          proxyUrl,
          originalSize: pdfBlob.size
        });
        
        console.log('✅ Generated public URL:', urlData.publicUrl);
        
        // Insert report record with proper validation
        const userReportsPayload = {
          user_id: userId,
          file_name: fileName,
          url: urlData.publicUrl,
          report_type: 'application_analysis', // Set report type
          generated_at: new Date().toISOString() // When the report was generated
          // created_at and updated_at will be handled automatically by Supabase
        };
        
        console.log('📊 Inserting user report:', userReportsPayload);
        const { data: insertData, error: insertError } = await supabase
          .from('user_reports')
          .insert(userReportsPayload)
          .select(); // Return the inserted data for verification
        
        if (insertError) {
          console.error('❌ user_reports insert error:', insertError);
          return null;
        }
        
        console.log('✅ Successfully inserted report:', insertData);
        setReportUrl(urlData.publicUrl);
        return urlData.publicUrl;
      } catch (err) {
        console.error('Error in uploadPDFBlob:', err);
        return null;
      }
    }

    useEffect(() => {
      const fetchUserDetails = async () => {
        // Prevent duplicate calls
        if (fetchingData) {
          console.log('🔄 Already fetching user details, skipping...');
          return;
        }

        try {
          setFetchingData(true);
          setLoading(true);
          console.log('🚀 Starting fetchUserDetails...');

          const {
            data: { session },
          } = await supabase.auth.getSession();

          console.log('🔍 Session:', session?.user?.id || 'No session');


          // --- Onboarding trigger: check user_metadata for application_data (device-independent) ---
          if (session?.user) {
            setSessionUser(session.user);
            const email = session.user.email;
            const role = session.user.user_metadata?.role || 'student';
            const name = session.user.user_metadata?.name || session.user.email;

            setUserDetails({ name, role, email });
            setEditName(name);

            // Onboarding: process application data in user_metadata if present
            const applicationData = session.user.user_metadata?.application_data;
            if (applicationData) {
              try {
                console.log('🟢 Found application_data in user_metadata, running onboarding...');
                setOnboardingInProgress(true);
                setLoading(true); // Show loading spinner/message
                setNotification('Setting up your profile...');
                await processApplicationFromMetadata({
                  id: session.user.id,
                  email: session.user.email,
                  user_metadata: {
                    ...session.user.user_metadata,
                    application_data: applicationData,
                    name: session.user.user_metadata?.name,
                    role: session.user.user_metadata?.role
                  }
                });
                // Clear application_data from user_metadata after onboarding
                await supabase.auth.updateUser({ data: { application_data: null } });
                setNotification(null);
                setOnboardingInProgress(false);
                // Optionally, reload to show new data
                window.location.reload();
                return;
              } catch (onboardErr) {
                setNotification(null);
                setOnboardingInProgress(false);
                console.error('❌ Failed to process onboarding data from user_metadata:', onboardErr);
              }
            }

            // Fetch actual user data from user_roles table
            try {
              const { data: userRoleData, error: userRoleError } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

              if (userRoleError && userRoleError.code !== 'PGRST116') {
                console.error('Error fetching user role data:', userRoleError);
                // Don't show error for 406/permission issues
                if (!userRoleError.message?.includes('406') && !userRoleError.message?.includes('Not Acceptable')) {
                  setError(`Database error: ${userRoleError.message}`);
                }
              }

              if (userRoleData) {
                console.log('✅ Found user role data:', userRoleData);
                console.log('🟣 application_report:', userRoleData.application_report);
                // Check if user has a tracker, if not create one
                const { data: existingTracker, error: trackerCheckError } = await supabase
                  .from('application_tracker')
                  .select('user_id')
                  .eq('user_id', session.user.id);
                if (!trackerCheckError && (!existingTracker || existingTracker.length === 0)) {
                  console.log('🔧 User has profile but no tracker, creating tracker...');
                  // Always attempt tracker creation, even if application_report is missing
                  const trackerSteps = [{
                    notes: "Tracker created for existing profile",
                    created_at: new Date().toISOString(),
                    application_report: userRoleData.application_report || { note: 'No application report available' }
                  }];
                  const trackerPayload = {
                    user_id: session.user.id,
                    country: Array.isArray(userRoleData.target_countries) ? userRoleData.target_countries.join(', ') : userRoleData.target_countries || '',
                    steps: trackerSteps,
                    last_updated: new Date().toISOString(),
                    email: session.user.email,
                    name: userRoleData.name || session.user.user_metadata?.name || '',
                  };
                  if (!isValidUuid(trackerPayload.user_id)) {
                    console.error('❌ Skipping backfill tracker creation: invalid user_id', trackerPayload.user_id);
                    return;
                  }
                  try {
                    const trackerResponse = await fetch('https://elite-scholars-eight.vercel.app/api/create-user-tracker', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(trackerPayload)
                    });
                    const trackerResult = await trackerResponse.json();
                    console.log('🔧 Backfill tracker response:', trackerResponse.status, trackerResult);
                    if (trackerResponse.ok) {
                      console.log('✅ Successfully created tracker for existing user');
                    } else {
                      console.error('❌ Failed to create tracker for existing user:', trackerResult);
                    }
                  } catch (backfillError) {
                    console.error('❌ Failed to create backfill tracker:', backfillError);
                  }
                }
                setProfileData({
                  name: userRoleData.name,
                  email: userRoleData.email,
                  role: userRoleData.role,
                  gpa: userRoleData.gpa,
                  budget: userRoleData.budget,
                  language_score: userRoleData.language_score,
                  target_countries: userRoleData.target_countries,
                  languages: userRoleData.languages,
                  degree_level: userRoleData.degree_level,
                  documents: userRoleData.documents,
                  schooling_country: userRoleData.schooling_country,
                  bachelor_country: userRoleData.bachelor_country,
                  master_country: userRoleData.master_country,
                  application_report: userRoleData.application_report,
                  phone_number: userRoleData.phone_number,
                  whatsapp: userRoleData.whatsapp
                });
                // Also set application report if available
                if (userRoleData.application_report) {
                  setApplicationReport(userRoleData.application_report);
                }
              } else {
                console.log('❌ No user role data found, setting default profile data');
                setProfileData({
                  name: name,
                  email: email,
                  role: role,
                  gpa: null,
                  budget: null,
                  language_score: null,
                  target_countries: [],
                  languages: [],
                  degree_level: null,
                  documents: {},
                  schooling_country: null,
                  bachelor_country: null,
                  master_country: null,
                  application_report: null,
                  phone_number: null
                });
                // Don't set error - just show empty profile that user can fill
              }
            } catch (fetchErr) {
              console.error('Exception fetching user role data:', fetchErr);
              // Set basic profile data instead of showing error
              setProfileData({
                name: name,
                email: email,
                role: role,
                gpa: null,
                budget: null,
                language_score: null,
                target_countries: [],
                languages: [],
                degree_level: null,
                documents: {},
                schooling_country: null,
                bachelor_country: null,
                master_country: null,
                application_report: null,
                phone_number: null
              });
            }

            // Fetch user reports
            try {
              const { data: reportsData, error: reportsError } = await supabase
                .from('user_reports')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

              if (reportsError) {
                console.error('Error fetching user reports:', reportsError);
                setUserReports([]); // Set empty array instead of leaving undefined
              } else {
                setUserReports(reportsData || []);
              }
            } catch (reportsErr) {
              console.error('Exception fetching user reports:', reportsErr);
              setUserReports([]); // Set empty array instead of leaving undefined
            }
          } else {
            console.log('❌ No session found, redirecting to login');
            // No session - redirect to login
            window.location.href = '/login';
            return;
          }
        } catch (err) {
          console.error('❌ Exception in fetchUserDetails:', err);
          setError('Error loading profile data. Please refresh the page.');
        } finally {
          setLoading(false);
          setFetchingData(false);
        }
      };

      fetchUserDetails();
    }, []);

    // Failsafe: ensure loading is always set to false after a timeout
    useEffect(() => {
      const timer = setTimeout(() => {
        console.log('⏰ Loading timeout - forcing loading to false');
        setLoading(false);
        setFetchingData(false);
      }, 5000); // Increased to 5 seconds
      
      return () => clearTimeout(timer);
    }, []);

    const handleUpdateName = async () => {
      setUpdateError('');
      setUpdateSuccess('');
      if (!editName.trim()) {
        setUpdateError('Name cannot be empty.');
        return;
      }
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setUpdateError('No user session found.');
        setLoading(false);
        return;
      }
      
      // Update name in user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .update({ name: editName.trim() })
        .eq('user_id', session.user.id)
        .select();
      
      // Update name in Supabase Auth user_metadata
      const { data: metaData, error: metaError } = await supabase.auth.updateUser({
        data: { name: editName.trim() }
      });
      
      if (roleError || metaError) {
        setUpdateError(`Failed to update name: ${roleError?.message || metaError?.message || 'Unknown error'}`);
      } else {
        setUserDetails(prev => ({ ...prev, name: editName.trim() }));
        setUpdateSuccess('Name updated successfully!');
        setEditing(false);
      }
      setLoading(false);
    };

    // Ensure user_roles entry is created and application_report is always updated
    const ensureUserRoleAndReport = async (user, applicationData, report) => {
      // Ensure user_roles entry exists
      const { data: userRole, error: userRoleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (!userRole) {
        // Try to get phone/whatsapp from applicationData, localStorage, or metadata
        let phoneNumber = applicationData.phone_number || '';
        let whatsappNumber = applicationData.whatsapp || '';
        // Try localStorage if not present
        if (!phoneNumber || !whatsappNumber) {
          try {
            const pendingData = JSON.parse(localStorage.getItem('pendingApplicationData'));
            if (pendingData && pendingData.applicationData) {
              if (!phoneNumber && pendingData.applicationData.phone_number) phoneNumber = pendingData.applicationData.phone_number;
              if (!whatsappNumber && pendingData.applicationData.whatsapp) whatsappNumber = pendingData.applicationData.whatsapp;
            }
          } catch (e) { /* ignore */ }
        }
        // Try metadata as last resort
        if (!phoneNumber) phoneNumber = user.user_metadata?.phone || user.user_metadata?.phone_number || '';
        if (!whatsappNumber) whatsappNumber = user.user_metadata?.whatsapp || '';

        const { error: insertError } = await supabase.from('user_roles').insert({
          user_id: user.id,
          name: user.user_metadata?.name || user.email,
          email: user.email,
          role: user.user_metadata?.role || 'student',
          target_countries: applicationData.country || [],
          languages: applicationData.language || [],
          degree_level: applicationData.degreeLevel || '',
          gpa: applicationData.gpa || '',
          language_score: applicationData.languageScore || '',
          budget: applicationData.budget || '',
          documents: applicationData.documents || {},
          schooling_country: applicationData.schoolingCountry || '',
          bachelor_country: applicationData.bachelorCountry || '',
          master_country: applicationData.masterCountry || '',
          phone_number: phoneNumber,
          whatsapp: whatsappNumber
        });
        if (insertError) {
          console.error('Error inserting user_roles:', insertError);
        }
      }
      // Always update application_report in user_roles
      const { error: updateReportError } = await supabase
        .from('user_roles')
        .update({ application_report: report })
        .eq('user_id', user.id);
      if (updateReportError) {
        console.error('Error updating application_report:', updateReportError);
      }
    };

    if (loading || onboardingInProgress) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="flex flex-col items-center p-responsive">
              <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-500 font-medium text-responsive-sm">
                {notification ? notification : 'Loading dashboard...'}
              </p>
          </div>
        </div>
      );
    }

    // Show error if there's one
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-xs sm:max-w-md w-full bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-8 h-8 sm:w-12 sm:h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-responsive-base font-medium text-gray-900 mb-2">Error Loading Profile</h3>
              <p className="text-responsive-sm text-gray-600 mb-4">{error}</p>
              <button 
                onClick={() => {
                  setError('');
                  setLoading(true);
                  fetchUserDetails();
                }}
                className="btn-responsive bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50/50 font-sans text-gray-800 pb-8 sm:pb-12 ml-0 lg:ml-16" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* Upload Notification */}
        {uploadNotification && (
          <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 ${
            uploadNotification.type === 'success' ? 'border-green-500' : 'border-red-500'
          } transform transition-all duration-300 ease-in-out`}>
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {uploadNotification.type === 'success' ? (
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${
                    uploadNotification.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Document Upload
                  </p>
                  <p className={`text-sm mt-1 ${
                    uploadNotification.type === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {uploadNotification.message}
                  </p>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <button
                    onClick={() => setUploadNotification(null)}
                    className={`text-sm font-medium ${
                      uploadNotification.type === 'success' ? 'text-green-600 hover:text-green-500' : 'text-red-600 hover:text-red-500'
                    }`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="w-full px-5 sm:px-8 py-6">
            
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex-1">
                    <h1 className="text-responsive-2xl font-light text-[#1a0841] break-anywhere text-left">
                      Welcome back, <span className="font-semibold">{userDetails.name.split(' ')[0]}</span>
                    </h1>
                    <p className="text-gray-500 text-responsive-sm mt-1 text-left">Here is what's happening with your application today.</p>
                </div>
                {/* ...removed sign out button, now in sidebar... */}
            </header>

            {/* Quick Actions Grid */}
            <section className="grid grid-responsive-3 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
                {/* Tracker Card */}
                <div onClick={() => navigate('/application-tracker')} className="group bg-gradient-to-br from-[#6c47ff] to-[#5b3bdb] rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-purple-200 cursor-pointer relative overflow-hidden transition-all hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
                    </div>
                    <div className="relative z-10">
                        <div className="bg-white/20 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 backdrop-blur-sm">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <h3 className="text-responsive-base font-bold">Application Tracker</h3>
                        <p className="text-purple-100 text-responsive-xs mt-1">Track deadlines & progress.</p>
                    </div>
                </div>

                {/* AI Advisor Card */}
                <div onClick={() => navigate('/ai-advisor')} className="group bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-blue-200 cursor-pointer relative overflow-hidden transition-all hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                    </div>
                    <div className="relative z-10">
                        <div className="bg-white/20 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 backdrop-blur-sm">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        </div>
                        <h3 className="text-responsive-base font-bold">AI Advisor</h3>
                        <p className="text-blue-100 text-responsive-xs mt-1">Get instant answers to queries.</p>
                    </div>
                </div>

                {/* Courses Card */}
                <div onClick={() => navigate('/courses')} className="group bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-emerald-200 cursor-pointer relative overflow-hidden transition-all hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z"/></svg>
                    </div>
                    <div className="relative z-10">
                        <div className="bg-white/20 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 backdrop-blur-sm">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <h3 className="text-responsive-base font-bold">Explore Courses</h3>
                        <p className="text-emerald-100 text-responsive-xs mt-1">Find programs matching you.</p>
                    </div>
                </div>
            </section>

            {/* Main Content Layout */}
            <div className={`space-y-8 ${userDetails.role === 'advisor' || userDetails.role === 'admin' ? 'max-w-4xl mx-auto' : ''}`}>
                
                {/* First Row: Profile + AI Analysis Report */}
                <div className={`grid grid-cols-1 gap-6 ${userDetails.role === 'advisor' || userDetails.role === 'admin' ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
                    
                    {/* Profile Card - order 2 on mobile, order 1 on desktop */}
                    <div className="order-2 lg:order-1 lg:col-span-1 bg-[#f0eeff] rounded-2xl p-6 border border-indigo-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <h2 className="text-lg font-bold text-[#1a0841]">Profile</h2>
                            <button onClick={() => { if(editing) handleUpdateName(); else setEditing(true); }} className="text-sm font-medium text-purple-600 hover:bg-purple-50 px-3 py-1 rounded-lg transition">
                                {editing ? 'Save' : 'Edit'}
                            </button>
                        </div>                        <div className="flex flex-col items-center mb-6 relative z-10">
                            <div className="w-24 h-24 bg-gradient-to-tr from-purple-100 to-indigo-100 rounded-full flex items-center justify-center text-3xl font-bold text-purple-600 mb-3 border-4 border-slate-200 shadow-sm">
                                {userDetails.name.charAt(0)}
                            </div>
                            {editing ? (
                                <input 
                                    className="text-center border-b-2 border-purple-200 focus:border-purple-600 outline-none text-xl font-bold text-gray-900 bg-transparent w-full"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    autoFocus
                                />
                            ) : (
                                <h3 className="text-xl font-bold text-gray-900">{userDetails.name}</h3>
                            )}
                            <span className="mt-1 px-3 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full uppercase tracking-wide">
                                {userDetails.role}
                            </span>
                        </div>

                        <div className="space-y-3 relative z-10">
                            <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="text-sm font-medium text-gray-900 truncate" title={userDetails.email}>{userDetails.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="text-sm font-medium text-gray-900">{profileData?.phone_number || sessionUser?.user_metadata?.phone || 'Not provided'}</p>
                              </div>
                            </div>
                            <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.72 11.06a11.05 11.05 0 01-4.24-4.24l1.06-1.06a2 2 0 00-2.83-2.83l-1.06 1.06a2 2 0 00-.38 2.18c.36.8.8 1.56 1.32 2.28a13.07 13.07 0 004.24 4.24c.72.52 1.48.96 2.28 1.32a2 2 0 002.18-.38l1.06-1.06a2 2 0 00-2.83-2.83l-1.06 1.06z" /></svg>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">WhatsApp</p>
                                <p className="text-sm font-medium text-gray-900">{profileData?.whatsapp || sessionUser?.user_metadata?.whatsapp || 'Not provided'}</p>
                              </div>
                            </div>
                            <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Role</p>
                                    <p className="text-sm font-medium text-gray-900 capitalize">{userDetails.role}</p>
                                </div>
                            </div>
                            {(userDetails.role === 'student' || userDetails.role === 'user') && (
                                <>
                                    <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">GPA</p>
                                            <p className="text-sm font-medium text-gray-900">{profileData?.gpa || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mr-3">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Language Score</p>
                                            <p className="text-sm font-medium text-gray-900">{profileData?.language_score || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Budget</p>
                                            <p className="text-sm font-medium text-gray-900">{profileData?.budget ? `$${(profileData.budget / 1000).toFixed(1)}k` : 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500">Target Countries</p>
                                            <p className="text-sm font-medium text-gray-900">
                                              {(() => {
                                                let countries = [];
                                                if (Array.isArray(profileData?.target_countries) && profileData.target_countries.length > 0) {
                                                  countries = profileData.target_countries;
                                                } else if (Array.isArray(profileData?.country) && profileData.country.length > 0) {
                                                  countries = profileData.country;
                                                } else if (typeof profileData?.target_countries === 'string' && profileData.target_countries) {
                                                  countries = [profileData.target_countries];
                                                } else if (typeof profileData?.country === 'string' && profileData.country) {
                                                  countries = [profileData.country];
                                                }
                                                return countries.length > 0
                                                  ? countries.map(country => `${getCountryFlag(country)} ${country}`).join(', ')
                                                  : 'Not specified';
                                              })()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Degree Level</p>
                                            <p className="text-sm font-medium text-gray-900">{profileData?.degree_level || 'Not specified'}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        {updateError && <div className="text-red-600 text-xs mt-2 bg-red-50 rounded px-2 py-1 border border-red-200">{updateError}</div>}
                        {updateSuccess && <div className="text-green-600 text-xs mt-2 bg-green-50 rounded px-2 py-1 border border-green-200">{updateSuccess}</div>}
                    </div>

                    {/* AI Analysis Report - order 1 on mobile, order 2 on desktop */}
                    {(userDetails.role !== 'advisor' && userDetails.role !== 'admin') && (
                    <div className="order-1 lg:order-2 lg:col-span-2 bg-[#f0eeff] rounded-2xl border border-indigo-100 shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-[#1a0841]">AI Analysis Report</h2>
                        <button
                          onClick={async () => {
                            try {
                              // Find the AI analysis report (report_type: 'application_analysis')
                              const aiReport = userReports.find(r => r.report_type === 'application_analysis');
                              let url = aiReport?.url || reportUrl;
                              console.log('📋 Attempting to download AI analysis report:', { aiReport, reportUrl, url });
                              // If no URL found, try to generate new report
                              if (!url && profileData?.application_report) {
                                console.log('🔄 No existing URL, generating new report...');
                                const newUrl = await uploadAndSavePDF(userId);
                                if (newUrl) {
                                  url = newUrl;
                  console.log('✅ New report generated:', url);
                } else {
                  // Fallback: Generate PDF and download directly
                  console.log('📥 Storage upload failed, generating direct download...');
                  try {
                    const report = extractReportFromFormData(profileData.application_report);
                    const pdfBlob = await pdf(<ReportPDF report={report} />).toBlob();
                    const blobUrl = URL.createObjectURL(pdfBlob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = getPDFFileName(report);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(blobUrl);
                    return; // Exit early since we've handled the download
                  } catch (fallbackError) {
                    console.error('❌ Direct download also failed:', fallbackError);
                    alert('Unable to generate report. Please check your internet connection and try again.');
                    return;
                  }
                }
              }                              if (url) {
                                // Test if URL is accessible
                                try {
                                  const response = await fetch(url, { method: 'HEAD' });
                                  if (response.ok) {
                                    window.open(url, '_blank');
                                  } else {
                                    console.error('❌ Report URL not accessible:', response.status);
                                    alert('Report is not accessible. Please try generating a new report.');
                                  }
                                } catch (fetchError) {
                                  console.error('❌ Error accessing report URL:', fetchError);
                                  // Try opening anyway in case it's a CORS issue
                                  window.open(url, '_blank');
                                }
                              } else {
                                alert('No report available. Please complete your profile and try again.');
                              }
                            } catch (error) {
                              console.error('❌ Error downloading report:', error);
                              alert('Error downloading report. Please try again.');
                            }
                          }}
                          className="px-4 py-2 bg-[#6c47ff] hover:bg-[#5b3bdb] text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                          disabled={!profileData?.application_report}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Report
                        </button>
                      </div>

                      {/* Tab Bar */}
                      <div className="flex gap-1 bg-indigo-100/60 rounded-xl p-1 mb-6">
                        {[
                          { key: 'strength', label: 'Strength' },
                          { key: 'requirements', label: 'Requirements' },
                          { key: 'matches', label: 'Matches' },
                          { key: 'summary', label: 'Summary' },
                        ].map(tab => (
                          <button
                            key={tab.key}
                            onClick={() => setActiveAnalysisTab(tab.key)}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                              activeAnalysisTab === tab.key
                                ? 'bg-[#6c47ff] text-white shadow-sm'
                                : 'text-indigo-700 hover:bg-indigo-100'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                  <div className="flex flex-col gap-6">

                    {/* ── STRENGTH TAB ── */}
                    {activeAnalysisTab === 'strength' && (<>
                      <div className="bg-indigo-50/60 rounded-xl p-6 border border-indigo-100">
                        <h3 className="text-lg font-semibold text-[#1a0841] mb-4">Profile Strength Assessment</h3>
                        <div className="flex flex-wrap gap-6 justify-center">
                          <MetricCircle label="Academics" value={applicationReport?.summary?.strengths?.academic || (profileData?.gpa ? (parseFloat(profileData.gpa) >= 3.0 ? 'Strong' : (parseFloat(profileData.gpa) >= 2.0 ? 'Average' : 'Needs Improvement')) : 'Needs Improvement')} />
                          <MetricCircle label="Language" value={applicationReport?.summary?.strengths?.language || (profileData?.language_score ? (parseFloat(profileData.language_score) >= 7 ? 'Good' : (parseFloat(profileData.language_score) >= 5 ? 'Average' : 'Needs Improvement')) : 'Needs Improvement')} />
                          <MetricCircle label="Financial" value={applicationReport?.summary?.strengths?.financial || (profileData?.budget ? (parseFloat(profileData.budget) >= 15000 ? 'Good' : (parseFloat(profileData.budget) >= 8000 ? 'Average' : 'Needs Improvement')) : 'Needs Improvement')} />
                        </div>
                      </div>
                      <div className="bg-[#ebe7ff]/70 rounded-xl border border-indigo-100 p-6">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Academic Stats</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                            <p className="text-xs sm:text-sm text-gray-500 mb-1">GPA</p>
                            <p className="text-base sm:text-2xl font-bold text-blue-700">{profileData?.gpa || 'No data'}</p>
                          </div>
                          <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
                            <p className="text-xs sm:text-sm text-gray-500 mb-1">Budget</p>
                            <p className="text-base sm:text-2xl font-bold text-green-700">{profileData?.budget ? '$' + (profileData.budget / 1000).toFixed(1) + 'k' : 'No data'}</p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
                            <p className="text-xs sm:text-sm text-gray-500 mb-1">Language Score</p>
                            <div className="flex items-center justify-center gap-2">
                              <p className="text-base sm:text-2xl font-bold text-purple-700">{profileData?.language_score || 'No data'}</p>
                              <div className="h-6 w-8 bg-purple-200 rounded flex items-center justify-center text-purple-700 font-bold text-xs">A+</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Visa Readiness */}
                      <div className="flex items-center justify-between bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Visa Readiness</p>
                          <p className="text-xs text-gray-400 mt-0.5">Based on your profile completeness and eligibility</p>
                        </div>
                        <span className="px-3 py-1.5 rounded-lg text-sm font-bold bg-yellow-100 text-yellow-700">
                          {applicationReport?.visaReadiness || applicationReport?.summary?.visaReadiness || 'Check Profile'}
                        </span>
                      </div>

                      {/* Key Strengths & Recommendations */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl border border-gray-100 p-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Strengths</h4>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const academic = applicationReport?.summary?.strengths?.academic || (profileData?.gpa ? (parseFloat(profileData.gpa) >= 3.0 ? 'Strong' : (parseFloat(profileData.gpa) >= 2.0 ? 'Average' : 'Needs Improvement')) : null);
                              const language = applicationReport?.summary?.strengths?.language || (profileData?.language_score ? (parseFloat(profileData.language_score) >= 7 ? 'Good' : (parseFloat(profileData.language_score) >= 5 ? 'Average' : 'Needs Improvement')) : null);
                              const financial = applicationReport?.summary?.strengths?.financial || (profileData?.budget ? (parseFloat(profileData.budget) >= 15000 ? 'Good' : (parseFloat(profileData.budget) >= 8000 ? 'Average' : 'Needs Improvement')) : null);
                              const strengths = [];
                              if (academic === 'Strong') strengths.push('Strong Academics');
                              if (language === 'Good') strengths.push('Good Language Score');
                              if (financial === 'Good') strengths.push('Solid Budget');
                              if (academic === 'Average') strengths.push('Average Academics');
                              if (language === 'Average') strengths.push('Average Language');
                              if (financial === 'Average') strengths.push('Moderate Budget');
                              if (strengths.length === 0) strengths.push('Complete your profile');
                              return strengths.map((s, i) => (
                                <span key={i} className={`text-xs px-2 py-1 rounded-full border ${s.includes('Strong') || s.includes('Good') || s.includes('Solid') ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{s}</span>
                              ));
                            })()}
                          </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Next Steps</h4>
                          <ul className="space-y-1.5">
                            {(() => {
                              const steps = [];
                              if (!profileData?.gpa) steps.push('Add your GPA');
                              if (!profileData?.language_score) steps.push('Add language test score');
                              if (!profileData?.budget) steps.push('Add your budget');
                              const academic = profileData?.gpa ? (parseFloat(profileData.gpa) >= 3.0 ? 'Strong' : 'improve') : null;
                              const language = profileData?.language_score ? (parseFloat(profileData.language_score) >= 7 ? 'Good' : 'improve') : null;
                              if (academic === 'improve') steps.push('Strengthen your academic record');
                              if (language === 'improve') steps.push('Retake language test for higher score');
                              steps.push('Prepare documents early');
                              return steps.slice(0, 4).map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                  <span className="mt-0.5 w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                                  {s}
                                </li>
                              ));
                            })()}
                          </ul>
                        </div>
                      </div>
                    </>)}

                    {/* ── REQUIREMENTS TAB ── */}
                    {activeAnalysisTab === 'requirements' && (<>
                      <div className="bg-[#ebe7ff]/70 rounded-xl border border-indigo-100 p-6">
                        <h3 className="text-lg font-semibold text-[#1a0841] mb-4">Academic Requirements Analysis</h3>
                        <div className="block lg:hidden space-y-4 px-2">
                          {[
                            { dot: 'bg-orange-400', label: 'GPA vs Academic Requirement', rule: "HS completion / Bachelor's for Master, typical GPA 2.5-3.2+ (varies)", msg: profileData?.gpa ? `Your GPA (${profileData.gpa}) will be evaluated against program requirements.` : 'Your GPA data is not available. Please complete your profile.', msgColor: 'text-blue-600' },
                            { dot: 'bg-green-400', label: 'IELTS vs English Requirement', rule: 'IELTS 6.0-7.0 (varies by program — alternatives: TOEFL, Duolingo, PTE)', msg: profileData?.language_score ? `Your IELTS score (${profileData.language_score}) meets the requirement. Strong language proficiency.` : 'Your language test score is not available. Please complete your profile.', msgColor: 'text-blue-600' },
                            { dot: 'bg-blue-400', label: 'Budget vs Estimated Tuition', rule: 'Estimated tuition: $8,000-45,000', msg: profileData?.budget ? `Your budget ($${(profileData.budget / 1000).toFixed(1)}k) covers basic tuition. Consider additional living costs.` : 'Your budget information is not available. Please complete your profile.', msgColor: 'text-blue-600' },
                            { dot: 'bg-green-400', label: 'Country Preference', rule: `Target countries: ${((profileData?.country && Array.isArray(profileData.country) && profileData.country.length > 0 ? profileData.country : (profileData?.target_countries && Array.isArray(profileData.target_countries) ? profileData.target_countries : []))).join(', ') || 'None'}`, msg: `Perfect match! This aligns with your preference for ${((profileData?.country && Array.isArray(profileData.country) && profileData.country.length > 0 ? profileData.country : (profileData?.target_countries && Array.isArray(profileData.target_countries) ? profileData.target_countries : []))).join(', ') || 'your selected countries'}.`, msgColor: 'text-green-600' },
                            { dot: 'bg-purple-400', label: 'Level Match', rule: 'Available levels: Bachelor/Master', msg: 'Your intended level (Pathway) will be checked against program availability.', msgColor: 'text-blue-600' },
                          ].map((row, i) => (
                            <div key={i} className="bg-gray-50 rounded-lg border border-gray-100 p-3 sm:p-4 w-full">
                              <div className="flex items-center gap-2 mb-2"><div className={`w-2 h-2 ${row.dot} rounded-full`}></div><span className="text-sm font-semibold">{row.label}</span></div>
                              <div className="text-xs text-gray-500 mb-1 font-semibold">Rule</div>
                              <div className="text-[15px] text-gray-600 mb-2">{row.rule}</div>
                              <div className="text-xs text-gray-500 mb-1 font-semibold">Message</div>
                              <div className={`text-[15px] ${row.msgColor}`}>{row.msg}</div>
                            </div>
                          ))}
                        </div>
                        <div className="hidden lg:block overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead><tr className="border-b border-gray-200"><th className="text-left p-3 font-semibold text-gray-700">Case</th><th className="text-left p-3 font-semibold text-gray-700">Rule</th><th className="text-left p-3 font-semibold text-gray-700">Message</th></tr></thead>
                            <tbody>
                              <tr className="border-b border-gray-100"><td className="p-3"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-400 rounded-full"></div><span className="text-sm">GPA vs Academic Requirement</span></div></td><td className="p-3 text-sm text-gray-600">HS completion / Bachelor's for Master, typical GPA 2.5-3.2+ (varies)</td><td className="p-3 text-sm text-blue-600">{profileData?.gpa ? `Your GPA (${profileData.gpa}) will be evaluated against program requirements.` : 'Your GPA data is not available. Please complete your profile.'}</td></tr>
                              <tr className="border-b border-gray-100"><td className="p-3"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full"></div><span className="text-sm">IELTS vs English Requirement</span></div></td><td className="p-3 text-sm text-gray-600">IELTS 6.0-7.0 (varies by program — alternatives: TOEFL, Duolingo, PTE)</td><td className="p-3 text-sm text-blue-600">{profileData?.language_score ? `Your IELTS score (${profileData.language_score}) meets the requirement. Strong language proficiency.` : 'Your language test score is not available. Please complete your profile.'}</td></tr>
                              <tr className="border-b border-gray-100"><td className="p-3"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-400 rounded-full"></div><span className="text-sm">Budget vs Estimated Tuition</span></div></td><td className="p-3 text-sm text-gray-600">Estimated tuition: $8,000-45,000</td><td className="p-3 text-sm text-blue-600">{profileData?.budget ? `Your budget ($${(profileData.budget / 1000).toFixed(1)}k) covers basic tuition. Consider additional living costs.` : 'Your budget information is not available. Please complete your profile.'}</td></tr>
                              <tr className="border-b border-gray-100"><td className="p-3"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full"></div><span className="text-sm">Country Preference</span></div></td><td className="p-3 text-sm text-gray-600">Target countries: {((profileData?.country && Array.isArray(profileData.country) && profileData.country.length > 0 ? profileData.country : (profileData?.target_countries && Array.isArray(profileData.target_countries) ? profileData.target_countries : []))).join(', ') || 'None'}</td><td className="p-3 text-sm text-green-600">Perfect match! This aligns with your preference for {((profileData?.country && Array.isArray(profileData.country) && profileData.country.length > 0 ? profileData.country : (profileData?.target_countries && Array.isArray(profileData.target_countries) ? profileData.target_countries : []))).join(', ') || 'your selected countries'}.</td></tr>
                              <tr><td className="p-3"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-purple-400 rounded-full"></div><span className="text-sm">Level Match</span></div></td><td className="p-3 text-sm text-gray-600">Available levels: Bachelor/Master</td><td className="p-3 text-sm text-blue-600">Your intended level (Pathway) will be checked against program availability.</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>)}

                    {/* ── MATCHES TAB ── */}
                    {activeAnalysisTab === 'matches' && (<>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
                          <span className="text-sm font-medium text-gray-600">Visa Readiness</span>
                          <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-700">{applicationReport?.visaReadiness || applicationReport?.summary?.visaReadiness || 'Check'}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Strengths</h4>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const strengths = [];
                              const academic = applicationReport?.summary?.strengths?.academic || (profileData?.gpa ? (parseFloat(profileData.gpa) >= 3.0 ? 'Strong' : (parseFloat(profileData.gpa) >= 2.0 ? 'Average' : 'Needs Improvement')) : null);
                              const language = applicationReport?.summary?.strengths?.language || (profileData?.language_score ? (parseFloat(profileData.language_score) >= 7 ? 'Good' : (parseFloat(profileData.language_score) >= 5 ? 'Average' : 'Needs Improvement')) : null);
                              const financial = applicationReport?.summary?.strengths?.financial || (profileData?.budget ? (parseFloat(profileData.budget) >= 15000 ? 'Good' : (parseFloat(profileData.budget) >= 8000 ? 'Average' : 'Needs Improvement')) : null);
                              if (academic === 'Strong') strengths.push('Strong Academic Background');
                              if (language === 'Good') strengths.push('Good Language Skills');
                              if (financial === 'Good') strengths.push('Adequate Financial Support');
                              if (academic === 'Average') strengths.push('Average Academics');
                              if (language === 'Average') strengths.push('Average Language Skills');
                              if (financial === 'Average') strengths.push('Average Financial Support');
                              if (academic === 'Needs Improvement') strengths.push('Academics Need Improvement');
                              if (language === 'Needs Improvement') strengths.push('Language Skills Need Improvement');
                              if (financial === 'Needs Improvement') strengths.push('Financial Support Needs Improvement');
                              if (strengths.length === 0) strengths.push('No strengths detected. Complete your profile.');
                              return strengths.map((s, i) => (<span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100">{s}</span>));
                            })()}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Recommendations</h4>
                          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 ml-1">
                            {(() => {
                              const recs = [];
                              const academic = applicationReport?.summary?.strengths?.academic || (profileData?.gpa ? (parseFloat(profileData.gpa) >= 3.0 ? 'Strong' : (parseFloat(profileData.gpa) >= 2.0 ? 'Average' : 'Needs Improvement')) : null);
                              const language = applicationReport?.summary?.strengths?.language || (profileData?.language_score ? (parseFloat(profileData.language_score) >= 7 ? 'Good' : (parseFloat(profileData.language_score) >= 5 ? 'Average' : 'Needs Improvement')) : null);
                              const financial = applicationReport?.summary?.strengths?.financial || (profileData?.budget ? (parseFloat(profileData.budget) >= 15000 ? 'Good' : (parseFloat(profileData.budget) >= 8000 ? 'Average' : 'Needs Improvement')) : null);
                              if (academic === 'Needs Improvement') recs.push('Consider improving your GPA or academic record for better university options.');
                              if (language === 'Needs Improvement') recs.push('Consider improving your language test scores for better university options.');
                              if (financial === 'Needs Improvement') recs.push('Consider increasing your available budget or seeking scholarships.');
                              if (!profileData?.gpa) recs.push('Add your GPA to get more accurate recommendations.');
                              if (!profileData?.language_score) recs.push('Add your language test score for better matching.');
                              if (!profileData?.budget) recs.push('Add your budget to see financial fit.');
                              recs.push('Prepare all required documents early to meet application deadlines.');
                              recs.push('Research scholarship opportunities to reduce financial burden.');
                              return recs.map((r, i) => <li key={i}>{r}</li>);
                            })()}
                          </ul>
                        </div>
                      </div>
                      <div className="bg-[#ebe7ff]/70 rounded-xl border border-indigo-100 p-6">
                        <h3 className="text-lg font-semibold text-[#1a0841] mb-4">Top University Matches</h3>
                        <div className="space-y-3">
                          {(() => {
                            const countries = (profileData?.country && Array.isArray(profileData.country) && profileData.country.length > 0 ? profileData.country : (profileData?.target_countries && Array.isArray(profileData.target_countries) ? profileData.target_countries : []));
                            const hasRequiredData = profileData?.gpa && profileData?.language_score && profileData?.budget && countries.length > 0;
                            if (!hasRequiredData) {
                              return (
                                <div className="text-center py-8">
                                  <div className="text-gray-400 mb-4"><svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                                  <h4 className="text-lg font-semibold text-gray-600 mb-2">Complete Your Profile</h4>
                                  <p className="text-gray-500 mb-4">To see university matches, please complete your profile with:</p>
                                  <div className="space-y-2 text-sm text-gray-600">
                                    {!profileData?.gpa && <div>• GPA/Academic scores</div>}
                                    {!profileData?.language_score && <div>• Language test scores (IELTS/TOEFL)</div>}
                                    {!profileData?.budget && <div>• Budget information</div>}
                                    {countries.length === 0 && <div>• Target countries</div>}
                                  </div>
                                  <button onClick={() => window.location.href = '/register'} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">Complete Profile</button>
                                </div>
                              );
                            }
                            const universityMatches = applicationReport?.eligible || [];
                            if (universityMatches.length === 0) {
                              return (
                                <div className="text-center py-8">
                                  <div className="text-gray-400 mb-4"><svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                                  <h4 className="text-lg font-semibold text-gray-600 mb-2">No Matches Found</h4>
                                  <p className="text-gray-500 mb-4">We couldn't find universities that match your current criteria.</p>
                                  <div className="bg-blue-50 rounded-lg p-4 mb-4"><h5 className="font-semibold text-blue-800 mb-2">Your Current Profile:</h5><div className="text-sm text-blue-700 space-y-1"><div>• GPA: {profileData?.gpa}</div><div>• Language Score: {profileData?.language_score}</div><div>• Budget: ${(profileData?.budget / 1000).toFixed(1)}k</div><div>• Target Countries: {countries.join(', ')}</div></div></div>
                                  <div className="flex gap-3 mt-6 justify-center">
                                    <button onClick={() => window.location.href = '/register'} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">Update Profile</button>
                                    <button onClick={() => window.location.href = '/ai-advisor'} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Get AI Advice</button>
                                  </div>
                                </div>
                              );
                            }
                            return universityMatches.slice(0, 5).map((university, index) => {
                              const isLocked = index >= 2;
                              return (
                                <div key={index} className={`flex items-center justify-between p-4 rounded-xl border ${isLocked ? 'bg-gray-100 border-gray-300 opacity-70' : 'bg-green-50 border-green-200'}`}>
                                  <div className="flex items-center gap-4">
                                    <span className="font-bold text-lg text-[#1a0841] w-6">{index + 1}.</span>
                                    <div>
                                      <span className="font-semibold text-[#1a0841] block">{isLocked ? <span className="flex items-center gap-1"><svg className="w-4 h-4 text-gray-500 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17a2 2 0 002-2v-2a2 2 0 00-2-2 2 2 0 00-2 2v2a2 2 0 002 2zm6 0V9a6 6 0 10-12 0v8a2 2 0 002 2h8a2 2 0 002-2z" /></svg>Locked</span> : (university.Name || university.name)}</span>
                                      <span className="text-sm text-gray-500 flex items-center gap-1 mt-1">{isLocked ? <span className="text-gray-400">Upgrade to unlock</span> : <><span>{getCountryFlag(university.Country || university.country)}</span>{university.Country || university.country}</>}</span>
                                    </div>
                                  </div>
                                  {!isLocked && university.matchPercentage !== undefined && (<span className="text-2xl font-bold text-[#6c47ff]">{university.matchPercentage}%</span>)}
                                  {isLocked && (<span className="flex items-center gap-1 text-gray-400 font-semibold"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17a2 2 0 002-2v-2a2 2 0 00-2-2 2 2 0 00-2 2v2a2 2 0 002 2zm6 0V9a6 6 0 10-12 0v8a2 2 0 002 2h8a2 2 0 002-2z" /></svg>Locked</span>)}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                        <h3 className="text-lg font-medium text-[#1a0841] mb-4 text-center">Acceptance by Country</h3>
                        <div className="flex flex-wrap gap-6 justify-center">
                          {(profileData?.country && Array.isArray(profileData.country) && profileData.country.length > 0 ? profileData.country : (profileData?.target_countries && Array.isArray(profileData.target_countries) ? profileData.target_countries : [])).map((country, idx) => (
                            <div key={country + idx} className="flex flex-col items-center gap-2">
                              <div className="relative w-20 h-20">
                                <svg className="w-full h-full transform -rotate-90"><circle cx="40" cy="40" r="28" fill="none" stroke="#f3f4f6" strokeWidth="6" /><circle cx="40" cy="40" r="28" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray={2 * Math.PI * 28} strokeDashoffset={2 * Math.PI * 28 - (2 * Math.PI * 28 * 76 / 100)} strokeLinecap="round" className="transition-all duration-1000 ease-out" /></svg>
                                <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-800 text-sm">76%</div>
                              </div>
                              <div className="text-center"><div className="text-sm font-semibold text-gray-800 flex items-center justify-center gap-1"><span>{getCountryFlag(country)}</span><span className="truncate max-w-[80px]">{country}</span></div><div className="text-xs text-gray-500">150/150 Eligible</div></div>
                            </div>
                          ))}
                          {((!profileData?.country || profileData.country.length === 0) && (!profileData?.target_countries || profileData.target_countries.length === 0)) && (<div className="text-gray-500 italic">No country data available.</div>)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 text-center">Report generated on: {new Date().toLocaleDateString()}</div>
                    </>)}

                    {/* ── SUMMARY TAB ── */}
                    {activeAnalysisTab === 'summary' && (<>
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold text-[#1a0841] mb-3">Summary</h4>
                          <p className="text-gray-700 leading-relaxed">
                            {(() => {
                              const academic = applicationReport?.summary?.strengths?.academic || (profileData?.gpa ? (parseFloat(profileData.gpa) >= 3.0 ? 'Strong' : (parseFloat(profileData.gpa) >= 2.0 ? 'Average' : 'Needs Improvement')) : null);
                              const language = applicationReport?.summary?.strengths?.language || (profileData?.language_score ? (parseFloat(profileData.language_score) >= 7 ? 'Good' : (parseFloat(profileData.language_score) >= 5 ? 'Average' : 'Needs Improvement')) : null);
                              const financial = applicationReport?.summary?.strengths?.financial || (profileData?.budget ? (parseFloat(profileData.budget) >= 15000 ? 'Good' : (parseFloat(profileData.budget) >= 8000 ? 'Average' : 'Needs Improvement')) : null);
                              if (academic === 'Strong' && language === 'Good' && financial === 'Good') return 'Great news! Based on your profile, you are eligible for many colleges in our database. Your academic, language, and financial strengths have opened up promising opportunities.';
                              if (academic === 'Needs Improvement' || language === 'Needs Improvement' || financial === 'Needs Improvement') return 'Some areas of your profile need improvement. Focus on academics, language, or financials to increase your eligibility for more colleges.';
                              return 'Your profile is average. Improving any weak areas will help you unlock more opportunities.';
                            })()}
                          </p>
                        </div>
                        <div className="bg-[#f0eeff] rounded-lg p-4 border border-purple-200">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-2 sm:mb-0">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-base sm:text-lg font-semibold text-purple-800 mb-1 sm:mb-2">Unlock Your Full Potential</h5>
                              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">Unlock the full list of eligible colleges, detailed insights, and personalized recommendations by upgrading to our paid subscription. Get expert guidance and maximize your chances for admission!</p>
                            </div>
                            <button className="mt-2 sm:mt-0 w-full sm:w-auto px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 text-sm sm:text-base whitespace-nowrap" onClick={() => navigate('/upgrade-plan')}>Upgrade Now</button>
                          </div>
                        </div>
                      </div>
                    </>)}

                  </div>
                </div>
                    )}
                </div>

                {/* Upgrade Form Documents Section - Only show if user has filled upgrade form */}
                {hasFilledUpgradeForm && (
                  <div className="bg-[#f0eeff] rounded-2xl border border-indigo-100 shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h2 className="text-xl font-bold text-[#1a0841]">Upgrade Form Documents</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {Object.keys(upgradeFormDocuments).length} uploaded
                        </span>
                        <button
                          onClick={() => setShowUpgradeDocsSection(!showUpgradeDocsSection)}
                          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <svg className={`w-5 h-5 transition-transform ${showUpgradeDocsSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {showUpgradeDocsSection && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Upload Interface */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Additional Documents</h3>
                          <div className="space-y-3">
                            {UPGRADE_DOCUMENT_TYPES.map((docType) => (
                              <UpgradeFileUploadField 
                                key={docType.key}
                                label={docType.label}
                                documentType={docType.key}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Right: Uploaded Documents List */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Uploaded Files</h3>
                          {Object.keys(upgradeFormDocuments).length > 0 ? (
                            <div className="space-y-3">
                              {Object.values(upgradeFormDocuments).map((doc, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                  <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <div>
                                      <p className="text-sm font-medium text-gray-800">{doc.fileName}</p>
                                      <p className="text-xs text-gray-500">
                                        {new Date(doc.uploadedAt).toLocaleDateString()} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = doc.url;
                                        link.download = doc.fileName;
                                        link.target = '_blank';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Download document"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => window.open(doc.url, '_blank')}
                                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                      title="View document"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-sm text-gray-500 mt-2">No upgrade documents uploaded yet</p>
                              <p className="text-xs text-gray-400">Upload documents to enhance your upgrade form submission</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Upload notification for upgrade docs */}
                    {uploadNotification && uploadingUpgradeDocument && (
                      <div className={`mt-4 p-4 rounded-lg border ${
                        uploadNotification.type === 'success' 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}>
                        <p className="text-sm font-medium">{uploadNotification.message}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Regular Documents Section */}
                <div className="bg-[#f0eeff] rounded-2xl border border-indigo-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#1a0841]">Documents</h2>
                    <span className="text-sm text-gray-500">
                      {Object.keys(profileData?.documents || {}).length}/{DOCUMENT_TYPES.length} uploaded
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Progress & Upload */}
                    <div className="lg:col-span-1">
                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>Profile Completion</span>
                          <span>{Math.round((Object.keys(profileData?.documents || {}).length / DOCUMENT_TYPES.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500" 
                            style={{width: `${Math.round((Object.keys(profileData?.documents || {}).length / DOCUMENT_TYPES.length) * 100)}%`}}
                          ></div>
                        </div>
                      </div>

                      {/* Quick Upload Area with Dropdown */}
                      <div className="relative">
                        <div 
                          onClick={() => setShowUploadSection(!showUploadSection)}
                          className="p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-purple-400 hover:bg-purple-50 transition-colors cursor-pointer"
                        >
                          <div className="text-center">
                            <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-900">Upload Documents</p>
                              <p className="text-xs text-gray-500">Click to choose document type</p>
                            </div>
                            <div className="flex items-center justify-center mt-2">
                              <span className="text-xs text-purple-600 font-medium">Choose Document Type</span>
                              <svg 
                                className={`ml-1 h-4 w-4 text-purple-600 transition-transform duration-200 ${showUploadSection ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Dropdown Menu for Document Types */}
                        {showUploadSection && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                            <div className="p-4">
                              <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Select Document to Upload</h3>
                              <div className="space-y-3">
                                {DOCUMENT_TYPES.filter(doc => {
                                  const existingDoc = uploadedDocuments[doc.key] || profileData?.documents?.[doc.key];
                                  return !existingDoc || !existingDoc.url;
                                }).map(doc => (
                                  <div 
                                    key={doc.key}
                                    className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Create a hidden file input and trigger it
                                      const fileInput = document.createElement('input');
                                      fileInput.type = 'file';
                                      fileInput.accept = '.pdf,.jpg,.jpeg,.png,.svg';
                                      fileInput.onchange = async (event) => {
                                        const file = event.target.files[0];
                                        if (file) {
                                          await uploadDocument(file, doc.key);
                                          setShowUploadSection(false); // Close dropdown after upload
                                        }
                                      };
                                      fileInput.click();
                                    }}
                                  >
                                    <div className="flex items-start">
                                      <div className="flex-shrink-0 mr-3 mt-1">
                                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                          </svg>
                                        </div>
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{doc.label}</p>
                                        <p className="text-xs text-gray-500 mt-1">Click to upload • PDF, JPG, PNG, SVG (10MB max)</p>
                                        {uploadingDocument === doc.key && (
                                          <div className="flex items-center mt-2">
                                            <svg className="animate-spin h-4 w-4 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="text-xs text-purple-600 font-medium">Uploading...</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {DOCUMENT_TYPES.filter(doc => {
                                  const existingDoc = uploadedDocuments[doc.key] || profileData?.documents?.[doc.key];
                                  return !existingDoc || !existingDoc.url;
                                }).length === 0 && (
                                  <div className="text-center py-4">
                                    <svg className="mx-auto h-8 w-8 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm font-medium text-green-700">All documents uploaded!</p>
                                    <p className="text-xs text-gray-500">Your profile is complete.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle & Right: Document Lists */}
                    <div className="lg:col-span-2">
                      {/* Uploaded Documents List */}
                      <div className="mb-6">
                        <button
                          onClick={() => setShowUploadedFilesDropdown(!showUploadedFilesDropdown)}
                          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100 hover:border-blue-200 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-lg font-semibold text-gray-700">Uploaded Files</span>
                            {Object.keys(profileData?.documents || {}).length > 0 && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                                {Object.keys(profileData?.documents || {}).length}
                              </span>
                            )}
                          </div>
                          {showUploadedFilesDropdown ? (
                            <svg className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                        
                        {showUploadedFilesDropdown && (
                          <div className="mt-4 space-y-4 pl-4">
                            {Object.keys(profileData?.documents || {}).length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DocumentsList 
                                  documents={profileData?.documents || {}} 
                                  userId={userId} 
                                  userEmail={userDetails?.email} 
                                />
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm text-gray-500 mt-2">No documents uploaded yet</p>
                                <p className="text-xs text-gray-400">Upload your first document to get started</p>
                              </div>
                            )}

                            {/* Missing Documents Alert */}
                            {Object.keys(profileData?.documents || {}).length < DOCUMENT_TYPES.length && Object.keys(profileData?.documents || {}).length > 0 && (
                              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-start">
                                  <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-yellow-800">
                                      {DOCUMENT_TYPES.length - Object.keys(profileData?.documents || {}).length} documents still needed
                                    </p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                      Complete your profile to improve your application success rate.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                      
                      {/* Admin Sent Documents */}
                      <div>
                        <AdminSentDocuments userId={userId} />
                      </div>
                    </div>
                  </div>
                </div>
            </div>
        </div>
      </div>
    );
  }
                
