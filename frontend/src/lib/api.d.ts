type TDocument = {
  id: string;
  created_at: Date;
  title?: string;
  description?: string;
  context?: string;
  is_processed: boolean;
  processing_error?: string;
  original_filename: string;
};

type TDocumentMessage = {
  id: string;
  created_at: Date;
  document_id: string;
  text: string;
  from_user: boolean;
  is_global: boolean;
};

type TSession = {
  id: int;
  created_at: Date;
  name?: str;
  context?: str;
  processing_since?: Date;
  documents_count: int;
  language: str;
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
