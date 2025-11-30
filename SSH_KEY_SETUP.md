# Generate SSH Key on Windows

Follow these steps to generate an SSH key on your Windows machine to connect to your server.

---

## Step 1: Open PowerShell

1. Press `Windows Key + X`
2. Click "Windows PowerShell" or "Terminal"

---

## Step 2: Generate SSH Key

Copy and paste this command:

```powershell
ssh-keygen -t ed25519 -C "your-email@example.com"
```

Replace `your-email@example.com` with your actual email.

**You'll see:**
```
Generating public/private ed25519 key pair.
Enter file in which to save the key (C:\Users\deepr/.ssh/id_ed25519):
```

**Just press ENTER** (uses default location)

**Then:**
```
Enter passphrase (empty for no passphrase):
```

**Press ENTER** (no passphrase - easier for automation)

**Then:**
```
Enter same passphrase again:
```

**Press ENTER again**

You'll see:
```
Your identification has been saved in C:\Users\deepr/.ssh/id_ed25519
Your public key has been saved in C:\Users\deepr/.ssh/id_ed25519.pub
The key fingerprint is:
SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx your-email@example.com
```

✅ **SSH Key Generated!**

---

## Step 3: View Your PUBLIC Key

This is the key you'll add to your server.

```powershell
cat C:\Users\deepr\.ssh\id_ed25519.pub
```

**Copy the ENTIRE output** - it looks like:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAbCdEfGhIjKlMnOpQrStUvWxYz... your-email@example.com
```

---

## Step 4: Add Key to Your Server

### Option A: Using DigitalOcean/Linode/Vultr Dashboard

1. Log into your server provider dashboard
2. Go to Settings → Security → SSH Keys
3. Click "Add SSH Key"
4. Paste your public key
5. Give it a name (e.g., "Windows Laptop")
6. Save

### Option B: Manual Method (if server already exists)

**If you can already access your server with password:**

1. Connect to server:
```powershell
ssh root@YOUR_SERVER_IP
# Enter password when prompted
```

2. Create .ssh directory (if doesn't exist):
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

3. Add your public key:
```bash
nano ~/.ssh/authorized_keys
```

4. Paste your public key (from Step 3)
5. Press `Ctrl + X`, then `Y`, then `Enter` to save

6. Set permissions:
```bash
chmod 600 ~/.ssh/authorized_keys
```

7. Exit server:
```bash
exit
```

---

## Step 5: Test SSH Connection

Now you can connect WITHOUT password:

```powershell
ssh root@YOUR_SERVER_IP
```

**Replace `YOUR_SERVER_IP` with your actual server IP!**

You should connect immediately without being asked for a password!

✅ **SSH Key Setup Complete!**

---

## Quick Reference

### Your Key Locations:
- **Private Key** (NEVER SHARE): `C:\Users\deepr\.ssh\id_ed25519`
- **Public Key** (safe to share): `C:\Users\deepr\.ssh\id_ed25519.pub`

### View Public Key Anytime:
```powershell
cat C:\Users\deepr\.ssh\id_ed25519.pub
```

### Connect to Server:
```powershell
ssh root@YOUR_SERVER_IP
```

or if you created a non-root user:
```powershell
ssh username@YOUR_SERVER_IP
```

---

## Troubleshooting

### Problem: "ssh-keygen is not recognized"

**Solution:** You're not using PowerShell.
1. Close CMD
2. Open PowerShell (Windows Key + X → Windows PowerShell)
3. Try again

---

### Problem: "Permission denied (publickey)"

**Solution:** Key not added to server correctly.
1. Connect with password: `ssh root@YOUR_SERVER_IP`
2. Check authorized_keys: `cat ~/.ssh/authorized_keys`
3. Make sure your public key is there
4. Check permissions: `ls -la ~/.ssh/`
   - Should show: `drwx------ .ssh`
   - Should show: `-rw------- authorized_keys`

---

### Problem: "WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED"

**Solution:** Server was reinstalled or IP changed.
```powershell
ssh-keygen -R YOUR_SERVER_IP
```

Then try connecting again.

---

## Next Steps

Once SSH is working:
1. Go to **SERVER_DEPLOYMENT_GUIDE.md**
2. Follow the deployment instructions
3. Your LinkedIn Agent will run on the server!

---

## Security Notes

- ✅ **Private key** (`id_ed25519`) - Keep secret, never share!
- ✅ **Public key** (`id_ed25519.pub`) - Safe to add to servers
- ✅ Always use SSH keys instead of passwords
- ✅ If you lose your private key, generate a new pair

---

## Alternative: If You Already Have a Server Provider Account

### DigitalOcean Example:
1. Copy your public key: `cat C:\Users\deepr\.ssh\id_ed25519.pub`
2. Go to https://cloud.digitalocean.com/account/security
3. Click "Add SSH Key"
4. Paste key and name it
5. When creating a new Droplet, select this SSH key

### AWS EC2 Example:
1. AWS provides its own key pair
2. Download the `.pem` file
3. Use it to connect: `ssh -i path/to/key.pem ubuntu@YOUR_SERVER_IP`

### Vultr/Linode:
Similar to DigitalOcean - add key in account settings before creating server.
