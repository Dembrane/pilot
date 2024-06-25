import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProject,
  createProjectTag,
  deleteConversationById,
  deleteConversationChunkById,
  deleteProjectById,
  deleteResourceById,
  deleteTagById,
  doInitiateSession,
  getAllProjects,
  getAllSessions,
  getConversationById,
  getConversationChunks,
  getConversationQuotes,
  getConversationsByProjectId,
  getCurrentSession,
  getProjectById,
  getProjectInsights,
  getProjectViewById,
  getProjectViews,
  getResourceById,
  getResourcesByProjectId,
  getTagsByProjectId,
  initiateAndUploadConversationChunk,
  initiateConversation,
  generateProjectLibrary as generateProjectLibrary,
  updateConversationById,
  updateProjectById,
  updateResourceById,
  uploadConversationChunk,
  uploadConversationText,
  uploadResourceByProjectId,
  getTaskById,
  generateProjectView,
} from "./api";
import { toast } from "@/components/Toaster";
import { AxiosError } from "axios";

export const useCurrentSession = () => {
  return useQuery({
    queryKey: ["session", "current"],
    queryFn: getCurrentSession,
    retry: (failureCount, err) => {
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          return false;
        }
      }
      const defaultRetry = 3;
      return Number.isSafeInteger(defaultRetry)
        ? failureCount < (defaultRetry ?? 0)
        : false;
    },
  });
};

export const useAllSessions = () => {
  return useQuery({
    queryKey: ["session", "all"],
    queryFn: getAllSessions,
  });
};

export const useInitiateSessionById = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: doInitiateSession,
    onSuccess: () => {
      // queryClient.invalidateQueries({ queryKey: ["document"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.resetQueries();
      queryClient.clear();
      toast.success("Session updated successfully");
    },
  });
};

export const useProjects = () => {
  return useQuery({
    queryKey: ["project", "all"],
    queryFn: getAllProjects,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project"] });
      toast.success("Project created successfully");
    },
  });
};

export const useProjectById = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectById(projectId),
  });
};

export const useProjectInsights = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId, "insights"],
    queryFn: () => getProjectInsights(projectId),
  });
};

export const useProjectViews = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId, "views"],
    queryFn: () => getProjectViews(projectId),
  });
};

export const useProjectViewById = (projectId: string, viewId: string) => {
  return useQuery({
    queryKey: ["project", projectId, "views", viewId],
    queryFn: () => getProjectViewById(projectId, viewId),
  });
};

export const useUpdateProjectByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProjectById,
    onSuccess: (_values, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.id],
      });
      toast.success("Project updated successfully");
    },
  });
};

export const useDeleteProjectByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProjectById,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project"],
      });
      queryClient.resetQueries();
      toast.success("Project deleted successfully");
    },
  });
};

export const useResourcesByProjectId = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId, "resources"],
    queryFn: () => getResourcesByProjectId(projectId),
    refetchInterval: 15000,
  });
};

export const useUploadResourceByProjectIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadResourceByProjectId,
    retry: 3,
    onSuccess: (_values, variables) => {
      const projectId = variables.projectId;
      queryClient.invalidateQueries({
        queryKey: ["project", projectId, "resources"],
      });
      toast.success("Resource uploaded successfully");
    },
  });
};

export const useResourceById = (resourceId: string) => {
  return useQuery({
    queryKey: ["resource", resourceId],
    queryFn: () => getResourceById(resourceId),
  });
};

export const useUpdateResourceByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateResourceById,
    onSuccess: (_values, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["resource", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["project"],
      });
      toast.success("Resource updated successfully");
    },
  });
};

export const useDeleteResourceByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteResourceById,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project"],
      });
      queryClient.invalidateQueries({
        queryKey: ["resource"],
      });
      toast.success("Resource deleted successfully");
    },
  });
};

export const useInitiateConversationMutation = () => {
  return useMutation({
    mutationFn: initiateConversation,
    onSuccess: () => {
      toast.success("Success");
    },
    onError: () => {
      toast.error("Invalid PIN or email. Please try again.");
    },
  });
};

export const useConversationById = (
  conversationId: string,
  loadChunks?: boolean,
) => {
  return useQuery({
    queryKey: ["conversation", loadChunks, conversationId],
    queryFn: () => getConversationById(conversationId, loadChunks),
    refetchInterval: 10000,
  });
};

export const useConversationQuotes = (conversationId: string) => {
  return useQuery({
    queryKey: ["conversation", conversationId, "quotes"],
    queryFn: () => getConversationQuotes(conversationId),
  });
};

export const useUpdateConversationByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateConversationById,
    onSuccess: (values, variables) => {
      queryClient.setQueryData(
        ["conversation", variables.id],
        (oldData: TConversation | undefined) => {
          return {
            ...oldData,
            ...values,
          };
        },
      );
      queryClient.invalidateQueries({
        queryKey: ["conversation", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["conversation", "all"],
      });
      toast.success("Conversation updated successfully");
    },
  });
};

export const useDeleteConversationByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteConversationById,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project"],
      });
      queryClient.invalidateQueries({
        queryKey: ["conversation"],
      });
      queryClient.invalidateQueries({
        queryKey: ["all"],
      });
      toast.success("Conversation deleted successfully");
    },
  });
};

export const useDeleteConversationChunkByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteConversationChunkById,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversation"],
      });
    },
  });
};

export const useConversationsByProjectId = (
  projectId: string,
  load_chunks?: boolean,
) => {
  return useQuery({
    queryKey: [
      "conversation",
      projectId,
      load_chunks ? "all" : "all/no_chunks",
    ],
    queryFn: () => getConversationsByProjectId(projectId, load_chunks),
    refetchInterval: 30000,
  });
};

export const useUploadConversationChunk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadConversationChunk,
    retry: 10,
    // When mutate is called:
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: ["conversation", variables.conversationId, "chunks"],
      });

      // Snapshot the previous value
      const previousChunks = queryClient.getQueryData([
        "conversation",
        variables.conversationId,
        "chunks",
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ["conversation", variables.conversationId, "chunks"],
        (oldData: TConversationChunk[] | undefined) => {
          return oldData
            ? [
                ...oldData,
                {
                  id: "optimistic-" + Date.now(),
                  conversation_id: variables.conversationId,
                  created_at: new Date(),
                  timestamp: new Date(),
                  updated_at: new Date(),
                  transcript: undefined,
                } as TConversationChunk,
              ]
            : [];
        },
      );

      // Return a context object with the snapshotted value
      return { previousChunks };
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (_err, variables, context) => {
      queryClient.setQueryData(
        ["conversation", variables.conversationId, "chunks"],
        context?.previousChunks,
      );
    },
    // Always refetch after error or success:
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", variables.conversationId, "chunks"],
      });
    },
  });
};

export const useUploadConversationTextChunk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadConversationText,
    retry: 10,
    // When mutate is called:
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: ["conversation", variables.conversationId, "chunks"],
      });

      // Snapshot the previous value
      const previousChunks = queryClient.getQueryData([
        "conversation",
        variables.conversationId,
        "chunks",
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ["conversation", variables.conversationId, "chunks"],
        (oldData: TConversationChunk[] | undefined) => {
          return oldData
            ? [
                ...oldData,
                {
                  id: "optimistic-" + Date.now(),
                  conversation_id: variables.conversationId,
                  created_at: new Date(),
                  timestamp: new Date(),
                  updated_at: new Date(),
                  transcript: variables.content,
                } as TConversationChunk,
              ]
            : [];
        },
      );

      // Return a context object with the snapshotted value
      return { previousChunks };
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (_err, variables, context) => {
      queryClient.setQueryData(
        ["conversation", variables.conversationId, "chunks"],
        context?.previousChunks,
      );
    },
    // Always refetch after error or success:
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", variables.conversationId, "chunks"],
      });
    },
  });
};

export const useUploadConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: initiateAndUploadConversationChunk,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversation"],
      });
      toast.success("Conversation(s) uploaded successfully");
    },
    retry: 10,
  });
};

export const useConversationChunks = (
  conversationId: string,
  refetchInterval: number = 10000,
) => {
  return useQuery({
    queryKey: ["conversation", conversationId, "chunks"],
    queryFn: () => getConversationChunks(conversationId),
    refetchInterval,
  });
};

export const useDeleteTagByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTagById,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project"],
      });
      toast.success("Tag deleted successfully");
    },
  });
};

export const useCreateProjectTagMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProjectTag,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project"],
      });
      toast.success("Tag created successfully");
    },
  });
};

export const useProjectTags = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId, "tags"],
    queryFn: () => getTagsByProjectId(projectId),
  });
};

export const useGenerateProjectLibraryMutation = () => {
  return useMutation({
    mutationFn: generateProjectLibrary,
    onSuccess: () => {
      toast.success("Analysis requested successfully");
    },
  });
};

export const useGenerateProjectViewMutation = () => {
  return useMutation({
    mutationFn: generateProjectView,
    onSuccess: () => {
      toast.success("Analysis requested successfully");
    },
  });
};

export const useTaskStatus = (taskId: string) => {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTaskById(taskId),
    refetchInterval: 10000,
  });
};
