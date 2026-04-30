# Backend auth analysis — Superadmin “Authorization required” / “Token company mismatch”

This report is based on **the actual code** in this repository (`Backend/`, `src/`). It maps each error string to **exact file and line numbers**, explains **root causes**, and states **what fixes the behavior** (without rewriting the project).

---

## 1. How `add_company` is protected (call chain)

| Step | File | What happens |
|------|------|----------------|
| 1 | `Backend/api/company/add_company.php` L5–7 | Loads `bootstrap_api.php`, then calls `billing_require_superadmin($conn)`. |
| 2 | `Backend/includes/middleware.php` L118–121 | `billing_require_superadmin` → `billing_require_roles($conn, ['superadmin'], false)`. |
| 3 | `Backend/includes/middleware.php` L90–103 | `billing_require_roles` calls `billing_require_auth($conn)` first, then checks role list; `requireCompanyScope` is **false** for superadmin, so **`company_id === null` is allowed** (no “Company scope required” here). |
| 4 | `Backend/includes/middleware.php` L23–83 | `billing_require_auth` validates Bearer token, JWT, user row, role, and (for non–superadmin) company match. |

**Conclusion:** Superadmin **must** pass `billing_require_auth` successfully. Failures before role checks surface as **401** with messages from `billing_require_auth` or JWT helpers—not from `add_company.php` body validation.

---

## 2. Error string → exact location (single source of truth)

All of these messages are emitted only from `Backend/includes/middleware.php` unless noted.

| Message | File | Line(s) | Condition |
|--------|------|-----------|-----------|
| **`Authorization required`** | `Backend/includes/middleware.php` | **25–29** | `billing_get_bearer_token()` returns **`null`** (no usable Bearer token string). |
| **`Invalid or expired token`** | `Backend/includes/middleware.php` | **31–35** | Token present but `billing_jwt_decode()` returns **`null`** (bad signature, malformed JWT, or **`exp` past due**). |
| **`Invalid token payload`** | `Backend/includes/middleware.php` | **43–47** | `sub` missing/zero or `role` empty after reading payload. |
| **`User not found or inactive`** | `Backend/includes/middleware.php` | **56–59** | No DB row for `users.id = sub`, or `is_deleted = 1`. |
| **`Token role mismatch`** | `Backend/includes/middleware.php` | **61–64** | JWT `role` ≠ `users.role` for that id. |
| **`Token company mismatch`** | `Backend/includes/middleware.php` | **69–75** | Only when **`$role !== 'superadmin'`**: DB `company_id` vs JWT `company_id` differ. |
| **`Company scope required`** | `Backend/includes/middleware.php` | **98–101** | `billing_require_roles` with **`requireCompanyScope === true`** and **`$auth['company_id'] === null`**. **Not** used by `billing_require_superadmin` (it passes `false`). |

**Important:** **`"Authorization required"`** and **`"Token company mismatch"`** come from **different branches**. They are **not** two symptoms of the same bug.

---

## 3. Root cause: `"Authorization required"`

### 3.1 Exact code

```23:29:Backend/includes/middleware.php
function billing_require_auth(mysqli $conn): array
{
    $token = billing_get_bearer_token();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['status' => false, 'message' => 'Authorization required']);
        exit;
```

```10:16:Backend/includes/middleware.php
function billing_get_bearer_token(): ?string
{
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $hdr, $m)) {
        return $m[1];
    }
    return null;
}
```

### 3.2 Why it happens (factual)

This error means **PHP never received a header it could parse as `Authorization: Bearer <token>`** into `$_SERVER['HTTP_AUTHORIZATION']` or `$_SERVER['REDIRECT_HTTP_AUTHORIZATION']`.

**Typical causes (consistent with this code):**

1. **Client did not send the header**  
   - Example: `src/services/api.ts` L21–23 only sets `Authorization` when `token` is truthy; if `token` is `null`/`undefined`/empty string, **no header is sent** → `"Authorization required"`.

2. **Web server does not pass `Authorization` to PHP**  
   - Common with **Apache** + certain PHP SAPI/CGI setups: the header exists on the wire but is **not** populated in `$_SERVER`.  
   - This repo has **no** `Backend/.htaccess` (verified: no `.htaccess` under `Backend/`) to force forwarding (e.g. `SetEnvIf Authorization ...` or rewrite rules). So **deployment-dependent** stripping is a **real** possible cause independent of PHP logic.

3. **Wrong test tool usage**  
   - Calling `add_company.php` without `Authorization: Bearer ...` in Postman/curl → same error.

### 3.3 What fixes it

- **Client:** Ensure every protected request passes a non-empty token (see `src/screens/CompanyFormScreen.tsx` L37–52: uses `token` from `useAuth()`). If the user is not logged in or SecureStore lost the token, the app will hit this path.
- **Server:** If the header is sent but PHP still does not see it, add the appropriate **Apache/nginx** rule so `Authorization` is available to PHP (environment-specific; not guessed here—verify with `var_dump($_SERVER)` or logs in a **non-production** diagnostic only).

**Why this works:** `billing_get_bearer_token()` only succeeds when the header string is present in `$_SERVER` and matches the regex.

---

## 4. Root cause: `"Token company mismatch"`

### 4.1 Exact code (current repository)

```67:76:Backend/includes/middleware.php
    // CHANGED: superadmin has no company — do not compare JWT company_id to DB (avoids NULL vs
    // missing-key vs 0 edge cases). Admin/cashier must still match token ↔ DB strictly.
    if ($role !== 'superadmin') {
        $dbCompany = $row['company_id'] !== null ? (int)$row['company_id'] : null;
        if ($dbCompany !== $companyId) {
            http_response_code(401);
            echo json_encode(['status' => false, 'message' => 'Token company mismatch']);
            exit;
        }
    }
```

### 4.2 When superadmin could still see this **before** this pattern existed

**Historical bug (logic, now addressed in-repo):** If **all** roles ran the strict check:

```php
$dbCompany = ...;
if ($dbCompany !== $companyId) { ... Token company mismatch ... }
```

then for **superadmin**:

- DB: `users.company_id` is **`NULL`** → `$dbCompany === null`.
- JWT: `company_id` might be **`null`**, **missing**, or incorrectly **`0`** after decode/cast.

In PHP, **`null !== 0`** is **`true`**. So **`null` (DB) vs `0` (token)** → mismatch. Similarly, inconsistent handling of a **missing** JWT key vs explicit **`null`** could produce mismatches depending on how `$companyId` was derived:

```39:41:Backend/includes/middleware.php
    $companyId = array_key_exists('company_id', $payload) && $payload['company_id'] !== null
        ? (int)$payload['company_id']
        : null;
```

If the token incorrectly contained **`company_id: 0`**, then `$companyId` becomes **`0`**, while DB is **`null`** → **`Token company mismatch`** for any role still using the old unconditional check—including superadmin.

### 4.3 Current behavior in this repo

With **`if ($role !== 'superadmin')`** wrapping the mismatch block (L69–75), **superadmin does not enter** that branch, so **this specific message should not be returned for a valid superadmin JWT** from this code path.

If you still see **`Token company mismatch`** while calling as superadmin, then **either**:

- The JWT **`role` claim is not the string `superadmin`** (e.g. typo, old token, different user), so the code **does** run the company check as **admin/cashier**; or  
- The running server **does not have this version** of `middleware.php` deployed.

### 4.4 What fixes it (already reflected in code)

- **Skip company comparison for `superadmin`** (done L69–76).  
- **Return `company_id => null` for superadmin** in the auth array (L78–82) so downstream code does not treat a bad claim as scope.

**Why it works:** Superadmin is **not** tenant-scoped; comparing `NULL` to JWT `0` or ambiguous missing keys was **invalid** for that role.

---

## 5. JWT generation vs verification (no guessing)

### 5.1 Issuance (`login`)

```24:30:Backend/api/auth/login.php
    $token = billing_jwt_encode([
        'sub' => $uid,
        'role' => $role,
        'company_id' => $cid,
        'iat' => time(),
        'exp' => time() + JWT_EXPIRY_SECONDS,
    ], JWT_SECRET);
```

`$cid` is **`null`** when `company_id` is SQL `NULL` (L22–22 in same file). So superadmin should get **`"company_id":null`** inside the JWT payload JSON.

### 5.2 Verification

```38:57:Backend/includes/jwt.php
function billing_jwt_decode(string $jwt, string $secret): ?array
{
    ...
    if (!hash_equals($expected, $s64)) {
        return null;
    }
    ...
    if (isset($payload['exp']) && time() >= (int)$payload['exp']) {
        return null;
    }
    return $payload;
}
```

Wrong secret, tampered token, or **expired `exp`** → **`null`** decode → **`Invalid or expired token`**, **not** `"Authorization required"` or `"Token company mismatch"`.

---

## 6. RBAC and `company_id` trust

| Area | Finding |
|------|---------|
| **Superadmin company APIs** | `billing_require_superadmin` uses `requireCompanyScope = false` → no **“Company scope required”** for `company_id === null`. |
| **Body trust** | `add_company.php` reads JSON body for company fields only **after** auth; it does **not** take `company_id` from the client to scope the user (correct for tenancy). |
| **Admin/cashier** | Still require strict **token ↔ DB** `company_id` match when `role` is not `superadmin` (L69–75). |

---

## 7. Frontend (`src/`) relevant to these errors

| File | Relevance |
|------|-----------|
| `src/services/api.ts` L21–23 | `Authorization` header only if `token` is truthy → missing token → backend **“Authorization required”**. |
| `src/screens/CompanyFormScreen.tsx` L37–52 | Sends `token` from `useAuth()`; if null, request goes without header. |

---

## 8. Summary table

| Symptom | Root cause in code | Fix |
|--------|---------------------|-----|
| **Authorization required** | `billing_get_bearer_token()` returns `null` → `middleware.php` **L25–29** | Send `Authorization: Bearer <jwt>`; fix server config if header stripped; ensure app has stored token. |
| **Token company mismatch** (historical superadmin) | Unconditional `$dbCompany !== $companyId` for users with **`NULL`** DB company vs JWT **`0`** or inconsistent **null** handling | **Skip company check for `superadmin`**; **implemented** in `middleware.php` **L67–76**. |
| **Token company mismatch** (admin/cashier) | JWT `company_id` does not match `users.company_id` | Re-login; fix DB/token drift; do not forge `company_id` client-side (server uses DB + JWT). |

---

## 9. Verification checklist (code-aligned)

1. **Confirm** the deployed file matches `Backend/includes/middleware.php` (superadmin bypass at L69–76).  
2. **Confirm** the client sends `Authorization: Bearer …` for `company/add_company.php` (see `api.ts` + `CompanyFormScreen`).  
3. If the header is sent but error persists, **inspect** whether the web server forwards `Authorization` into `$_SERVER` (deployment issue, not PHP business logic).  
4. Distinguish **401** messages: only **L25–29** is **“Authorization required”**; **“Invalid or expired token”** is **L31–35**.

---

*Generated from repository snapshot: `Backend/includes/middleware.php`, `Backend/includes/jwt.php`, `Backend/api/company/add_company.php`, `Backend/api/auth/login.php`, `src/services/api.ts`, `src/screens/CompanyFormScreen.tsx`.*
