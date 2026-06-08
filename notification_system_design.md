# Notification System Design & Implementation

## 1. Project Overview
This document outlines the design and implementation details of the Notification System developed for the Affordmed Campus Hiring Evaluation. The system is divided into independent services to handle notification dispatching, storage, and centralized logging.

### Developer Information
- **Name**: Awanish Kumar Verma
- **Roll Number**: 2301430100067
- **Email**: a2023cse9230@imsec.ac.in
- **Company Name**: Affordmed

---

## 2. Components Developed

### 1. Notification Backend (`notification_app_be`)
A Node.js and Express API server responsible for processing notification requests, retrieving notification logs, and persisting them.

**Example: Send Notification Response**
```json
{
    "success": true,
    "data": {
        "type": "email",
        "title": "Welcome",
        "message": "Account created successfully",
        "recipient": "awanish@example.com",
        "status": "pending",
        "_id": "6a2666d28dfa0f2643a055bf",
        "createdAt": "2026-06-08T06:53:06.490Z",
        "updatedAt": "2026-06-08T06:53:06.490Z",
        "__v": 0
    }
}
```

**Example: Fetch Notifications Response**
```json
{
    "success": true,
    "count": 8,
    "data": [
        {
            "_id": "6a265fb0dc9b773bc7982610",
            "type": "email",
            "title": "Welcome",
            "message": "Account created successfully",
            "recipient": "user@example.com",
            "status": "pending",
            "createdAt": "2026-06-08T06:22:40.792Z",
            "updatedAt": "2026-06-08T06:22:40.792Z",
            "__v": 0
        }
    ]
}
```

### 2. Database Choice
**MongoDB (NoSQL)**
MongoDB was chosen for the backend database for the following reasons:
- **Horizontal Scalability:** We can easily scale a NoSQL database horizontally to accommodate increased load.
- **Schema Flexibility:** For a notification system, adding new columns or fields for evolving notification types is straightforward in a NoSQL database compared to relational databases.
- **High Concurrency:** It can scale better for concurrent user access and high-throughput write operations than a traditional SQL database.

### 3. Logging Middleware (`logging_middleware`)
A custom Node.js middleware module (`logger.js`) that pushes logs securely to the central Affordmed evaluation service.

**Implementation Details:**
- Uses `axios` to send a `POST` request to the evaluation log URL (`process.env.LOG_API_URL`).
- Formats the log payload with parameters: `stack`, `level`, `logClass` (package), and `logMessage`.
- Attaches the Access Token directly to the `Authorization` header.
- Gracefully handles success responses and network or API errors.

---

## 3. Execution Flow
1. An external client hits the Backend API to create a notification.
2. The controller securely saves the notification to MongoDB.
3. Simultaneously, the `Log` function from the `logging_middleware` is invoked.
4. The middleware transmits the event details to the evaluation logs endpoint using the configured API Authorization token.
