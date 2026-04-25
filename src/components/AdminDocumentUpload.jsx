import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Upload, File, X, Download, Trash2 } from 'lucide-react';

const AdminDocumentUpload = ({ userId, userName }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchUploadedDocuments();
  }, [userId]);

  const fetchUploadedDocuments = async () => {
    try {
      setLoading(true);
      console.log('Fetching documents for userId:', userId);
      
      // List files in the user's folder directly from storage
      const { data: files, error: filesError } = await supabase.storage
        .from('admin-documents')
        .list(userId, {
          limit: 100,
          offset: 0
        });

      console.log('Storage list result:', { files, filesError });

      if (filesError) {
        console.error('Error fetching documents:', filesError);
        setUploadedDocs([]);
        return;
      }

      if (!files || files.length === 0) {
        console.log('No files found in storage');
        setUploadedDocs([]);
        return;
      }

      // Get public URLs for each file
      const docsWithUrls = await Promise.all(
        files.map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('admin-documents')
            .getPublicUrl(`${userId}/${file.name}`);
          
          console.log('File:', file.name, 'URL:', urlData.publicUrl);
          
          return {
            name: file.name,
            size: file.metadata?.size || 0,
            created_at: file.created_at,
            url: urlData.publicUrl
          };
        })
      );

      console.log('Final docs with URLs:', docsWithUrls);
      setUploadedDocs(docsWithUrls);
    } catch (error) {
      console.error('Error in fetchUploadedDocuments:', error);
      setUploadedDocs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(selectedFiles);
  };

  const uploadDocuments = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      console.log('Starting upload for userId:', userId, 'files:', files.length);

      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        console.log('Uploading file:', file.name, 'to path:', filePath);

        const { error: uploadError } = await supabase.storage
          .from('admin-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error for file:', file.name, uploadError);
          throw uploadError;
        }

        console.log('Successfully uploaded:', file.name, 'as:', fileName);

        // Also store metadata in a table (optional)
        const { error: metadataError } = await supabase
          .from('admin_uploaded_documents')
          .insert({
            user_id: userId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            uploaded_by: 'admin', // You can get actual admin user ID here
            upload_date: new Date().toISOString()
          });

        if (metadataError) {
          console.warn('Error storing metadata (table might not exist):', metadataError);
          // Don't fail the upload if metadata fails
        }

        return { success: true, fileName: file.name };
      });

      await Promise.all(uploadPromises);
      
      // Clear files and refresh the list
      setFiles([]);
      document.getElementById('file-upload').value = '';
      await fetchUploadedDocuments();
      
      setNotification({
        type: 'success',
        message: `Successfully uploaded ${files.length} document(s) for ${userName}`,
        timestamp: Date.now()
      });
      // Auto-hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      console.error('Error uploading documents:', error);
      setNotification({
        type: 'error',
        message: 'Error uploading documents. Please try again.',
        timestamp: Date.now()
      });
      // Auto-hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (document) => {
    if (!confirm(`Are you sure you want to delete ${document.name}?`)) return;

    try {
      // Use the full file_path from metadata if available, or construct it
      const filePath = document.generatedName ? `${userId}/${document.generatedName}` : `${userId}/${document.name}`;
      
      const { error } = await supabase.storage
        .from('admin-documents')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting document:', error);
        alert('Error deleting document. Please try again.');
        return;
      }

      // Also remove from metadata table if document has an ID
      if (document.id) {
        await supabase
          .from('admin_uploaded_documents')
          .delete()
          .eq('id', document.id);
      }

      await fetchUploadedDocuments();
      alert('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document. Please try again.');
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 ${
          notification.type === 'success' ? 'border-green-500' : 'border-red-500'
        } transform transition-all duration-300 ease-in-out mb-4`}>
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
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
                  notification.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  Document Upload
                </p>
                <p className={`text-sm mt-1 ${
                  notification.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {notification.message}
                </p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <button
                  onClick={() => setNotification(null)}
                  className={`text-sm font-medium ${
                    notification.type === 'success' ? 'text-green-600 hover:text-green-500' : 'text-red-600 hover:text-red-500'
                  }`}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Upload Documents for {userName}
      </h3>

      {/* File Upload Section */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            onClick={uploadDocuments}
            disabled={files.length === 0 || uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={16} />
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {files.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Selected files:</p>
            <ul className="space-y-1">
              {files.map((file, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <File size={14} />
                  <span>{file.name}</span>
                  <span className="text-gray-400">({formatFileSize(file.size)})</span>
                  <button
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-700 ml-auto"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Uploaded Documents List */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Previously Uploaded Documents</h4>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600 mt-2">Loading documents...</p>
          </div>
        ) : uploadedDocs.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No documents uploaded yet for this user.</p>
        ) : (
          <div className="space-y-2">
            {uploadedDocs.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <File size={16} className="text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(doc.size)} • {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Download"
                  >
                    <Download size={16} />
                  </a>
                  <button
                    onClick={() => deleteDocument(doc)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDocumentUpload;