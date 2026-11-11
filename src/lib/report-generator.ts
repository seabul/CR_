import { AttendanceRecord } from "@/types";

export type ReportFormat = "full" | "absent_only" | "present_only" | "summary_only";

export function formatDatePretty(dateString: string): string {
  if (!dateString) return "";
  try {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function generateWhatsAppReport(
  record: AttendanceRecord,
  institution = "MANARAT INTERNATIONAL UNIVERSITY",
  crName = "Class Representative",
  format: ReportFormat = "full"
): string {
  const prettyDate = formatDatePretty(record.date);
  const courseName = record.courseName || "Class";
  const courseCode = record.courseCode || "N/A";
  const batch = record.section || "Batch 66";
  const summary = record.summary || {
    total: record.records?.length || 0,
    present: record.records?.filter((r) => r.status === "present").length || 0,
    absent: record.records?.filter((r) => r.status === "absent").length || 0,
    late: record.records?.filter((r) => r.status === "late").length || 0,
    excused: record.records?.filter((r) => r.status === "excused").length || 0,
    rate: 0,
  };

  const absentees = record.records.filter((r) => r.status === "absent");
  const presentStudents = record.records.filter((r) => r.status === "present");
  const lateStudents = record.records.filter((r) => r.status === "late");
  const excusedStudents = record.records.filter((r) => r.status === "excused");

  const header = [
    "━━━━━━━━━━━━━━━━━━",
    `📚 ${institution.toUpperCase()}`,
    "📋 CLASS ATTENDANCE REPORT",
    "━━━━━━━━━━━━━━━━━━",
    "",
    `📅 Date: ${prettyDate}`,
    `📖 Course: ${courseName}`,
    `📌 Course Code: ${courseCode}`,
    `👨‍🎓 Batch: ${batch}`,
    `👥 Total Students: ${summary.total}`,
    "",
  ].join("\n");

  const summarySection = [
    "━━━━━━━━━━━━━━━━━━",
    "📊 ATTENDANCE SUMMARY",
    "━━━━━━━━━━━━━━━━━━",
    "",
    `✅ Present: ${summary.present}`,
    `❌ Absent: ${summary.absent}`,
    `🕒 Late: ${summary.late}`,
    `📝 Excused: ${summary.excused}`,
    "",
    `📈 Attendance Rate: ${summary.rate}%`,
    "",
  ].join("\n");

  const footer = `━━━━━━━━━━━━━━━━━━\n\nReport prepared by: ${crName}`;

  if (format === "summary_only") {
    return `${header}${summarySection}${footer}`;
  }

  if (format === "absent_only") {
    const absentList =
      absentees.length > 0
        ? absentees
            .map(
              (s, i) =>
                `${i + 1}. ${s.studentName} - ID: ${s.studentId}${s.rollNumber ? ` (Roll: ${s.rollNumber})` : ""}`
            )
            .join("\n")
        : "🎉 No absentees! 100% attendance.";

    return [
      header,
      "━━━━━━━━━━━━━━━━━━",
      `❌ ABSENT STUDENTS (${absentees.length})`,
      "━━━━━━━━━━━━━━━━━━",
      "",
      absentList,
      "",
      footer,
    ].join("\n");
  }

  if (format === "present_only") {
    const presentList =
      presentStudents.length > 0
        ? presentStudents
            .map(
              (s, i) =>
                `${i + 1}. ${s.studentName} - ID: ${s.studentId}${s.rollNumber ? ` (Roll: ${s.rollNumber})` : ""}`
            )
            .join("\n")
        : "No students marked present.";

    return [
      header,
      "━━━━━━━━━━━━━━━━━━",
      `✅ PRESENT STUDENTS (${presentStudents.length})`,
      "━━━━━━━━━━━━━━━━━━",
      "",
      presentList,
      "",
      footer,
    ].join("\n");
  }

  // format === 'full'
  const sections: string[] = [header, summarySection];

  if (absentees.length > 0) {
    sections.push(
      "━━━━━━━━━━━━━━━━━━\n" +
        `❌ ABSENT STUDENTS (${absentees.length})\n` +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        absentees
          .map(
            (s, i) =>
              `${i + 1}. ${s.studentName} - ID: ${s.studentId}${s.rollNumber ? ` (Roll: ${s.rollNumber})` : ""}`
          )
          .join("\n") +
        "\n\n"
    );
  } else {
    sections.push("━━━━━━━━━━━━━━━━━━\n❌ ABSENT STUDENTS\n━━━━━━━━━━━━━━━━━━\n\nNone (Full Class Present!)\n\n");
  }

  if (lateStudents.length > 0) {
    sections.push(
      "━━━━━━━━━━━━━━━━━━\n" +
        `🕒 LATE STUDENTS (${lateStudents.length})\n` +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        lateStudents
          .map(
            (s, i) =>
              `${i + 1}. ${s.studentName} - ID: ${s.studentId}${s.notes ? ` [${s.notes}]` : ""}`
          )
          .join("\n") +
        "\n\n"
    );
  }

  if (excusedStudents.length > 0) {
    sections.push(
      "━━━━━━━━━━━━━━━━━━\n" +
        `📝 EXCUSED STUDENTS (${excusedStudents.length})\n` +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        excusedStudents
          .map(
            (s, i) =>
              `${i + 1}. ${s.studentName} - ID: ${s.studentId}${s.notes ? ` [${s.notes}]` : ""}`
          )
          .join("\n") +
        "\n\n"
    );
  }

  sections.push(footer);
  return sections.join("");
}

export function openWhatsAppShare(text: string) {
  const encoded = encodeURIComponent(text);
  const url = `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(url, "_blank");
}

export function downloadTextReport(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
