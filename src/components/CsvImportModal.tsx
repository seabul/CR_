"use client";

import React, { useState, useRef } from "react";
import { X, UploadCloud, FileSpreadsheet, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

interface ParsedStudent {
  studentId: string;
  name: string;
  rollNumber: string;
  email?: string;
  phone?: string;
}

export default function CsvImportModal({ isOpen, onClose, onImportSuccess }: Props) {
  const [parsedRows, setParsedRows] = useState<ParsedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const downloadSampleTemplate = () => {
    const csvContent =
      "RollNumber,StudentID,FullName,Email,Phone\n" +
      "01,1001,Md. Tanvir Ahmed,tanvir@example.com,+8801700100100\n" +
      "02,1002,Sarah Khan,sarah@example.com,+8801700100101\n" +
      "03,1003,Rakib Hasan,rakib@example.com,+8801700100102\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "student_import_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Downloaded sample CSV template");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length <= 1) {
        toast.error("CSV file appears to be empty or has only headers.");
        return;
      }

      // Detect header index mapping
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
      const rollIdx = headers.findIndex((h) => h.includes("roll"));
      const idIdx = headers.findIndex((h) => h.includes("id"));
      const nameIdx = headers.findIndex((h) => h.includes("name"));
      const emailIdx = headers.findIndex((h) => h.includes("email"));
      const phoneIdx = headers.findIndex((h) => h.includes("phone") || h.includes("mobile"));

      const rows: ParsedStudent[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map((p) => p.trim());
        if (parts.length < 2) continue;

        const rollNumber = rollIdx !== -1 ? parts[rollIdx] : parts[0] || "";
        const studentId = idIdx !== -1 ? parts[idIdx] : parts[1] || "";
        const name = nameIdx !== -1 ? parts[nameIdx] : parts[2] || "";
        const email = emailIdx !== -1 ? parts[emailIdx] : parts[3] || "";
        const phone = phoneIdx !== -1 ? parts[phoneIdx] : parts[4] || "";

        if (studentId || name || rollNumber) {
          rows.push({
            rollNumber,
            studentId,
            name,
            email,
            phone,
          });
        }
      }

      setParsedRows(rows);
      toast.success(`Parsed ${rows.length} students from CSV`);
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: parsedRows }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import students");
      }

      if (data.insertedCount > 0) {
        toast.success(`Successfully imported ${data.insertedCount} students!`);
        if (data.skippedCount > 0) {
          toast.warning(`Skipped ${data.skippedCount} rows (duplicates or invalid).`);
        }
        onImportSuccess();
        onClose();
      } else {
        toast.error(`No students were imported. ${data.skippedCount} rows skipped.`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error importing students");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Import Students from CSV</h3>
              <p className="text-xs text-slate-500">Quickly upload your batch roster</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Instructions & Template */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-blue-50/60 border border-blue-100 rounded-xl">
            <div className="text-xs text-blue-900">
              <p className="font-semibold">Expected CSV Columns:</p>
              <p className="text-blue-700">RollNumber, StudentID, FullName, Email (opt), Phone (opt)</p>
            </div>
            <button
              onClick={downloadSampleTemplate}
              type="button"
              className="flex items-center gap-1.5 py-1.5 px-3 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold shadow-2xs shrink-0 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {fileName ? fileName : "Click to select or drag & drop CSV file"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Supports standard .csv format with comma delimiters</p>
          </div>

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Roster Preview ({parsedRows.length} Students)
                </span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Import
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Roll</th>
                      <th className="py-2 px-3">Student ID</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 font-semibold text-slate-800">{row.rollNumber}</td>
                        <td className="py-1.5 px-3 font-mono text-slate-600">{row.studentId}</td>
                        <td className="py-1.5 px-3 font-medium text-slate-800">{row.name}</td>
                        <td className="py-1.5 px-3 text-slate-500 truncate max-w-[150px]">{row.email || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={loading || parsedRows.length === 0}
            className="flex items-center gap-1.5 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{loading ? "Importing..." : `Import ${parsedRows.length} Students`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
