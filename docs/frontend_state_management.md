# Hierarchy of State Management

1. **Server-Side State**

   - **Purpose**: Synchronize state across multiple users.
   - **Storage**: Server via APIs.
   - **Library**: `@tanstack/query` for easy synchronization.
   - **Examples**: Shared resources, collaborative data.

2. **Client-Side Storage**
   - **Session Storage / Local Storage**
     - **Purpose**: User-specific settings.
     - **Examples**: Dark mode preference, UI configurations.
   - **In-Memory Storage**
     - **Purpose**: Sensitive data with expiration.
     - **Examples**: Access tokens.
   - **HTTP-Only Cookies**
     - **Purpose**: Persistent sensitive data.
     - **Examples**: Refresh tokens.
