// src/components/CountrySelector.jsx
import React, { useState } from 'react';
import './CountrySelector.css'; // We'll add spinner CSS here

const countries = [
  { code: 'USA', name: 'United States', flag: '🇺🇸' },
  { code: 'CHN', name: 'China', flag: '🇨🇳' },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴' },
  { code: 'IND', name: 'India', flag: '🇮🇳' },
  { code: 'MEX', name: 'Mexico', flag: '🇲🇽' },
];

const CountrySelector = ({ pendingCountry, setPendingCountry, onSubmit, isLoading }) => {
  const [search, setSearch] = useState('');
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <input
        type="text"
        placeholder="Select a country..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.searchInput}
      />
      <select
        value={pendingCountry}
        onChange={(e) => setPendingCountry(e.target.value)}
        style={styles.select}
      >
        <option value="" disabled>
          -- Select a country --
        </option>
        {filteredCountries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.flag} {country.name}
          </option>
        ))}
      </select>
      <button style={styles.submitBtn} onClick={onSubmit} disabled={isLoading}>
        {isLoading ? (
          <>
            Submitting
            <span className="button-spinner"></span>
          </>
        ) : (
          'Submit'
        )}
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
  },
  searchInput: {
    flex: '0 0 150px',
    padding: '5px',
    fontSize: '14px',
  },
  select: {
    flex: '1',
    padding: '5px',
    fontSize: '14px',
  },
  submitBtn: {
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    position: 'relative'
  }
};

export default CountrySelector;
