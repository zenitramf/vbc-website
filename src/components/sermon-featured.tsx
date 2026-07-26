import { ArrowUpRight, CalendarDays, Play, User } from "lucide-react";
import { useState } from "react";

import { formatSermonDate } from "@/lib/sermons";
import type { Sermon } from "@/lib/sermons";

interface SermonFeaturedProps {
  sermon: Sermon;
}

const primaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-md bg-primary px-5 text-base font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50";

const secondaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-md border border-border bg-secondary px-5 text-base font-medium text-secondary-foreground transition-all hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-outline/50";

export default function SermonFeatured({ sermon }: SermonFeaturedProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const embedUrl = `https://www.youtube-nocookie.com/embed/${sermon.youtubeId}?autoplay=1&rel=0`;

  return (
    <article className="animate-fade-up overflow-hidden rounded-2xl border border-border bg-linear-to-br from-accent/30 via-card to-card shadow-sm">
      <div className="grid lg:grid-cols-5">
        <div className="relative aspect-video lg:col-span-3 lg:aspect-auto">
          {isPlaying ? (
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
              referrerPolicy="strict-origin-when-cross-origin"
              src={embedUrl}
              title={sermon.title}
            />
          ) : (
            <>
              <img
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
                fetchPriority="high"
                height={360}
                src={sermon.thumbnailUrl}
                width={480}
              />
              <button
                aria-label={`Play "${sermon.title}"`}
                className="group absolute inset-0 flex items-center justify-center bg-foreground/20 transition-colors hover:bg-foreground/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/50 focus-visible:ring-inset"
                onClick={() => setIsPlaying(true)}
                type="button"
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-300 group-hover:scale-110 md:size-20">
                  <Play
                    aria-hidden="true"
                    className="size-7 fill-current md:size-8"
                  />
                </span>
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col justify-center gap-5 p-6 md:p-10 lg:col-span-2">
          <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <span aria-hidden="true" className="h-px w-8 bg-primary" />
            Latest Message
          </p>
          <h2 className="font-display text-2xl font-bold leading-tight text-foreground md:text-3xl">
            {sermon.title}
          </h2>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays
                aria-hidden="true"
                className="size-4 text-primary"
              />
              {formatSermonDate(sermon.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <User aria-hidden="true" className="size-4 text-primary" />
              {sermon.speaker}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className={primaryButtonClass}
              onClick={() => setIsPlaying(true)}
              type="button"
            >
              <Play aria-hidden="true" className="size-4.5 fill-current" />
              Watch Now
            </button>
            <a
              aria-label={`Open "${sermon.title}" on YouTube in a new tab`}
              className={secondaryButtonClass}
              href={sermon.youtubeUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open in YouTube
              <ArrowUpRight aria-hidden="true" className="size-4.5" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
