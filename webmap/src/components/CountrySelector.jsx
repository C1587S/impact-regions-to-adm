// src/components/CountrySelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import './CountrySelector.css';
import countries from './Countries'; 

const CountrySelector = ({ pendingCountry, setPendingCountry, onSubmit, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef(null);

  // When a country is selected, update the parent's pendingCountry and display text.
  const handleSelect = (country) => {
    setPendingCountry(country.code);
    setSearchTerm(`${country.flag} ${country.name}`);
    setDropdownOpen(false);
  };

  // Filter countries based on searchTerm.
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
         setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="country-selector-container" ref={containerRef}>
      <input 
         type="text"
         className="country-selector-input"
         placeholder="Select a country..."
         value={searchTerm}
         onChange={(e) => {
           setSearchTerm(e.target.value);
           setDropdownOpen(true);
         }}
         onFocus={() => setDropdownOpen(true)}
      />
      {dropdownOpen && (
         <div className="country-selector-dropdown">
           {filteredCountries.length > 0 ? (
             filteredCountries.map(country => (
               <div 
                 key={country.code} 
                 className="country-selector-option"
                 onClick={() => handleSelect(country)}
               >
                 {country.flag} {country.name}
               </div>
             ))
           ) : (
             <div className="country-selector-option">No results found</div>
           )}
         </div>
      )}
      <button 
         className="submit-button" 
         onClick={onSubmit} 
         disabled={isLoading}
      >
        {isLoading ? (
          <>
            Submitting <span className="button-spinner"></span>
          </>
        ) : (
          'Submit'
        )}
      </button>
    </div>
  );
};

export default CountrySelector;
