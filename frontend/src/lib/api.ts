import { API_BASE_URL, USE_PARTICIPANT_ROUTER } from "@/config";
import axios, {
  AxiosError,
  AxiosRequestConfig,
  CreateAxiosDefaults,
} from "axios";

export const apiCommonConfig: CreateAxiosDefaults = {
  baseURL: API_BASE_URL,
};

export const apiNoAuth = axios.create(apiCommonConfig);

apiNoAuth.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Pass through errors
    throw error;
  },
);

export const api = axios.create(apiCommonConfig);

export const doInitiateSession = async (sessionId?: number | "new") => {
  const url = sessionId
    ? `/session/initiate?session_id=${sessionId}`
    : "/session/initiate";
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
        if (!USE_PARTICIPANT_ROUTER) {
          // go to /login
          window.location.assign("/login");
        }
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

// const getDocuments = async () => {
//   return api.get<unknown, TDocument[]>("/document");
// };

// export const getDocumentById = async (documentId: string) => {
//   return api.get<unknown, TDocument>(`/document/${documentId}`);
// };

export const uploadResourceByProjectId = async (payload: {
  projectId: string;
  files: File[];
}) => {
  const formData = new FormData();

  payload.files.forEach((file) => {
    formData.append("files", file);
  });

  return api.post<unknown, TResource[]>(
    `/projects/${payload.projectId}/resources/upload`,
    formData,
    {
      timeout: 60000,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
};

// type TUpdateDocumentPayload = {
//   document: TDocument;
//   update: Partial<TDocument>;
// };

// const updateDocument = async (payload: TUpdateDocumentPayload) => {
//   return api.put<TDocument, TDocument>(
//     `/document/${payload.document.id}`,
//     payload.update,
//   );
// };

// const deleteDocument = async (document: TDocument) => {
//   return api.delete(`/document/${document.id}`);
// };

export const getAllSessions = async () => {
  return apiNoAuth.get<unknown, TSession[]>("/session/all");
};

export const getCurrentSession = async () => {
  return apiNoAuth.get<unknown, TSession>("/session/current");
};

export const getAllProjects = async () => {
  return api.get<unknown, TProject[]>("/projects");
};

export const createProject = async (payload: Partial<TProject>) => {
  return api.post<unknown, TProject>("/projects", payload);
};

export const getProjectById = async (projectId: string) => {
  return api.get<unknown, TProject>(`/projects/${projectId}`);
};

export const updateProjectById = async (payload: {
  update: Partial<TProject>;
  id: string;
}) => {
  console.log("updateProjectById", payload);
  return api.put<unknown, TProject>(`/projects/${payload.id}`, payload.update);
};

export const deleteProjectById = async (projectId: string) => {
  return api.delete(`/projects/${projectId}`);
};

export const getResourcesByProjectId = async (projectId: string) => {
  return api.get<unknown, TResource[]>(`/projects/${projectId}/resources`);
};

export const getResourceById = async (resourceId: string) => {
  return api.get<unknown, TResource>(`/resources/${resourceId}`);
};

export const updateResourceById = async (payload: {
  id: string;
  update: Partial<TResource>;
}) => {
  return api.put<unknown, TResource>(
    `/resources/${payload.id}`,
    payload.update,
  );
};

export const deleteResourceById = async (resourceId: string) => {
  return api.delete(`/resources/${resourceId}`);
};

export const initiateConversation = async (payload: {
  projectId: string;
  participantEmail: string;
  pin: string;
}) => {
  return apiNoAuth.post<unknown, TConversation>(
    `/projects/${payload.projectId}/conversations/initiate`,
    {
      email: payload.participantEmail,
      pin: payload.pin,
    },
  );
};

export const getConversationById = async (conversationId: string) => {
  return apiNoAuth.get<unknown, TConversation>(
    `/conversations/${conversationId}`,
  );
};

export const updateConversationById = async (payload: {
  id: string;
  update: Partial<TConversation>;
}) => {
  return api.put<unknown, TConversation>(
    `/conversations/${payload.id}`,
    payload.update,
  );
};

export const deleteConversationById = async (conversationId: string) => {
  return api.delete(`/conversations/${conversationId}`);
};

export const getConversationsByProjectId = async (projectId: string) => {
  return api.get<unknown, TConversation[]>(
    `/projects/${projectId}/conversations`,
  );
};

export const uploadConversationChunk = async (payload: {
  conversationId: string;
  chunk: Blob;
  timestamp: Date;
}) => {
  const formData = new FormData();

  if (payload.chunk.type.startsWith("audio/")) {
    const file = new File(
      [payload.chunk],
      `chunk.${payload.chunk.type.split("/")[1]}`,
      {
        type: payload.chunk.type,
      },
    );
    formData.append("chunk", file);
  }
  formData.append("timestamp", payload.timestamp.toISOString());

  return apiNoAuth.post<unknown, TConversation>(
    `/conversations/${payload.conversationId}/upload-chunk`,
    formData,
    {
      timeout: 10000,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
};

export const getConversationChunks = async (conversationId: string) => {
  return api.get<unknown, TConversationChunk[]>(
    `/conversations/${conversationId}/chunks`,
  );
};

export const getConversationContentLink = (conversationId: string) =>
  `${apiCommonConfig.baseURL}/conversations/${conversationId}/content`;

export const getConversationChunkContent = (
  conversationId: string,
  chunkId: string,
) =>
  `${apiCommonConfig.baseURL}/conversations/${conversationId}/chunks/${chunkId}/content`;

// export const getConversationDuration = async (conversationId: string) => {
//   return api.get<unknown, number>(`/conversations/${conversationId}/duration`);
// };
