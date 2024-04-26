type TResource = {
  id: string;
  created_at: Date;
  updated_at: Date;
  project_id: string;
  is_processed: boolean;
  type: string;
  original_filename: string;
  title: string;
  description?: string;
  context?: string;
  processing_error?: string;
};

type TProjectTag = {
  id: string;
  created_at: Date;
  updated_at: Date;
  text: string;
};

type TConversation = {
  id: string;
  created_at: Date;
  updated_at: Date;
  project_id: string;
  title?: string;
  description?: string;
  context?: string;
  participant_email?: string;
  participant_name: string;
  tags: TProjectTag[];
};

type TProcessingStatus = "PENDING" | "PROCESSING" | "ERROR" | "DONE";

type TQuote = {
  id: string;
  created_at: Date;
  updated_at: Date;
  project_analysis_run_id: string;
  conversation_id: string;
  conversation_chunks: TConversationChunk[];
  text: string;
};

type TInsight = {
  id: string;
  created_at: Date;
  updated_at: Date;
  project_analysis_run_id: string;
  title: string;
  summary: string;
  quotes: TQuote[];
};

type TConversationChunk = {
  id: string;
  created_at: Date;
  updated_at: Date;
  conversation_id: string;

  transcript: string;
  timestamp: Date;

  processing_status?: TProcessingStatus;
  processing_error?: string;
  processing_started_at?: Date;
  processing_completed_at?: Date;
};

type TProject = {
  id: string;
  created_at: Date;
  updated_at: Date;
  language: string;
  pin: string;
  name?: string;
  context?: string;
  is_conversation_allowed?: boolean;
  default_conversation_title?: string;
  default_conversation_description?: string;
  default_conversation_context?: string;
  tags: TProjectTag[];
};

type TSession = {
  id: number;
  created_at: Date;
  updated_at: Date;
};
