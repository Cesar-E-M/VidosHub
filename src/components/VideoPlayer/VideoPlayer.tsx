import React, { useCallback, useEffect, useRef, useState } from "react";
import { VideoControls } from "./VideoControl";

interface VideoPlayerProps {
  src: string;
  autoPlay?: boolean;
  showControls?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export const VideoPlayer = ({
  src,
  autoPlay = false,
  showControls = false,
  onPlayStateChange,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const handleTimeUpdate = () => setProgress(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (autoPlay && video.paused) {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          onPlayStateChange?.(true);
        })
        .catch((error) => {
          console.error("Error al reproducir:", error);
        });
    }
  }, [autoPlay, onPlayStateChange]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      onPlayStateChange?.(true);
    } else {
      video.pause();
      setIsPlaying(false);
      onPlayStateChange?.(false);
    }
  }, [onPlayStateChange]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!videoRef.current) return;

      const newVolume = parseFloat(e.target.value);
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    },
    []
  );

  const handlePlaybackRateChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!videoRef.current) return;

      const newPlaybackRate = parseFloat(e.target.value);
      videoRef.current.playbackRate = newPlaybackRate;
      setPlaybackRate(newPlaybackRate);
    },
    []
  );

  const toggleFullScreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }

    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!videoRef.current) return;

      const newProgress = parseFloat(e.target.value);
      videoRef.current.currentTime = newProgress;
      setProgress(newProgress);
    },
    []
  );

  return (
    <div className="relative border shadow-2xl shadow-black rounded-md overflow-hidden w-full h-full drop-shadow-sm group">
      <video
        src={src}
        className="w-auto h-auto object-cover"
        ref={videoRef}
        onClick={showControls ? togglePlay : undefined}
        muted={!showControls}
        loop={!showControls}
      />
      {showControls && (
        <VideoControls
          // Estados
          progress={progress}
          duration={duration}
          isPlaying={isPlaying}
          volume={volume}
          playbackRate={playbackRate}
          isFullscreen={isFullscreen}
          // Funciones del Reproductor
          togglePlay={togglePlay}
          handleVolumeChange={handleVolumeChange}
          handlePlaybackRateChange={handlePlaybackRateChange}
          toggleFullScreen={toggleFullScreen}
          handleProgressChange={handleProgressChange}
        />
      )}
    </div>
  );
};
