import { useQuery } from "@tanstack/react-query";
import {
  getParticipantProjectById,
  getParticipantTutorialCardsBySlug,
} from "./api";

export const useParticipantProjectById = (projectId: string) => {
  return useQuery({
    queryKey: ["participantProject", projectId],
    queryFn: () => getParticipantProjectById(projectId),
  });
};

export const useParticipantTutorialCardBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["participantTutorialCard", slug],
    queryFn: () => getParticipantTutorialCardsBySlug(slug),
    select: (data) => (data.length > 0 ? data[0] : null),
    enabled: slug !== "",
  });
};
