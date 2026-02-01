# oauth2-debug-checklist

A practical checklist for debugging **OAuth 2.0 Authorization Code Flow** implementations.
Focus is on real-world pitfalls and recurring issues developers encounter.

---

## Why this exists

OAuth 2.0 is widely used for delegated authentication (e.g., "Login with Google").
Even experienced developers often run into implementation issues that are:

- not syntax errors,
- not library bugs,
- but conceptual mismatches.

This checklist gathers common points that often require attention when debugging
OAuth 2.0 authorization flows in real code.

---

## Checklist (version 0.1)

Each item below has saved time for developers solving real issues in issues / PRs.

1. **Redirect URI mismatch**
   - Ensure the redirect URI exactly matches what the provider expects.
   - Case, trailing slash, query params — all must match.

2. **Missing / incorrect state parameter**
   - Include `state` to prevent CSRF issues.
   - Ensure it is returned unchanged.

3. **Client secret exposed in frontend**
   - Authorization Code Flow requires the client secret to be used only on backend.

4. **Mixing tokens**
   - Distinguish:
     - authorization `code`
     - `access_token`
     - `refresh_token`
   - Do not send access_token via browser unless explicitly required.

5. **Provider-specific quirks**
   - Some providers require additional flags/scopes.
   - Always check each provider doc for nuances.

6. **Token endpoint errors**
   - Examine error responses from provider token endpoint — often tell what is wrong.

7. **Clock skew**
   - Servers with incorrect time may fail token validity checks.

---

## Contributing

If you find a common case not covered here, feel free to open an issue or PR.

---

## License

This repository is released under the MIT License.
