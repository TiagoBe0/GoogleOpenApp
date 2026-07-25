"use client";

import { useEffect, useState } from "react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  updatedAt: string;
  patient: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface ReviewsResponse {
  summary: {
    average: number;
    count: number;
  };
  reviews: Review[];
  myReview: Review | null;
}

interface Props {
  canReview?: boolean;
  title?: string;
}

const EMPTY_REVIEWS: ReviewsResponse = {
  summary: { average: 0, count: 0 },
  reviews: [],
  myReview: null,
};

function Stars({
  value,
  onChange,
  interactive = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  interactive?: boolean;
}) {
  return (
    <div className="flex items-center gap-1" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;

        if (!interactive) {
          return (
            <span key={star} className={`text-lg leading-none ${active ? "text-pending" : "text-line"}`}>
              ★
            </span>
          );
        }

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className={`text-2xl leading-none transition-colors ${active ? "text-pending" : "text-muted hover:text-pending"}`}
            aria-label={`Calificar con ${star} estrellas`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

function patientLabel(review: Review) {
  return review.patient.name || review.patient.email;
}

export default function ReviewsPanel({ canReview = false, title = "Calificaciones" }: Props) {
  const [data, setData] = useState<ReviewsResponse>(EMPTY_REVIEWS);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/reviews")
      .then((res) => res.json())
      .then((nextData: ReviewsResponse) => {
        if (cancelled) return;
        setData(nextData);
        setRating(nextData.myReview?.rating ?? 5);
        setComment(nextData.myReview?.comment ?? "");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshReviews() {
    const res = await fetch("/api/reviews");
    const nextData: ReviewsResponse = await res.json();
    setData(nextData);
    setRating(nextData.myReview?.rating ?? rating);
    setComment(nextData.myReview?.comment ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "No se pudo guardar la calificación");
        return;
      }

      await refreshReviews();
      setSuccess("Calificación guardada.");
    } finally {
      setSubmitting(false);
    }
  }

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: data.reviews.filter((review) => review.rating === star).length,
  }));

  return (
    <section className="bg-surface rounded-lg border border-line overflow-hidden">
      <div className="px-5 py-4 border-b border-line flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-ink text-sm">{title}</h2>
          <p className="text-xs text-muted mt-0.5">
            {loading ? "Cargando…" : `${data.summary.count} comentario${data.summary.count === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-ink">{data.summary.average || "-"}</p>
          <Stars value={Math.round(data.summary.average)} />
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {canReview && (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-line bg-surface-2 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink">
                {data.myReview ? "Tu calificación" : "Calificar a mi psicólogo"}
              </p>
              <Stars value={rating} onChange={setRating} interactive />
            </div>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError("");
                setSuccess("");
              }}
              rows={3}
              maxLength={1000}
              placeholder="Contá cómo fue tu experiencia…"
              className="w-full resize-none rounded-md border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            {success && <p className="text-sm text-primary-hi">{success}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hi disabled:bg-surface-2 disabled:text-muted"
            >
              {submitting ? "Guardando…" : data.myReview ? "Actualizar calificación" : "Enviar calificación"}
            </button>
          </form>
        )}

        {data.summary.count > 0 && (
          <div className="space-y-2">
            {distribution.map(({ star, count }) => {
              const width = data.summary.count === 0 ? 0 : Math.round((count / data.summary.count) * 100);
              return (
                <div key={star} className="grid grid-cols-[48px_1fr_28px] items-center gap-2 text-xs text-muted">
                  <span>{star} ★</span>
                  <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full rounded-full bg-pending" style={{ width: `${width}%` }} />
                  </div>
                  <span className="text-right">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-surface-2 animate-pulse" />
            <div className="h-16 rounded-lg bg-surface-2 animate-pulse" />
          </div>
        ) : data.reviews.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted">Todavía no hay calificaciones.</p>
        ) : (
          <div className="space-y-3">
            {data.reviews.map((review) => (
              <article key={review.id} className="rounded-lg border border-line px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{patientLabel(review)}</p>
                    <p className="text-xs text-muted">
                      {new Date(review.updatedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <Stars value={review.rating} />
                </div>
                {review.comment && <p className="mt-2 text-sm leading-6 text-muted">{review.comment}</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
