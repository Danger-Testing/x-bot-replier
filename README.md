# X Bot Replier — @DANGER_UPDATES

Auto-replies to all mentions with an xrageroom link to the parent tweet.

## How It Works
- Polls Twitter mentions every 2 minutes via X API v2
- Skips its own tweets to avoid reply loops
- Finds the **parent tweet** (the one the mentioner replied to)
- Replies with: `@username Here is your link! https://www.xrageroom.com/x?url={parent_tweet_url}`
- Tracks last processed mention ID to avoid duplicates

## Setup
1. Copy `.env.example` → `.env` and fill in your X API credentials
2. `npm install`
3. `npm start`

## Railway Deployment
- **Project:** https://railway.com/project/14567ccb-f586-45a1-bf4a-e1fcd9f86c92
- **Workspace:** Danger Testing
- **Service:** x-bot-replier

### Commands
```bash
railway login                # Authenticate (opens browser)
railway up --detach          # Deploy latest code
railway down -y              # Stop the bot
railway service logs         # Check logs
railway variables set KEY=VAL # Update env vars
```

## Env Variables (set in Railway + .env)
| Variable | Description |
|---|---|
| `X_API_KEY` | Twitter API consumer key |
| `X_API_SECRET` | Twitter API consumer secret |
| `X_ACCESS_TOKEN` | OAuth 1.0a access token |
| `X_ACCESS_TOKEN_SECRET` | OAuth 1.0a access secret |
| `POLL_INTERVAL_MINUTES` | How often to check mentions (default: 2) |
| `REPLY_MESSAGE` | Reply template. Use `{username}` and `{link}` placeholders |

## Costs
- **Railway:** ~$5/month
- **X API:** ~$2-3/month for low volume (pay-per-use)

## Status
Bot is currently **OFF**. Run `railway up --detach` to restart.
