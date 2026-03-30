const Queue = require("bull");
const { query } = require("./db");

const postQueue = new Queue("post-scheduling", process.env.REDIS_URL);

postQueue.process(async (job) => {
  const { postId, content } = job.data;

  console.log("Processing job for post ID:", postId);

  await query(
    "UPDATE posts SET status = $1 WHERE id = $2",
    ["published", postId]
  );
});

console.log("✅ Worker running...");