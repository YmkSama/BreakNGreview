'use client';

import { useEffect, useRef } from 'react';

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

export default function YouTubeEmbed({ youtubeId, playerRef, initialSeek }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let player;
    let cancelled = false;

    loadYouTubeAPI().then((YT) => {
      if (cancelled || !containerRef.current) return;
      player = new YT.Player(containerRef.current, {
        videoId: youtubeId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            playerRef.current = player;
            if (initialSeek) {
              try { player.seekTo(initialSeek, true); } catch (e) {}
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (player && typeof player.destroy === 'function') player.destroy();
      if (playerRef.current === player) playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId]);

  return (
    <div className="aspect-video rounded-2xl overflow-hidden shadow-sm bg-black">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
