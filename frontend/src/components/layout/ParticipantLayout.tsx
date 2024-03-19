import { Outlet } from "react-router-dom";
import { BaseLayout } from "./BaseLayout";
import { Toaster } from "../Toaster";
import { Box, Paper, Group, Container } from "@mantine/core";
import { Logo } from "../Logo";

export const ParticipantLayout = () => {
  return (
    <main className="relative h-screen overflow-y-auto">
      <div className="container mx-auto h-full max-w-lg">
        <Outlet />
      </div>
    </main>
  );
};
