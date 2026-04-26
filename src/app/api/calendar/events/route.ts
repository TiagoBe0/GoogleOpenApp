import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

async function getAccessToken() {
  const session = await auth();
  if (!session) return { error: "No autenticado", status: 401 };
  if (!session.googleAccessToken) return { error: "Google Calendar no vinculado", status: 403 };
  return { token: session.googleAccessToken };
}

export async function GET(req: NextRequest) {
  const result = await getAccessToken();
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const { searchParams } = new URL(req.url);
  const timeMin = searchParams.get("timeMin") ?? new Date().toISOString();
  const timeMax = searchParams.get("timeMax");

  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", timeMin);
  if (timeMax) url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("maxResults", "50");
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.append("eventTypes", "default");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${result.token}` },
  });

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ error: "Error al obtener eventos", details: error }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const result = await getAccessToken();
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const body = await req.json();
  const { summary, description, startDateTime, endDateTime } = body;

  if (!summary || !startDateTime || !endDateTime) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const event = {
    summary,
    description: description ?? "",
    start: { dateTime: startDateTime, timeZone: "America/Argentina/Buenos_Aires" },
    end: { dateTime: endDateTime, timeZone: "America/Argentina/Buenos_Aires" },
  };

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${result.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ error: "Error al crear evento", details: error }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 201 });
}
