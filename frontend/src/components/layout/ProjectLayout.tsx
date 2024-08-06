import { Box, Group, Paper } from "@mantine/core";
import { Logo } from "../common/Logo";
import { Toaster } from "../common/Toaster";
import { PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";
import { ProjectSidebar } from "../project/ProjectSidebar";

// can be rendered inside BaseLayout
export const ProjectLayout = () => {
  return (
    <Box className="grid grid-cols-12 gap-4 relative">
      <aside className="col-span-full md:col-span-4 h-fit md:h-[calc(100vh-60px)] md:overflow-y-auto">
        <ProjectSidebar />
      </aside>

      <section className="col-span-full md:col-span-8 h-fit md:h-[calc(100vh-60px)] md:overflow-y-auto">
        <Outlet />
      </section>
    </Box>
  );
};
