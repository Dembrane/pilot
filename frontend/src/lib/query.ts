import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProject,
  deleteConversationById,
  deleteProjectById,
  deleteResourceById,
  doInitiateSession,
  getAllProjects,
  getAllSessions,
  getConversationById,
  getConversationChunks,
  getConversationsByProjectId,
  getCurrentSession,
  getProjectById,
  getResourceById,
  getResourcesByProjectId,
  initiateConversation,
  updateConversationById,
  updateProjectById,
  updateResourceById,
  uploadConversationChunk,
  uploadResourceByProjectId,
} from "./api";
import { toast } from "@/components/Toaster";
import { AxiosError } from "axios";

// export const useDocumentById = (
//   documentId: string,
//   initialData?: TDocument,
// ) => {
//   return useQuery({
//     queryKey: ["document", documentId],
//     queryFn: () => getDocumentById(documentId),
//     initialData,
//     refetchInterval: 10000,
//   });
// };

// export const useUploadDocuments = () => {
//   const queryClient = useQueryClient();

//   const mutationResult = useMutation({
//     mutationFn: uploadDocument,
//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ["document"],
//       });
//       toast.success("Document(s) uploaded successfully");
//     },
//     onError: (error) => {
//       console.error("uploadDocument error", error);
//       toast.error("Error uploading document(s). Please try again.");
//     },
//   });

//   return { ...mutationResult, uploadDocument: mutationResult.mutate };
// };

// export const useUpdateDocument = () => {
//   const queryClient = useQueryClient();

//   const mutation = useMutation({
//     mutationFn: updateDocument,
//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ["document"],
//       });
//     },
//     onError: (error) => {
//       console.error("updateDocument error", error);
//     },
//   });

//   return mutation;
// };

// export const useDeleteDocument = () => {
//   const queryClient = useQueryClient();

//   const mutation = useMutation({
//     mutationFn: deleteDocument,
//     onMutate: (document: TDocument) => {
//       queryClient.setQueryData(
//         ["document"],
//         (oldData: TDocument[] | undefined) => {
//           return oldData ? oldData.filter((d) => d.id !== document.id) : [];
//         },
//       );
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ["document"],
//       });
//     },
//     onError: (error) => {
//       console.error("deleteDocument error", error);
//     },
//   });

//   return mutation;
// };

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
    refetchInterval: 10000,
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

export const useConversationById = (conversationId: string) => {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversationById(conversationId),
    refetchInterval: 5000,
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

export const useConversationsByProjectId = (projectId: string) => {
  return useQuery({
    queryKey: ["conversation", "all", projectId],
    queryFn: () => getConversationsByProjectId(projectId),
    refetchInterval: 10000,
  });
};

export const useUploadConversationChunk = () => {
  return useMutation({
    mutationFn: uploadConversationChunk,
    retry: 3,
  });
};

export const useConversationChunks = (conversationId: string) => {
  return useQuery({
    queryKey: ["conversation", conversationId, "chunks"],
    queryFn: () => getConversationChunks(conversationId),
    refetchInterval: 8000,
  });
};

// // const getSessionById = async (sessionId: string) => {
// //   return api.get<unknown, TSession>(`/session/${sessionId}`);
// // };

// // export const useSessionById = (sessionId: string) => {
// //   return useQuery({
// //     queryKey: ["session", sessionId],
// //     queryFn: () => getSessionById(sessionId),
// //     refetchInterval: 10000,
// //   });
// // };

// // const updateCurrentSession = async (session: Partial<TSession>) => {
// //   return api.put<TSession, TSession>(`/session`, session);
// // };

// // export const useUpdateCurrentSession = () => {
// //   const queryClient = useQueryClient();

// //   const mutation = useMutation({
// //     mutationFn: updateCurrentSession,
// //     onSuccess: () => {
// //       queryClient.invalidateQueries({
// //         queryKey: ["session"],
// //       });
// //       toast.success("Updated successfully");
// //     },
// //     onError: (error) => {
// //       toast.error("Error updating session. Please try again.");
// //       console.error("updateSession error", error);
// //     },
// //   });

// //   return mutation;
// // };

// const updateSessionById = async ({
//   sessionId,
//   payload,
// }: {
//   sessionId: string;
//   payload: Partial<TSession>;
// }) => {
//   return api.put<TSession, TSession>(`/session/${sessionId}`, payload);
// };

// export const useUpdateSessionById = () => {
//   const queryClient = useQueryClient();

//   const mutation = useMutation({
//     mutationFn: updateSessionById,
//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ["session"],
//       });
//       toast.success("Updated successfully");
//     },
//     onError: (error) => {
//       toast.error("Error updating session. Please try again.");
//       console.error("updateSession error", error);
//     },
//   });

//   return mutation;
// };

// const getDocumentMessages = async (documentId: string) => {
//   return api.get<unknown, TDocumentMessage[]>(`/document/${documentId}/chat`);
// };

// export const useDocumentMessages = (documentId: string) => {
//   return useQuery({
//     queryKey: ["document", documentId, "chat"],
//     queryFn: () => getDocumentMessages(documentId),
//     refetchInterval: 10000,
//   });
// };

// type PostDocumentMessagePayload = {
//   documentId: string;
//   message: string;
// };

// const postDocumentMessage = async (payload: PostDocumentMessagePayload) => {
//   if (payload.message == "") {
//     throw new Error("Please enter a message");
//   }
//   return api.post<unknown, TDocumentMessage>(
//     `/document/${payload.documentId}/chat`,
//     {
//       message: payload.message,
//     },
//   );
// };

// export const usePostDocumentMessage = () => {
//   const queryClient = useQueryClient();

//   const mutation = useMutation({
//     mutationFn: postDocumentMessage,
//     onMutate: ({ documentId, message }) => {
//       queryClient.setQueryData(
//         ["document", documentId, "chat"],
//         (oldData: TDocumentMessage[] | undefined) => {
//           return oldData
//             ? [
//                 ...oldData,
//                 {
//                   id: `optimistic-${Date.now()}`,
//                   document_id: documentId,
//                   created_at: new Date(),
//                   text: message,
//                   from_user: true,
//                 } as TDocumentMessage,
//               ]
//             : [];
//         },
//       );
//     },
//     onSuccess: ({ document_id }) => {
//       queryClient.invalidateQueries({
//         queryKey: ["document", document_id, "chat"],
//       });
//     },
//     onError: (error) => {
//       console.error("postDocumentMessage error", error);
//       toast.error("Error getting a chat response. Please try again.");
//     },
//   });

//   return mutation;
// };

// const getSessionMessages = async () => {
//   return api.get<unknown, TSessionMessage[]>(`/session/chat`);
// };

// export const useSessionMessages = () => {
//   return useQuery({
//     queryKey: ["session", "chat"],
//     queryFn: () => getSessionMessages(),
//     refetchInterval: 10000,
//   });
// };

// type PostSessionMessagePayload = {
//   message: string;
// };

// export const postSessionMessage = async (
//   payload: PostSessionMessagePayload,
// ) => {
//   if (payload.message == "") {
//     throw new Error("Please enter a message");
//   }
//   return api.post<unknown, TSessionMessage>("/session/chat", {
//     message: payload.message,
//   });
// };

// export const usePostSessionMessage = () => {
//   const queryClient = useQueryClient();

//   const mutation = useMutation({
//     mutationFn: postSessionMessage,
//     onMutate: ({ message }) => {
//       queryClient.setQueryData(["session"], (oldData: TSession | undefined) => {
//         return {
//           ...oldData,
//           processing_since: new Date(),
//         } as TSession;
//       });
//       queryClient.setQueryData(
//         ["session", "chat"],
//         (oldData: TSessionMessage[] | undefined) => {
//           return oldData
//             ? [
//                 ...oldData,
//                 {
//                   id: `optimistic-${Date.now()}`,
//                   session_id: "current",
//                   created_at: new Date(),
//                   text: message,
//                   from_user: true,
//                   documents_used: [],
//                 } as TSessionMessage,
//               ]
//             : [];
//         },
//       );
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ["session"],
//       });
//     },
//     onError: (error) => {
//       console.error("postSessionMessage error", error);
//       toast.error("Error getting a chat response. Please try again.");
//     },
//   });

//   return mutation;
// };
