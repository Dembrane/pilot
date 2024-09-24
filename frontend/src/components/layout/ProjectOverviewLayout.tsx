import {
  useConversationsByProjectId,
  useProjectById,
  useUpdateProjectByIdMutation,
} from "@/lib/query";
import {
  Box,
  Checkbox,
  Divider,
  LoadingOverlay,
  SimpleGrid,
  Stack,
  Tooltip,
  VisuallyHidden,
} from "@mantine/core";
import { useParams } from "react-router-dom";
import { TabsWithRouter } from "./TabsWithRouter";
import { PARTICIPANT_BASE_URL } from "@/config";
import { Icons } from "@/icons";
import { useDocumentTitle } from "@mantine/hooks";
import { IconUsersGroup } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { SummaryCard } from "../common/SummaryCard";

import useSessionStorageState from "use-session-storage-state";
import { ProjectQRCode } from "../project/ProjectQRCode";
import { OngoingConversationsSummaryCard } from "../conversation/OngoingConversationsSummaryCard";

export const ProjectOverviewLayout = () => {
  const projectId = useParams().projectId;
  const projectQuery = useProjectById({
    projectId: projectId ?? "",
  });
  const conversationsQuery = useConversationsByProjectId(projectId ?? "");
  const updateProjectMutation = useUpdateProjectByIdMutation();

  useDocumentTitle("Project Overview | Dembrane");

  const handleOpenForParticipationCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    updateProjectMutation.mutate({
      id: projectId ?? "",
      payload: {
        is_conversation_allowed: e.target.checked,
      },
    });
  };

  const summaryItems = [
    {
      loading: conversationsQuery.isLoading,
      icon: <Icons.Phone width="24px" />,
      label: "Open for Participation?",
      value: (
        <Tooltip
          position="bottom"
          label="Allow participants using the link to start new conversations"
        >
          <Checkbox
            size="md"
            checked={projectQuery.data?.is_conversation_allowed}
            disabled={
              updateProjectMutation.isPending || projectQuery.isFetching
            }
            onChange={handleOpenForParticipationCheckboxChange}
          />
        </Tooltip>
      ),
    },
  ];
  return (
    <Stack className="relative px-2 py-4">
      {" "}
      {/* Add h-full class */}
      <LoadingOverlay visible={projectQuery.isLoading} />
      <div className="grid grid-cols-12 place-content-stretch gap-3">
        <Box
          visibleFrom="lg"
          className="col-span-5 h-full" // Update this class
        >
          <ProjectQRCode project={projectQuery.data} />
        </Box>
        <Stack
          gap="sm"
          className="col-span-12 h-full lg:col-span-7 2xl:col-span-4"
        >
          {summaryItems.map((item, index) => (
            <SummaryCard key={index} {...item} />
          ))}
          <OngoingConversationsSummaryCard projectId={projectId ?? ""} />
        </Stack>
      </div>
      <Divider />
      <TabsWithRouter
        basePath="/projects/:projectId"
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "portal-editor", label: "Portal Editor" },
          { value: "transcript-settings", label: "Transcript Settings" },
        ]}
        loading={projectQuery.isLoading}
      />
    </Stack>
  );
};
