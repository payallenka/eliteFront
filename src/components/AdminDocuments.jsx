import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function AdminDocuments() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserDocuments();
  }, []);

  const fetchUserDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://elite-scholars-eight.vercel.app/api/admin/documents');
      if (!response.ok) {
        throw new Error('Failed to fetch user documents');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching user documents:', err);
      setError('Failed to load user documents');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentCount = (documents) => {
    if (!documents || typeof documents !== 'object') return 0;
    return Object.values(documents).filter(doc => doc && doc.url).length;
  };

  const getDocumentStatus = (documents) => {
    const count = getDocumentCount(documents);
    if (count === 0) return { status: 'None', color: 'text-red-600' };
    if (count < 3) return { status: 'Partial', color: 'text-yellow-600' };
    return { status: 'Complete', color: 'text-green-600' };
  };

  const openDocument = (url) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6c47ff] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <button 
            onClick={fetchUserDocuments}
            className="mt-4 bg-[#6c47ff] text-white px-4 py-2 rounded hover:bg-[#5a3fd4]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Documents</h1>
          <p className="text-gray-600 mt-2">View and manage all user uploaded documents</p>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500">No users have uploaded documents yet.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {users.map((user) => {
                const docStatus = getDocumentStatus(user.documents);
                const docCount = getDocumentCount(user.documents);
                
                return (
                  <li key={user.user_id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-[#6c47ff] rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              User ID: {user.user_id}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`text-sm font-medium ${docStatus.color}`}>
                            {docStatus.status}
                          </div>
                          <div className="text-xs text-gray-500">
                            {docCount} documents uploaded
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {user.documents && Object.entries(user.documents).map(([docType, docData]) => {
                            if (!docData || !docData.url) return null;
                            
                            return (
                              <button
                                key={docType}
                                onClick={() => openDocument(docData.url)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-[#6c47ff] hover:bg-[#5a3fd4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6c47ff] transition-colors"
                                title={`View ${docType}: ${docData.fileName || 'Document'}`}
                              >
                                {docType.charAt(0).toUpperCase() + docType.slice(1)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Document details */}
                    <div className="mt-4 ml-14">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {user.documents && Object.entries(user.documents).map(([docType, docData]) => {
                          if (!docData || !docData.url) return null;
                          
                          return (
                            <div key={docType} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {docType.charAt(0).toUpperCase() + docType.slice(1)}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {docData.fileName || 'Document'}
                                  </p>
                                  {docData.uploadedAt && (
                                    <p className="text-xs text-gray-400">
                                      {new Date(docData.uploadedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => openDocument(docData.url)}
                                  className="ml-2 text-[#6c47ff] hover:text-[#5a3fd4]"
                                  title="View document"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDocuments;
