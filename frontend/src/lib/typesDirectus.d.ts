type AlembicVersion = {
  version_num: string;
};

type Aspect = {
  centroid_embedding?: string | null;
  created_at: string;
  description?: string | null;
  id: string;
  image_url?: string | null;
  long_summary?: string | null;
  name: string;
  project_analysis_run_id?: string | null;
  quotes: any[] | QuoteAspect[];
  quotes_count?: number | null;
  representative_quotes: any[] | QuoteAspect1[];
  short_summary?: string | null;
  updated_at: string;
  view_id?: string | View | null;
};

type CeleryTaskmeta = {
  args?: string | null;
  date_done?: string | null;
  id: number;
  kwargs?: string | null;
  name?: string | null;
  queue?: string | null;
  result?: string | null;
  retries?: number | null;
  status?: string | null;
  task_id?: string | null;
  traceback?: string | null;
  worker?: string | null;
};

type CeleryTasksetmeta = {
  date_done?: string | null;
  id: number;
  result?: string | null;
  taskset_id?: string | null;
};

type Conversation = {
  context?: string | null;
  created_at: string;
  description?: string | null;
  id: string;
  participant_email?: string | null;
  participant_name: string;
  participant_user_agent?: string | null;
  processing_completed_at?: string | null;
  processing_error?: string | null;
  processing_started_at?: string | null;
  processing_status: string;
  project_id: string;
  tags?: null | ConversationProjectTag[];
  chunks?: ConversationChunk[];
  title?: string | null;
  updated_at: string;
  summary?: string;
};

type ConversationChunk = {
  conversation_id: string;
  created_at: string;
  id: string;
  path?: string | null;
  quotes?: string[] | QuoteConversationChunk[];
  task_id?: string | null;
  timestamp: string;
  transcript?: string | null;
  updated_at: string;
};

type ConversationProjectTag = {
  conversation_id?: string | Conversation | null;
  id: number;
  project_tag_id?: string | ProjectTag | null;
};

type DirectusActivity = {
  action: string;
  collection: string;
  comment?: string | null;
  id: number;
  ip?: string | null;
  item: string;
  origin?: string | null;
  revisions: any[] | DirectusRevisions[];
  timestamp: string;
  user?: string | DirectusUsers | null;
  user_agent?: string | null;
};

type DirectusCollections = {
  accountability?: string | null;
  archive_app_filter: boolean;
  archive_field?: string | null;
  archive_value?: string | null;
  collapse: string;
  collection: string;
  color?: string | null;
  display_template?: string | null;
  group?: string | DirectusCollections | null;
  hidden: boolean;
  icon?: string | null;
  item_duplication_fields?: unknown | null;
  note?: string | null;
  preview_url?: string | null;
  singleton: boolean;
  sort?: number | null;
  sort_field?: string | null;
  translations?: unknown | null;
  unarchive_value?: string | null;
  versioning: boolean;
};

type DirectusDashboards = {
  color?: string | null;
  date_created?: string | null;
  icon: string;
  id: string;
  name: string;
  note?: string | null;
  panels: any[] | DirectusPanels[];
  user_created?: string | DirectusUsers | null;
};

type DirectusExtensions = {
  bundle?: string | null;
  enabled: boolean;
  folder: string;
  id: string;
  source: string;
};

type DirectusFields = {
  collection: string | DirectusCollections;
  conditions?: unknown | null;
  display?: string | null;
  display_options?: unknown | null;
  field: string;
  group?: string | DirectusFields | null;
  hidden: boolean;
  id: number;
  interface?: string | null;
  note?: string | null;
  options?: unknown | null;
  readonly: boolean;
  required?: boolean | null;
  sort?: number | null;
  special?: unknown | null;
  translations?: unknown | null;
  validation?: unknown | null;
  validation_message?: string | null;
  width?: string | null;
};

type DirectusFiles = {
  charset?: string | null;
  description?: string | null;
  duration?: number | null;
  embed?: string | null;
  filename_disk?: string | null;
  filename_download: string;
  filesize?: number | null;
  focal_point_x?: number | null;
  focal_point_y?: number | null;
  folder?: string | DirectusFolders | null;
  height?: number | null;
  id: string;
  location?: string | null;
  metadata?: unknown | null;
  modified_by?: string | DirectusUsers | null;
  modified_on: string;
  storage: string;
  tags?: unknown | null;
  title?: string | null;
  type?: string | null;
  uploaded_by?: string | DirectusUsers | null;
  uploaded_on: string;
  width?: number | null;
};

type DirectusFlows = {
  accountability?: string | null;
  color?: string | null;
  date_created?: string | null;
  description?: string | null;
  icon?: string | null;
  id: string;
  name: string;
  operation?: string | DirectusOperations | null;
  operations: any[] | DirectusOperations[];
  options?: unknown | null;
  status: string;
  trigger?: string | null;
  user_created?: string | DirectusUsers | null;
};

type DirectusFolders = {
  id: string;
  name: string;
  parent?: string | DirectusFolders | null;
};

type DirectusMigrations = {
  name: string;
  timestamp?: string | null;
  version: string;
};

type DirectusNotifications = {
  collection?: string | null;
  id: number;
  item?: string | null;
  message?: string | null;
  recipient: string | DirectusUsers;
  sender?: string | DirectusUsers | null;
  status?: string | null;
  subject: string;
  timestamp?: string | null;
};

type DirectusOperations = {
  date_created?: string | null;
  flow: string | DirectusFlows;
  id: string;
  key: string;
  name?: string | null;
  options?: unknown | null;
  position_x: number;
  position_y: number;
  reject?: string | DirectusOperations | null;
  resolve?: string | DirectusOperations | null;
  type: string;
  user_created?: string | DirectusUsers | null;
};

type DirectusPanels = {
  color?: string | null;
  dashboard: string | DirectusDashboards;
  date_created?: string | null;
  height: number;
  icon?: string | null;
  id: string;
  name?: string | null;
  note?: string | null;
  options?: unknown | null;
  position_x: number;
  position_y: number;
  show_header: boolean;
  type: string;
  user_created?: string | DirectusUsers | null;
  width: number;
};

type DirectusPermissions = {
  action: string;
  collection: string;
  fields?: unknown | null;
  id: number;
  permissions?: unknown | null;
  presets?: unknown | null;
  role?: string | DirectusRoles | null;
  validation?: unknown | null;
};

type DirectusPresets = {
  bookmark?: string | null;
  collection?: string | null;
  color?: string | null;
  filter?: unknown | null;
  icon?: string | null;
  id: number;
  layout?: string | null;
  layout_options?: unknown | null;
  layout_query?: unknown | null;
  refresh_interval?: number | null;
  role?: string | DirectusRoles | null;
  search?: string | null;
  user?: string | DirectusUsers | null;
};

type DirectusRelations = {
  id: number;
  junction_field?: string | null;
  many_collection: string;
  many_field: string;
  one_allowed_collections?: unknown | null;
  one_collection?: string | null;
  one_collection_field?: string | null;
  one_deselect_action: string;
  one_field?: string | null;
  sort_field?: string | null;
};

type DirectusRevisions = {
  activity: number | DirectusActivity;
  collection: string;
  data?: unknown | null;
  delta?: unknown | null;
  id: number;
  item: string;
  parent?: number | DirectusRevisions | null;
  version?: string | DirectusVersions | null;
};

type DirectusRoles = {
  admin_access: boolean;
  app_access: boolean;
  description?: string | null;
  enforce_tfa: boolean;
  icon: string;
  id: string;
  ip_access?: unknown | null;
  name: string;
  users: any[] | DirectusUsers[];
};

type DirectusSessions = {
  expires: string;
  ip?: string | null;
  next_token?: string | null;
  origin?: string | null;
  share?: string | DirectusShares | null;
  token: string;
  user?: string | DirectusUsers | null;
  user_agent?: string | null;
};

type DirectusSettings = {
  auth_login_attempts?: number | null;
  auth_password_policy?: string | null;
  basemaps?: unknown | null;
  custom_aspect_ratios?: unknown | null;
  custom_css?: string | null;
  default_appearance: string;
  default_language: string;
  default_theme_dark?: string | null;
  default_theme_light?: string | null;
  id: number;
  mapbox_key?: string | null;
  module_bar?: unknown | null;
  project_color: string;
  project_descriptor?: string | null;
  project_logo?: string | DirectusFiles | null;
  project_name: string;
  project_url?: string | null;
  public_background?: string | DirectusFiles | null;
  public_favicon?: string | DirectusFiles | null;
  public_foreground?: string | DirectusFiles | null;
  public_note?: string | null;
  public_registration: boolean;
  public_registration_email_filter?: unknown | null;
  public_registration_role?: string | null;
  public_registration_verify_email: boolean;
  report_bug_url?: string | null;
  report_error_url?: string | null;
  report_feature_url?: string | null;
  storage_asset_presets?: unknown | null;
  storage_asset_transform?: string | null;
  storage_default_folder?: string | DirectusFolders | null;
  theme_dark_overrides?: unknown | null;
  theme_light_overrides?: unknown | null;
  theming_group: string;
};

type DirectusShares = {
  collection: string | DirectusCollections;
  date_created?: string | null;
  date_end?: string | null;
  date_start?: string | null;
  id: string;
  item: string;
  max_uses?: number | null;
  name?: string | null;
  password?: string | null;
  role?: string | DirectusRoles | null;
  times_used?: number | null;
  user_created?: string | DirectusUsers | null;
};

type DirectusTranslations = {
  id: string;
  key: string;
  language: string;
  value: string;
};

type DirectusUsers = {
  appearance?: string | null;
  auth_data?: unknown | null;
  avatar?: string | DirectusFiles | null;
  description?: string | null;
  email?: string | null;
  email_notifications?: boolean | null;
  external_identifier?: string | null;
  first_name?: string | null;
  id: string;
  language?: string | null;
  last_access?: string | null;
  last_name?: string | null;
  last_page?: string | null;
  location?: string | null;
  password?: string | null;
  provider: string;
  role?: string | DirectusRoles | null;
  status: string;
  tags?: unknown | null;
  tfa_secret?: string | null;
  theme_dark?: string | null;
  theme_dark_overrides?: unknown | null;
  theme_light?: string | null;
  theme_light_overrides?: unknown | null;
  title?: string | null;
  token?: string | null;
};

type DirectusVersions = {
  collection: string | DirectusCollections;
  date_created?: string | null;
  date_updated?: string | null;
  hash?: string | null;
  id: string;
  item: string;
  key: string;
  name?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

type DirectusWebhooks = {
  actions: unknown;
  collections: unknown;
  data: boolean;
  headers?: unknown | null;
  id: number;
  method: string;
  migrated_flow?: string | null;
  name: string;
  status: string;
  url: string;
  was_active_before_deprecation: boolean;
};

type DDocument = {
  context?: string | null;
  created_at: string;
  description?: string | null;
  id: string;
  is_processed: boolean;
  original_filename: string;
  path: string;
  processing_error?: string | null;
  project_id: string;
  title: string;
  type: string;
  updated_at: string;
};

type Insight = {
  created_at: string;
  id: string;
  project_analysis_run_id?: string | ProjectAnalysisRun | null;
  summary?: string | null;
  title?: string | null;
  updated_at: string;
  quotes: string[] | Quote[];
};

type Project = {
  conversations_count?: number;
  context?: string | null;
  conversations: null | any[] | Conversation[];
  created_at: string;
  default_conversation_context?: string | null;
  default_conversation_description?: string | null;
  default_conversation_finish_text?: string | null;
  default_conversation_title?: string | null;
  id: string;
  image_generation_model?: string | null;
  is_conversation_allowed: boolean;
  language: string;
  name?: string | null;
  pin: string;
  project_analysis_runs?: any[] | ProjectAnalysisRun[];
  session_id: number;
  tags: null | any[] | ProjectTag[];
  updated_at: string;
  directus_user_id: string;
};

type ProjectAnalysisRun = {
  created_at: string;
  id: string;
  insights: any[] | Insight[];
  processing_completed_at?: string | null;
  processing_error?: string | null;
  processing_message?: string | null;
  processing_started_at?: string | null;
  processing_status?: string | null;
  project_id?: string | Project | null;
  quotes: any[] | Quote[];
  updated_at: string;
  views: any[] | View[];
};

type ProjectTag = {
  conversations: any[] | ConversationProjectTag[];
  created_at: string;
  id: string;
  project_id: string | Project;
  text: string;
  updated_at: string;
};

type Quote = {
  aspects: any[] | QuoteAspect[];
  conversation_id?: string | Conversation | null;
  conversation_chunks: any[] | QuoteConversationChunk[];
  created_at: string;
  embedding: string;
  id: string;
  insight_id?: string | null;
  project_analysis_run_id?: string | ProjectAnalysisRun | null;
  representative_aspects: any[] | QuoteAspect1[];
  text: string;
  order?: number | null;
  timestamp?: string | null;
  updated_at: string;
};

type QuoteAspect = {
  aspect_id?: string | Aspect | null;
  id: number;
  quote_id?: string | Quote | null;
};

type QuoteAspect1 = {
  aspect_id?: string | Aspect | null;
  id: number;
  quote_id?: string | Quote | null;
};

type QuoteConversationChunk = {
  conversation_chunk_id?: string | ConversationChunk | null;
  id: number;
  quote_id?: string | Quote | null;
};

type Session = {
  created_at: string;
  id: number;
  uuid?: string;
  updated_at: string;
  user_id: DirectusUser | string;
  projects?: string[] | Project[];
  projects_count?: number;
};

type View = {
  aspects: any[] | Aspect[];
  created_at: string;
  id: string;
  name: string;
  processing_completed_at?: string | null;
  processing_error?: string | null;
  processing_message?: string | null;
  processing_started_at?: string | null;
  processing_status?: string | null;
  project_analysis_run_id?: string | ProjectAnalysisRun | null;
  summary?: string | null;
  updated_at: string;
};

type CustomDirectusTypes = {
  alembic_version: AlembicVersion[];
  aspect: Aspect[];
  celery_taskmeta: CeleryTaskmeta[];
  celery_tasksetmeta: CeleryTasksetmeta[];
  conversation: Conversation[];
  conversation_chunk: ConversationChunk[];
  conversation_project_tag: ConversationProjectTag[];
  directus_activity: DirectusActivity[];
  directus_collections: DirectusCollections[];
  directus_dashboards: DirectusDashboards[];
  directus_extensions: DirectusExtensions[];
  directus_fields: DirectusFields[];
  directus_files: DirectusFiles[];
  directus_flows: DirectusFlows[];
  directus_folders: DirectusFolders[];
  directus_migrations: DirectusMigrations[];
  directus_notifications: DirectusNotifications[];
  directus_operations: DirectusOperations[];
  directus_panels: DirectusPanels[];
  directus_permissions: DirectusPermissions[];
  directus_presets: DirectusPresets[];
  directus_relations: DirectusRelations[];
  directus_revisions: DirectusRevisions[];
  directus_roles: DirectusRoles[];
  directus_sessions: DirectusSessions[];
  directus_settings: DirectusSettings;
  directus_shares: DirectusShares[];
  directus_translations: DirectusTranslations[];
  directus_users: DirectusUsers[];
  directus_versions: DirectusVersions[];
  directus_webhooks: DirectusWebhooks[];
  document: DDocument[];
  insight: Insight[];
  project: Project[];
  project_analysis_run: ProjectAnalysisRun[];
  project_tag: ProjectTag[];
  quote: Quote[];
  quote_aspect: QuoteAspect[];
  quote_aspect_1: QuoteAspect1[];
  quote_conversation_chunk: QuoteConversationChunk[];
  session: Session[];
  view: View[];
};
