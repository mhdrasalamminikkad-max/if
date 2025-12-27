import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import type { Student } from "@shared/schema";

interface StudentAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectStudent: (student: Student) => void;
  placeholder?: string;
  "data-testid"?: string;
}

export function StudentAutocomplete({
  value,
  onChange,
  onSelectStudent,
  placeholder = "Enter student name...",
  "data-testid": dataTestId,
}: StudentAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: suggestions = [] } = useQuery<Student[]>({
    queryKey: ["/api/students/search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const res = await fetch(`/api/students/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error("Failed to search");
      return res.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleSelectStudent = (student: Student) => {
    onSelectStudent(student);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => value.length >= 2 && setIsOpen(true)}
        placeholder={placeholder}
        data-testid={dataTestId}
        autoComplete="off"
      />
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((student) => (
            <button
              key={student.id}
              type="button"
              className="w-full px-3 py-2 text-left hover-elevate flex flex-col gap-0.5 border-b border-border last:border-b-0"
              onClick={() => handleSelectStudent(student)}
              data-testid={`suggestion-student-${student.id}`}
            >
              <span className="font-medium text-foreground">{student.name}</span>
              <span className="text-sm text-muted-foreground">
                {student.registrationNumber}
                {student.isBanned && (
                  <span className="ml-2 text-destructive font-medium">(Banned)</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
