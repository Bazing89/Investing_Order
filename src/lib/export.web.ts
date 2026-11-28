import type { Scenario } from "@/domain/allocation/types";
import { csv, checklistHtml } from "./export-content";
export async function exportCsv(s: Scenario) {
  const url = URL.createObjectURL(
    new Blob([csv(s)], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "investing-order-2026.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportPdf(s: Scenario) {
  const tab = window.open("", "_blank");
  if (!tab) throw Error("Allow the print preview popup, then retry.");
  tab.document.write(checklistHtml(s));
  tab.document.close();
  tab.focus();
  tab.print();
}
