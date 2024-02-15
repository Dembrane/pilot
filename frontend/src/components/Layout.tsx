import { Button, Group, Paper, Stack, Title, Text, Box } from "@mantine/core";
import { Logo } from "./Logo";
import { DocumentPanel } from "./Documents";
import { Toaster } from "./Toaster";
import { Outlet } from "react-router-dom";

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
            <Box>
              <Title order={2}>History</Title>
              <Text size="sm" mt="xs">
                Currently unavailable
              </Text>
            </Box>
          </Stack>
        </aside>

        <main className="col-span-12 sm:col-span-8">
          <Outlet />
        </main>
        <Toaster />
      </div>
    </div>
  );
};
