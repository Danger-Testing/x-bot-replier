require("dotenv").config();
const { TwitterApi } = require("twitter-api-v2");
const fs = require("fs");
const path = require("path");

// --- Config ---
const POLL_INTERVAL_MS =
  (parseInt(process.env.POLL_INTERVAL_MINUTES, 10) || 2) * 60 * 1000;
const REPLY_TEMPLATE =
  process.env.REPLY_MESSAGE ||
  "Hey @{username}! Thanks for reaching out 🤖 How can I help you?";
const LAST_ID_FILE = path.join(__dirname, "last_mention_id.txt");

// --- Twitter client (OAuth 1.0a user context — read + write) ---
const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

// --- Persist last processed mention ID to avoid duplicates ---
function loadLastMentionId() {
  try {
    return fs.readFileSync(LAST_ID_FILE, "utf-8").trim() || undefined;
  } catch {
    return undefined;
  }
}

function saveLastMentionId(id) {
  fs.writeFileSync(LAST_ID_FILE, id, "utf-8");
}

// --- Core logic ---
let botUserId = null;

async function initBot() {
  // Step 5: Get bot's own user ID
  const me = await client.v2.me();
  botUserId = me.data.id;
  console.log(`✅ Bot authenticated as @${me.data.username} (ID: ${botUserId})`);
}

async function pollMentions() {
  try {
    const sinceId = loadLastMentionId();

    // Step 6: Poll mentions timeline
    const params = {
      max_results: 10,
      "tweet.fields": "author_id,conversation_id,created_at",
      expansions: "author_id",
    };
    if (sinceId) {
      params.since_id = sinceId;
    }

    const mentions = await client.v2.userMentionTimeline(botUserId, params);

    if (!mentions.data?.data?.length) {
      console.log(`[${new Date().toISOString()}] No new mentions.`);
      return;
    }

    // Build a map of user IDs → usernames from includes
    const userMap = {};
    if (mentions.includes?.users) {
      for (const user of mentions.includes.users) {
        userMap[user.id] = user.username;
      }
    }

    // Process from oldest to newest so we save progress correctly
    const tweets = [...mentions.data.data].reverse();

    for (const tweet of tweets) {
      const tweetId = tweet.id;
      const authorUsername = userMap[tweet.author_id] || "friend";

      // Skip mentions from the bot itself
      if (tweet.author_id === botUserId) {
        saveLastMentionId(tweetId);
        continue;
      }

      // Step 8: Skip if already processed (safety net)
      const lastId = loadLastMentionId();
      if (lastId && BigInt(tweetId) <= BigInt(lastId)) continue;

      // Step 10: Generate reply text
      const replyText = REPLY_TEMPLATE.replace("{username}", authorUsername);

      console.log(
        `💬 Replying to @${authorUsername} (tweet ${tweetId}): "${tweet.text.slice(0, 60)}..."`
      );

      try {
        // Step 11: Post the reply
        await client.v2.tweet({
          text: replyText,
          reply: { in_reply_to_tweet_id: tweetId },
        });
        console.log(`  ✅ Reply sent.`);
      } catch (err) {
        // Step 13: Handle errors
        if (err.code === 429) {
          console.error(`  ⏳ Rate limited. Will retry next cycle.`);
          return; // Stop processing, retry next poll
        }
        if (err.code === 403) {
          console.error(`  🚫 Forbidden (maybe duplicate or protected user). Skipping.`);
        } else {
          console.error(`  ❌ Failed to reply:`, err.message || err);
        }
      }

      // Step 8: Track most recent processed mention ID
      saveLastMentionId(tweetId);
    }
  } catch (err) {
    if (err.code === 429) {
      console.error(`⏳ Rate limited on mentions fetch. Waiting for next cycle.`);
    } else {
      console.error(`❌ Error polling mentions:`, err.message || err);
    }
  }
}

// --- Main loop ---
async function main() {
  console.log("🤖 X Bot Replier starting...");
  console.log(`⏱  Polling every ${POLL_INTERVAL_MS / 1000}s`);

  await initBot();

  // Run immediately, then on interval
  await pollMentions();
  setInterval(pollMentions, POLL_INTERVAL_MS);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
