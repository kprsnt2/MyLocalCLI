---
name: aws
description: AWS cloud services patterns including Lambda, S3, DynamoDB, ECS, and IAM.
globs: ["**/serverless.*", "**/cdk/**", "**/cloudformation/**", "**/.aws/**", "**/sam*"]
priority: 80
tags: ["devops"]
---

# AWS Best Practices

## IAM
- Follow least privilege principle
- Use roles over access keys
- Enable MFA for all accounts
- Use IAM policies with conditions
- Rotate credentials regularly

## Lambda
- Keep functions small and focused
- Use environment variables for config
- Set appropriate memory and timeout
- Use layers for shared dependencies
- Use reserved concurrency for critical functions
- Use Powertools for structured logging

## S3
- Enable versioning for important buckets
- Use lifecycle rules for cost optimization
- Enable server-side encryption
- Use presigned URLs for temporary access
- Block public access by default

## DynamoDB
- Design for access patterns first
- Use single-table design when appropriate
- Use GSI for alternative access patterns
- Use TTL for expiring data
- Use DynamoDB Streams for events

## ECS/Fargate
- Use Fargate for serverless containers
- Set resource limits properly
- Use health checks
- Use service discovery for microservices

## Cost Optimization
- Use spot instances for fault-tolerant workloads
- Use reserved instances for steady workloads
- Enable Cost Explorer and budgets
- Use S3 Intelligent Tiering
