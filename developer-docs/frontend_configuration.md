# Environment Variables Configuration (Frontend)

This document provides an overview of the environment variables used in the frontend application configuration.

> [!IMPORTANT]
> These can be set using [env files](https://vitejs.dev/guide/env-and-mode#env-files)

## Required Environment Variables

### VITE_API_BASE_URL

- **Description**: Base URL for the API.
- **Default Value**: `/api`

### VITE_USE_PARTICIPANT_ROUTER

- **Description**: Enables or disables the participant router.
- **Default Value**: `false`
- **Possible Values**: `true`, `false`, `1`
- **Example**: `VITE_USE_PARTICIPANT_ROUTER=1`

## Optional Environment Variables

### VITE_PARTICIPANT_BASE_URL

- **Description**: Base URL for the participant interface.
- **Default Value**: `window.location.origin`

### VITE_DISABLE_SENTRY

- **Description**: Disables Sentry error tracking if set to true.
- **Default Value**: `false`
- **Possible Values**: `true`, `false`, `1`
- **Example**: `VITE_DISABLE_SENTRY=1`

### VITE_ENABLE_EXPERIMENTAL_FEATURES

- **Description**: Enables experimental features if set to true.
- **Default Value**: `true`
- **Possible Values**: `true`, `false`, `1`
- **Example**: `VITE_ENABLE_EXPERIMENTAL_FEATURES=1`

### VITE_BUILD_VERSION

- **Description**: Specifies the build version of the application.
- **Default Value**: `dev`
- **Example**: `VITE_BUILD_VERSION=1.0.0`

### PRIVACY_POLICY_URL

- **Description**: URL for the privacy policy.

Ensure these environment variables are correctly set in your deployment environment to configure the application as needed.
