# Section 01 — Infrastructure Setup
**Goal:** VPS running + domain pointing to it + Nginx routing subdomains + SSL

---

## Step 1.1 — Buy a VPS

Go to hetzner.com and create a CX22 instance:
- OS: Ubuntu 24.04
- Location: closest to you (Bangalore → Singapore or Helsinki)
- SSH key: generate one locally and paste the public key
- Cost: ~€3.79/mo

Save your VPS IP address. You will need it throughout.

```bash
# Test SSH access after provisioning
ssh root@YOUR_VPS_IP
```

---

## Step 1.2 — Buy a domain

Go to namecheap.com and buy a `.com` domain.
Suggested names: `mortgageeval.com`, `anuragqai.com`, `loaneval.com`

After purchase, go to **Advanced DNS** settings in Namecheap.

---

## Step 1.3 — DNS records

Add these four A records in Namecheap DNS panel.
All point to the same VPS IP:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | app | YOUR_VPS_IP | Automatic |
| A | test | YOUR_VPS_IP | Automatic |
| A | mlflow | YOUR_VPS_IP | Automatic |
| A | @ | YOUR_VPS_IP | Automatic |

DNS propagation takes 10-30 minutes.
Test with: `ping app.domain.com` — should resolve to your VPS IP.

---

## Step 1.4 — VPS initial setup

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Install Nginx
apt install nginx -y

# Install Certbot for SSL
apt install certbot python3-certbot-nginx -y

# Install Git
apt install git -y

# Create app user (don't run everything as root)
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy

# Switch to deploy user
su - deploy
```

---

## Step 1.5 — Nginx config

Create the Nginx config file:

```bash
sudo nano /etc/nginx/sites-available/mortgageeval
```

Paste this content:

```nginx
# app.domain.com — React frontend
server {
    listen 80;
    server_name app.domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# test.domain.com — Test dashboard
server {
    listen 80;
    server_name test.domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}

# mlflow.domain.com — MLflow UI
server {
    listen 80;
    server_name mlflow.domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        auth_basic "MLflow";
        auth_basic_user_file /etc/nginx/.htpasswd;
    }
}
```

Enable the config and test:

```bash
sudo ln -s /etc/nginx/sites-available/mortgageeval /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 1.6 — SSL certificates

```bash
# Get SSL for all three subdomains in one command
sudo certbot --nginx \
  -d app.domain.com \
  -d test.domain.com \
  -d mlflow.domain.com \
  --email your@email.com \
  --agree-tos \
  --non-interactive

# Certbot auto-updates your Nginx config with HTTPS
# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Step 1.7 — MLflow basic auth

```bash
# Create password for MLflow dashboard
sudo apt install apache2-utils -y
sudo htpasswd -c /etc/nginx/.htpasswd mlflow
# Enter a password when prompted
```

---

## Step 1.8 — Setup deploy directory

```bash
# On VPS, as deploy user
mkdir -p /home/deploy/mortgageeval
cd /home/deploy/mortgageeval

# Add your SSH key to VPS for GitHub Actions deployment
# On your LOCAL machine:
ssh-keygen -t ed25519 -C "github-actions-deploy"
# Copy the PUBLIC key to VPS:
ssh-copy-id -i ~/.ssh/id_ed25519_deploy.pub deploy@YOUR_VPS_IP
# Save the PRIVATE key as GitHub secret: VPS_SSH_KEY
```

---

## Section 01 Checklist

- [ ] VPS provisioned and SSH access working
- [ ] Domain purchased
- [ ] Four DNS A records created (app, test, mlflow, @)
- [ ] Docker + Docker Compose installed on VPS
- [ ] Nginx installed and config created
- [ ] SSL certificates issued for all three subdomains
- [ ] MLflow basic auth password set
- [ ] Deploy directory created at `/home/deploy/mortgageeval`
- [ ] GitHub Actions SSH key added to VPS

**Before proceeding:** Visit `https://app.domain.com` in browser.
You should see a 502 Bad Gateway (correct — backend not running yet).
If you see a domain error, DNS hasn't propagated yet. Wait 30 minutes.
