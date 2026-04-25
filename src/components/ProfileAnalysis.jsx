import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const ProfileAnalysis = ({ profileAnalysis, visaReadiness, idealCategoryFit }) => {
  if (!profileAnalysis || profileAnalysis.length === 0) {
    return null;
  }

  const getMessageIcon = (message) => {
    if (message.includes('meets') || message.includes('Perfect') || message.includes('Strong') || message.includes('comfortably')) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (message.includes('below') || message.includes('insufficient') || message.includes('improvement')) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else if (message.includes('slightly') || message.includes('consider') || message.includes('recommend')) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return <Info className="h-5 w-5 text-blue-500" />;
  };

  const getVisaReadinessColor = (readiness) => {
    switch (readiness?.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'very good': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-red-600 bg-red-50';
    }
  };

  const getCategoryColor = (category) => {
    if (category?.includes('Top-tier')) return 'text-purple-600 bg-purple-50';
    if (category?.includes('Mid-tier')) return 'text-blue-600 bg-blue-50';
    if (category?.includes('Pathway')) return 'text-green-600 bg-green-50';
    return 'text-orange-600 bg-orange-50';
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-4 sm:mb-6">
      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">Profile Analysis</h3>
      
      {/* Key Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className={`p-3 sm:p-4 rounded-lg ${getVisaReadinessColor(visaReadiness)}`}>
          <h4 className="font-semibold mb-1 text-sm sm:text-base">Visa Readiness</h4>
          <p className="text-base sm:text-lg font-bold">{visaReadiness || 'Calculating...'}</p>
        </div>
        
        <div className={`p-3 sm:p-4 rounded-lg ${getCategoryColor(idealCategoryFit)}`}>
          <h4 className="font-semibold mb-1 text-sm sm:text-base">Ideal Category Fit</h4>
          <p className="text-base sm:text-lg font-bold">{idealCategoryFit || 'Analyzing...'}</p>
        </div>
      </div>

      {/* Mobile-optimized cards for small screens */}
      <div className="block sm:hidden space-y-3">
        {profileAnalysis.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
            <div className="flex items-start gap-2 mb-2">
              {getMessageIcon(item.message)}
              <span className="font-medium text-gray-700 text-sm">{item.case}</span>
            </div>
            <div className="text-xs text-gray-600 mb-2 pl-7">
              <strong>Rule:</strong> {item.rule}
            </div>
            <div className={`text-sm pl-7 ${
              item.message.includes('meets') || item.message.includes('Perfect') || item.message.includes('Strong') || item.message.includes('comfortably')
                ? 'text-green-700'
                : item.message.includes('below') || item.message.includes('insufficient') || item.message.includes('improvement')
                ? 'text-red-700'
                : item.message.includes('slightly') || item.message.includes('consider') || item.message.includes('recommend')
                ? 'text-yellow-700'
                : 'text-gray-700'
            }`}>
              {item.message}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table for larger screens */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-700 text-sm sm:text-base">Case</th>
              <th className="border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-700 text-sm sm:text-base">Rule</th>
              <th className="border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-700 text-sm sm:text-base">Message</th>
            </tr>
          </thead>
          <tbody>
            {profileAnalysis.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
                  <div className="flex items-center gap-2">
                    {getMessageIcon(item.message)}
                    <span className="font-medium text-gray-700 text-sm sm:text-base">{item.case}</span>
                  </div>
                </td>
                <td className="border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                  {item.rule}
                </td>
                <td className="border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                  <span className={`${
                    item.message.includes('meets') || item.message.includes('Perfect') || item.message.includes('Strong') || item.message.includes('comfortably')
                      ? 'text-green-700'
                      : item.message.includes('below') || item.message.includes('insufficient') || item.message.includes('improvement')
                      ? 'text-red-700'
                      : item.message.includes('slightly') || item.message.includes('consider') || item.message.includes('recommend')
                      ? 'text-yellow-700'
                      : 'text-gray-700'
                  }`}>
                    {item.message}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfileAnalysis;
