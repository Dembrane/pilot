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

type TConversation = {
  id: string;
  created_at: Date;
  updated_at: Date;
  project_id: string;
  title?: string;
  description?: string;
  context?: string;
  participant_email?: string;
};

type TConversationChunk = {
  id: string;
  created_at: Date;
  updated_at: Date;
  conversation_id: string;

  transcript: string;
  timestamp: Date;

  is_processed: boolean;
  processing_error?: string;
};

type TProject = {
  id: string;
  created_at: Date;
  updated_at: Date;
  language: string;
  pin: string;
  name?: string;
  context?: string;
};

type TSession = {
  id: number;
  created_at: Date;
  updated_at: Date;
};

type TSessionMessage = {
  id: string;
  created_at: Date;
  session_id: string;
  text: string;
  from_user: boolean;
  // ids of documents used in this message
  documents_used: string[];
};
