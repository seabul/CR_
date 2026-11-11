"use client";

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Send,
  Download,
  Printer,
  Share2,
} from "lucide-react";
import { AttendanceRecord } from "@/types";
import {
  generateWhatsAppReport,
  openWhatsAppShare,
  downloadTextReport,
  ReportFormat,
  formatDatePretty,
} from "@/lib/report-generator";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  institution?: string;
  crName?: string;
}

export default function WhatsAppReportModal({
  isOpen,
  onClose,
  record,
  institution = "MANARAT INTERNATIONAL UNIVERSITY",
  crName = "Class Representative",
}: Props) {
  const [format, setFormat] = useState<ReportFormat>("full");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !record) return null;

  const reportText = generateWhatsAppReport(record, institution, crName, format);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      toast.success("Attendance report copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy report to clipboard");
    }
  };

  const handleWhatsApp = () => {
    openWhatsAppShare(reportText);
    toast.success("Opening WhatsApp...");
  };

  const handleDownloadTxt = () => {
    const filename = `Attendance_${record.courseCode || "Class"}_${record.date}.txt`;
    downloadTextReport(reportText, filename);
    toast.success(`Downloaded ${filename}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                WhatsApp Attendance Report
              </h2>
              <p className="text-xs text-slate-500">
                {record.courseName} ({record.courseCode}) • {formatDatePretty(record.date)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Pills */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Select Report Format
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "full", label: "Full Report" },
              { id: "absent_only", label: "Absent Only" },
              { id: "present_only", label: "Present Only" },
              { id: "summary_only", label: "Short Summary" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id as ReportFormat)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  format === f.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Report Preview */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/60">
          <div className="relative">
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-inner selection:bg-blue-500 selection:text-white">
              {reportText}
            </pre>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadTxt}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download TXT</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold transition-all border ${
                copied
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Report"}</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Share via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
