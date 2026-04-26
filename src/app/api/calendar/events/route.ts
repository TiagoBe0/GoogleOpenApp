import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const accessToken = session.googleAccessToken;

  if (!accessToken) {
    return NextResponse.json(
      { error: "No hay token de Google. Inicia sesión con Google para ver tu calendario." },
      { status: 403 }
    );
  }

  const now = new Date().toISOString();
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", now);
  url.searchParams.set("maxResults", "10");
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ error: "Error al obtener eventos de Google Calendar", details: error }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
