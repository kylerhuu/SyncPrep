"use client";

import { useRef, useState, useEffect } from "react";
import { getTimezoneSuggestions } from "@/lib/timezone";

interface TimezoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function TimezoneInput({
  label,
  value,
  onChange,
  placeholder = "e.g. San Francisco, PST, or America/Los_Angeles",
  error,
}: TimezoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = getTimezoneSuggestions(value);
  const showDropdown = isOpen && suggestions.length > 0;

  useEffect(() => {
    if (!showDropdown) setHighlightIndex(0);
  }, [showDropdown, value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(iana: string) {
    onChange(iana);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) {
      if (e.key === "ArrowDown" || e.key === "Escape") setIsOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const opt = suggestions[highlightIndex];
      if (opt) handleSelect(opt.value);
      return;
    }
  }

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls="timezone-suggestions"
        className={`w-full min-h-[40px] rounded-xl border-2 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/25"
            : "border-slate-200 hover:border-slate-300"
        }`}
      />
      {showDropdown && (
        <ul
          id="timezone-suggestions"
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-[240px] overflow-auto rounded-xl border-2 border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10"
        >
          {suggestions.map((opt, i) => (
            <li
              key={`${opt.value}-${i}`}
              role="option"
              aria-selected={i === highlightIndex}
              onMouseEnter={() => setHighlightIndex(i)}
              onClick={() => handleSelect(opt.value)}
              className={`cursor-pointer px-3.5 py-2.5 text-sm ${
                i === highlightIndex
                  ? "bg-blue-50 text-slate-900"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="font-medium text-slate-800">{opt.label.split(" — ")[0]}</span>
              <span className="text-slate-500 ml-1.5">{opt.label.split(" — ")[1]}</span>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
