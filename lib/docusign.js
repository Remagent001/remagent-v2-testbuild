import docusign from "docusign-esign";
import fs from "fs";
import path from "path";

const SCOPES = ["signature", "impersonation"];

// Get a DocuSign API client with JWT authentication
export async function getDocuSignClient() {
  const privateKey = fs.readFileSync(
    path.resolve(process.env.DOCUSIGN_PRIVATE_KEY_PATH || "./doc/docusign-private-key.pem"),
    "utf8"
  );

  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(process.env.DOCUSIGN_BASE_URL);
  apiClient.setOAuthBasePath(process.env.DOCUSIGN_AUTH_SERVER || "account-d.docusign.com");

  const results = await apiClient.requestJWTUserToken(
    process.env.DOCUSIGN_INTEGRATION_KEY,
    process.env.DOCUSIGN_USER_ID,
    SCOPES,
    privateKey,
    600 // token expires in 10 minutes
  );

  apiClient.addDefaultHeader("Authorization", "Bearer " + results.body.access_token);
  return apiClient;
}

// Create an envelope for MSA signing (Business User)
export async function createMsaEnvelope(apiClient, { signerEmail, signerName, companyName, address }) {
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  const envelopesApi = new docusign.EnvelopesApi(apiClient);

  // Read the MSA PDF
  const pdfPath = path.resolve("./doc/client.pdf");
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBytes.toString("base64");

  // Create the document
  const document = new docusign.Document();
  document.documentBase64 = pdfBase64;
  document.name = "Master Services Agreement";
  document.fileExtension = "pdf";
  document.documentId = "1";

  // Create signer with anchor-based tabs (matching the PDF anchor strings)
  const signer = new docusign.Signer();
  signer.email = signerEmail;
  signer.name = signerName;
  signer.recipientId = "1";
  signer.routingOrder = "1";
  signer.clientUserId = "1000"; // embedded signing

  // Signature tab
  const signHere = new docusign.SignHere();
  signHere.anchorString = "/sn1/";
  signHere.anchorUnits = "pixels";
  signHere.anchorXOffset = "0";
  signHere.anchorYOffset = "0";

  // Pre-fill text tabs
  const companyTab = new docusign.Text();
  companyTab.anchorString = "/company/";
  companyTab.anchorUnits = "pixels";
  companyTab.value = companyName || "";
  companyTab.locked = "false";

  const nameTab = new docusign.Text();
  nameTab.anchorString = "/name/";
  nameTab.anchorUnits = "pixels";
  nameTab.value = signerName;
  nameTab.locked = "false";

  const titleTab = new docusign.Text();
  titleTab.anchorString = "/title/";
  titleTab.anchorUnits = "pixels";
  titleTab.value = "";
  titleTab.locked = "false";

  const addrTab = new docusign.Text();
  addrTab.anchorString = "/addr/";
  addrTab.anchorUnits = "pixels";
  addrTab.value = address || "";
  addrTab.locked = "false";

  const dateTab = new docusign.DateSigned();
  dateTab.anchorString = "/date/";
  dateTab.anchorUnits = "pixels";

  const tabs = new docusign.Tabs();
  tabs.signHereTabs = [signHere];
  tabs.textTabs = [companyTab, nameTab, titleTab, addrTab];
  tabs.dateSignedTabs = [dateTab];
  signer.tabs = tabs;

  const recipients = new docusign.Recipients();
  recipients.signers = [signer];

  const envelopeDefinition = new docusign.EnvelopeDefinition();
  envelopeDefinition.emailSubject = "Remagent Master Services Agreement";
  envelopeDefinition.documents = [document];
  envelopeDefinition.recipients = recipients;
  envelopeDefinition.status = "sent";

  const envelope = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });
  return envelope.envelopeId;
}

// Create an envelope for Professional agreement
export async function createProfessionalEnvelope(apiClient, { signerEmail, signerName, address }) {
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  const envelopesApi = new docusign.EnvelopesApi(apiClient);

  const pdfPath = path.resolve("./doc/professional.pdf");
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBytes.toString("base64");

  const document = new docusign.Document();
  document.documentBase64 = pdfBase64;
  document.name = "Professional Services Agreement";
  document.fileExtension = "pdf";
  document.documentId = "1";

  const signer = new docusign.Signer();
  signer.email = signerEmail;
  signer.name = signerName;
  signer.recipientId = "1";
  signer.routingOrder = "1";
  signer.clientUserId = "1000";

  const signHere = new docusign.SignHere();
  signHere.anchorString = "/sn1/";
  signHere.anchorUnits = "pixels";

  const nameTab = new docusign.Text();
  nameTab.anchorString = "/name/";
  nameTab.anchorUnits = "pixels";
  nameTab.value = signerName;
  nameTab.locked = "false";

  const addrTab = new docusign.Text();
  addrTab.anchorString = "/addr/";
  addrTab.anchorUnits = "pixels";
  addrTab.value = address || "";
  addrTab.locked = "false";

  const dateTab = new docusign.DateSigned();
  dateTab.anchorString = "/date/";
  dateTab.anchorUnits = "pixels";

  const tabs = new docusign.Tabs();
  tabs.signHereTabs = [signHere];
  tabs.textTabs = [nameTab, addrTab];
  tabs.dateSignedTabs = [dateTab];
  signer.tabs = tabs;

  const recipients = new docusign.Recipients();
  recipients.signers = [signer];

  const envelopeDefinition = new docusign.EnvelopeDefinition();
  envelopeDefinition.emailSubject = "Remagent Professional Services Agreement";
  envelopeDefinition.documents = [document];
  envelopeDefinition.recipients = recipients;
  envelopeDefinition.status = "sent";

  const envelope = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });
  return envelope.envelopeId;
}

// Get the embedded signing URL for a user to sign in-browser
export async function getSigningUrl(apiClient, envelopeId, { signerEmail, signerName, returnUrl }) {
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  const envelopesApi = new docusign.EnvelopesApi(apiClient);

  const viewRequest = new docusign.RecipientViewRequest();
  viewRequest.authenticationMethod = "None";
  viewRequest.clientUserId = "1000";
  viewRequest.recipientId = "1";
  viewRequest.returnUrl = returnUrl;
  viewRequest.userName = signerName;
  viewRequest.email = signerEmail;

  const result = await envelopesApi.createRecipientView(accountId, envelopeId, { recipientViewRequest: viewRequest });
  return result.url;
}

// Check envelope status
export async function getEnvelopeStatus(apiClient, envelopeId) {
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  const envelopesApi = new docusign.EnvelopesApi(apiClient);
  const envelope = await envelopesApi.getEnvelope(accountId, envelopeId);
  return envelope.status; // "sent", "delivered", "completed", "declined", "voided"
}
