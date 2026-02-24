# Deploying InfraNexus to AWS (~$21/month)

Single EC2 instance running everything via Docker Compose with Caddy for automatic HTTPS.

## Architecture

```
Internet → Caddy (port 80/443) → Next.js frontend (:3000)
                                → Express backend (:4000)
                                → PostgreSQL (:5432, internal only)
```

## Cost Breakdown

| Service | Config | Monthly Cost |
|---------|--------|-------------|
| EC2 `t3.small` | 2 vCPU, 2GB RAM, Ubuntu 24.04 | $15.18 |
| Elastic IP | Static IP for DNS | $3.65 |
| EBS (30GB gp3) | Root volume | $2.40 |
| **Total** | | **~$21/month** |

> If your AWS account has free tier, EC2 `t3.micro` is free for 12 months → total drops to ~$6/month.

---

## Prerequisites

- EC2 instance launched and running (Ubuntu 24.04 recommended)
- SSH access to your instance
- Domain name purchased (e.g., `infranexus.cloud`)

---

## Step 1: Allocate an Elastic IP

You need a **static IP address** so your domain always points to the same place. By default, EC2 public IPs change every time you stop/start the instance.

1. Go to **AWS Console → EC2 → Elastic IPs** (left sidebar under "Network & Security")
2. Click **"Allocate Elastic IP address"**
3. Leave defaults → click **"Allocate"**
4. Select the new Elastic IP → click **"Actions" → "Associate Elastic IP address"**
5. Choose your EC2 instance from the dropdown → click **"Associate"**

> **Write down your Elastic IP** — you'll need it for DNS. Example: `54.210.123.45`

---

## Step 2: Point Your Domain (infranexus.cloud) to EC2

You need to create a **DNS A Record** that tells the internet "infranexus.cloud → your EC2 IP."

### Option A: Using AWS Route 53 (recommended — most reliable)

**Cost:** $0.50/month per hosted zone + negligible query costs

1. Go to **AWS Console → Route 53 → Hosted zones**
2. Click **"Create hosted zone"**
   - Domain name: `infranexus.cloud`
   - Type: **Public hosted zone**
   - Click **"Create hosted zone"**
3. Route 53 will show you **4 nameservers** (NS records) that look like:
   ```
   ns-1234.awsdns-12.org
   ns-567.awsdns-34.net
   ns-890.awsdns-56.co.uk
   ns-12.awsdns-78.com
   ```
4. **Go to your domain registrar** (wherever you bought `infranexus.cloud`) and update the nameservers to the 4 Route 53 nameservers above. This is usually under "DNS Settings" or "Nameservers" in your registrar's dashboard.
5. **Back in Route 53**, click into your hosted zone and create records:

   **Record 1 — Root domain:**
   - Click **"Create record"**
   - Record name: *(leave blank for root `infranexus.cloud`)*
   - Record type: **A**
   - Value: **Your Elastic IP** (e.g., `54.210.123.45`)
   - TTL: 300
   - Click **"Create records"**

   **Record 2 — www subdomain:**
   - Click **"Create record"**
   - Record name: `www`
   - Record type: **CNAME**
   - Value: `infranexus.cloud`
   - TTL: 300
   - Click **"Create records"**

### Option B: Using Your Domain Registrar's DNS (free)

If you don't want the extra $0.50/month for Route 53, set DNS directly at your registrar.

1. Log into your domain registrar (GoDaddy, Namecheap, Cloudflare, Porkbun, etc.)
2. Go to **DNS Management** for `infranexus.cloud`
3. **Delete any existing A or CNAME records** for `@` or `www`
4. Create these records:

   | Type | Name/Host | Value | TTL |
   |------|-----------|-------|-----|
   | A | `@` (or blank) | `YOUR_ELASTIC_IP` | 300 |
   | CNAME | `www` | `infranexus.cloud` | 300 |

   > **Note:** Different registrars use different names. `@` means the root domain. Some registrars use a blank field instead.

### Verify DNS Propagation

DNS changes can take **5 minutes to 48 hours** (usually 5-15 minutes).

```bash
# Check from your local machine:
dig infranexus.cloud +short
# Should return your Elastic IP

nslookup infranexus.cloud
# Should show your Elastic IP

# Or use a web tool: https://dnschecker.org
```

---

## Step 3: Configure Security Group

Make sure your EC2 instance allows web traffic:

1. Go to **AWS Console → EC2 → Security Groups**
2. Find the security group attached to your instance → click **"Edit inbound rules"**
3. Ensure you have these rules:

   | Type | Port | Source | Purpose |
   |------|------|--------|---------|
   | SSH | 22 | **My IP** | Your SSH access |
   | HTTP | 80 | **0.0.0.0/0** | Caddy redirect to HTTPS |
   | HTTPS | 443 | **0.0.0.0/0** | Main app traffic |

4. Click **"Save rules"**

> ⚠️ **Never open port 22 to 0.0.0.0/0** — restrict SSH to your IP only.

---

## Step 4: Install Docker on EC2

SSH into your instance and install Docker:

```bash
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
```

Then run these commands one by one:

```bash
# 1. Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com | sh

# 3. Add your user to the docker group (so you don't need sudo)
sudo usermod -aG docker ubuntu

# 4. Install Docker Compose plugin
sudo apt-get install -y docker-compose-plugin

# 5. Install git
sudo apt-get install -y git

# 6. IMPORTANT: Log out and back in for group changes to take effect
exit
```

SSH back in and verify:
```bash
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP

docker --version
# Should output: Docker version 2x.x.x

docker compose version
# Should output: Docker Compose version v2.x.x
```

---

## Step 5: Clone & Configure the App

```bash
# 1. Clone your repo
git clone https://github.com/YOUR_USERNAME/vm-ide.git
cd vm-ide

# 2. Create your production .env from the template
cp .env.production .env

# 3. Generate a secure NEXTAUTH_SECRET
openssl rand -base64 32
# Copy the output — you'll paste it into .env

# 4. Generate a secure database password
openssl rand -base64 24
# Copy the output — you'll paste it into .env

# 5. Edit the .env with your actual values
nano .env
```

In the `nano` editor, update these values:

```bash
# Set your domain
DOMAIN=infranexus.cloud
NEXTAUTH_URL=https://infranexus.cloud

# Paste the passwords you generated above
POSTGRES_PASSWORD=<paste-db-password-here>
NEXTAUTH_SECRET=<paste-secret-here>

# GitHub OAuth (you'll set these up in Step 6)
GITHUB_CLIENT_ID=<leave-empty-for-now>
GITHUB_CLIENT_SECRET=<leave-empty-for-now>
```

Save the file: `Ctrl+O` → `Enter` → `Ctrl+X`

Also update the **Caddyfile** to use your domain:

```bash
# The Caddyfile uses the $DOMAIN env var automatically, but verify it looks correct:
cat Caddyfile
# The first line should show: {$DOMAIN} {
# This will resolve to infranexus.cloud from your .env
```

---

## Step 6: Set Up GitHub OAuth App

1. Go to **[github.com/settings/developers](https://github.com/settings/developers)**
2. Click **"OAuth Apps"** → **"New OAuth App"**
3. Fill in:
   - **Application name**: `InfraNexus`
   - **Homepage URL**: `https://infranexus.cloud`
   - **Authorization callback URL**: `https://infranexus.cloud/api/auth/callback/github`
4. Click **"Register application"**
5. Copy the **Client ID** shown on the next page
6. Click **"Generate a new client secret"** → copy the secret

Now update your `.env` on the EC2:

```bash
nano .env

# Update these two lines:
GITHUB_CLIENT_ID=<paste-client-id>
GITHUB_CLIENT_SECRET=<paste-client-secret>
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

---

## Step 7: Build & Launch

```bash
cd ~/vm-ide

# Build and start all containers (this will take 3-5 minutes the first time)
docker compose -f docker-compose.prod.yml up -d --build

# Watch the build progress:
docker compose -f docker-compose.prod.yml logs -f
# Press Ctrl+C to stop watching logs (containers keep running)
```

Wait until you see all containers are healthy:

```bash
docker compose -f docker-compose.prod.yml ps
# Should show: caddy, db, frontend, backend — all "Up"
```

---

## Step 8: Run Database Migrations & Seed

```bash
# Run Prisma migrations to create all database tables
docker compose -f docker-compose.prod.yml exec frontend npx prisma migrate deploy

# Seed the database (creates plans, admin user, etc.)
docker compose -f docker-compose.prod.yml exec frontend npx prisma db seed
```

---

## Step 9: Verify Everything Works

```bash
# 1. Check all containers are running
docker compose -f docker-compose.prod.yml ps

# 2. Test HTTPS (may take 1-2 minutes for Caddy to get the SSL cert)
curl -I https://infranexus.cloud
# Should return: HTTP/2 200 with valid TLS

# 3. If curl fails, check Caddy logs:
docker compose -f docker-compose.prod.yml logs caddy
```

Open **https://infranexus.cloud** in your browser. You should see:
- ✅ The InfraNexus landing page with HTTPS (lock icon)
- ✅ Login page with "Continue with GitHub" button
- ✅ GitHub OAuth login working end-to-end

---

## Troubleshooting

### "Connection refused" or site doesn't load
```bash
# Check security group allows ports 80 and 443
# Check containers are running:
docker compose -f docker-compose.prod.yml ps

# Check logs:
docker compose -f docker-compose.prod.yml logs caddy
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs backend
```

### Caddy can't get SSL certificate
- Make sure DNS is propagated: `dig infranexus.cloud +short` should return your IP
- Make sure ports 80 AND 443 are open in security group
- Check Caddy logs: `docker compose -f docker-compose.prod.yml logs caddy`

### GitHub OAuth "redirect_uri mismatch"
- Verify the callback URL in GitHub is exactly: `https://infranexus.cloud/api/auth/callback/github`
- Verify `NEXTAUTH_URL` in `.env` is exactly: `https://infranexus.cloud` (no trailing slash)

### Database connection errors
```bash
# Check DB is healthy:
docker compose -f docker-compose.prod.yml exec db pg_isready -U vmide
# Should return: accepting connections

# Check DB logs:
docker compose -f docker-compose.prod.yml logs db
```

### Out of memory on t3.small
```bash
# Check memory usage:
free -h
docker stats --no-stream

# If needed, add swap space:
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Operations

### View logs
```bash
docker compose -f docker-compose.prod.yml logs -f              # all services
docker compose -f docker-compose.prod.yml logs -f frontend     # just frontend
docker compose -f docker-compose.prod.yml logs -f backend      # just backend
```

### Restart services
```bash
docker compose -f docker-compose.prod.yml restart
```

### Update & redeploy
```bash
cd ~/vm-ide
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Database backup
```bash
# Backup to a file
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U vmide vmide > backup-$(date +%Y%m%d).sql

# Restore from backup
cat backup-20260224.sql | docker compose -f docker-compose.prod.yml exec -T db \
  psql -U vmide vmide
```

### SSH security hardening
```bash
# Disable password auth (key-only SSH)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Enable automatic security updates
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Scaling Later (SaaS)

When ready to scale beyond this single-server setup:

1. **Database** → Migrate PostgreSQL to **RDS** (~$12/mo for `db.t4g.micro`)
2. **Containers** → Move to **ECS Fargate** or **ECS on EC2** with auto-scaling
3. **Load Balancer** → Add **ALB** for multi-instance frontend/backend
4. **CDN** → Add **CloudFront** in front of Next.js for static asset caching
5. **Secrets** → Move env vars to **AWS Secrets Manager** or **SSM Parameter Store**
