import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronLeft, Headphones } from "lucide-react";
import { type CSSProperties, type ComponentType, type ReactNode, type SVGProps } from "react";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { localizeText, type Locale } from "@/core/i18n/localized";
import { spotifyAlbumHref } from "@/core/http/spotify";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import type { HomeSlideDTO } from "@/public/features/home/types";

type Props = {
  slide: HomeSlideDTO;
  index: number;
  currentSlide: number;
  previousSlide: number | null;
  nextSlide: number;
  previousSlideIndex: number;
  direction: -1 | 1;
  locale: Locale;
  exploreLabel: string;
  listenLabel: string;
  openStreamingSlideId: string | null;
  readyVideoSlideIds: Set<string>;
  failedVideoSlideIds: Set<string>;
  firstSlideReady: boolean;
  onStreamingToggle: (id: string) => void;
  onStreamingClose: () => void;
  onVideoReady: (id: string) => void;
  onVideoFailure: (id: string) => void;
  onFirstImageLoaded: () => void;
};

export default function HomeSlide({
  slide, index, currentSlide, previousSlide, nextSlide, previousSlideIndex, direction, locale,
  exploreLabel, listenLabel, openStreamingSlideId, readyVideoSlideIds, failedVideoSlideIds,
  firstSlideReady, onStreamingToggle, onStreamingClose, onVideoReady, onVideoFailure, onFirstImageLoaded,
}: Props) {
  const isActive = index === currentSlide;
  const isLeaving = index === previousSlide;
  const isVisible = isActive || isLeaving;
  const shouldLoadMedia = isVisible || index === nextSlide || index === previousSlideIndex;
  const isStreamingOpen = openStreamingSlideId === slide.id;

  return <div
    className="absolute inset-0"
    aria-hidden={!isActive}
    style={{
      zIndex: isActive ? 10 : isLeaving ? 5 : 0,
      opacity: isVisible ? undefined : 0,
      pointerEvents: isActive ? "auto" : "none",
      animation: isActive
        ? `${direction === 1 ? "slideRevealReverse" : "slideReveal"} 1.1s cubic-bezier(0.76, 0, 0.24, 1) forwards`
        : isLeaving ? `${direction === 1 ? "slideExitReverse" : "slideExit"} 1.1s cubic-bezier(0.76, 0, 0.24, 1) forwards` : undefined,
      "--slide-accent": slide.color || BRAND_PINK_HEX,
    } as CSSProperties}
  >
    <div className="home-hero-shade" aria-hidden="true" />
    {shouldLoadMedia && slide.videoUrl && <video
      className="home-hero-video absolute inset-0 z-[1] h-full w-full object-cover"
      src={slide.videoUrl}
      data-slide-index={index}
      data-start-time={videoStartTime(slide.videoUrl)}
      muted playsInline autoPlay={index === 0} preload={index === 0 ? "auto" : "metadata"} fetchPriority={index === 0 ? "high" : undefined} aria-hidden="true"
      onCanPlay={() => onVideoReady(slide.id)}
      onError={() => onVideoFailure(slide.id)}
      style={{ opacity: readyVideoSlideIds.has(slide.id) ? 1 : 0, transition: "opacity 600ms ease" }}
    />}
    {shouldLoadMedia && slide.imageUrl && (index !== 0 || !slide.videoUrl || failedVideoSlideIds.has(slide.id)) && <Image
      src={slide.imageUrl} alt={`${slide.artistName} ${slide.title}`} fill sizes="100vw" preload={isActive}
      fetchPriority={isActive ? "high" : undefined} loading="eager" quality={80} onLoad={() => { if (index === 0) onFirstImageLoaded(); }}
      className="object-cover object-center" style={{ animation: isVisible ? "kenBurnsIn 8s ease-out forwards" : undefined }}
    />}
    {index === 0 && !firstSlideReady && <div className="home-hero-loading"><LoadingIndicator /></div>}
    <div className="home-hero-content"><div className="home-hero-copy">
      <span className="home-release-meta"><span style={{ color: "var(--slide-accent)" }}>{slide.artistName}</span>{slide.type && <><span style={{ color: "var(--alpha-ffffff-3)", margin: "0 0.4em" }}>·</span><span style={{ color: "var(--color-static-white)" }}>{slide.type}</span></>}</span>
      <h2 className="home-release-title" aria-label={slide.title}>{isVisible && slide.typoLogoUrl ? <span aria-hidden="true" className="home-typo-logo" style={{ WebkitMaskImage: `url("${slide.typoLogoUrl}")`, maskImage: `url("${slide.typoLogoUrl}")` }} /> : slide.title}</h2>
      {localizeText(slide.descriptions, locale) && <p className="home-release-description">{localizeText(slide.descriptions, locale)}</p>}
      <div className="home-release-actions">
        <Link href={`/${slide.artistSlug}/discography?album=${encodeURIComponent(slide.id)}`} prefetch={isActive ? null : false} className="home-primary-link">{exploreLabel}</Link>
        {(slide.youtubeUrl || slide.spotifyId) && <StreamingActions slide={slide} open={isStreamingOpen} listenLabel={listenLabel} onToggle={() => onStreamingToggle(slide.id)} onClose={onStreamingClose} />}
      </div>
    </div></div>
  </div>;
}

function StreamingActions({ slide, open, listenLabel, onToggle, onClose }: { slide: HomeSlideDTO; open: boolean; listenLabel: string; onToggle: () => void; onClose: () => void }) {
  return <div className={`home-stream-actions ${open ? "is-open" : ""}`}>
    <button type="button" aria-expanded={open} aria-controls={`streaming-${slide.id}`} onClick={onToggle} className={`home-listen-trigger ${open ? "is-open" : ""}`}><span className="home-listen-icon" aria-hidden="true"><Headphones /></span><span>{listenLabel}</span><ChevronDown className="home-listen-chevron" aria-hidden="true" /></button>
    <button type="button" aria-label="Close streaming options" onClick={onClose} className="home-listen-back"><ChevronLeft aria-hidden="true" /></button>
    <div id={`streaming-${slide.id}`} className={`home-stream-platforms ${open ? "is-open" : ""}`} aria-hidden={!open}>
      {slide.youtubeUrl && <StreamingLink href={slide.youtubeUrl} label={`${slide.title} on YouTube`} className="is-youtube" icon={YouTubeIcon}>YouTube</StreamingLink>}
      {spotifyAlbumHref(slide.spotifyId) && <StreamingLink href={spotifyAlbumHref(slide.spotifyId)!} label={`${slide.title} on Spotify`} className="is-spotify" icon={SpotifyIcon}>Spotify</StreamingLink>}
    </div>
  </div>;
}

function StreamingLink({ href, label, className, icon: Icon, children }: { href: string; label: string; className: string; icon: ComponentType<SVGProps<SVGSVGElement>>; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" aria-label={label} className={className}><Icon aria-hidden="true" /><span>{children}</span></a>;
}

function videoStartTime(videoUrl: string) { const start = Number(new URL(videoUrl).hash.match(/^#t=([\d.]+)/)?.[1]); return Number.isFinite(start) && start >= 0 ? start : 0; }
function YouTubeIcon({ className, ...props }: SVGProps<SVGSVGElement>) { return <svg viewBox="0 0 24 24" fill="none" className={className} {...props}><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8Z" /><path fill="var(--color-static-black)" d="m9.6 15.8 6.2-3.8-6.2-3.8v7.6Z" /></svg>; }
function SpotifyIcon({ className, ...props }: SVGProps<SVGSVGElement>) { return <svg viewBox="0 0 24 24" fill="none" className={className} {...props}><circle cx="12" cy="12" r="10" fill="currentColor" /><path d="M6.7 9.8c3.5-1 7.3-.6 10.4 1M7.3 13c3-0.8 6.3-.5 9 1M8 16c2.5-.6 5.1-.3 7.2.9" stroke="var(--color-static-black)" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
