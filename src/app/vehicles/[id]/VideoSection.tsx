"use client";

import { useState } from "react";

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
}

interface Props {
  videos: Video[];
}

// Videos placeholder para o MVP
const PLACEHOLDER_VIDEOS: Video[] = [
  { id: "v1", title: "Walkaround Exterior", url: "", thumbnail: "" },
  { id: "v2", title: "Walkaround Exterior 2", url: "", thumbnail: "" },
  { id: "v3", title: "Walkaround Interior", url: "", thumbnail: "" },
  { id: "v4", title: "Walkaround Interior 2", url: "", thumbnail: "" },
];

export default function VideoSection({ videos }: Props) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const allVideos = videos.length > 0 ? videos : PLACEHOLDER_VIDEOS;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Vídeos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {allVideos.map((video) => (
          <div key={video.id}>
            {/* Thumbnail com play button */}
            <button
              onClick={() => setPlayingId(video.id)}
              className="relative w-full aspect-video bg-[#2d2d2d] rounded-lg overflow-hidden group"
            >
              {video.thumbnail ? (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <span className="text-4xl opacity-20">🎬</span>
                </div>
              )}
              
              {/* Title overlay */}
              <div className="absolute top-3 left-3 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
                {video.title}
              </div>

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-black/60 group-hover:bg-black/80 rounded-full flex items-center justify-center transition">
                  <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              {/* Duration badge */}
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                0:38
              </div>
            </button>
            {/* Title */}
            <p className="text-gray-300 text-sm mt-2 font-medium">{video.title}</p>
          </div>
        ))}
      </div>

      {/* Video Player Modal */}
      {playingId && (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
          <button
            onClick={() => setPlayingId(null)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition z-10"
          >
            ✕
          </button>
          <div className="w-full max-w-5xl aspect-video bg-[#111] rounded-lg flex items-center justify-center">
            {/* Title */}
            <div className="absolute top-4 left-4 text-white text-sm font-medium">
              {allVideos.find(v => v.id === playingId)?.title}
            </div>
            {/* Placeholder - em prod seria um <video> tag */}
            <div className="text-center">
              <span className="text-6xl opacity-30">🎬</span>
              <p className="text-gray-500 mt-4 text-sm">
                Player de vídeo — funcional com upload real
              </p>
            </div>
            {/* Fake controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center gap-3">
                <button className="text-white">▶</button>
                <button className="text-white">🔊</button>
                <div className="flex-1 h-1 bg-gray-700 rounded-full">
                  <div className="w-1/3 h-full bg-blue-500 rounded-full" />
                </div>
                <span className="text-white text-xs">0:31</span>
                <button className="text-white">⛶</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

