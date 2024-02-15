import { Button, Group, Paper } from "@mantine/core";
import { Logo } from "./Logo";
import { DocumentPanel } from "./Documents";
import { Toaster } from "./Toaster";
import { Outlet } from "react-router-dom";

export const Layout = () => {
  return (
    <div className="min-h-screen relative">
      <header className="h-[60px] sticky top-0 z-10">
        <Paper p="xs" shadow="xs" className="">
          <Group justify="space-between">
            <Logo />
            <Button disabled variant="filled">
              Export
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
