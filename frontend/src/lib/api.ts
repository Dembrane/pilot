import { toast } from "@/components/Toaster";
import { API_BASE_URL, USE_PARTICIPANT_ROUTER } from "@/config";
import axios, {
  AxiosError,
  AxiosRequestConfig,
  CreateAxiosDefaults,
} from "axios";

export const apiCommonConfig: CreateAxiosDefaults = {
  baseURL: API_BASE_URL,
  withCredentials: true,
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

export const getProjectInsights = async (projectId: string) => {
  return api.get<unknown, TInsight[]>(`/projects/${projectId}/insights`);
};

export const getProjectViews = async (projectId: string) => {
  return api.get<unknown, TView[]>(`/projects/${projectId}/views`);
};

export const getProjectViewById = async (projectId: string, viewId: string) => {
  return api.get<unknown, TView>(`/projects/${projectId}/views/${viewId}`);
};

export const getProjectTranscriptsLink = (projectId: string) =>
  `${apiCommonConfig.baseURL}/projects/${projectId}/transcripts`;

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
  email?: string;
  name: string;
  pin: string;
  tagIdList: string[];
}) => {
  return apiNoAuth.post<unknown, TConversation>(
    `/projects/${payload.projectId}/conversations/initiate`,
    {
      email: payload.email ?? undefined,
      name: payload.name,
      pin: payload.pin,
      tag_id_list: payload.tagIdList,
      user_agent: navigator.userAgent ?? undefined,
    },
  );
};

export const getConversationById = async (
  conversationId: string,
  loadChunks?: boolean,
) => {
  return apiNoAuth.get<unknown, TConversation>(
    `/conversations/${conversationId}`,
    {
      params: {
        load_chunks: loadChunks,
      },
    },
  );
};

export const getConversationQuotes = async (conversationId: string) => {
  return api.get<unknown, TQuote[]>(`/conversations/${conversationId}/quotes`);
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

export const deleteConversationChunkById = async (chunkId: string) => {
  return api.delete(`/conversation-chunks/${chunkId}`);
};

export const getConversationsByProjectId = async (
  projectId: string,
  load_chunks?: boolean,
) => {
  return api.get<unknown, TConversation[]>(
    `/projects/${projectId}/conversations`,
    {
      params: {
        load_chunks,
      },
    },
  );
};

export const uploadConversationChunk = async (payload: {
  conversationId: string;
  chunk?: Blob;
  timestamp: Date;
}) => {
  const formData = new FormData();

  if (!payload.chunk) {
    throw new Error("No chunk provided");
  }

  const fileExtension = payload.chunk.type.split("/")[1].split(";")[0];
  const file = new File([payload.chunk], `chunk.${fileExtension}`, {
    type: payload.chunk.type,
  });
  formData.append("chunk", file);
  formData.append("timestamp", payload.timestamp.toISOString());

  return apiNoAuth.post<unknown, TConversationChunk[]>(
    `/conversations/${payload.conversationId}/upload-chunk`,
    formData,
    {
      // 10 min
      timeout: 600000,
      // 25 mB
      maxBodyLength: 25 * 1024 * 1024,
      maxContentLength: 25 * 1024 * 1024,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
};

export const uploadConversationText = async (payload: {
  conversationId: string;
  content: string;
  timestamp: Date;
}) => {
  return apiNoAuth.post<unknown, TConversationChunk>(
    `/conversations/${payload.conversationId}/upload-text`,
    {
      content: payload.content,
      timestamp: payload.timestamp.toISOString(),
    },
  );
};

export const initiateAndUploadConversationChunk = async (payload: {
  projectId: string;
  pin: string;
  namePrefix: string;
  tagIdList: string[];
  chunks: Blob[];
  timestamps: Date[];
  email?: string;
}) => {
  const promises = [];
  for (let i = 0; i < payload.chunks.length; i++) {
    try {
      toast(
        `Uploading conversation '${(payload.chunks[i] as unknown as any).name}'`,
      );
    } catch (e) {
      console.error(e);
    }

    let blob: Blob = payload.chunks[i];
    let name = "";

    if (payload.namePrefix) {
      name = `${payload.namePrefix}`;
    }

    if (blob instanceof File) {
      console.log("Blob is actually File");
      name += blob.name;

      const isxm4a = blob.type === "audio/x-m4a";
      if (isxm4a) {
        console.log("Converting xm4a to audio/m4a");
        blob = new Blob([await blob.arrayBuffer()], { type: "audio/m4a" });
      }
    } else {
      console.log("Blob is not a File");
      name += `chunk-${i}`;
    }

    const conversation = await initiateConversation({
      projectId: payload.projectId,
      email: payload.email,
      name: `${name}`,
      pin: payload.pin,
      tagIdList: payload.tagIdList,
    });

    promises.push(
      uploadConversationChunk({
        conversationId: conversation.id,
        chunk: blob,
        timestamp: payload.timestamps.at(i) ?? new Date(),
      }),
    );
  }

  return Promise.all(promises);
};

export const getConversationChunks = async (conversationId: string) => {
  return api.get<unknown, TConversationChunk[]>(
    `/conversations/${conversationId}/chunks`,
  );
};

export const getConversationContentLink = (conversationId: string) =>
  `${apiCommonConfig.baseURL}/conversations/${conversationId}/content`;

export const getConversationChunkContentLink = (
  conversationId: string,
  chunkId: string,
) =>
  `${apiCommonConfig.baseURL}/conversations/${conversationId}/chunks/${chunkId}/content`;

export const getTagsByProjectId = async (projectId: string) => {
  return apiNoAuth.get<unknown, TProjectTag[]>(`/projects/${projectId}/tag`);
};

export const deleteTagById = async (tagId: string) => {
  return api.delete(`/tag/${tagId}`);
};

export const createProjectTag = async (payload: {
  projectId: string;
  text: string;
}) => {
  return api.post<unknown, TProjectTag>(`/projects/${payload.projectId}/tag`, {
    text: payload.text,
  });
};

export const generateProjectLibrary = async (payload: {
  projectId: string;
}) => {
  return api.post<unknown, TTask>(
    `/projects/${payload.projectId}/create-library`,
  );
};

export const generateProjectView = async (payload: {
  projectId: string;
  query: string;
  additionalContext?: string;
}) => {
  return api.post<unknown, TTask>(
    `/projects/${payload.projectId}/create-view`,
    {
      query: payload.query,
      additional_context: payload.additionalContext,
    },
  );
};

export const getTaskById = async (taskId: string) => {
  return api.get<unknown, TTask>(`/tasks/${taskId}`);
};
