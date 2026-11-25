# Podman Desktop Deployment Guide for Windows

## 1. Prerequisites & WSL 2 Machine Initialization
Podman on Windows runs containers through a lightweight WSL 2 (Windows Subsystem for Linux) machine.

### Initializing the Machine via CLI or GUI:
1. **Via Podman Desktop GUI**:
   - Launch Podman Desktop.
   - Click **"Initialize and run"** on the main setup banner.
2. **Via PowerShell CLI**:
   ```powershell
   podman machine init
   podman machine start
   ```
3. **Verify Machine Status**:
   ```powershell
   podman machine list
   ```
   *Expected Output: `podman-machine-default  running`*

---

## 2. Multi-Stage Container Build Pipeline
The `Dockerfile` employs multi-stage caching for minimal production footprint:

```dockerfile
# Stage 1: Build the React + Vite frontend
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production Node.js runtime
FROM node:22-alpine AS production-server
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client-builder /app/client/dist ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Running with Podman Compose:
```powershell
cd C:\Users\admin\.gemini\antigravity\scratch\rythu-mitra
podman compose up --build
```
The entire application will be compiled, containerized, and accessible at `http://localhost:3000`.
