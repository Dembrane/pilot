import { ActionIcon, Box, Button } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { ProjectSidebar } from "../project/ProjectSidebar";
import { useState } from "react";
import { Resizable } from "re-resizable";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useSidebarCollapsed } from "@/lib/useSidebarCollapsed";
import { Icons } from "@/icons";

// can be rendered inside BaseLayout
export const ProjectLayout = () => {
  const {
    isCollapsed,
    setIsCollapsed,
    sidebarWidth,
    setSidebarWidth,
    toggleSidebar,
  } = useSidebarCollapsed();

  return (
    <Box className="relative flex h-[calc(100vh-60px)]">
      <Resizable
        size={{ width: sidebarWidth }}
        minWidth={300}
        maxWidth="45%"
        onResizeStop={(e, _direction, _ref, d) => {
          setSidebarWidth(sidebarWidth + d.width);
        }}
        enable={{ right: !isCollapsed }}
      >
        <aside
          className={`h-full overflow-y-auto border-r transition-all duration-300 ${isCollapsed ? "w-0" : ""}`}
        >
          <ProjectSidebar />
        </aside>
      </Resizable>

      {isCollapsed && (
        <ActionIcon
          className="absolute left-2 top-2 z-10"
          variant="subtle"
          onClick={toggleSidebar}
        >
          <Icons.Sidebar />
        </ActionIcon>
      )}

      <section className="flex-grow overflow-y-auto px-2">
        <Outlet />
      </section>
    </Box>
  );
};
