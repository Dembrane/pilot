# Server: Environment Variables Configuration

This document provides an overview of the environment variables used in the application configuration, grouped by required and optional variables.

> [!IMPORTANT] > **These are to be set at `./server/.env`**

## Required Environment Variables

### DATABASE_URL

- **Description**: URL for the database connection.
- **Note**: Must be set. The application will not start without this variable.

### RABBITMQ_URL

- **Description**: URL for RabbitMQ connection.
- **Note**: Must be set. The application will not start without this variable.

### OPENAI_API_KEY

- **Description**: API key for OpenAI services.
- **Note**: Must be set. The application will not start without this variable.

## Optional Environment Variables

### DEBUG_MODE

- **Description**: Enables or disables debug mode.
- **Default Value**: `false`
- **Possible Values**: `true`, `false`, `1`
- **Example**: `DEBUG_MODE=true`

### ADMIN_BASE_URL

- **Description**: Base URL for the admin interface.
- **Default Value**: `http://localhost:3000`
- **Example**: `ADMIN_BASE_URL=https://admin.example.com`

### PARTICIPANT_BASE_URL

- **Description**: Base URL for the participant interface.
- **Default Value**: `http://localhost:3001`
- **Example**: `PARTICIPANT_BASE_URL=https://participant.example.com`

### DISABLE_REDACTION

- **Description**: Disables redaction if set to true.
- **Default Value**: `false`
- **Possible Values**: `true`, `false`, `1`
- **Example**: `DISABLE_REDACTION=true`

### SERVE_API_DOCS

- **Description**: Enables or disables serving API documentation.
- **Default Value**: `false`
- **Possible Values**: `true`, `false`, `1`
- **Example**: `SERVE_API_DOCS=true`

### DISABLE_SENTRY

- **Description**: Disables Sentry error tracking if set to true.
- **Default Value**: `false`
- **Possible Values**: `true`, `false`, `1`
- **Example**: `DISABLE_SENTRY=true`

### BUILD_VERSION

- **Description**: Specifies the build version of the application.
- **Default Value**: `dev`
- **Example**: `BUILD_VERSION=1.0.0`

### UPLOADS_DIR

- **Description**: Directory for file uploads.
- **Default Value**: `uploads`
- **Note**: Created if it does not exist.

### TRANKIT_CACHE_DIR

- **Description**: Directory for Trankit cache.
- **Default Value**: `trankit_cache`

Ensure these environment variables are correctly set in your deployment environment to configure the application as needed.
