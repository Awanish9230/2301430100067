const axios = require('axios');

// Priority weights: Placement > Result > Event
const WEIGHTS = {
  'Placement': 3,
  'Result': 2,
  'Event': 1
};

async function getPriorityInbox() {
  try {
    // Stage 6 API Call
    const token = process.env.ACCESS_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhMjAyM2NzZTkyMzBAaW1zZWMuYWMuaW4iLCJleHAiOjE3ODA4OTg2NTUsImlhdCI6MTc4MDg5Nzc1NSwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjRhOWE5YjRhLTNjOWQtNDEzOC1iM2I4LWE5Yjg5YTg0MDI3YyIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6ImF3YW5pc2gga3VtYXIgdmVybWEiLCJzdWIiOiI3MjgxNWFmZC1jOWNjLTQxZDctYmI5NS1lMmE2MjZlNTVmNDkifSwiZW1haWwiOiJhMjAyM2NzZTkyMzBAaW1zZWMuYWMuaW4iLCJuYW1lIjoiYXdhbmlzaCBrdW1hciB2ZXJtYSIsInJvbGxObyI6IjIzMDE0MzAxMDAwNjciLCJhY2Nlc3NDb2RlIjoibnlYUU11IiwiY2xpZW50SUQiOiI3MjgxNWFmZC1jOWNjLTQxZDctYmI5NS1lMmE2MjZlNTVmNDkiLCJjbGllbnRTZWNyZXQiOiJZcHVyVXdqZVhCaFVKRWVDIn0.VgshRDnnqdzdoB6710GZPe-Zt0bHag4NryKkDUGESfw';
    
    const response = await axios.get('http://4.224.186.213/evaluation-service/notifications', {
      headers: {
        'Authorization': token
      }
    });

    const notifications = response.data.notifications || [];

    // Sort notifications
    notifications.sort((a, b) => {
      // 1. Primary sort: Weight (Descending)
      const weightA = WEIGHTS[a.Type] || 0;
      const weightB = WEIGHTS[b.Type] || 0;
      
      if (weightA !== weightB) {
        return weightB - weightA; // Higher weight comes first
      }
      
      // 2. Secondary sort: Recency (Descending)
      const timeA = new Date(a.Timestamp).getTime();
      const timeB = new Date(b.Timestamp).getTime();
      return timeB - timeA; // Newer timestamp comes first
    });

    // Get Top 10
    const top10 = notifications.slice(0, 10);
    
    console.log("=== PRIORITY INBOX (Top 10) ===");
    top10.forEach((n, i) => {
      console.log(`${i + 1}. [${n.Type.toUpperCase()}] ${n.Message} | Time: ${n.Timestamp}`);
    });

  } catch (error) {
    console.error("Failed to fetch notifications:", error.message);
  }
}

// Run the script
getPriorityInbox();
