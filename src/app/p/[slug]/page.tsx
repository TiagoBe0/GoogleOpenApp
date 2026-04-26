import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BookingWidget from "@/components/BookingWidget";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params;

  const profile = await prisma.psychologistProfile.findUnique({
    where: { slug },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  if (!profile) notFound();

  const psy = profile.user;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <span className="font-bold text-gray-900 text-sm">PsicoApp</span>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex flex-col items-center text-center mb-5">
              {psy.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={psy.image} alt="" className="w-20 h-20 rounded-2xl object-cover mb-3" />
              ) : (
                <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-2xl mb-3">
                  {psy.name?.[0]?.toUpperCase() ?? "P"}
                </div>
              )}
              <h1 className="font-bold text-gray-900 text-lg">{psy.name}</h1>
              {profile.specialty && (
                <p className="text-sm text-indigo-600 font-medium mt-0.5">{profile.specialty}</p>
              )}
              {profile.licenseNumber && (
                <p className="text-xs text-gray-400 mt-0.5">Mat. {profile.licenseNumber}</p>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{profile.bio}</p>
            )}

            <div className="space-y-2 text-sm">
              {profile.consultationFee && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{profile.currency} {profile.consultationFee.toLocaleString()} · {profile.sessionDuration ?? 50} min</span>
                </div>
              )}
              {profile.city && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>{profile.city}{profile.country ? `, ${profile.country}` : ""}</span>
                </div>
              )}
              {profile.languages && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                  <span>{profile.languages}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {profile.modalityOnline && (
                <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg">Online</span>
              )}
              {profile.modalityPresential && (
                <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-lg">Presencial</span>
              )}
              {profile.yearsOfExperience && (
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg">
                  {profile.yearsOfExperience} años de exp.
                </span>
              )}
            </div>

            {(profile.website || profile.instagram || profile.linkedin) && (
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-indigo-600 transition-colors">Web</a>
                )}
                {profile.instagram && (
                  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-indigo-600 transition-colors">Instagram</a>
                )}
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-indigo-600 transition-colors">LinkedIn</a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Booking widget */}
        <div className="lg:col-span-3">
          <BookingWidget
            psychologistId={psy.id}
            psychologistName={psy.name ?? ""}
            fee={profile.consultationFee ?? 0}
            currency={profile.currency ?? "ARS"}
            duration={profile.sessionDuration ?? 50}
            acceptsNewPatients={profile.acceptsNewPatients}
          />
        </div>
      </main>
    </div>
  );
}
