'use client';

import { useEffect, useRef, useState } from 'react';

let apiPromise = null;
function loadYouTubeAPI() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') return;
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const existingCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (existingCallback) existingCallback();
      resolve(window.YT);
    };
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
  });
  return apiPromise;
}

// https://developers.google.com/youtube/iframe_api_reference#onError
function errorMessage(code) {
  if (code === 101 || code === 150) return 'The owner of this video has disabled embedding.';
  if (code === 100) return 'This video was removed or is private.';
  if (code === 153) return 'YouTube could not verify where this player is embedded.';
  return 'The video could not be played here.';
}

export default function YouTubeEmbed({ youtubeId, playerRef, initialSeek }) {
  const containerRef = useRef(null);
  const [errorCode, setErrorCode] = useState(null);
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    let player;
    let cancelled = false;
    setErrorCode(null);
    setStalled(false);
    // If the player never reports ready (blocked script, blocked iframe, etc.) say so instead of a black box.
    const stallTimer = setTimeout(() => { if (!playerRef.current) setStalled(true); }, 8000);

    loadYouTubeAPI().then((YT) => {
      if (cancelled || !containerRef.current) return;
      // YT.Player replaces the element it is given, so hand it a node React doesn't own.
      const mount = document.createElement('div');
      mount.className = 'w-full h-full';
      containerRef.current.appendChild(mount);

      player = new YT.Player(mount, {
        videoId: youtubeId,
        // The API defaults to a fixed 640x390 iframe, which overflows (and is clipped) on phones.
        width: '100%',
        height: '100%',
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1, // keep playback inline on iOS instead of forcing fullscreen
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            playerRef.current = player;
            setStalled(false);
            if (initialSeek) {
              try { player.seekTo(initialSeek, true); } catch (e) {}
            }
          },
          onError: (e) => setErrorCode(e.data),
        },
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(stallTimer);
      if (player && typeof player.destroy === 'function') player.destroy();
      if (playerRef.current === player) playerRef.current = null;
      if (containerRef.current) containerRef.current.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId]);

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden shadow-sm bg-black">
      <div ref={containerRef} className="w-full h-full" />
      {(errorCode || stalled) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 text-white text-center p-4 text-sm">
          <p>
            {errorCode
              ? errorMessage(errorCode)
              : "The video player didn’t load. A content blocker, private browsing, or a slow connection can cause this."}
          </p>
          <a
            href={`https://www.youtube.com/watch?v=${youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-white text-ink font-medium"
          >
            Watch on YouTube
          </a>
        </div>
      )}
    </div>
  );
}
