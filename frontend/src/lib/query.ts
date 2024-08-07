import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  getProjectViews,
  initiateAndUploadConversationChunk,
  initiateConversation,
  generateProjectLibrary as generateProjectLibrary,
  uploadConversationChunk,
  uploadConversationText,
  uploadResourceByProjectId,
  generateProjectView,
  getLatestProjectAnalysisRunByProjectId,
  getProjectInsights,
  getResourceById,
  getResourcesByProjectId,
  updateResourceById,
  deleteResourceById,
  api,
} from "./api";
import { toast } from "@/components/common/Toaster";
import { directus } from "./directus";
import {
  createItem,
  deleteItem,
  passwordRequest,
  passwordReset,
  Query,
  readItem,
  readItems,
  readUser,
  registerUser,
  registerUserVerify,
  updateItem,
} from "@directus/sdk";
import { useNavigate } from "react-router-dom";
import { ADMIN_BASE_URL } from "@/config";

// always throws a error with a message
function throwWithMessage(e: unknown): never {
  if (
    e &&
    typeof e === "object" &&
    "errors" in e &&
    Array.isArray((e as any).errors)
  ) {
    // Handle Directus error format
    const message = (e as any).errors[0].message;
    console.log(message);
    throw new Error(message);
  } else if (e instanceof Error) {
    // Handle generic errors
    console.log(e.message);
    throw new Error(e.message);
  } else {
    // Handle unknown errors
    console.log("An unknown error occurred");
    throw new Error("Something went wrong");
  }
}

export const useProjects = ({
  query,
}: {
  query: Partial<Query<CustomDirectusTypes, Project>>;
}) => {
  return useQuery({
    queryKey: ["projects", query],
    queryFn: () =>
      directus.request(
        readItems("project", {
          fields: [
            "*",
            {
              tags: ["*"],
            },
          ],
          ...query,
        }),
      ),
  });
};

export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Project>) => {
      return api.post<unknown, TProject>("/projects", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully");
    },
    onError: (e) => {
      console.error(e);
      toast.error("Error creating project");
    },
  });
};

// todo: add redirection logic here
export const useLoginMutation = () => {
  return useMutation({
    mutationFn: (payload: Parameters<typeof directus.login>) => {
      return directus.login(...payload);
    },
    onSuccess: () => {
      toast.success("Login successful");
    },
  });
};

export const useRegisterMutation = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (payload: Parameters<typeof registerUser>) => {
      try {
        const response = await directus.request(registerUser(...payload));
        return response;
      } catch (e) {
        try {
          throwWithMessage(e);
        } catch (inner) {
          if (inner instanceof Error) {
            if (inner.message === "You don't have permission to access this.") {
              throw new Error(
                "Oops! It seems your email is not eligible for registration at this time. Please consider joining our waitlist for future updates!",
              );
            }
          }
        }
      }
    },
    onSuccess: () => {
      toast.success("Please check your email to verify your account.");
      navigate("/check-your-email");
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });
};

export const useVerifyMutation = (doRedirect: boolean = true) =>
  useMutation({
    mutationFn: async (data: { token: string }) => {
      try {
        const response = await directus.request(registerUserVerify(data.token));
        return response;
      } catch (e) {
        throwWithMessage(e);
      }
    },
    onSuccess: () => {
      toast.success("Email verified successfully.");
      if (doRedirect) {
        setTimeout(() => {
          window.location.href = `/login?new=true`;
        }, 4500);
      }
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });

export const useRequestPasswordResetMutation = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (email: string) => {
      try {
        const response = await directus.request(
          passwordRequest(email, `${ADMIN_BASE_URL}/password-reset`),
        );
        return response;
      } catch (e) {
        throwWithMessage(e);
      }
    },
    onSuccess: () => {
      toast.success("Password reset email sent successfully");
      navigate("/check-your-email");
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });
};

export const useResetPasswordMutation = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async ({
      token,
      password,
    }: {
      token: string;
      password: string;
    }) => {
      try {
        const response = await directus.request(passwordReset(token, password));
        return response;
      } catch (e) {
        throwWithMessage(e);
      }
    },
    onSuccess: () => {
      toast.success(
        "Password reset successfully. Please login with new password.",
      );
      navigate("/login");
    },
    onError: (e) => {
      try {
        toast.error(e.message);
      } catch (e) {
        toast.error("Error resetting password. Please contact support.");
      }
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      next: _,
    }: {
      next?: string;
      reason?: string;
      doRedirect: boolean;
    }) => {
      await directus.logout();
    },
    onMutate: async ({ next, reason, doRedirect }) => {
      queryClient.resetQueries();
      if (doRedirect) {
        window.location.href =
          "/login" +
          (next ? `?next=${encodeURIComponent(next)}` : "") +
          (reason ? `&reason=${reason}` : "");
      }
    },
  });
};

export const useProjectById = ({
  projectId,
  query = {
    fields: [
      "*",
      {
        tags: ["id", "created_at", "text"],
      },
    ],
  },
}: {
  projectId: string;
  query?: Partial<Query<CustomDirectusTypes, Project>>;
}) => {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: () =>
      directus.request<Project>(readItem("project", projectId, query)),
  });
};

export const useProjectInsights = (projectId: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "insights"],
    queryFn: () => getProjectInsights(projectId),
  });
};

export const useProjectViews = (projectId: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "views"],
    queryFn: () => getProjectViews(projectId),
    refetchInterval: 20000,
  });
};

export const useViewById = (projectId: string, viewId: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "views", viewId],
    queryFn: () =>
      directus.request<View>(
        readItem("view", viewId, {
          fields: ["*", { aspects: ["*", "count(quotes)"] }],
          deep: {
            aspects: {
              _sort: "name",
            } as any,
          },
        }),
      ),
  });
};

export const useAspectById = (projectId: string, aspectId: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "aspects", aspectId],
    queryFn: () =>
      directus.request<Aspect>(
        readItem("aspect", aspectId, {
          fields: [
            "*",
            {
              quotes: [
                "*",
                {
                  quote_id: [
                    "id",
                    "text",
                    "created_at",
                    {
                      conversation_id: ["id", "participant_name", "created_at"],
                    },
                  ],
                },
              ],
            },
            {
              representative_quotes: [
                "*",
                {
                  quote_id: [
                    "id",
                    "text",
                    "created_at",
                    {
                      conversation_id: ["id", "participant_name", "created_at"],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ),
  });
};

export const useUpdateProjectByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Project> }) =>
      directus.request<Project>(updateItem("project", id, payload)),
    onSuccess: (_values, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.id],
      });
      toast.success("Project updated successfully");
    },
  });
};

export const useDeleteProjectByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      directus.request(deleteItem("project", projectId)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
      queryClient.resetQueries();
      toast.success("Project deleted successfully");
    },
  });
};

export const useResourceById = (resourceId: string) => {
  return useQuery({
    queryKey: ["resources", resourceId],
    queryFn: () => getResourceById(resourceId),
  });
};

export const useResourcesByProjectId = (projectId: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "resources"],
    queryFn: () => getResourcesByProjectId(projectId),
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
        queryKey: ["projects", projectId, "resources"],
      });
      toast.success("Resource uploaded successfully");
    },
  });
};

export const useUpdateResourceByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateResourceById,
    onSuccess: (_values, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["resources", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects"],
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
        queryKey: ["projects"],
      });
      queryClient.invalidateQueries({
        queryKey: ["resources"],
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

export const useConversationById = ({
  conversationId,
  loadConversationChunks = false,
  query = {},
  useQueryOpts = {
    refetchInterval: 10000,
  },
}: {
  conversationId: string;
  loadConversationChunks?: boolean;
  // query overrides the default query and loadChunks
  query?: Partial<Query<CustomDirectusTypes, Conversation>>;
  useQueryOpts?: Partial<UseQueryOptions<Conversation>>;
}) => {
  return useQuery({
    queryKey: ["conversations", conversationId, loadConversationChunks, query],
    queryFn: () =>
      directus.request<Conversation>(
        readItem("conversation", conversationId, {
          fields: [
            "*",
            {
              tags: [
                {
                  project_tag_id: ["id", "text", "created_at"],
                },
              ],
            },
            ...(loadConversationChunks ? [{ chunks: ["*"] as any }] : []),
          ],
          ...query,
        }),
      ),
    ...useQueryOpts,
  });
};

export const useConversationQuotes = (conversationId: string) => {
  return useQuery({
    queryKey: ["conversations", conversationId, "quotes"],
    queryFn: () =>
      directus.request(
        readItems("quote", {
          fields: ["*", { conversation_id: ["id", "participant_name"] }],
          filter: {
            conversation_id: {
              _eq: conversationId,
            },
          },
        }),
      ),
  });
};

export const useUpdateConversationByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Conversation>;
    }) =>
      directus.request<Conversation>(updateItem("conversation", id, payload)),
    onSuccess: (values, variables) => {
      queryClient.setQueryData(
        ["conversations", variables.id],
        (oldData: Conversation | undefined) => {
          return {
            ...oldData,
            ...values,
          };
        },
      );
      queryClient.invalidateQueries({
        queryKey: ["conversations", variables.id],
      });
      // queryClient.invalidateQueries({
      //   queryKey: ["conversationd", "all"],
      // });
      toast.success("Conversation updated successfully");
    },
  });
};

export const useDeleteConversationByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      directus.request(deleteItem("conversation", conversationId)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
      toast.success("Conversation deleted successfully");
    },
  });
};

export const useDeleteConversationChunkByIdMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chunkId: string) =>
      directus.request(deleteItem("conversation_chunk", chunkId)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });
};

export const useConversationsByProjectId = (
  projectId: string,
  loadChunks?: boolean,
  loadWhereTranscriptExists?: boolean,
  query?: Partial<Query<CustomDirectusTypes, Conversation>>,
) => {
  return useQuery({
    queryKey: [
      "conversations",
      projectId,
      loadChunks ? "chunks" : "no-chunks",
      loadWhereTranscriptExists ? "transcript" : "no-transcript",
      query,
    ],
    queryFn: () =>
      directus.request(
        readItems("conversation", {
          sort: "-updated_at",
          fields: [
            "*",
            {
              tags: [
                {
                  project_tag_id: ["id", "text", "created_at"],
                },
              ],
            },
            { chunks: ["*"] },
          ],
          deep: {
            // @ts-ignore
            chunks: {
              _limit: loadChunks ? 1000 : 1,
            },
          },
          filter: {
            project_id: {
              _eq: projectId,
            },
            chunks: {
              ...(loadWhereTranscriptExists && {
                _some: {
                  transcript: {
                    _nempty: true,
                  },
                },
              }),
            },
          },
          limit: 1000,
          ...query,
        }),
      ),
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
        queryKey: ["conversations", variables.conversationId, "chunks"],
      });

      await queryClient.cancelQueries({
        queryKey: [
          "participant",
          "conversation_chunks",
          variables.conversationId,
        ],
      });

      // Snapshot the previous value
      const previousChunks = queryClient.getQueryData([
        "conversations",
        variables.conversationId,
        "chunks",
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ["conversations", variables.conversationId, "chunks"],
        (oldData: ConversationChunk[] | undefined) => {
          return oldData
            ? [
                ...oldData,
                {
                  id: "optimistic-" + Date.now(),
                  conversation_id: variables.conversationId,
                  created_at: new Date().toISOString(),
                  timestamp: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  transcript: undefined,
                } as ConversationChunk,
              ]
            : [];
        },
      );

      queryClient.setQueryData(
        ["participant", "conversation_chunks", variables.conversationId],
        (oldData: ConversationChunk[] | undefined) => {
          return oldData
            ? [
                ...oldData,
                {
                  id: "optimistic-" + Date.now(),
                  conversation_id: variables.conversationId,
                  created_at: new Date().toISOString(),
                  timestamp: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  transcript: undefined,
                } as ConversationChunk,
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
        ["conversations", variables.conversationId, "chunks"],
        context?.previousChunks,
      );
    },
    // Always refetch after error or success:
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversations", variables.conversationId, "chunks"],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "participant",
          "conversation_chunks",
          variables.conversationId,
        ],
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
        queryKey: ["conversations", variables.conversationId, "chunks"],
      });

      await queryClient.cancelQueries({
        queryKey: [
          "participant",
          "conversation_chunks",
          variables.conversationId,
        ],
      });

      // Snapshot the previous value
      const previousChunks = queryClient.getQueryData([
        "conversations",
        variables.conversationId,
        "chunks",
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ["conversations", variables.conversationId, "chunks"],
        (oldData: ConversationChunk[] | undefined) => {
          return oldData
            ? [
                ...oldData,
                {
                  id: "optimistic-" + Date.now(),
                  conversation_id: variables.conversationId,
                  created_at: new Date().toISOString(),
                  timestamp: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  transcript: undefined,
                } as ConversationChunk,
              ]
            : [];
        },
      );

      queryClient.setQueryData(
        ["participant", "conversation_chunks", variables.conversationId],
        (oldData: ConversationChunk[] | undefined) => {
          return oldData
            ? [
                ...oldData,
                {
                  id: "optimistic-" + Date.now(),
                  conversation_id: variables.conversationId,
                  created_at: new Date().toISOString(),
                  timestamp: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  transcript: undefined,
                } as ConversationChunk,
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
        ["conversations", variables.conversationId, "chunks"],
        context?.previousChunks,
      );
    },
    // Always refetch after error or success:
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversations", variables.conversationId, "chunks"],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "participant",
          "conversation_chunks",
          variables.conversationId,
        ],
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
        queryKey: ["conversations"],
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
    queryKey: ["conversations", conversationId, "chunks"],
    queryFn: () =>
      directus.request(
        readItems("conversation_chunk", {
          filter: {
            conversation_id: {
              _eq: conversationId,
            },
          },
          sort: "timestamp",
        }),
      ),
    refetchInterval,
  });
};

export const useDeleteTagByIdMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) =>
      directus.request(deleteItem("project_tag", tagId)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
      toast.success("Tag deleted successfully");
    },
  });
};

export const useCreateProjectTagMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      project_id: {
        id: string;
        directus_user_id: string;
      };
      text: string;
    }) => directus.request(createItem("project_tag", payload as any)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.project_id.id],
      });
      toast.success("Tag created successfully");
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: ["projects", variables.project_id.id],
      });

      // Snapshot the previous value
      const previousTags = queryClient.getQueryData([
        "projects",
        variables.project_id.id,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ["projects", variables.project_id.id],
        (oldData: Project | undefined) => {
          return oldData
            ? {
                ...oldData,
                tags: [
                  ...(oldData.tags ?? []),
                  {
                    id: "optimistic-" + Date.now(),
                    text: variables.text,
                    created_at: new Date().toISOString(),
                  },
                ],
              }
            : oldData;
        },
      );

      // Return a context object with the snapshotted value
      return { previousTags };
    },
  });
};

export const useGenerateProjectLibraryMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: generateProjectLibrary,
    onSuccess: (_, variables) => {
      toast.success("Analysis requested successfully");
      client.invalidateQueries({ queryKey: ["projects", variables.projectId] });
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

export const useLatestProjectAnalysisRunByProjectId = (projectId: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "latest_analysis"],
    queryFn: () => getLatestProjectAnalysisRunByProjectId(projectId),
    refetchInterval: 10000,
  });
};

export const useCurrentUser = () =>
  useQuery({
    queryKey: ["users", "me"],
    queryFn: () => directus.request(readUser("me")),
  });
