import { Box } from "@mantine/core";
import { Toaster } from "../common/Toaster";
import { Outlet } from "react-router-dom";
import { PropsWithChildren } from "react";
import { Header } from "./Header";
import { ErrorBoundary } from "../error/ErrorBoundary";

export const BaseLayout = ({ children }: PropsWithChildren) => {
  return (
    <Box className="min-h-screen">
      <Box className="fixed top-0 z-10 h-[60px] w-full">
        <Header />
      </Box>

      <ErrorBoundary>
        <main className="h-[calc(100%-60px)] w-full pt-[60px]">
          <Outlet />
          {children}
        </main>
      </ErrorBoundary>

      <Toaster />
    </Box>
  );
};
