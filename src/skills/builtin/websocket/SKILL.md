---
name: websocket
description: WebSocket real-time communication patterns and best practices.
globs: ["**/ws/**", "**/socket**", "**/realtime/**"]
priority: 75
tags: ["framework"]
---

# WebSocket Best Practices

## Connection
- Implement automatic reconnection with backoff
- Use heartbeat/ping-pong for connection health
- Handle connection state (connecting, open, closing, closed)
- Use secure WebSocket (wss://) in production

## Patterns
- Use rooms/channels for topic-based messaging
- Implement pub/sub for broadcast
- Use acknowledgments for critical messages
- Use binary frames for large data
- Implement message queuing during disconnects

## Scale
- Use Redis pub/sub for multi-server support
- Use sticky sessions or separate WS servers
- Implement horizontal scaling with message brokers
- Monitor connection counts and memory
