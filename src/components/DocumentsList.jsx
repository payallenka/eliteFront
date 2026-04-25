import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Inline SVG icon components (copied from AdminUserDetails.jsx)
const Download = ({ className = "w-4 h-4" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const Eye = ({ className = "w-4 h-4" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/></svg>
);

export default function DocumentsList({ documents, userId, userEmail, showOnlyRegistrationAndUpgrade }) {
  const [allDocuments, setAllDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllDocuments = async () => {
      console.log('[DocumentsList] Fetching documents for userId:', userId);
      console.log('[DocumentsList] Documents from DB:', documents);
      
      if (!userId) {
        console.log('[DocumentsList] No userId provided, skipping fetch');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const combinedDocs = [];
        
        // 1. Get documents from user_roles.documents field
        const uploadedDocsFromDB = Object.entries(documents || {}).filter(([key, doc]) => doc && doc.url);
        uploadedDocsFromDB.forEach(([key, doc]) => {
          combinedDocs.push({
            id: `db-${key}`,
            name: doc.fileName || key,
            type: key,
            url: doc.url,
            uploadedAt: doc.uploadedAt || 'Unknown',
            source: 'Database (user_roles)',
            category: 'Profile Documents'
          });
        });

        // 2. Get documents from user-uploads bucket (registration and upgrade)
        console.log('[DocumentsList] Fetching from user-uploads bucket for userId:', userId);
        try {
          // Upgrade documents (root of user-uploads)
          const { data: storageFiles, error: storageError } = await supabase.storage
            .from('user-uploads')
            .list(userId, {
              limit: 100,
              offset: 0
            });
          console.log('[DocumentsList] user-uploads result:', { storageFiles, storageError });
          if (!storageError && storageFiles) {
            for (const file of storageFiles) {
              const { data: urlData } = supabase.storage
                .from('user-uploads')
                .getPublicUrl(`${userId}/${file.name}`);
              if (urlData?.publicUrl) {
                const normalizedName = file.name.replace(/[_\s]+/g, '').toLowerCase();
                let docType = 'other';
                if (normalizedName.includes('diploma')) docType = 'diploma';
                else if (normalizedName.includes('transcript')) docType = 'transcript';
                else if (normalizedName.includes('passport')) docType = 'passport';
                else if (normalizedName.includes('enrollment')) docType = 'enrollment';
                combinedDocs.push({
                  id: `storage-user-uploads-${file.name}`,
                  name: file.name,
                  type: docType,
                  url: urlData.publicUrl,
                  uploadedAt: file.updated_at || file.created_at || 'Unknown',
                  source: 'Storage (user-uploads)',
                  category: 'Upgrade Documents',
                  size: file.metadata?.size ? `${Math.round(file.metadata.size / 1024)}KB` : null
                });
              }
            }
          }
          // Upgrade plan docs (user-uploads/{userId}/upgrade-forms/)
          const { data: upgradeFiles, error: upgradeError } = await supabase.storage
            .from('user-uploads')
            .list(`${userId}/upgrade-forms/`, {
              limit: 100,
              offset: 0
            });
          console.log('[DocumentsList] user-uploads upgrade-forms result:', { upgradeFiles, upgradeError });
          if (!upgradeError && upgradeFiles) {
            for (const file of upgradeFiles) {
              const { data: urlData } = supabase.storage
                .from('user-uploads')
                .getPublicUrl(`${userId}/upgrade-forms/${file.name}`);
              let docType = 'additional_docs';
              if (file.name.includes('transcript')) docType = 'updated_transcripts';
              else if (file.name.includes('financial')) docType = 'financial_statements';
              else if (file.name.includes('sop')) docType = 'sop';
              else if (file.name.includes('recommendation')) docType = 'recommendation_letters';
              else if (file.name.includes('portfolio')) docType = 'portfolio';
              if (urlData?.publicUrl) {
                combinedDocs.push({
                  id: `storage-user-uploads-upgrade-${file.name}`,
                  name: file.name,
                  type: docType,
                  url: urlData.publicUrl,
                  uploadedAt: file.updated_at || file.created_at || 'Unknown',
                  source: 'Storage (user-uploads/upgrade-forms)',
                  category: 'Upgrade Documents',
                  size: file.metadata?.size ? `${Math.round(file.metadata.size / 1024)}KB` : null
                });
              }
            }
          }
        } catch (storageError) {
          console.warn('Could not fetch storage documents:', storageError);
        }

        // 3. Get documents from user-documents bucket (registration uploads)
        console.log('[DocumentsList] Fetching from user-documents bucket for userId:', userId);
        console.log('[DocumentsList] userEmail received:', userEmail);
        // Try all possible folder structures for admin
        const possibleFolders = [
          `user_documents/${userId}`,
          userId,
        ];
        // If userEmail is available, add those as well
        if (userEmail) {
          possibleFolders.push(`user_documents/${userEmail}`);
          possibleFolders.push(userEmail);
        }
        for (const folder of possibleFolders) {
          try {
            const { data: regFiles, error: regError } = await supabase.storage
              .from('user-documents')
              .list(folder, {
                limit: 100,
                offset: 0
              });
            console.log(`[DocumentsList] user-documents result for folder ${folder}:`, { regFiles, regError });
            if (!regError && regFiles) {
              for (const file of regFiles) {
                const { data: urlData } = supabase.storage
                  .from('user-documents')
                  .getPublicUrl(`${folder}/${file.name}`);
                if (urlData?.publicUrl) {
                  combinedDocs.push({
                    id: `storage-user-documents-${folder}-${file.name}`,
                    name: file.name,
                    type: file.name.includes('diploma') ? 'diploma' : 
                          file.name.includes('transcript') ? 'transcript' :
                          file.name.includes('passport') ? 'passport' :
                          file.name.includes('enrollment') ? 'enrollment' : 'other',
                    url: urlData.publicUrl,
                    uploadedAt: file.updated_at || file.created_at || 'Unknown',
                    source: `Storage (user-documents/${folder})`,
                    category: 'Registration Documents',
                    size: file.metadata?.size ? `${Math.round(file.metadata.size / 1024)}KB` : null
                  });
                }
              }
            }
          } catch (regError) {
            console.warn(`[DocumentsList] Could not fetch registration documents for folder ${folder}:`, regError);
          }
        }

        // Remove duplicates based on similar names or URLs
        const uniqueDocs = combinedDocs.filter((doc, index, self) => 
          index === self.findIndex(d => d.url === doc.url || 
            (d.name === doc.name && d.type === doc.type))
        );

        console.log('[DocumentsList] Final combined documents:', uniqueDocs);
        setAllDocuments(uniqueDocs);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    fetchAllDocuments();
  }, [documents, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#6c47ff]"></div>
        <span className="ml-2 text-gray-600">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 italic">{error}</div>;
  }
  
  if (allDocuments.length === 0) {
    return <div className="text-gray-500 italic">No documents uploaded yet.</div>;
  }

  let groupedByCategory = allDocuments.reduce((acc, doc) => {
    const category = doc.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {});

  // Debug: Log groupedByCategory before rendering
  console.log('[DocumentsList] groupedByCategory:', groupedByCategory);

  // If showOnlyRegistrationAndUpgrade is set, filter to only Registration and Upgrade Documents
  // Only show Upgrade Documents
  // Show both Registration Documents and Upgrade Documents
  groupedByCategory = {
    'Registration Documents': groupedByCategory['Registration Documents'] || [],
    'Upgrade Documents': groupedByCategory['Upgrade Documents'] || []
  };

  // Helper: pretty label for document type
  const typeLabels = {
    diploma: 'Diploma',
    transcripts: 'Transcripts',
    transcript: 'Transcripts',
    passport: 'Passport',
    enrollment: 'Enrollment Proof',
    other: 'Other',
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedByCategory).map(([category, docs]) => {
        // Group by type within this category
        const groupedByType = docs.reduce((acc, doc) => {
          const type = doc.type || 'other';
          if (!acc[type]) acc[type] = [];
          acc[type].push(doc);
          return acc;
        }, {});
        return (
          <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                {category} ({docs.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {Object.entries(groupedByType).map(([type, typeDocs]) => (
                <div key={type} className="px-4 py-2">
                  <div className="font-semibold text-sm text-gray-700 mb-2">{typeLabels[type] || type}</div>
                  <ul className="space-y-2">
                    {typeDocs.map((doc) => (
                      <li key={doc.id} className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="font-semibold text-base text-[#6c47ff]" title={doc.name}>{doc.name}</span>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-gray-100 rounded-full">{typeLabels[type] || type}</span>
                            {doc.size && <span>{doc.size}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="text-xs text-gray-400 text-right">
                            <div>{doc.source}</div>
                            <div>{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <a href={doc.url} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors px-2 py-1 rounded-md hover:bg-blue-100">
                              <Download className="w-4 h-4" /> Download
                            </a>
                            <button onClick={() => window.open(doc.url, '_blank')}
                                    className="flex items-center gap-1 text-sm text-[#6c47ff] hover:text-[#4d36b8] font-medium transition-colors px-2 py-1 rounded-md hover:bg-[#efeafc]">
                              <Eye className="w-4 h-4" /> Preview
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
