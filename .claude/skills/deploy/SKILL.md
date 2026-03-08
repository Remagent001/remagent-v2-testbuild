---
name: deploy
description: Build and deploy the remagent v2 Next.js app to remagentemploymentprofessionals.com
---

# Deploy v2 to remagentemploymentprofessionals.com

Follow these steps EXACTLY in order. Do NOT skip steps. Do NOT try plain SSH or SCP — there is no .pem key.

## Step 1: Commit and push to GitHub

```bash
cd "C:\Users\keith\OneDrive\claude\remagent\remagent-v2-testbuild" && git add -A && git status
```

If there are uncommitted changes, commit them. Then push:

```bash
git push origin main
```

## Step 2: Generate temp SSH key

IMPORTANT: Always delete first to avoid the overwrite prompt hanging forever.

```bash
rm -f /tmp/remagent-staging /tmp/remagent-staging.pub && ssh-keygen -t rsa -b 2048 -f /tmp/remagent-staging -N ""
```

## Step 3: Check/add IP to security group

```bash
CURRENT_IP=$(curl -s https://checkip.amazonaws.com) && echo "Current IP: $CURRENT_IP" && \
aws ec2 describe-security-groups --region us-east-2 --group-ids sg-020206cab7764e7e0 \
  --query 'SecurityGroups[0].IpPermissions[?FromPort==`22`].IpRanges[].CidrIp' --output text
```

If current IP is NOT listed, add it:

```bash
aws ec2 authorize-security-group-ingress --region us-east-2 --group-id sg-020206cab7764e7e0 --protocol tcp --port 22 --cidr ${CURRENT_IP}/32
```

## Step 4: Pull code + build + restart (all in one SSH session)

CRITICAL: The pushed SSH key expires in ~60 seconds. ALWAYS chain `send-ssh-public-key` and `ssh` in ONE command using `&&`.

The server has a git repo at /www/wwwroot/remagent-v2/ linked to the GitHub repo. Port is already 3020 in package.json — no sed needed.

`npx` is not available via sudo — use the full node path for prisma commands.

```bash
aws ec2-instance-connect send-ssh-public-key --region us-east-2 \
  --instance-id i-0f2e05fa61fb8bdf6 --instance-os-user ubuntu \
  --ssh-public-key "$(cat /tmp/remagent-staging.pub)" > /dev/null 2>&1 \
&& ssh -i /tmp/remagent-staging -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
  ubuntu@3.18.126.199 "cd /www/wwwroot/remagent-v2 && \
    sudo -u www git pull origin main && \
    sudo -u www npm install --legacy-peer-deps 2>&1 | tail -3 && \
    sudo -u www /www/server/nodejs/v22.11.0/bin/node node_modules/.bin/prisma generate 2>&1 | tail -2 && \
    sudo -u www /www/server/nodejs/v22.11.0/bin/node node_modules/.bin/prisma db push --accept-data-loss 2>&1 | tail -3 && \
    sudo -u www npm run build 2>&1 | tail -5 && \
    sudo rm -rf /tmp/btcache/* && \
    sudo -u www /www/server/nodejs/v22.11.0/lib/node_modules/pm2/bin/pm2 delete remagent-v2 2>/dev/null; \
    sudo -u www /www/server/nodejs/v22.11.0/lib/node_modules/pm2/bin/pm2 start npm --name remagent-v2 -- start && \
    sudo -u www /www/server/nodejs/v22.11.0/lib/node_modules/pm2/bin/pm2 save --force && \
    echo '=== DEPLOY COMPLETE ==='"
```

IMPORTANT notes on this command:
- Use `pm2 start npm --name remagent-v2 -- start` (NOT `pm2 start package.json`)
- Use `pm2 delete` + `pm2 start`, NEVER just `pm2 restart` — avoids stale memory
- Always purge `/tmp/btcache/*` — nginx cache causes stale pages
- Use `pm2 save --force` to avoid warnings about old ghost processes

## Step 5: Verify

Wait 5 seconds, then:

```bash
curl -s -o /dev/null -w "%{http_code}" https://remagentemploymentprofessionals.com/login
```

Should return `200`. If not, check PM2 logs:

```bash
rm -f /tmp/remagent-staging /tmp/remagent-staging.pub && ssh-keygen -t rsa -b 2048 -f /tmp/remagent-staging -N "" 2>&1 | tail -1 && \
aws ec2-instance-connect send-ssh-public-key --region us-east-2 \
  --instance-id i-0f2e05fa61fb8bdf6 --instance-os-user ubuntu \
  --ssh-public-key "$(cat /tmp/remagent-staging.pub)" > /dev/null 2>&1 \
&& ssh -i /tmp/remagent-staging -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
  ubuntu@3.18.126.199 "sudo -u www /www/server/nodejs/v22.11.0/lib/node_modules/pm2/bin/pm2 logs remagent-v2 --lines 30 --nostream"
```

## Fallback: SSM (if SSH fails entirely)

If EC2 Instance Connect keeps failing (IP not whitelisted, key issues), use AWS SSM:

```bash
COMMAND_ID=$(aws ssm send-command --region us-east-2 \
  --instance-ids i-0f2e05fa61fb8bdf6 \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /www/wwwroot/remagent-v2 && sudo -u www git pull origin main && sudo -u www npm install --legacy-peer-deps && sudo -u www /www/server/nodejs/v22.11.0/bin/node node_modules/.bin/prisma generate && sudo -u www /www/server/nodejs/v22.11.0/bin/node node_modules/.bin/prisma db push --accept-data-loss && sudo -u www npm run build && sudo rm -rf /tmp/btcache/* && sudo -u www /www/server/nodejs/v22.11.0/lib/node_modules/pm2/bin/pm2 delete remagent-v2; sudo -u www /www/server/nodejs/v22.11.0/lib/node_modules/pm2/bin/pm2 start npm --name remagent-v2 -- start && sudo -u www /www/server/nodejs/v22.11.0/lib/node_modules/pm2/bin/pm2 save --force"]' \
  --query 'Command.CommandId' --output text)
echo "Command ID: $COMMAND_ID"
```

Wait ~2-3 minutes for build, then check result:

```bash
aws ssm get-command-invocation --region us-east-2 \
  --command-id "$COMMAND_ID" \
  --instance-id i-0f2e05fa61fb8bdf6 \
  --query '[Status, StandardOutputContent, StandardErrorContent]' --output text
```

## HARD RULES — NEVER BREAK THESE
- NEVER try plain `ssh ubuntu@3.18.126.199` or `scp` — no .pem key exists, it WILL fail
- ALWAYS chain `send-ssh-public-key` + `ssh` in ONE command with `&&`
- ALWAYS `rm -f` the key files before `ssh-keygen` — avoids overwrite prompt hanging
- ALWAYS use `pm2 delete` + `pm2 start npm --name remagent-v2 -- start`
- ALWAYS purge `/tmp/btcache/*`
- NO sed needed — port is 3020 in package.json permanently
- NO local build needed — server builds from git pull
- Server git repo: /www/wwwroot/remagent-v2/ (initialized, tracks origin/main)
- Instance ID: i-0f2e05fa61fb8bdf6
- IP: 3.18.126.199, user: ubuntu
