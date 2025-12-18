const owaspSnippets = {
  "A01:2021": [
    "Enforce server-side authorization on every request (object- and function-level).",
    "Deny-by-default; only allow actions explicitly permitted to the authenticated principal.",
    "Avoid exposing direct object references; use indirect references or access checks."
  ],
  "A02:2021": [
    "Use modern, vetted algorithms and correct modes (e.g., AES-GCM for symmetric encryption).",
    "Never roll your own crypto; manage keys securely (rotation, access control).",
    "Force HTTPS; set HSTS and secure cookie attributes."
  ],
  "A03:2021": [
    "Use parameterized queries/ORMs; never concatenate untrusted input into queries.",
    "Sanitize and encode outputs contextually (HTML, JS, URL, SQL).",
    "Apply centralized input validation with allow-lists."
  ],
  "A04:2021": [
    "Threat model critical flows; design mitigations before coding.",
    "Apply security patterns (rate limiting, isolation, defense-in-depth).",
    "Validate assumptions with abuse cases."
  ],
  "A05:2021": [
    "Harden defaults; disable unused features, services, and endpoints.",
    "Set security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).",
    "Automate configuration checks in CI/CD."
  ],
  "A06:2021": [
    "Continuously inventory dependencies; pin versions and apply updates fast.",
    "Use SCA tools to detect vulnerabilities; avoid unmaintained packages.",
    "Isolate risky components and verify signatures for critical artifacts."
  ],
  "A07:2021": [
    "Enforce MFA; use secure password storage (Argon2/bcrypt/scrypt with salt).",
    "Harden session management (Secure, HttpOnly, SameSite cookies; rotate on auth changes).",
    "Lock accounts or require step-up auth on suspicious behavior."
  ],
  "A08:2021": [
    "Verify integrity of updates and third-party code; avoid unsafe deserialization.",
    "Enforce signed payloads and trusted sources for build artifacts.",
    "Use allow-lists for file types and paths; validate uploads strictly."
  ],
  "A09:2021": [
    "Centralize logs; monitor authentication, authorization, and key business events.",
    "Protect logs from tampering; restrict access and retention.",
    "Alert on anomalies; ensure traceability with correlation IDs."
  ],
  "A10:2021": [
    "Block SSRF by default; use allow-listed destinations and network egress filters.",
    "Avoid passing full URLs from users to server-side fetchers.",
    "Enforce metadata service protections and timeouts."
  ]
};

export default owaspSnippets;