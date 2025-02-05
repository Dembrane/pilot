# Codebase Summary

## Project Structure

The project is organized into several key components:

1. Infrastructure
   - Located in the `infrastructure/` directory
   - Contains Terraform configurations for Azure resources
   - Subdirectories for different environments (e.g., `dev/`, `prod/`, `cicd/`)

2. GitHub Workflows
   - Located in the `.github/workflows/` directory
   - Contains CI/CD pipeline configurations

3. Application Components
   - Directus (Headless CMS)
   - API Server
   - Worker
   - Participant Frontend
   - Dashboard Frontend
   - RabbitMQ

## Key Components and Their Interactions

1. Frontend Applications
   - Participant Frontend: Accessible at `https://portal.dev.dembrane.com`
   - Dashboard Frontend: Accessible at `https://dashboard.dev.dembrane.com`
   - Both interact with the API Server and Directus

2. Backend Services
   - API Server: Handles API requests, accessible at `https://api.dev.dembrane.com`
   - Worker: Processes background jobs
   - Both interact with the database, Redis, and RabbitMQ

3. Directus
   - Provides content management capabilities
   - Accessible at `https://directus.dev.dembrane.com`

4. Infrastructure
   - Azure Application Gateway: Handles routing and SSL termination
   - Azure Container Instances: Runs containerized applications
   - Azure Cosmos DB for PostgreSQL: Main database
   - Azure Redis Cache: For caching and session storage
   - Azure Key Vault: Manages secrets and configurations

## Data Flow

1. User requests come through the Azure Application Gateway
2. Requests are routed to the appropriate frontend or backend service
3. API Server and Directus handle data operations with the Cosmos DB
4. Worker processes background jobs using RabbitMQ for message queuing
5. Redis is used for caching and improving performance

## External Dependencies

- Azure Services (as detailed in the techStack.md file)
- OpenAI API for AI capabilities
- Google Auth for authentication

## Recent Significant Changes

- Implementation of Azure infrastructure using Terraform
- Setup of CI/CD pipelines using GitHub Actions
- Deployment of containerized applications on Azure Container Instances
- Integration of Azure OpenAI Service for AI capabilities

## User Feedback Integration and Its Impact on Development

(This section should be updated based on actual user feedback and its impact on the development process.)

Note: This summary provides an overview based on the available information. It should be updated regularly as the project evolves and more detailed information becomes available about each component.
