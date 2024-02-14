import { Button, Group, Paper, Stack, Title } from "@mantine/core";
import { Logo } from "./Logo";
import { DocumentPanel } from "./Documents";

export const Layout = () => {
  return (
    <div>
      <header>
        <Paper p="md" shadow="xs">
          <Group justify="space-between">
            <Logo />
            <Button disabled variant="filled">
              Export
            </Button>
          </Group>
        </Paper>
      </header>

      <div className="grid grid-cols-12">
        <aside className="col-span-12 sm:col-span-4">
          <Stack p="sm" gap="xl">
            <DocumentPanel />
            <Title order={2}>History</Title>
          </Stack>
        </aside>

        <main className="col-span-12 sm:col-span-8">
          <Stack p="sm">
            <Title order={2}>Analysis</Title>
          </Stack>
        </main>
      </div>
    </div>
  );
};
