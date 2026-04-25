import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCalendar } from 'react-icons/fi';

/**
 * MonthPicker - A simple month/year picker component
 * 
 * @param {Object} props
 * @param {string} props.value - Currently selected value in YYYY-MM format
 * @param {function} props.onChange - Callback when value changes
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional classes
 * @param {string} props.minWidth - Minimum width
 */
export default function MonthPicker({
  value,
  onChange,
  placeholder = 'Select month',
  className = '',
  minWidth = '170px',
}) {
    const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate months (last 12 months + next 12 months)
  const generateMonths = () => {
    const months = [];
    const currentDate = new Date();
    
    // Add past 12 months
    for (let i = 12; i >= 1; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    }
    
    // Add current month
    months.push({
      value: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
      label: 'This Month'
    });
    
    // Add next 12 months
    for (let i = 1; i <= 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      months.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    }
    
    return months;
  };

  const months = generateMonths();
  const selectedMonth = months.find(m => m.value === value);

  const handleSelect = (monthValue) => {
    onChange(monthValue);
    setIsOpen(false);
  };

  return (
    <div 
      ref={dropdownRef}
      className={`relative ${className}`}
      style={{ minWidth }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-[56px] border border-gray-200 bg-white hover:border-[#D72E2D] focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <FiCalendar className="text-[#636363]" />
          <span className={`text-sm ${selectedMonth ? 'text-[#141414]' : 'text-[#636363]'}`}>
            {selectedMonth ? selectedMonth.label : placeholder}
          </span>
        </div>
        <FiChevronDown className={`text-[#636363] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {months.map((month) => (
            <button
              key={month.value}
              type="button"
              onClick={() => handleSelect(month.value)}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#D6DAFF]/30 transition-colors ${
                value === month.value ? 'bg-[#D6DAFF] text-[#0B0E32] font-semibold' : 'text-[#141414]'
              }`}
            >
              {month.label}
            </button>
          ))}
          {/* Clear option */}
          {value && (
            <>
              <div className="border-t border-gray-200 my-1" />
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="w-full text-left px-4 py-2.5 text-sm text-[#636363] hover:bg-gray-100 transition-colors"
              >
                Clear selection
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

