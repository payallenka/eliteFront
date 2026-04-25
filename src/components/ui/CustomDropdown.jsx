import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCheck } from 'react-icons/fi';

/**
 * CustomDropdown - A modern, fully styled dropdown component
 * 
 * @param {Object} props
 * @param {Array} props.options - Array of options, each with { value, label }
 * @param {string} props.value - Currently selected value
 * @param {function} props.onChange - Callback when value changes
 * @param {string} props.placeholder - Placeholder text when no value selected
 * @param {string} props.className - Additional classes for the container
 * @param {boolean} props.capitalize - Whether to capitalize option labels
 * @param {string} props.minWidth - Minimum width of the dropdown
 */
export default function CustomDropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  capitalize = false,
  minWidth = '160px',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Find current selected option
  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption?.label || placeholder;

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

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div 
      ref={dropdownRef} 
      className={`relative ${className}`}
      style={{ minWidth }}
    >
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-2
          pl-4 pr-3 py-3
          bg-white border border-gray-200 
          rounded-[56px]
          cursor-pointer
          transition-all duration-200
          hover:border-gray-300
          focus:outline-none focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20
          ${isOpen ? 'border-[#D72E2D] ring-2 ring-[#D72E2D]/20' : ''}
          ${capitalize ? 'capitalize' : ''}
        `}
      >
        <span className={`text-sm truncate ${selectedOption ? 'text-[#141414]' : 'text-[#636363]'}`}>
          {displayText}
        </span>
        <FiChevronDown 
          className={`w-4 h-4 text-[#636363] flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="
            absolute z-50 mt-2 w-full
            bg-white
            border border-gray-200
            rounded-2xl
            shadow-lg shadow-black/10
            overflow-hidden
            animate-in fade-in slide-in-from-top-2 duration-200
          "
          style={{
            animation: 'dropdownFadeIn 0.15s ease-out',
          }}
        >
          <div className="py-2 max-h-64 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full flex items-center justify-between gap-2
                  px-4 py-2.5
                  text-sm text-left
                  transition-colors duration-150
                  ${capitalize ? 'capitalize' : ''}
                  ${option.value === value 
                    ? 'bg-[#D72E2D]/10 text-[#D72E2D] font-medium' 
                    : 'text-[#141414] hover:bg-gray-50'
                  }
                `}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && (
                  <FiCheck className="w-4 h-4 flex-shrink-0 text-[#D72E2D]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
