import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { Scenario } from "@/domain/allocation/types";
import { csv, checklistHtml } from "./export-content";
export async function exportCsv(s: Scenario) {
  if (!(await Sharing.isAvailableAsync()))
    throw Error("Sharing is unavailable on this device.");
  const file = new File(Paths.cache, `investing-order-${Date.now()}.csv`);
  file.create();
  file.write(csv(s));
  try {
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      UTI: "public.comma-separated-values-text",
    });
  } finally {
    if (file.exists) file.delete();
  }
}
export async function exportPdf(s: Scenario) {
  if (!(await Sharing.isAvailableAsync()))
    throw Error("Sharing is unavailable on this device.");
  const file = await Print.printToFileAsync({ html: checklistHtml(s) });
  try {
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
    });
  } finally {
    new File(file.uri).delete();
  }
}
