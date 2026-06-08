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

---

## Stage 2

**1. Choice of DB & Why:**
I'd go with **MongoDB (NoSQL)**. Notification systems deal with high write volumes and changing data structures (like adding new fields for different types of alerts). MongoDB scales horizontally very well and doesn't force us into a rigid schema like SQL does.

**2. DB Schema (Mongoose example):**
```javascript
const NotificationSchema = new mongoose.Schema({
  type: { type: String, enum: ['email', 'sms', 'push', 'Event', 'Result', 'Placement'], required: true },
  title: String,
  message: String,
  recipient: String,
  studentID: Number,
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true }); 
```

**3. Problems with huge data volume:**
- **Slow Queries:** Finding a student's unread notifications out of millions of rows will take forever without indexes.
- **Huge Storage:** Keeping all old notifications will bloat the database and cost a lot.

**4. How to solve them:**
- Add **indexes** (like a compound index on `studentID` + `isRead`) to make lookups fast.
- Set up a **TTL (Time-To-Live)** index to automatically delete notifications older than a few months.
- **Sharding:** Split the database across multiple servers if the load gets too crazy.

**5. DB Queries:**
*Insert:* `db.notifications.insertOne({ ...data })`
*Fetch unread for a student:* `db.notifications.find({ studentID: 1042, isRead: false }).sort({ createdAt: 1 })`

---

## Stage 3

**1. Is the query accurate? Why is it slow?**
`SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt ASC;`
Yes, the syntax is correct. But it's super slow because of **no indexing**. The database has to do a full table scan across 5,000,000 rows to find matches and then sort them manually in memory.

**2. What to change and the computation cost?**
Add a **Composite Index** on `(studentID, isRead, createdAt)`. This drops the computation cost from `O(N)` (checking everything) to `O(log N)` (jumping straight to the right records).

**3. Should we index every column?**
**No, bad idea.** It kills write performance because every insert/update has to update all those indexes. It also wastes a ton of disk space. Only index what you actually filter or sort by.

**4. Query for placement notifications in the last 7 days:**
```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL 7 DAY;
```

---

## Stage 5

**1. Shortcomings:**
The code runs sequentially in the same thread. If sending the email hangs or fails, the thread is blocked, and the DB insert or app push never happens. It's incredibly slow and prone to partial failures.

**2. What now? (Failed for 200 students):**
Since the DB save was written *after* the email step, we have no record of who failed. We lost the data for those 200 students.

**3. Redesign for reliability and speed:**
Move to an **Asynchronous Message Queue** (like RabbitMQ or Redis). The main API just saves the intent to the DB and pushes the job to the queue, then responds to the user instantly. Background workers handle the slow email sending and retry automatically if it fails.

**4. Should DB save and email happen together?**
No. DB saves are fast and reliable. Email APIs are slow and rely on external networks. Decouple them to keep your main app fast and stable.

**Revised Pseudocode:**
```python
def process_notification(student_id, message):
    # 1. Save to DB first so we don't lose the record
    notif_id = save_to_db(student_id, message, status="pending")
    
    # 2. Push to a background queue
    queue.push(task="send_email", data={"id": notif_id, "student_id": student_id, "message": message})
    queue.push(task="push_to_app", data={"id": notif_id, "student_id": student_id, "message": message})
    
    return "processing"

# Worker Process
def email_worker(job):
    try:
        send_email(job.student_id, job.message)
        update_db(job.id, status="sent")
    except Exception:
        # Let the queue handle retries
        raise
```

---

## Stage 6

**Approach:**
To get the top 10 priority notifications, I rank them by two things:
1. **Weight:** Placement (3) > Result (2) > Event (1).
2. **Recency:** If the weights are tied, the newer one wins.

**Handling continuous new notifications efficiently:**
Sorting the whole array every time a new alert pops up is `O(N log N)`, which is too slow. 
Instead, we use a **Min-Heap (Priority Queue)** of size 10. When a new notification comes in, we just compare it to the lowest-priority item in our top 10. If it's more important, we swap it. This takes `O(log 10)` or basically `O(1)` constant time, which is lightning fast.

*(Check out `stage6_priority_inbox.js` for the actual code implementation!)*
