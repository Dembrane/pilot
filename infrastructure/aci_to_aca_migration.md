# Migration from Azure Container Instances (ACI) to Azure Container Apps (ACA)

## Overview

This document outlines the plan and considerations for migrating our infrastructure from Azure Container Instances (ACI) to Azure Container Apps (ACA). This migration aims to improve scalability, manageability, and leverage the benefits of a managed Kubernetes-like environment.

## Current Architecture

Our current setup uses Azure Container Instances for the following services:

- RabbitMQ
- Participant Frontend
- Dashboard Frontend
- Directus
- Worker
- API Server

These services are integrated with other Azure services such as Application Gateway, Azure Key Vault, and Azure Storage.

## Migration Plan

### 1. Architecture Changes

- Create an Azure Container Apps Environment to host all container apps.
- Migrate each service from ACI to ACA.
- Update network configurations to align with ACA's networking model.

### 2. Service Migration

For each service (RabbitMQ, Participant Frontend, Dashboard Frontend, Directus, Worker, API Server):

a. Create a new Container App in the ACA Environment.
b. Update container configurations, including:
   - Image references
   - Environment variables
   - Resource allocations
c. Configure scaling rules (where applicable).
d. Update service discovery and inter-service communication.

### 3. Networking

- Review and update network security groups and firewall rules.
- Configure virtual network integration for the ACA Environment.
- Update DNS configurations if necessary.

### 4. Configuration Management

- Migrate environment variables to ACA's configuration system.
- Update secret management to use ACA's integration with Azure Key Vault.

### 5. Continuous Deployment

- Update CI/CD pipelines to deploy to ACA instead of ACI.
- Implement blue-green or canary deployment strategies where appropriate.

### 6. Monitoring and Logging

- Configure Azure Monitor for ACA.
- Update log collection and analysis processes.
- Set up appropriate alerts and dashboards.

### 7. Application Gateway Integration

- Update Application Gateway backend pool to point to the new ACA services.
- Reconfigure health probes and routing rules.

### 8. Storage

- For services using Azure File Shares (e.g., uploads volume), reconfigure storage mounts in ACA.

### 9. Performance Testing

- Conduct thorough performance testing post-migration.
- Compare performance metrics with the previous ACI setup.
- Optimize ACA configurations based on test results.

## Considerations

- **Phased Approach**: Consider migrating services one by one to minimize risk.
- **Rollback Plan**: Maintain the ability to revert to ACI if unforeseen issues arise.
- **Cost Analysis**: Compare the cost implications of ACA vs ACI.
- **Service Dependencies**: Carefully manage the migration of interdependent services.
- **Downtime Management**: Plan for potential downtime during the migration and communicate with stakeholders.

## Timeline

[To be filled with specific project timeline]

## Risks and Mitigations

- **Risk**: Service disruption during migration.
  **Mitigation**: Conduct migrations during low-traffic periods and have a rollback plan ready.

- **Risk**: Performance degradation post-migration.
  **Mitigation**: Thorough pre-production testing and gradual rollout with monitoring.

- **Risk**: Unexpected compatibility issues with ACA.
  **Mitigation**: Comprehensive testing of each service in an ACA environment before full migration.

## Post-Migration Tasks

- Monitor application performance and resource utilization.
- Gather feedback from users and address any issues promptly.
- Document lessons learned and update operational procedures.

## Conclusion

This migration from ACI to ACA represents a significant improvement in our infrastructure's scalability and manageability. Careful planning and execution will ensure a smooth transition with minimal disruption to our services.
