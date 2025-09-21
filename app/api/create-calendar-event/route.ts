import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { date, time, summary, location, details } = await req.json();
    // Load service account credentials from environment variable
    // Parse service account credentials and restore newline characters
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
    if (credentials.private_key && typeof credentials.private_key === 'string') {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
    // Ensure required fields are present
    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Service account credentials missing client_email or private_key');
    }
    const auth = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/calendar']
    );
    await auth.authorize();
    const calendar = google.calendar({ version: 'v3', auth });

    // Construct start and end times (default 1hr duration)
    const baseStart = new Date(`${date}T${time}`);
    const start = new Date(baseStart.getTime() - 4 * 60 * 60 * 1000); // subtract 4 hours
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const event = {
      summary,
      location,
      description: details,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return NextResponse.json({ eventLink: response.data.htmlLink });
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
