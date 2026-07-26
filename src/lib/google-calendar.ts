export interface UpcomingEvent {
  allDay: boolean;
  endsAt: string;
  id: string;
  location?: string;
  startsAt: string;
  title: string;
}

interface CalendarCredentials {
  client_email: string;
  private_key: string;
  private_key_id?: string;
  token_uri?: string;
}

interface GoogleCalendarEvent {
  attendees?: { email?: string }[];
  end?: { date?: string; dateTime?: string };
  id?: string;
  location?: string;
  recurringEventId?: string;
  start?: { date?: string; dateTime?: string };
  status?: string;
  summary?: string;
}

interface UpcomingCalendarEvent {
  event: UpcomingEvent;
  recurringEventId?: string;
}

interface GoogleCalendarEventsResponse {
  items?: GoogleCalendarEvent[];
}

interface GoogleTokenResponse {
  access_token?: string;
}

interface GoogleCalendarEnv {
  GOOGLE_MINISTRY_CAL?: string;
  GOOGLE_SERVICE_ACCOUNT_JSON?: string;
}

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const EVENT_LIMIT = 5;
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const INVITED_EMAIL = "fresnovictory@gmail.com";

const base64UrlEncode = (value: string | Uint8Array): string => {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
};

const base64Decode = (value: string): ArrayBuffer => {
  const binary = atob(value.replaceAll(/\s/g, ""));
  const bytes = Uint8Array.from(
    binary,
    (character) => character.codePointAt(0) ?? 0
  );

  return bytes.buffer;
};

const getCredentials = (serviceAccountJson: string): CalendarCredentials => {
  let credentials: CalendarCredentials;

  try {
    credentials = JSON.parse(serviceAccountJson) as CalendarCredentials;
  } catch {
    throw new Error("The Google service-account credentials are invalid.");
  }

  if (!(credentials.client_email && credentials.private_key)) {
    throw new Error("The Google service-account credentials are incomplete.");
  }

  return credentials;
};

const createUnsignedToken = (credentials: CalendarCredentials): string => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    ...(credentials.private_key_id ? { kid: credentials.private_key_id } : {}),
    typ: "JWT",
  };
  const claims = {
    aud: credentials.token_uri ?? GOOGLE_TOKEN_URL,
    exp: issuedAt + 3600,
    iat: issuedAt,
    iss: credentials.client_email,
    scope: CALENDAR_SCOPE,
  };

  return `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claims))}`;
};

const importPrivateKey = (privateKey: string): Promise<CryptoKey> => {
  const keyData = privateKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "");

  return crypto.subtle.importKey(
    "pkcs8",
    base64Decode(keyData),
    { hash: "SHA-256", name: "RSASSA-PKCS1-v1_5" },
    false,
    ["sign"]
  );
};

const createSignedToken = async (
  credentials: CalendarCredentials
): Promise<string> => {
  const unsignedToken = createUnsignedToken(credentials);
  const key = await importPrivateKey(credentials.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedToken)
  );

  return `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`;
};

const requestAccessToken = async (
  signedToken: string,
  tokenUrl: string
): Promise<string> => {
  const tokenResponse = await fetch(tokenUrl, {
    body: new URLSearchParams({
      assertion: signedToken,
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
  });

  if (!tokenResponse.ok) {
    throw new Error("Google rejected the service-account credentials.");
  }

  const { access_token: accessToken } =
    (await tokenResponse.json()) as GoogleTokenResponse;

  if (!accessToken) {
    throw new Error("Google did not return an access token.");
  }

  return accessToken;
};

const getAccessToken = async (serviceAccountJson: string): Promise<string> => {
  const credentials = getCredentials(serviceAccountJson);
  const signedToken = await createSignedToken(credentials);

  return requestAccessToken(
    signedToken,
    credentials.token_uri ?? GOOGLE_TOKEN_URL
  );
};

const getEventTime = (
  eventTime: GoogleCalendarEvent["start"]
): { allDay: boolean; value: string } | undefined => {
  if (!eventTime) {
    return undefined;
  }

  if (eventTime.dateTime) {
    return { allDay: false, value: eventTime.dateTime };
  }

  if (eventTime.date) {
    return { allDay: true, value: eventTime.date };
  }

  return undefined;
};

const isInvited = (event: GoogleCalendarEvent): boolean =>
  event.attendees?.some(
    ({ email }) => email?.toLowerCase() === INVITED_EMAIL
  ) ?? false;

const toUpcomingEvent = (
  event: GoogleCalendarEvent
): UpcomingCalendarEvent | undefined => {
  const startsAt = getEventTime(event.start);
  const endsAt = getEventTime(event.end);

  if (!(event.id && startsAt && endsAt)) {
    return undefined;
  }

  return {
    event: {
      allDay: startsAt.allDay,
      endsAt: endsAt.value,
      id: event.id,
      ...(event.location ? { location: event.location } : {}),
      startsAt: startsAt.value,
      title: event.summary?.trim() || "Church Event",
    },
    ...(event.recurringEventId
      ? { recurringEventId: event.recurringEventId }
      : {}),
  };
};

const removeConsecutiveRecurringEvents = (
  events: UpcomingCalendarEvent[]
): UpcomingCalendarEvent[] => {
  let previousRecurringEventId: string | undefined;

  return events.filter((event) => {
    const isConsecutiveRepeat =
      event.recurringEventId &&
      event.recurringEventId === previousRecurringEventId;

    previousRecurringEventId = event.recurringEventId;
    return !isConsecutiveRepeat;
  });
};

const createEventsUrl = (calendarId: string): URL => {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  );

  url.search = new URLSearchParams({
    fields:
      "items(id,status,summary,start,end,location,recurringEventId,attendees(email))",
    maxResults: "2500",
    orderBy: "startTime",
    q: INVITED_EMAIL,
    singleEvents: "true",
    timeMin: new Date().toISOString(),
  }).toString();

  return url;
};

const getCalendarItems = async (
  accessToken: string,
  calendarId: string
): Promise<GoogleCalendarEvent[]> => {
  const calendarResponse = await fetch(createEventsUrl(calendarId), {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  if (!calendarResponse.ok) {
    throw new Error("Google Calendar could not return upcoming events.");
  }

  const { items = [] } =
    (await calendarResponse.json()) as GoogleCalendarEventsResponse;

  return items;
};

const getCalendarConfiguration = ({
  GOOGLE_MINISTRY_CAL: calendarId,
  GOOGLE_SERVICE_ACCOUNT_JSON: serviceAccountJson,
}: GoogleCalendarEnv): { calendarId: string; serviceAccountJson: string } => {
  if (!calendarId) {
    throw new Error("GOOGLE_MINISTRY_CAL is not configured.");
  }

  if (!serviceAccountJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured.");
  }

  return { calendarId, serviceAccountJson };
};

export const getUpcomingMinistryEvents = async (
  environment: GoogleCalendarEnv
): Promise<UpcomingEvent[]> => {
  const { calendarId, serviceAccountJson } =
    getCalendarConfiguration(environment);
  const accessToken = await getAccessToken(serviceAccountJson);
  const events = await getCalendarItems(accessToken, calendarId);

  const upcomingEvents = events
    .filter((event) => event.status !== "cancelled" && isInvited(event))
    .flatMap((event) => {
      const upcomingEvent = toUpcomingEvent(event);
      return upcomingEvent ? [upcomingEvent] : [];
    });

  return removeConsecutiveRecurringEvents(upcomingEvents)
    .map(({ event }) => event)
    .slice(0, EVENT_LIMIT);
};
