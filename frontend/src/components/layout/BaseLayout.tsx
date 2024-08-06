import { Box, Group, Paper } from "@mantine/core";
import { Logo } from "../common/Logo";
import { Toaster } from "../common/Toaster";
import { Outlet } from "react-router-dom";
import { PropsWithChildren } from "react";
import { Header } from "../common/Header";

export const BaseLayout = ({ children }: PropsWithChildren) => {
  return (
    <Box className="min-h-screen">
      <Box className="h-[60px] w-full fixed top-0 z-10">
        <Header />
      </Box>

      <main className="w-full pt-[60px] h-[calc(100%-60px)]">
        <Outlet />
        {children}
      </main>

      <Toaster />
    </Box>
  );
};
