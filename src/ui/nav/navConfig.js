export const NAV_ITEMS = [
  { key: "stagingResults", label: "Runs", href: "/", icon: "bi bi-list-check" },
  { key: "import", label: "Import", href: "/import", icon: "bi bi-cloud-upload" },
  { key: "stringPatterns", label: "String patterns", href: "/string-patterns", icon: "bi bi-scissors" },
];

export function normalizePage(page) {
  if (page === "import") return "import";
  if (page === "edit") return "edit";
  if (page === "stringPatterns") return "stringPatterns";
  if (page === "staging") return "stagingResults";
  if (page === "stagingResults") return "stagingResults";
  return "stagingResults";
}