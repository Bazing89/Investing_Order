import { router } from "expo-router";
import { Shell } from "@/components/investing/shell";
import { Card, Txt, Button } from "@/components/investing/ui";
export default function NotFound() {
  return (
    <Shell title="A small detour.">
      <Card>
        <Txt>
          This page could not be found. Your plans are still in your workspace.
        </Txt>
        <Button onPress={() => router.replace("/")}>Back to overview</Button>
      </Card>
    </Shell>
  );
}
