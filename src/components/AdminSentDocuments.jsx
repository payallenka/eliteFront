import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { File, Download, Eye, ChevronDown, ChevronUp } from 'lucide-react';

const AdminSentDocuments = ({ userId }) => {
  const [adminDocuments, setAdminDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    console.log('AdminSentDocuments useEffect triggered with userId:', userId);
    if (userId) {
      fetchAdminDocuments();
    } else {
      console.log('No userId provided to AdminSentDocuments');
    }
  }, [userId]);

  const fetchAdminDocuments = async () => {
    try {
      setLoading(true);
      console.log('Fetching admin documents for userId:', userId);
      
      // List files in the user's folder directly from storage
      const { data: files, error: filesError } = await supabase.storage
        .from('admin-documents')
        .list(userId, {
          limit: 100,
          offset: 0
        });

      console.log('Storage list result for user:', { files, filesError });

      if (filesError) {
        console.error('Error fetching admin documents:', filesError);
        setAdminDocuments([]);
        return;
      }

      if (!files || files.length === 0) {
        console.log('No admin documents found in storage');
        setAdminDocuments([]);
        return;
      }

      // Get public URLs for each file and try to get metadata
      const docsWithUrls = await Promise.all(
        files.map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('admin-documents')
            .getPublicUrl(`${userId}/${file.name}`);
          
          // Try to get metadata from the database using the full file_path
          const { data: metadata } = await supabase
            .from('admin_uploaded_documents')
            .select('file_name, uploaded_by, upload_date, description')
            .eq('user_id', userId)
            .eq('file_path', `${userId}/${file.name}`)
            .single();

          console.log('File:', file.name, 'Metadata:', metadata, 'URL:', urlData.publicUrl);

          return {
            name: file.name,
            originalName: metadata?.file_name || file.name,
            size: file.metadata?.size || 0,
            created_at: file.created_at,
            uploaded_by: metadata?.uploaded_by || 'Admin',
            upload_date: metadata?.upload_date || file.created_at,
            description: metadata?.description || '',
            url: urlData.publicUrl
          };
        })
      );

      console.log('Final admin docs with URLs:', docsWithUrls);
      setAdminDocuments(docsWithUrls);
    } catch (error) {
      console.error('Error in fetchAdminDocuments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div>
        <button
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100 hover:border-purple-200 transition-all"
          disabled
        >
          <div className="flex items-center gap-3">
            <File className="w-5 h-5 text-purple-600" />
            <span className="text-lg font-bold text-[#1a0841]">Documents Sent by Admin</span>
          </div>
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100 hover:border-purple-200 transition-all group"
      >
        <div className="flex items-center gap-3">
          <File className="w-5 h-5 text-purple-600" />
          <span className="text-lg font-bold text-[#1a0841]">Documents Sent by Admin</span>
          {adminDocuments.length > 0 && (
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-semibold">
              {adminDocuments.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-purple-600 group-hover:text-purple-700 transition-colors" />
        ) : (
          <ChevronDown className="w-5 h-5 text-purple-600 group-hover:text-purple-700 transition-colors" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-4 space-y-4 pl-4">
          {adminDocuments.length === 0 ? (
            <div className="text-center py-8">
              <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-sm">No documents have been sent by admin yet.</p>
              <p className="text-gray-400 text-xs mt-2">
                Your advisor will share important documents here when available.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {adminDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 hover:border-purple-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <File size={20} className="text-purple-600 flex-shrink-0" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.originalName}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>Sent by {doc.uploaded_by}</span>
                        <span>•</span>
                        <span>{formatDate(doc.upload_date)}</span>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-gray-600 mt-1 italic">{doc.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                      title="View Document"
                    >
                      <Eye size={18} />
                    </a>
                    <a
                      href={doc.url}
                      download={doc.originalName}
                      className="p-2 text-purple-600 hover:bg-purple-100 rounded-xl transition-colors"
                      title="Download Document"
                    >
                      <Download size={18} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {adminDocuments.length > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> These documents were uploaded by your advisor. 
                If you have questions about any document, please contact your advisor directly.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSentDocuments;