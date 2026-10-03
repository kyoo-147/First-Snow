# Companion WebSocket gateway

The gateway runs as a separate Node process and serves `GET /health` plus WebSocket upgrades at `/api/companion/ws`.

Build and run it with:

```sh
npm run build:gateway
npm run start:gateway
```

It requires `DATABASE_URL`. Production also requires `NODE_ENV=production` and `COMPANION_PUBLIC_ORIGIN=https://<public-host>`.

The default bind is `127.0.0.1:4001`. If nginx runs on another host or container, set `COMPANION_GATEWAY_HOST` to the private interface and `COMPANION_TRUSTED_PROXY_ADDRESS` to nginx's source IP.

The production upgrade check requires that the socket peer match the configured trusted proxy, `X-Forwarded-Proto` equal `https`, `X-Forwarded-Host` match the configured public origin, and `Origin` equal that same origin.

An nginx location can proxy the fixed path as follows, with `$host` and `$scheme` supplied by nginx:

```nginx
location = /api/companion/ws {
    proxy_pass http://127.0.0.1:4001/api/companion/ws$is_args$args;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Origin $http_origin;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_read_timeout 130s;
}
```

VoiceClient transports the one-time ticket via query parameter `?ticket=<token>` during the WebSocket upgrade handshake (`/api/companion/ws?ticket=...`). The gateway validates and consumes the matching hashed ticket in `companion_sessions.metadata` under a row lock atomically at upgrade time before accepting the connection. For clients connecting without a query parameter, initial frame auth `{"type":"auth","ticket":"…","sessionId":"…"}` is also supported.

Upon authentication, the gateway sends `connected`, `capabilities`, and `provider_unavailable` (for ASR, TTS, and LLM). Its connected capabilities keep audio input, camera, screen, and vision disabled. No child text or media is echoed as a response.

