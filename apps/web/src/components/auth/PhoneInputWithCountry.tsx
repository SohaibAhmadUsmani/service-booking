"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface PhoneInputWithCountryProps {
  value: string;
  onChange: (value: string) => void;
}

const countryCodes = [
  { code: "+1", country: "US", label: "US +1" },
  { code: "+44", country: "UK", label: "UK +44" },
  { code: "+92", country: "PK", label: "PK +92" },
  { code: "+971", country: "AE", label: "AE +971" },
  { code: "+61", country: "AU", label: "AU +61" },
  { code: "+49", country: "DE", label: "DE +49" },
];

export function PhoneInputWithCountry({
  value,
  onChange,
}: PhoneInputWithCountryProps) {
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    onChange(raw);
  }

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        Phone Number
      </label>
      <div className="flex rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
        {/* Country Code Selector */}
        <div className="relative border-r border-slate-200 bg-slate-50 flex items-center px-3">
          <select
            value={selectedCountry.code}
            onChange={(e) => {
              const found = countryCodes.find((c) => c.code === e.target.value);
              if (found) setSelectedCountry(found);
            }}
            className="appearance-none bg-transparent pr-5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            {countryCodes.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 pointer-events-none" />
        </div>

        {/* Formatted Phone Input */}
        <input
          type="tel"
          placeholder="(555) 000-0000"
          value={value}
          onChange={handleNumberChange}
          className="flex-1 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
        />
      </div>
    </div>
  );
}
