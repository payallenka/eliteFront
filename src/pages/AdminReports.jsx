import React, { useEffect, useState } from 'react';
import Loader from '../components/ui/Loader';
import { FiSearch } from 'react-icons/fi';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://elite-scholars-eight.vercel.app';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND_URL}/api/admin/reports`);
        if (!res.ok) throw new Error('Failed to fetch reports');
        const data = await res.json();
        console.log('Fetched reports:', data); // Debug log
        setReports(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  // Group reports by user_id and user_name
  const grouped = {};
  reports.forEach(report => {
    if (!grouped[report.user_id]) {
      grouped[report.user_id] = {
        user_id: report.user_id,
        user_name: report.user_name,
        reports: []
      };
    }
    grouped[report.user_id].reports.push(report);
  });
  const groupedReports = Object.values(grouped);

  // Filter users by search
  const filteredReports = groupedReports.filter(user =>
    (user.user_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white text-[#1a0841] font-sans px-0 sm:px-4 py-8 ml-0 lg:ml-16" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <h2 className="text-3xl md:text-4xl tracking-tight mb-2 md:mb-0" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>User Reports Management</h2>
      </div>
      <div className="mb-6 flex items-center justify-start">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Search user name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-300 shadow focus:outline-none focus:ring-2 focus:ring-[#6c47ff] bg-gray-50 text-base"
            style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6c47ff] text-xl pointer-events-none">
            <FiSearch />
          </span>
        </div>
      </div>
      {loading && <Loader message="Loading reports..." />}
      {error && <div className="text-red-500">Error: {error}</div>}
      {!loading && !error && (
        <div className="border rounded-2xl shadow divide-y bg-gray-50">
          {filteredReports.length === 0 ? (
            <div className="p-4 text-center">No reports found.</div>
          ) : (
            filteredReports.map(user => (
              <div key={user.user_id}>
                <button
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center rounded-t-xl"
                  style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}
                  onClick={() => setExpandedUser(expandedUser === user.user_id ? null : user.user_id)}
                >
                  <span className="font-semibold">{user.user_name}</span>
                  <span className="text-sm text-gray-500">{user.reports.length} report{user.reports.length !== 1 ? 's' : ''}</span>
                  <span className="ml-2">{expandedUser === user.user_id ? '▲' : '▼'}</span>
                </button>
                {expandedUser === user.user_id && (
                  <div className="overflow-x-auto bg-white rounded-b-xl">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 text-left">File Name</th>
                          <th className="p-2 text-left">Report Type</th>
                          <th className="p-2 text-left">Created At</th>
                          <th className="p-2 text-left">Download</th>
                          <th className="p-2 text-left">Preview</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.reports.map((report, idx) => {
                          const getReportTypeDisplay = (type) => {
                            switch (type) {
                              case 'application_analysis':
                                return { text: '🤖 AI Analysis', color: 'bg-blue-100 text-blue-800' };
                              case 'application_form':
                                return { text: '📋 Form Data', color: 'bg-green-100 text-green-800' };
                              default:
                                return { text: '📄 Other', color: 'bg-gray-100 text-gray-800' };
                            }
                          };
                          
                          const typeDisplay = getReportTypeDisplay(report.report_type);
                          
                          return (
                            <tr key={report.file_name + idx} className="border-t hover:bg-gray-50">
                              <td className="p-2 font-medium">{report.file_name}</td>
                              <td className="p-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeDisplay.color}`}>
                                  {typeDisplay.text}
                                </span>
                              </td>
                              <td className="p-2 text-gray-600">{report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}</td>
                              <td className="p-2">
                                <a href={report.url} target="_blank" rel="noopener noreferrer" 
                                   className="text-blue-600 hover:text-blue-800 underline font-medium">
                                  Download
                                </a>
                              </td>
                              <td className="p-2">
                                <button
                                  onClick={() => window.open(report.url, '_blank')}
                                  className="text-[#6c47ff] hover:text-[#4d36b8] underline bg-transparent border-none cursor-pointer font-medium"
                                  style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}
                                >
                                  Preview
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
