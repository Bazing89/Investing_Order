import type { Scenario, Person } from "@/domain/allocation/types";
export type PlanData = {
  ownerId: string | null;
  plans: Scenario[];
  activeId: string;
  draft: Scenario | null;
  checks: Record<string, boolean>;
};
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function validPerson(v: unknown): v is Person {
  if (!isRecord(v)) return false;
  return (
    ["id", "name"].every((k) => typeof v[k] === "string") &&
    [
      "age",
      "wages",
      "priorWages",
      "matchPercent",
      "matchRate",
      "pretaxExisting",
      "rothExisting",
      "iraExisting",
    ].every((k) => typeof v[k] === "number" || v[k] === null) &&
    ["workplace", "rothAvailable", "catchUp"].every(
      (k) => typeof v[k] === "boolean",
    ) &&
    ["none", "yes", "unknown"].includes(v.iraBalances as string)
  );
}
function validScenario(v: unknown): v is Scenario {
  if (!isRecord(v)) return false;
  return (
    v.year === 2026 &&
    ["single", "joint"].includes(v.filing as string) &&
    Array.isArray(v.people) &&
    v.people.length >= 1 &&
    v.people.length <= 2 &&
    v.people.every(validPerson) &&
    ["id", "name", "hsaOwner", "updatedAt"].every(
      (k) => typeof v[k] === "string",
    ) &&
    [
      "budget",
      "otherIncome",
      "deduction",
      "hsaExisting",
      "hsaEmployer",
      "brokerageTarget",
      "educationTarget",
    ].every((k) => typeof v[k] === "number" || v[k] === null) &&
    ["ready", "sample", "hsaEligible", "education"].every(
      (k) => typeof v[k] === "boolean",
    ) &&
    ["none", "self", "family", "review"].includes(v.hsa as string) &&
    ["lower", "same", "uncertain"].includes(v.preference as string)
  );
}
export function parsePlanData(value: unknown): PlanData {
  if (
    !isRecord(value) ||
    !Array.isArray(value.plans) ||
    !value.plans.every(validScenario) ||
    !(value.draft === null || validScenario(value.draft)) ||
    typeof value.activeId !== "string" ||
    !isRecord(value.checks) ||
    !Object.values(value.checks).every((v) => typeof v === "boolean") ||
    !(value.ownerId === null || typeof value.ownerId === "string")
  )
    throw Error(
      "This saved snapshot is not compatible with this version of Investing Order.",
    );
  return {
    ownerId: value.ownerId as string | null,
    plans: value.plans,
    draft: value.draft,
    activeId: value.activeId,
    checks: value.checks as Record<string, boolean>,
  };
}
