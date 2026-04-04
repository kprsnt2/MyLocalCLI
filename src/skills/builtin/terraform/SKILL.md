---
name: terraform
description: Terraform infrastructure as code patterns, modules, and state management.
globs: ["**/*.tf", "**/*.tfvars", "**/terraform*"]
priority: 80
tags: ["devops"]
---

# Terraform Best Practices

## Structure
- Use modules for reusable infrastructure
- Separate environments with workspaces or directories
- Use `terraform.tfvars` for environment-specific values
- Keep state remote (S3 + DynamoDB, Terraform Cloud)
- Use consistent naming conventions

## Code Quality
- Use `terraform fmt` and `terraform validate`
- Use `tflint` for additional checks
- Pin provider versions
- Use `for_each` over `count` for resources
- Use `locals` for computed values
- Tag all resources

## State Management
- Never edit state manually
- Use state locking (DynamoDB)
- Import existing resources with `terraform import`
- Use `moved` blocks for refactoring
- Back up state files

## Security
- Never commit secrets to .tf files
- Use variables for sensitive values
- Use Vault or AWS Secrets Manager
- Enable encryption on state backend
