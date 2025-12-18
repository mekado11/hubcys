export const OWASP_TOP10_2021 = [
  { id: "A01:2021", name: "Broken Access Control" },
  { id: "A02:2021", name: "Cryptographic Failures" },
  { id: "A03:2021", name: "Injection" },
  { id: "A04:2021", name: "Insecure Design" },
  { id: "A05:2021", name: "Security Misconfiguration" },
  { id: "A06:2021", name: "Vulnerable and Outdated Components" },
  { id: "A07:2021", name: "Identification and Authentication Failures" },
  { id: "A08:2021", name: "Software and Data Integrity Failures" },
  { id: "A09:2021", name: "Security Logging and Monitoring Failures" },
  { id: "A10:2021", name: "Server-Side Request Forgery" },
];

const CHEAT_SHEETS = {
  "Access Control": "https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html",
  Authorization: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html",
  "SQL Injection": "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
  "XSS Prevention": "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html",
  "Input Validation": "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html",
  "Security Headers": "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html",
  "Content Security Policy": "https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html",
  HSTS: "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html",
  "Cryptographic Storage": "https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html",
  "Authentication": "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
  "Session Management": "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html",
  "Password Storage": "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html",
  SSRF: "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html",
  XXE: "https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html",
  Deserialization: "https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html",
  Logging: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html",
  CORS: "https://cheatsheetseries.owasp.org/cheatsheets/CORS_Cheat_Sheet.html",
  "File Upload": "https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html",
  "Threat Modeling": "https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html",
};

const OWASP_CATEGORY_TO_CHEATS = {
  "A01:2021": ["Access Control", "Authorization"],
  "A02:2021": ["Cryptographic Storage", "HSTS"],
  "A03:2021": ["SQL Injection", "Input Validation"],
  "A04:2021": ["Threat Modeling", "Authentication"], // guidance-oriented
  "A05:2021": ["Security Headers", "Content Security Policy", "HSTS", "CORS"],
  "A06:2021": [], // usually dependency hygiene—no specific cheat sheet
  "A07:2021": ["Authentication", "Password Storage", "Session Management"],
  "A08:2021": ["Deserialization", "File Upload"],
  "A09:2021": ["Logging"],
  "A10:2021": ["SSRF"],
};

export function getCheatSheetUrlsForOwaspCategory(owaspCategory) {
  if (!owaspCategory) return [];
  // Accept either "A01:2021" prefix or full name containing it
  const key = OWASP_TOP10_2021.find(({ id, name }) => {
    const v = String(owaspCategory).toLowerCase();
    return v.includes(id.toLowerCase()) || v.includes(name.toLowerCase());
  })?.id;
  const cheats = (key && OWASP_CATEGORY_TO_CHEATS[key]) || [];
  return cheats.map((c) => ({ title: c, url: CHEAT_SHEETS[c] })).filter((x) => !!x.url);
}

export function guessCheatSheetsFromFinding(finding) {
  const text = `${finding?.title || ""} ${finding?.description || ""} ${finding?.code_snippet || ""}`.toLowerCase();

  const hits = [];
  const push = (title) => {
    const url = CHEAT_SHEETS[title];
    if (url && !hits.find((h) => h.title === title)) hits.push({ title, url });
  };

  if (/xss|cross[-\s]?site\s*scripting|innerhtml|dangerouslysetinnerhtml/.test(text)) push("XSS Prevention");
  if (/sql|sequelize|query\(|execute\(|injection/.test(text)) push("SQL Injection");
  if (/jwt|session|cookie|auth|login|token/i.test(text)) push("Authentication");
  if (/cors|access-control-allow-origin/.test(text)) push("CORS");
  if (/csp|content-security-policy/.test(text)) push("Content Security Policy");
  if (/hsts|strict-transport-security/.test(text)) push("HSTS");
  if (/crypto|encrypt|hash|aes|rsa|bcrypt|argon/.test(text)) push("Cryptographic Storage");
  if (/ssrf|fetch\(|axios\(|http[s]?:\/\/.*internal|metadata\.googleapis/.test(text)) push("SSRF");
  if (/xxe|xmlparser|domparser|xml2js/.test(text)) push("XXE");
  if (/deserialize|serialization|pickle|marshal/.test(text)) push("Deserialization");
  if (/file\s*upload|multipart|form-data|content-type/.test(text)) push("File Upload");
  if (/log\(|console\.|logger|audit/.test(text)) push("Logging");
  if (/acl|access\s*control|authorization|role\s*check|idor|bypass/.test(text)) {
    push("Access Control");
    push("Authorization");
  }
  if (/validate|sanitize|schema|zod|joi|yup|validator/.test(text)) push("Input Validation");

  return hits;
}