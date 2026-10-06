"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

export interface CountryOption {
  code: string;       // E.164 dial code, e.g. "+1"
  country: string;    // ISO 2-letter country code, e.g. "US"
  name: string;       // Full country name
  flag: string;       // Emoji flag
  placeholder: string;
}

export const SUPPORTED_COUNTRIES: CountryOption[] = [
  { code: "+1", country: "US", name: "United States", flag: "🇺🇸", placeholder: "(555) 000-0000" },
  { code: "+1", country: "CA", name: "Canada", flag: "🇨🇦", placeholder: "(555) 000-0000" },
  { code: "+44", country: "GB", name: "United Kingdom", flag: "🇬🇧", placeholder: "7911 123456" },
  { code: "+92", country: "PK", name: "Pakistan", flag: "🇵🇰", placeholder: "300 1234567" },
  { code: "+971", country: "AE", name: "United Arab Emirates", flag: "🇦🇪", placeholder: "50 123 4567" },
  { code: "+61", country: "AU", name: "Australia", flag: "🇦🇺", placeholder: "412 345 678" },
  { code: "+49", country: "DE", name: "Germany", flag: "🇩🇪", placeholder: "151 23456789" },
  { code: "+91", country: "IN", name: "India", flag: "🇮🇳", placeholder: "98765 43210" },
  { code: "+33", country: "FR", name: "France", flag: "🇫🇷", placeholder: "6 12 34 56 78" },
  { code: "+966", country: "SA", name: "Saudi Arabia", flag: "🇸🇦", placeholder: "50 123 4567" },
  { code: "+65", country: "SG", name: "Singapore", flag: "🇸🇬", placeholder: "8123 4567" },
];

interface PhoneInputWithCountryProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
  name?: string;
}

export function PhoneInputWithCountry({
  value,
  onChange,
  className,
  id = "phone-input",
  name = "phone",
}: PhoneInputWithCountryProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(SUPPORTED_COUNTRIES[0]);
  const [rawSubscriberDigits, setRawSubscriberDigits] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Synchronize internal state with parent payload (E.164 string)
  useEffect(() => {
    if (!value) {
      setRawSubscriberDigits("");
      return;
    }

    if (value.startsWith("+")) {
      const sorted = [...SUPPORTED_COUNTRIES].sort((a, b) => b.code.length - a.code.length);
      const matched = sorted.find((c) => value.startsWith(c.code));
      if (matched) {
        setSelectedCountry(matched);
        const subDigits = value.slice(matched.code.length).replace(/\D/g, "");
        setRawSubscriberDigits(subDigits);
        return;
      }
    }

    // Fallback if raw digits without plus were passed
    const digitsOnly = value.replace(/\D/g, "");
    setRawSubscriberDigits(digitsOnly);
  }, [value]);

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Filter countries by query
  const filteredCountries = SUPPORTED_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.includes(searchQuery) ||
    c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Formatter for localized display
  function formatDisplay(digits: string, countryCode: string): string {
    if (!digits) return "";
    if (countryCode === "+1") {
      if (digits.length <= 3) return `(${digits}`;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10, 14)}`;
  }

  // Handle subscriber input changes
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawVal = e.target.value;

    // Detect pasted string with '+' and country code
    if (rawVal.startsWith("+")) {
      const sorted = [...SUPPORTED_COUNTRIES].sort((a, b) => b.code.length - a.code.length);
      const matched = sorted.find((c) => rawVal.startsWith(c.code));
      if (matched) {
        setSelectedCountry(matched);
        const subDigits = rawVal.slice(matched.code.length).replace(/\D/g, "").slice(0, 14);
        setRawSubscriberDigits(subDigits);
        onChange(subDigits ? `${matched.code}${subDigits}` : "");
        return;
      }
    }

    // Digits sanitization
    let sanitized = rawVal.replace(/\D/g, "");

    // Strip leading trunk prefix zero for international format (e.g. 0300... -> 300...)
    if (sanitized.startsWith("0")) {
      sanitized = sanitized.replace(/^0+/, "");
    }

    // Cap at 14 digits (E.164 total cap is 15 digits including country code)
    const capped = sanitized.slice(0, 14);
    setRawSubscriberDigits(capped);

    // Synchronize parent with exact E.164 payload
    if (capped.length > 0) {
      onChange(`${selectedCountry.code}${capped}`);
    } else {
      onChange("");
    }
  }

  // Handle country selection
  function handleSelectCountry(country: CountryOption) {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery("");
    triggerButtonRef.current?.focus();

    if (rawSubscriberDigits.length > 0) {
      onChange(`${country.code}${rawSubscriberDigits}`);
    } else {
      onChange("");
    }
  }

  // Accessible keyboard navigation for dropdown
  function handleDropdownKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      triggerButtonRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % filteredCountries.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + filteredCountries.length) % filteredCountries.length);
    } else if (e.key === "Enter" && focusedIndex >= 0 && focusedIndex < filteredCountries.length) {
      e.preventDefault();
      handleSelectCountry(filteredCountries[focusedIndex]);
    }
  }

  return (
    <div className={cn("w-full", className)} ref={dropdownRef}>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-slate-700 mb-1.5"
      >
        Phone Number
      </label>

      <div className="flex rounded-xl border border-slate-200 bg-white shadow-sm overflow-visible focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
        {/* Country Code Accessible Dropdown Trigger */}
        <div className="relative">
          <button
            ref={triggerButtonRef}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls="country-code-listbox"
            aria-label={`Select country code, currently ${selectedCountry.name} (${selectedCountry.code})`}
            onClick={() => {
              setIsOpen(!isOpen);
              setFocusedIndex(-1);
              if (!isOpen) {
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }
            }}
            onKeyDown={handleDropdownKeyDown}
            className="h-full border-r border-slate-200 bg-slate-50 hover:bg-slate-100/80 px-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-l-xl cursor-pointer"
          >
            <span className="text-sm leading-none" aria-hidden="true">{selectedCountry.flag}</span>
            <span className="font-mono">{selectedCountry.code}</span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                isOpen && "rotate-180 text-indigo-600"
              )}
              aria-hidden="true"
            />
          </button>

          {/* Accessible Dropdown Panel */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden"
              >
                {/* Search Box */}
                <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" aria-hidden="true" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search country or code..."
                      aria-label="Search countries"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setFocusedIndex(0);
                      }}
                      onKeyDown={handleDropdownKeyDown}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Country Listbox Options */}
                <ul
                  ref={listboxRef}
                  id="country-code-listbox"
                  role="listbox"
                  aria-label="Country calling codes"
                  className="max-h-56 overflow-y-auto py-1 text-xs"
                >
                  {filteredCountries.length === 0 ? (
                    <li className="px-3 py-3 text-center text-slate-400 text-xs">
                      No countries found
                    </li>
                  ) : (
                    filteredCountries.map((c, idx) => {
                      const isSelected = selectedCountry.country === c.country && selectedCountry.code === c.code;
                      const isFocused = idx === focusedIndex;

                      return (
                        <li
                          key={`${c.country}-${c.code}`}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectCountry(c)}
                          onMouseEnter={() => setFocusedIndex(idx)}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 cursor-pointer transition-colors",
                            isSelected
                              ? "bg-indigo-50 text-indigo-900 font-semibold"
                              : isFocused
                              ? "bg-slate-50 text-slate-900"
                              : "text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-sm" aria-hidden="true">{c.flag}</span>
                            <span className="truncate">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            <span className="font-mono text-slate-500">{c.code}</span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" aria-hidden="true" />
                            )}
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Formatted Phone Input Field */}
        <input
          id={id}
          name={name}
          type="tel"
          autoComplete="tel-national"
          placeholder={selectedCountry.placeholder}
          aria-label="National phone number"
          value={formatDisplay(rawSubscriberDigits, selectedCountry.code)}
          onChange={handleInputChange}
          className="flex-1 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
        />
      </div>
    </div>
  );
}
