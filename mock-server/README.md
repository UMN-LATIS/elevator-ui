# Elevator UI Mock Server

A mock API server for developing and testing the Elevator UI application. Built with [Hono](https://hono.dev/) to simulate the CodeIgniter 3 backend API.

## Quick Start

```bash
# Install dependencies
npm run mock:install

# Start the mock server (port 3001)
npm run mock:serve

# Or run both UI and mock server together
npm run dev:mock

# get data from the endpoint (using HTTPie)
http http://localhost:3001/health
http http://localhost:3001/defaultinstance/home/getInstanceNav
```

## Testing Credentials

```
Username: testuser
Password: password

Username: admin
Password: admin
```
