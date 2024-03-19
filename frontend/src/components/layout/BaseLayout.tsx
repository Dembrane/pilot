import { Box, Group, Paper } from "@mantine/core";
import { Logo } from "../Logo";
import { Toaster } from "../Toaster";
import { Outlet } from "react-router-dom";
import { PropsWithChildren } from "react";

export const BaseLayout = ({ children }: PropsWithChildren) => {
  return (
    <Box className="min-h-screen relative">
      <Paper
        bg="white"
        component="header"
        p="xs"
        shadow="xs"
        className="h-[60px] sticky top-0 z-10"
      >
        <Group justify="space-between" align="center" className="h-full w-full">
          <Group gap="md">
            <Logo />
          </Group>
        </Group>
      </Paper>

      <main className="relative h-[calc(100vh-60px)] overflow-y-auto">
        <Outlet />
        {children}
      </main>
      <Toaster />
    </Box>
  );
};
