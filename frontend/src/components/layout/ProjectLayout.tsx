import { Box } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { ProjectSidebar } from "../project/ProjectSidebar";

// can be rendered inside BaseLayout
export const ProjectLayout = () => {
  return (
    <Box className="relative grid grid-cols-12 gap-2">
      <aside className="col-span-full h-fit border-b border-r-0 lg:col-span-4 lg:h-[calc(100vh-60px)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <ProjectSidebar />
      </aside>

      <section className="col-span-full h-fit lg:col-span-8 lg:h-[calc(100vh-60px)] lg:overflow-y-auto">
        <Outlet />
      </section>
    </Box>
  );
};
