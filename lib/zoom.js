// Zoom Server-to-Server OAuth — instant meeting creation

async function getAccessToken() {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const accountId = process.env.ZOOM_ACCOUNT_ID;

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom OAuth failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function createInstantMeeting({ topic }) {
  const token = await getAccessToken();

  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: topic || "Remagent Meeting",
      type: 1, // instant meeting
      settings: {
        host_video: true,
        participant_video: true,
        approval_type: 0,
        waiting_room: false,
        join_before_host: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom meeting creation failed: ${err}`);
  }

  const meeting = await res.json();

  return {
    meetingId: meeting.id,
    joinUrl: meeting.join_url,
    startUrl: meeting.start_url,
    password: meeting.password,
  };
}
