# X Bot Replier — Agent Instructions

## Overview
X bot (@DANGER_UPDATES) that auto-replies to mentions with an xrageroom link to the parent tweet.

## Commands
- **Run locally**: `npm start`
- **Deploy to Railway**: `railway up --detach`
- **Stop Railway**: `railway down -y`
- **Check logs**: `railway service logs`
- **Update env var**: `railway variables set KEY=VAL`

## Architecture
- **Runtime**: Node.js, single file `bot.js`
- **Library**: `twitter-api-v2` with OAuth 1.0a (read + write)
- **Hosting**: Railway (Danger Testing workspace)
- **Polling**: Every 2 min via `setInterval`, configurable via `POLL_INTERVAL_MINUTES`
- **State**: `last_mention_id.txt` tracks last processed mention (not committed)

## Key Logic
1. Polls `/2/users/:id/mentions` for new mentions
2. Skips bot's own tweets to prevent reply loops
3. Finds the **parent tweet** via `referenced_tweets` (the tweet the mentioner replied to)
4. Wraps parent tweet URL in `https://www.xrageroom.com/x?url={encoded_url}`
5. Replies with `@username Here is your link! {app_link}`

## Important Notes
- Never reply to old/historical mentions — always ensure `last_mention_id.txt` is seeded before first run
- Credentials are in Railway env vars and local `.env` (never committed)
- GitHub repo: https://github.com/Danger-Testing/x-bot-replier
- Railway project: https://railway.com/project/14567ccb-f586-45a1-bf4a-e1fcd9f86c92
- Bot account is labeled as automated per X rules
