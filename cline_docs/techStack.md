# Tech Stack

## Infrastructure (Azure)

### Compute
- Azure Container Instances (ACI) for running containerized applications
- Azure Container Registry (ACR) for storing Docker images

### Networking
- Azure Virtual Network (VNet) with public and private subnets
- Azure Application Gateway v2 with Web Application Firewall (WAF) for load balancing and SSL termination
- Azure NAT Gateway for outbound internet connectivity from private subnets
- Azure DNS for managing DNS records

### Data Storage
- Azure Cosmos DB for PostgreSQL for the main database
- Azure Redis Cache for caching and session storage
- Azure Storage Account with File Shares for persistent storage

### Security
- Azure Key Vault for secrets management
- Managed Identities for secure access to Azure resources

### Monitoring
- Azure Log Analytics Workspace for centralized logging
- Azure Monitor with Container Insights for container monitoring
- Custom Azure Portal Dashboard for visualizing container metrics

### AI/ML
- Azure OpenAI Service for AI capabilities (including GPT-4 and Whisper models)

## Application Components

- Directus: Headless CMS running in a container
- API Server: Custom API running in a container
- Worker: Background job processor running in a container
- Participant Frontend: React-based frontend for participants
- Dashboard Frontend: React-based frontend for administrators
- RabbitMQ: Message broker for inter-service communication

## CI/CD

- GitHub Actions for continuous integration and deployment
- Terraform for infrastructure as code (IaC)

## Development Tools

- Docker for containerization
- Terraform for infrastructure provisioning
- GitHub for version control and CI/CD pipelines

## Programming Languages

- TypeScript/JavaScript for frontend development
- Python for backend services (API Server and Worker)

## Frameworks and Libraries

- React for frontend development
- FastAPI (assumed) for the API Server
- Celery (assumed) for the Worker

This tech stack provides a scalable, secure, and modern architecture for the application, leveraging Azure's managed services for optimal performance and reliability.
