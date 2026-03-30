import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../api";

const Dashboard = () => {
  const [posts, setPosts] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New post form state
  const [newPostContent, setNewPostContent] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsRes, metricsRes] = await Promise.all([
          api.get('/posts'),
          api.get('/metrics')
        ]);
        setPosts(postsRes.data);
        setMetrics(metricsRes.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid date";
    
    const diff = date - new Date();
    const absDiff = Math.abs(diff);
    const minutes = Math.floor(absDiff / 60000);
    const hours = Math.floor(absDiff / 3600000);
    const days = Math.floor(absDiff / 86400000);

    if (diff > 0) { // Future
      if (minutes < 1) return "in less than a minute";
      if (minutes < 60) return `in ${minutes}m`;
      if (hours < 24) return `in ${hours}h`;
      return `in ${days}d`;
    } else { // Past
      if (minutes < 1) return "just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    }
  };

  const handleSeed = async () => {
    try {
      setLoading(true);
      await api.post('/seed');
      const [postsRes, metricsRes] = await Promise.all([
        api.get('/posts'),
        api.get('/metrics')
      ]);
      setPosts(postsRes.data);
      setMetrics(metricsRes.data);
      alert("Sample data generated! 🚀");
    } catch (err) {
      alert("Failed to generate data: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const chartData = metrics.map((m) => ({
    name: new Date(m.recorded_at).toLocaleDateString(),
    value: m.value
  }));

  if (loading) return <div style={{ padding: "20px" }}>Loading Dashboard...</div>;

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent || !scheduledFor) return alert("Please fill all fields");
    
    try {
      setIsSubmitting(true);
      // Convert to ISO string to ensure consistent timezone handling (UTC)
      const isoDate = new Date(scheduledFor).toISOString();
      await api.post('/posts', { 
        content: newPostContent, 
        scheduledFor: isoDate
      });
      setNewPostContent("");
      setScheduledFor("");
      
      // Refresh posts
      const postsRes = await api.get('/posts');
      setPosts(postsRes.data);
      alert("Post scheduled successfully! 📅");
    } catch (err) {
      alert("Error scheduling post: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>📊 Social Dashboard</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#4CAF50", fontSize: "14px" }}>
          <span style={{ height: "8px", width: "8px", backgroundColor: "#4CAF50", borderRadius: "50%", display: "inline-block" }}></span>
          Live Syncing
        </div>
      </div>

      {/* New Post Form */}
      <div style={{ backgroundColor: "#f0f4f8", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
        <h3>Schedule New Post</h3>
        <form onSubmit={handleCreatePost}>
          <textarea
            placeholder="What's on your mind?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            style={{ width: "100%", height: "80px", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", marginBottom: "10px" }}
          />
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
            />
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ 
                backgroundColor: "#2196F3", 
                color: "white", 
                padding: "8px 20px", 
                border: "none", 
                borderRadius: "5px", 
                cursor: isSubmitting ? "not-allowed" : "pointer" 
              }}
            >
              {isSubmitting ? "Scheduling..." : "Schedule Post"}
            </button>
          </div>
        </form>
      </div>

      <div style={{ backgroundColor: "#f9f9f9", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
        <h3>Followers Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {metrics.length === 0 && posts.length > 0 && (
        <div style={{ textAlign: "center", padding: "10px", marginBottom: "20px", border: "1px dashed #ccc", borderRadius: "8px" }}>
          <p style={{ margin: "5px 0", fontSize: "14px" }}>No metrics data available yet.</p>
          <button 
            onClick={handleSeed}
            style={{ 
              backgroundColor: "#4CAF50", 
              color: "white", 
              padding: "5px 15px", 
              border: "none", 
              borderRadius: "5px", 
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            ✨ Generate Sample Metrics
          </button>
        </div>
      )}

      <h3>Posts</h3>
      {posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", border: "1px dashed #ccc", borderRadius: "8px" }}>
          <p>No posts scheduled yet.</p>
          <button 
            onClick={handleSeed}
            style={{ 
              backgroundColor: "#4CAF50", 
              color: "white", 
              padding: "10px 20px", 
              border: "none", 
              borderRadius: "5px", 
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            ✨ Generate Sample Data
          </button>
        </div>
      ) : (
        posts.map(post => (
          <div key={post.id} style={{ borderBottom: "1px solid #eee", padding: "10px 0" }}>
            <p style={{ margin: "5px 0", fontWeight: "500" }}>{post.content}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <small style={{ color: post.status === 'published' ? '#2e7d32' : '#ed6c02', fontWeight: "bold" }}>
                Status: {post.status.toUpperCase()}
              </small>
              <small style={{ color: "#666" }}>
                {getRelativeTime(post.scheduled_for)} ({new Date(post.scheduled_for).toLocaleTimeString()})
              </small>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Dashboard;