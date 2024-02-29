import { Anchor, Button, Group, Paper } from "@mantine/core";
import { Logo } from "./Logo";
import { DocumentPanel } from "./Documents";
import { Toaster } from "./Toaster";
import { NavLink, Outlet } from "react-router-dom";
import { Trans } from "@lingui/macro";

export const Layout = () => {
  return (
    <div className="min-h-screen relative">
      <header className="h-[60px] sticky top-0 z-10">
        <Paper p="xs" shadow="xs" className="">
          <Group justify="space-between">
            <Group gap="md">
              <Logo />
              <NavLink to="/">
                {({ isActive }) => (
                  <Anchor c={isActive ? "blue" : "gray"}>
                    <Trans>Analysis</Trans>
                  </Anchor>
                )}
              </NavLink>
              <NavLink to="/session">
                {({ isActive }) => (
                  <Anchor c={isActive ? "blue" : "gray"}>
                    <Trans>Select Session</Trans>
                  </Anchor>
                )}
              </NavLink>
            </Group>
            <Button disabled variant="filled">
              <Trans>Export</Trans>
            </Button>
          </Group>
        </Paper>
      </header>

      <div className="grid grid-cols-12">
        <aside className="col-span-12 sm:col-span-4 relative h-[calc(100vh-60px)] overflow-y-auto">
          <DocumentPanel />
        </aside>

        <main className="col-span-12 sm:col-span-8 relative h-[calc(100vh-60px)] overflow-y-auto">
          <Outlet />
        </main>
        <Toaster />
      </div>
    </div>
  );
};
