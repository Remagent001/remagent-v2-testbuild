import fs from "fs";
import path from "path";
import crypto from "crypto";

// Build JWT for DocuSign authentication
function buildJwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ typ: "JWT", alg: "RS256" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: process.env.DOCUSIGN_INTEGRATION_KEY,
    sub: process.env.DOCUSIGN_USER_ID,
    aud: process.env.DOCUSIGN_AUTH_SERVER || "account-d.docusign.com",
    iat: now,
    exp: now + 600,
    scope: "signature impersonation",
  })).toString("base64url");

  const privateKey = fs.readFileSync(
    path.resolve(process.env.DOCUSIGN_PRIVATE_KEY_PATH || "./doc/docusign-private-key.pem"),
    "utf8"
  );

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(privateKey, "base64url");

  return `${header}.${payload}.${signature}`;
}

// Get access token from DocuSign
async function getAccessToken() {
  const jwt = buildJwt();
  const authServer = process.env.DOCUSIGN_AUTH_SERVER || "account-d.docusign.com";

  const res = await fetch(`https://${authServer}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DocuSign auth failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

// API helper
async function docuSignApi(method, endpoint, body = null) {
  const token = await getAccessToken();
  const baseUrl = process.env.DOCUSIGN_BASE_URL || "https://demo.docusign.net/restapi";
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  const url = `${baseUrl}/v2.1/accounts/${accountId}${endpoint}`;

  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DocuSign API ${method} ${endpoint}: ${res.status} ${err}`);
  }
  return res.json();
}

// Create an envelope for MSA signing (Business User)
export async function createMsaEnvelope({ signerEmail, signerName, companyName, address }) {
  const pdfPath = path.resolve("./doc/client.pdf");
  const pdfBase64 = fs.readFileSync(pdfPath).toString("base64");

  const envelope = await docuSignApi("POST", "/envelopes", {
    emailSubject: "Remagent Master Services Agreement",
    documents: [{
      documentBase64: pdfBase64,
      name: "Master Services Agreement",
      fileExtension: "pdf",
      documentId: "1",
    }],
    recipients: {
      signers: [{
        email: signerEmail,
        name: signerName,
        recipientId: "1",
        routingOrder: "1",
        clientUserId: "1000",
        tabs: {
          signHereTabs: [{ anchorString: "/sn1/", anchorUnits: "pixels", tabLabel: "signature" }],
          textTabs: [
            { anchorString: "/company/", anchorUnits: "pixels", tabLabel: "company", value: companyName || "", locked: "false" },
            { anchorString: "/name/", anchorUnits: "pixels", tabLabel: "name", value: signerName, locked: "false" },
            { anchorString: "/title/", anchorUnits: "pixels", tabLabel: "title", value: "", locked: "false" },
            { anchorString: "/addr/", anchorUnits: "pixels", tabLabel: "address", value: address || "", locked: "false" },
          ],
          dateSignedTabs: [{ anchorString: "/date/", anchorUnits: "pixels", tabLabel: "dateSigned" }],
        },
      }],
    },
    status: "sent",
  });

  return envelope.envelopeId;
}

// Create an envelope for Professional agreement
export async function createProfessionalEnvelope({ signerEmail, signerName, address }) {
  const pdfPath = path.resolve("./doc/professional.pdf");
  const pdfBase64 = fs.readFileSync(pdfPath).toString("base64");

  const envelope = await docuSignApi("POST", "/envelopes", {
    emailSubject: "Remagent Professional Services Agreement",
    documents: [{
      documentBase64: pdfBase64,
      name: "Professional Services Agreement",
      fileExtension: "pdf",
      documentId: "1",
    }],
    recipients: {
      signers: [{
        email: signerEmail,
        name: signerName,
        recipientId: "1",
        routingOrder: "1",
        clientUserId: "1000",
        tabs: {
          signHereTabs: [{ anchorString: "/sn1/", anchorUnits: "pixels" }],
          textTabs: [
            { anchorString: "/name/", anchorUnits: "pixels", value: signerName, locked: "false" },
            { anchorString: "/addr/", anchorUnits: "pixels", value: address || "", locked: "false" },
          ],
          dateSignedTabs: [{ anchorString: "/date/", anchorUnits: "pixels" }],
        },
      }],
    },
    status: "sent",
  });

  return envelope.envelopeId;
}

// Get the embedded signing URL
export async function getSigningUrl(envelopeId, { signerEmail, signerName, returnUrl }) {
  const result = await docuSignApi("POST", `/envelopes/${envelopeId}/views/recipient`, {
    authenticationMethod: "None",
    clientUserId: "1000",
    recipientId: "1",
    returnUrl,
    userName: signerName,
    email: signerEmail,
  });

  return result.url;
}

// Check envelope status
export async function getEnvelopeStatus(envelopeId) {
  const envelope = await docuSignApi("GET", `/envelopes/${envelopeId}`);
  return envelope.status;
}
