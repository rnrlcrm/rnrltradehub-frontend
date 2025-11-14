/**
 * Location Selector Component
 * 
 * Provides cascading dropdowns for location selection:
 * Country (default: India) → State → Region (optional) → City/Station
 * 
 * Features:
 * - Fetches location data from backend or uses local master data
 * - Cascading selection (selecting state filters regions and cities)
 * - Optional region field
 * - Clean, user-friendly interface
 */

import React, { useState, useEffect } from 'react';
import { Location } from '../types';

interface LocationSelectorProps {
  value: {
    country?: string;
    state?: string;
    region?: string;
    city?: string;
  };
  onChange: (location: {
    country: string;
    state: string;
    region?: string;
    city: string;
  }) => void;
  required?: boolean;
  disabled?: boolean;
  showRegion?: boolean; // Whether to show region field (default: true)
  locations?: Location[]; // Optional: provide location data, otherwise fetches from API
  className?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  required = true,
  disabled = false,
  showRegion = true,
  locations = [],
  className = '',
}) => {
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Extract unique states, regions, and cities from locations
  useEffect(() => {
    if (!locations || locations.length === 0) {
      return;
    }

    // Get unique states for the selected country (default: India)
    const country = value.country || 'India';
    const states = Array.from(
      new Set(
        locations
          .filter(loc => loc.country === country)
          .map(loc => loc.state)
      )
    ).sort();
    
    setAvailableStates(states);
  }, [locations, value.country]);

  useEffect(() => {
    if (!value.state || !locations || locations.length === 0) {
      setAvailableRegions([]);
      setAvailableCities([]);
      return;
    }

    const country = value.country || 'India';
    
    // Get unique regions for the selected state
    const regions = Array.from(
      new Set(
        locations
          .filter(loc => loc.country === country && loc.state === value.state)
          .map(loc => loc.region)
          .filter(Boolean) as string[]
      )
    ).sort();
    
    setAvailableRegions(regions);

    // Get cities for the selected state (and region if specified)
    let filteredLocations = locations.filter(
      loc => loc.country === country && loc.state === value.state
    );

    if (showRegion && value.region) {
      filteredLocations = filteredLocations.filter(
        loc => loc.region === value.region
      );
    }

    const cities = Array.from(
      new Set(filteredLocations.map(loc => loc.city))
    ).sort();
    
    setAvailableCities(cities);
  }, [locations, value.country, value.state, value.region, showRegion]);

  const handleCountryChange = (newCountry: string) => {
    onChange({
      country: newCountry,
      state: '',
      region: '',
      city: '',
    });
  };

  const handleStateChange = (newState: string) => {
    onChange({
      country: value.country || 'India',
      state: newState,
      region: '',
      city: '',
    });
  };

  const handleRegionChange = (newRegion: string) => {
    onChange({
      country: value.country || 'India',
      state: value.state || '',
      region: newRegion,
      city: '',
    });
  };

  const handleCityChange = (newCity: string) => {
    onChange({
      country: value.country || 'India',
      state: value.state || '',
      region: value.region,
      city: newCity,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Country {required && '*'}
        </label>
        <input
          type="text"
          value={value.country || 'India'}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
          readOnly
        />
        <p className="mt-1 text-xs text-slate-500">Default: India</p>
      </div>

      {/* State */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          State {required && '*'}
        </label>
        {availableStates.length > 0 ? (
          <select
            value={value.state || ''}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={disabled}
            required={required}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select State</option>
            {availableStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={value.state || ''}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={disabled}
            required={required}
            placeholder="Enter State"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}
      </div>

      {/* Region (Optional) */}
      {showRegion && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Region / Division
          </label>
          {availableRegions.length > 0 ? (
            <select
              value={value.region || ''}
              onChange={(e) => handleRegionChange(e.target.value)}
              disabled={disabled || !value.state}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Region (Optional)</option>
              {availableRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={value.region || ''}
              onChange={(e) => handleRegionChange(e.target.value)}
              disabled={disabled || !value.state}
              placeholder="Enter Region (e.g., Vidarbha, Marathwada)"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
          <p className="mt-1 text-xs text-slate-500">
            Optional: Regional division (e.g., Vidarbha, Marathwada)
          </p>
        </div>
      )}

      {/* City/Station */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          City / Station {required && '*'}
        </label>
        {availableCities.length > 0 ? (
          <select
            value={value.city || ''}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={disabled || !value.state}
            required={required}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select City/Station</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={value.city || ''}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={disabled || !value.state}
            required={required}
            placeholder="Enter City/Station"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}
      </div>
    </div>
  );
};

export default LocationSelector;
