# Security Audit — oauth-fullstack

**Datum:** 2026-10-18
**Scope:** React SPA (:5173) · Node.js/Express API (:3001) · Auth0 (Authorization Server)
**Methodik:** Manuelle Tests, `curl`, Browser DevTools, Burp (passiv)
**Prüfer:** Selbst-Audit

---

## Zusammenfassung

Die Anwendung implementiert OAuth 2.0 Authorization Code Flow mit PKCE, Refresh
Token Rotation und rollenbasierter Autorisierung. Transport- und Browser-seitige
Härtung erfolgt über `helmet` (Security Header) und eine explizite Content-Security-
Policy. Alle geprüften Angriffsklassen (CORS-Missbrauch, Clickjacking, Token-
Fälschung, Privilege Escalation) werden korrekt abgewehrt. Ein Low-Finding
(Stacktrace in Fehlerantworten) ist offen und für das Produktions-Deployment zu
beheben. Ein bewusst akzeptierter Trade-off (Tokens im LocalStorage) ist dokumentiert.

---

## Geprüfte Kontrollen & Ergebnisse

### Authentifizierung / OAuth

| Kontrolle | Test | Ergebnis |
|---|---|---|
| PKCE (S256) | `/authorize`-Request im Network Tab: `code_challenge` + `code_challenge_method=S256` | bestanden |
| Refresh Token Rotation | Reuse eines verbrauchten Refresh Tokens (`curl` gegen `/oauth/token`) | `invalid_grant`, Token-Familie widerrufen |
| JWT-Signaturprüfung | gültiger Token → 200; Token mit 1 geändertem Zeichen → 401; ohne Token → 401 | bestanden |
| Public Client ohne Secret | SPA nutzt kein Client Secret (PKCE) | bestanden |

### Autorisierung (RBAC)

| Kontrolle | Test | Ergebnis |
|---|---|---|
| Permission vorhanden | `GET /api/messages` (Token mit `read:messages`) | 200 |
| Permission fehlt | `GET /api/test403` (Permission `does:not-exist`, nie vergeben) | 403 |
| 401 vs 403 getrennt | kein Token → 401 (checkJwt); Token ohne Recht → 403 (requirePermission) | korrekt getrennt |

### CORS

| Kontrolle | Test | Ergebnis |
|---|---|---|
| Keine Origin-Reflection | `curl -H "Origin: https://evil.com" /api/health` | `Access-Control-Allow-Origin: http://localhost:5173` (nicht gespiegelt) |
| Feste Allowlist | `cors({ origin: FRONTEND_URL, credentials: true })` | kein `*`, kein `null`, keine Wildcard-Subdomain |

### Security Header (Backend :3001)

| Header | Wert | Status |
|---|---|---|
| Content-Security-Policy | `default-src 'self'; … frame-ancestors 'none'; script-src 'self'; connect-src 'self' http://localhost:5173` | gesetzt |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` | gesetzt |
| X-Content-Type-Options | `nosniff` | gesetzt |
| X-Frame-Options | `SAMEORIGIN` | gesetzt |
| Referrer-Policy | `no-referrer` | gesetzt |
| X-Powered-By | — | entfernt |

### Security Header (Frontend :5173)

| Header | Wert | Status |
|---|---|---|
| Content-Security-Policy | `frame-ancestors 'none'` | gesetzt (Vite Dev Server) |
| X-Frame-Options | `DENY` | gesetzt |

### Rate Limiting

| Kontrolle | Test | Ergebnis |
|---|---|---|
| Globales Limit | 100 Req / 15 min / IP (express-rate-limit) | 429 nach Limit, verifiziert |
| Strenges Limit | 5 Req / min auf /api/sensitive | 429 ab dem 6. Request |
| 429-Antwort | curl-Schleife | Retry-After + RateLimit-* gesetzt |
| Limiter vor Auth | /api/sensitive ohne Token | 401 (gezählt) → 429 (geblockt vor checkJwt) |

### Clickjacking

| Kontrolle | Test | Ergebnis |
|---|---|---|
| Einbettung verhindert | lokale `iframe`-Testseite gegen `http://localhost:5173` | iframe bleibt leer, Browser verweigert Darstellung |
| Header statt Meta-Tag | `frame-ancestors` als echter HTTP-Header (nicht nur `<meta>`) | korrigiert (Freitag) |

### XSS / CSP

| Kontrolle | Test | Ergebnis |
|---|---|---|
| Keine Inline-Scripts | `script-src 'self'` ohne `'unsafe-inline'` | bestanden |
| Exfiltration blockiert | `fetch('https://example.com/…')` aus der Console | durch `connect-src` blockiert |
| Token-Auslesen | LocalStorage per JS lesbar | durch CSP nicht verhinderbar (siehe Finding 1) |

---

## Findings

| # | Schwere | Finding | Beschreibung | Status |
|---|---|---|---|---|
| 1 | Info | Tokens im LocalStorage | Access-/Refresh-Token liegen im LocalStorage und sind per JavaScript lesbar. CSP senkt das XSS-Risiko, beseitigt es aber nicht. | akzeptierter Trade-off |
| 2 | Low | Stacktrace in Fehlerantwort | Die API gibt bei Fehlern (z. B. ungültiges Token) einen vollständigen Stacktrace inkl. absoluter Dateipfade und `node_modules`-Struktur an den Client zurück (Information Disclosure). | offen — vor Produktion beheben |
| 3 | Low | `style-src 'unsafe-inline'` | Inline-Styles der SPA erfordern `'unsafe-inline'` in der `style-src`-Direktive. CSS-Injection-Risiko ist begrenzt, aber nicht null. | akzeptierter Trade-off |

### Finding 2 — Behebung

```javascript
// Produktion: NODE_ENV=production setzen und generischen Error-Handler ergänzen
app.use((err, req, res, next) => {
  console.error(err)                      // intern loggen
  res.status(err.status || 500).json({    // generische Antwort nach außen
    error: 'Internal Server Error',
  })
})
```

Zusätzlich: `express` sendet Stacktraces nur, solange `NODE_ENV` nicht auf
`production` steht. Für das Deployment `NODE_ENV=production` setzen.

---

## Offene Punkte / Roadmap

- **Finding 2 beheben** — generischer Error-Handler + `NODE_ENV=production`.
- **BFF-Variante** — Tokens in httpOnly-Cookie statt LocalStorage; eliminiert das
  XSS-Token-Diebstahl-Risiko (Trade-off: CSRF-Schutz via SameSite + CSRF-Token nötig).
- **CSP härten** — `nonce`/`hash` statt `'unsafe-inline'` bei Styles.
- **Produktions-TLS** — echtes HTTPS, HSTS wirksam, ggf. HSTS-Preload.
- **Rate Limiting Produktion** — trust proxy korrekt setzen (hinter Reverse Proxy)
  und Redis-Store statt In-Memory bei mehreren Instanzen.

---

## Methodik-Notizen

| Werkzeug | Verwendung |
|---|---|
| `curl -I` | Header-Inspektion (BE + FE), CORS-Origin-Test |
| `curl -i` + manipulierter Token | JWT-Signatur- und RBAC-Prüfung |
| Browser DevTools | Network (PKCE, Preflights), Console (CSP-Verstöße), LocalStorage (Token-Inspektion) |
| Lokale iframe-Testseite | Clickjacking-Einbettungstest |
| Burp (passiv) | Traffic-Aufzeichnung, Header-Review |

### Reproduktion der Kerntests

```bash
# Header
curl -I http://localhost:3001/api/health
curl -I http://localhost:5173

# CORS — Origin wird nicht gespiegelt
curl -I -H "Origin: https://evil.com" http://localhost:3001/api/health

# JWT — Signaturprüfung
curl -i http://localhost:3001/api/user -H "Authorization: Bearer <GÜLTIG>"      # 200
curl -i http://localhost:3001/api/user -H "Authorization: Bearer <MANIPULIERT>" # 401
curl -i http://localhost:3001/api/user                                          # 401

# RBAC — 403 bei fehlender Permission
curl -i http://localhost:3001/api/messages -H "Authorization: Bearer <TOKEN>"   # 200
curl -i http://localhost:3001/api/test403  -H "Authorization: Bearer <TOKEN>"   # 403
```

---

## Fazit

Die Kern-Sicherheitskontrollen (PKCE, Refresh Rotation, JWT-Validierung, RBAC,
CORS-Allowlist, Security Header, Clickjacking-Schutz) sind implementiert und durch
Tests belegt. Es verbleibt ein Low-Finding (Stacktrace-Leak), das vor einem
Produktions-Deployment zu beheben ist. Die architektonische Haupt-Entscheidung
(LocalStorage statt BFF) ist bewusst getroffen und mit ihren Grenzen dokumentiert.
