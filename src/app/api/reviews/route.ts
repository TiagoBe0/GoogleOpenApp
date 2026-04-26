import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function toReviewSummary(reviews: { rating: number }[]) {
  const count = reviews.length;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);

  return {
    count,
    average: count === 0 ? 0 : Number((total / count).toFixed(1)),
  };
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const userId = session.user.id;
  const isPatient = session.user.role === "PATIENT";

  const psychologistId = isPatient
    ? (
        await prisma.user.findUnique({
          where: { id: userId },
          select: { psychologistId: true },
        })
      )?.psychologistId
    : userId;

  if (!psychologistId) {
    return NextResponse.json({ summary: { average: 0, count: 0 }, reviews: [], myReview: null });
  }

  const reviews = await prisma.review.findMany({
    where: { psychologistId },
    include: {
      patient: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const myReview = isPatient
    ? reviews.find((review) => review.patientId === userId) ?? null
    : null;

  return NextResponse.json({
    summary: toReviewSummary(reviews),
    reviews,
    myReview,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "Solo los pacientes pueden calificar" }, { status: 403 });
  }

  const { rating, comment } = await req.json();
  const parsedRating = Number(rating);
  const cleanComment = typeof comment === "string" ? comment.trim() : "";

  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return NextResponse.json({ error: "La calificación debe estar entre 1 y 5 estrellas" }, { status: 400 });
  }

  if (cleanComment.length > 1000) {
    return NextResponse.json({ error: "El comentario no puede superar los 1000 caracteres" }, { status: 400 });
  }

  const patient = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { psychologistId: true },
  });

  if (!patient?.psychologistId) {
    return NextResponse.json({ error: "Necesitás tener un psicólogo vinculado para calificar" }, { status: 400 });
  }

  const review = await prisma.review.upsert({
    where: {
      patientId_psychologistId: {
        patientId: session.user.id,
        psychologistId: patient.psychologistId,
      },
    },
    create: {
      rating: parsedRating,
      comment: cleanComment || null,
      patientId: session.user.id,
      psychologistId: patient.psychologistId,
    },
    update: {
      rating: parsedRating,
      comment: cleanComment || null,
    },
    include: {
      patient: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json(review, { status: 201 });
}
