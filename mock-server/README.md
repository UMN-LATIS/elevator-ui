# Elevator UI Mock Server

A mock API server for developing and testing the Elevator UI application. Built with [Hono](https://hono.dev/) to simulate the Elevator API.

Features:

- API compatibility with core backend endpoints using our frontend TS types
- Session-based auth simulation
- Multi-worker mock database isolation to support playwright's parallel testing

## Quick Start

```bash
# Install dependencies
npm run mock:install

# Run both UI and mock server together
npm run dev:mock

# Go to: <https://localhost:5173>
```

Front end: <https://localhost:5173>
Back end: <http://localhost:3001>

Vite dev server is automatically started with `VITE_API_PROXY_TARGET="http://localhost:3001"`

## Testing Credentials

```
# full admin
Username: admin
Password: admin

# manage assets
Username: curator
Password: curator

# search and view
Username: user
Password: user
```
