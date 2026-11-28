import { Shell } from "@/components/investing/shell";
import { Card, Txt, Notice } from "@/components/investing/ui";
export default function Privacy() {
  return (
    <Shell
      title="Your information, with intention."
      subtitle="Preview scope and data practices"
    >
      <Card>
        <Txt size={22}>Educational scope</Txt>
        <Txt>
          Investing Order is an educational calculator. It does not prepare a
          tax return, recommend securities, execute transactions, or establish
          eligibility with a financial provider. Estimates require independent
          review before use.
        </Txt>
        <Txt size={22}>Where your data goes</Txt>
        <Txt>
          Calculations run on this device. With device saving off, financial
          values remain in memory for this session. Opting into device saving
          uses app-accessible storage that is not encrypted by this app.
          Clearing device data removes the app’s saved plans and drafts from
          this device.
        </Txt>
        <Txt>
          When configured, Supabase authentication sends account information to
          that service. Financial scenarios are uploaded only through an
          explicit cloud snapshot action. An account owns its household plans;
          spouse fields do not invite or authorize another user.
        </Txt>
        <Txt size={22}>Exports and deletion</Txt>
        <Txt>
          CSV and PDF exports contain financial information and leave the app
          when you save or share them. Clearing the device, deleting a plan,
          deleting a cloud snapshot and deleting an account are separate
          actions.
        </Txt>
        <Notice>
          This is a development preview. Production retention periods, backups,
          account deletion operations and final service terms must be configured
          before a public launch.
        </Notice>
      </Card>
    </Shell>
  );
}
