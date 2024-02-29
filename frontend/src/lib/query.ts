import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, {
  AxiosError,
  AxiosRequestConfig,
  CreateAxiosDefaults,
} from "axios";
import { toast } from "../components/Toaster";

const commonConfig: CreateAxiosDefaults = {
  baseURL: "/api",
};

export const apiNoAuth = axios.create(commonConfig);

apiNoAuth.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Pass through errors
    throw error;
  },
);

export const api = axios.create(commonConfig);

const initiateSession = async (sessionId?: number | "new") => {
  const url = sessionId ? `/initiate?session_id=${sessionId}` : "/initiate";
  return api.get(url);
};

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const { config, response } = error;
    // Retry the request if the response status is 401 or 403
    if (
      response &&
      [401, 403].includes(response.status) &&
      config &&
      !(config as CustomAxiosRequestConfig)._retry
    ) {
      (config as CustomAxiosRequestConfig)._retry = true;
      try {
        await initiateSession();
        return api(config);
      } catch (e) {
        console.error("init session error", e);
        // Handle the error when refreshing the session fails
        throw e;
      }
    }
    // Pass through other errors
    throw error;
  },
);

const getDocuments = async () => {
  return api.get<unknown, TDocument[]>("/document");
};

export const useDocuments = () => {
  const queryResult = useQuery({
    queryKey: ["document"],
    queryFn: getDocuments,
    refetchInterval: 10000,
  });

  return queryResult;
};

export const getDocumentById = async (documentId: string) => {
  return api.get<unknown, TDocument>(`/document/${documentId}`);
};

export const useDocumentById = (
  documentId: string,
  initialData?: TDocument,
) => {
  return useQuery({
    queryKey: ["document", documentId],
    queryFn: () => getDocumentById(documentId),
    initialData,
    refetchInterval: 10000,
  });
};

const uploadDocument = async (files: File[]) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  return api.post<unknown, TDocument[]>("/upload-documents", formData, {
    timeout: 15000,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const useUploadDocuments = () => {
  const queryClient = useQueryClient();

  const mutationResult = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["document"],
      });
      toast.success("Document(s) uploaded successfully");
    },
    onError: (error) => {
      console.error("uploadDocument error", error);
      toast.error("Error uploading document(s). Please try again.");
    },
  });

  return { ...mutationResult, uploadDocument: mutationResult.mutate };
};

type TUpdateDocumentPayload = {
  document: TDocument;
  update: Partial<TDocument>;
};

const updateDocument = async (payload: TUpdateDocumentPayload) => {
  return api.put<TDocument, TDocument>(
    `/document/${payload.document.id}`,
    payload.update,
  );
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["document"],
      });
    },
    onError: (error) => {
      console.error("updateDocument error", error);
    },
  });

  return mutation;
};

const deleteDocument = async (document: TDocument) => {
  return api.delete(`/document/${document.id}`);
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteDocument,
    onMutate: (document: TDocument) => {
      queryClient.setQueryData(
        ["document"],
        (oldData: TDocument[] | undefined) => {
          return oldData ? oldData.filter((d) => d.id !== document.id) : [];
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["document"],
      });
    },
    onError: (error) => {
      console.error("deleteDocument error", error);
    },
  });

  return mutation;
};

const getAllSessions = async () => {
  return apiNoAuth.get<unknown, TSession[]>("/all-sessions");
};

export const useAllSessions = () => {
  return useQuery({
    queryKey: ["session", "all"],
    queryFn: getAllSessions,
    refetchInterval: 10000,
  });
};

export const useInitiateSessionById = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: initiateSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.resetQueries();
      toast.success("Session updated successfully");
    },
  });
};

const getCurrentSession = async () => {
  return api.get<unknown, TSession>("/session");
};

export const useCurrentSession = () => {
  return useQuery({
    queryKey: ["session"],
    queryFn: getCurrentSession,
    refetchInterval: 10000,
  });
};

const updateCurrentSession = async (session: Partial<TSession>) => {
  return api.put<TSession, TSession>(`/session`, session);
};

export const useUpdateCurrentSession = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateCurrentSession,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["session"],
      });
      toast.success("Updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating session. Please try again.");
      console.error("updateSession error", error);
    },
  });

  return mutation;
};

const getDocumentMessages = async (documentId: string) => {
  return api.get<unknown, TDocumentMessage[]>(`/document/${documentId}/chat`);
};

export const useDocumentMessages = (documentId: string) => {
  return useQuery({
    queryKey: ["document", documentId, "chat"],
    queryFn: () => getDocumentMessages(documentId),
    refetchInterval: 10000,
  });
};

type PostDocumentMessagePayload = {
  documentId: string;
  message: string;
};

const postDocumentMessage = async (payload: PostDocumentMessagePayload) => {
  if (payload.message == "") {
    throw new Error("Please enter a message");
  }
  return api.post<unknown, TDocumentMessage>(
    `/document/${payload.documentId}/chat`,
    {
      message: payload.message,
    },
  );
};

export const usePostDocumentMessage = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: postDocumentMessage,
    onMutate: ({ documentId, message }) => {
      queryClient.setQueryData(
        ["document", documentId, "chat"],
        (oldData: TDocumentMessage[] | undefined) => {
          return oldData
            ? [
                ...oldData,
                {
                  id: `optimistic-${Date.now()}`,
                  document_id: documentId,
                  created_at: new Date(),
                  text: message,
                  from_user: true,
                } as TDocumentMessage,
              ]
            : [];
        },
      );
    },
    onSuccess: ({ document_id }) => {
      queryClient.invalidateQueries({
        queryKey: ["document", document_id, "chat"],
      });
    },
    onError: (error) => {
      console.error("postDocumentMessage error", error);
      toast.error("Error getting a chat response. Please try again.");
    },
  });

  return mutation;
};

const getSessionMessages = async () => {
  return api.get<unknown, TSessionMessage[]>(`/session/chat`);
};

export const useSessionMessages = () => {
  return useQuery({
    queryKey: ["session", "chat"],
    queryFn: () => getSessionMessages(),
    refetchInterval: 10000,
  });
};

type PostSessionMessagePayload = {
  message: string;
};

export const postSessionMessage = async (
  payload: PostSessionMessagePayload,
) => {
  if (payload.message == "") {
    throw new Error("Please enter a message");
  }
  return api.post<unknown, TSessionMessage>("/session/chat", {
    message: payload.message,
  });
};

export const usePostSessionMessage = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: postSessionMessage,
    onMutate: ({ message }) => {
      queryClient.setQueryData(["session"], (oldData: TSession | undefined) => {
        return {
          ...oldData,
          processing_since: new Date(),
        } as TSession;
      });
      queryClient.setQueryData(
        ["session", "chat"],
        (oldData: TSessionMessage[] | undefined) => {
          return oldData
            ? [
                ...oldData,
                {
                  id: `optimistic-${Date.now()}`,
                  session_id: "current",
                  created_at: new Date(),
                  text: message,
                  from_user: true,
                  documents_used: [],
                } as TSessionMessage,
              ]
            : [];
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["session"],
      });
    },
    onError: (error) => {
      console.error("postSessionMessage error", error);
      toast.error("Error getting a chat response. Please try again.");
    },
  });

  return mutation;
};
