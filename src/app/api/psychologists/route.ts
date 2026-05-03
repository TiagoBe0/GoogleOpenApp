import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const psychologists = await prisma.user.findMany({
    where: {
      role: "PSYCHOLOGIST",
      isActive: true,
      psychologistProfile: { isNot: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      psychologistProfile: {
        select: {
          slug: true,
          specialty: true,
          bio: true,
          city: true,
          country: true,
          consultationFee: true,
          currency: true,
          sessionDuration: true,
          yearsOfExperience: true,
          modalityOnline: true,
          modalityPresential: true,
          acceptsNewPatients: true,
        },
      },
      reviewsReceived: {
        select: { rating: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const result = psychologists.map((p) => {
    const reviews = p.reviewsReceived;
    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount) * 10) / 10
        : null;

    return {
      id: p.id,
      name: p.name,
      email: p.email,
      image: p.image,
      profile: p.psychologistProfile,
      reviewCount,
      averageRating,
    };
  });

  return NextResponse.json(result);
}
