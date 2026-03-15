import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sns = new SNSClient({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Format phone to E.164 (+1XXXXXXXXXX)
function formatPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.startsWith("+")) return phone;
  return null;
}

export async function sendSms(phone, message) {
  const formatted = formatPhone(phone);
  if (!formatted) return false;

  try {
    await sns.send(
      new PublishCommand({
        PhoneNumber: formatted,
        Message: `${message}\n\n— Remagent`,
        MessageAttributes: {
          "AWS.SNS.SMS.SMSType": {
            DataType: "String",
            StringValue: "Transactional",
          },
        },
      })
    );
    return true;
  } catch (err) {
    console.error("SMS send error:", err.message);
    return false;
  }
}

// Pre-built notification messages
export async function notifyInviteReceived(phone, { businessName, jobTitle }) {
  return sendSms(
    phone,
    `You've been invited to apply for "${jobTitle}" by ${businessName}. Log in to view: https://remagentemploymentprofessionals.com/invitations`
  );
}

export async function notifyInviteAccepted(phone, { professionalName, jobTitle }) {
  return sendSms(
    phone,
    `${professionalName} accepted your invite for "${jobTitle}". View details: https://remagentemploymentprofessionals.com/invites`
  );
}

export async function notifyInviteDeclined(phone, { professionalName, jobTitle }) {
  return sendSms(
    phone,
    `${professionalName} declined your invite for "${jobTitle}". View details: https://remagentemploymentprofessionals.com/invites`
  );
}

export async function notifyNewMessage(phone, { senderName, jobTitle }) {
  return sendSms(
    phone,
    `New message from ${senderName} regarding "${jobTitle}". View: https://remagentemploymentprofessionals.com/invitations`
  );
}
