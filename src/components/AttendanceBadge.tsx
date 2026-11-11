import React from "react";
import { AttendanceStatus } from "@/types";
import { CheckCircle2, XCircle, Clock, FileText } from "lucide-react";

interface Props {
  status: AttendanceStatus;
  size?: "sm" | "md";
}

export default function AttendanceBadge({ status, size = "md" }: Props) {
  const configs: Record<
    AttendanceStatus,
    { label: string; bg: string; text: string; border: string; icon: typeof CheckCircle2 }
  > = {
    present: {
      label: "Present",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: CheckCircle2,
    },
    absent: {
      label: "Absent",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      icon: XCircle,
    },
    late: {
      label: "Late",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: Clock,
    },
    excused: {
      label: "Excused",
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-300",
      icon: FileText,
    },
  };

  const config = configs[status] || configs.present;
  const Icon = config.icon;

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2 py-0.5 gap-1"
      : "text-xs font-semibold px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>{config.label}</span>
    </span>
  );
}
