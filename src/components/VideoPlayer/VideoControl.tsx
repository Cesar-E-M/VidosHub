import { BsPauseFill, BsFillPlayFill } from "react-icons/bs";
import { MdFullscreen } from "react-icons/md";

const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

interface VideoControlsProps {
  progress: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  isFullscreen: boolean;
  togglePlay: () => void;
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePlaybackRateChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  toggleFullScreen: () => void;
  handleProgressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const VideoControls = ({
  progress,
  duration,
  isPlaying,
  volume,
  playbackRate,
  togglePlay,
  handleVolumeChange,
  handlePlaybackRateChange,
  toggleFullScreen,
  handleProgressChange,
}: VideoControlsProps) => {
  return (
    <div
      className={`absolute bottom-0 left-0 w-full p-2 sm:p-4 flex flex-col bg-black bg-opacity-75 ${
        isPlaying ? "hidden group-hover:flex" : ""
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full mb-2 sm:mb-0 sm:hidden">
        <div className="relative w-full h-1 bg-gray-600 rounded-full">
          <input
            type="range"
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            min="0"
            max={duration}
            step={1}
            value={progress}
            onChange={handleProgressChange}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
            style={{ width: `${(progress / duration) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
        <button
          className="text-white focus:outline-none cursor-pointer shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
        >
          {isPlaying ? (
            <BsPauseFill size={20} className="sm:w-6 sm:h-6" />
          ) : (
            <BsFillPlayFill size={20} className="sm:w-6 sm:h-6" />
          )}
        </button>

        <div className="hidden sm:flex items-center flex-1">
          <span className="text-white mr-2 text-sm">
            {formatTime(progress)}
          </span>
          <div className="relative flex-1 max-w-md h-1.5 bg-gray-600 rounded-full mr-2">
            <input
              type="range"
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              min="0"
              max={duration}
              step={1}
              value={progress}
              onChange={handleProgressChange}
              onClick={(e) => e.stopPropagation()}
            />
            <div
              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
              style={{ width: `${(progress / duration) * 100}%` }}
            ></div>
          </div>
          <span className="text-white mr-2 text-sm">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex sm:hidden items-center text-xs text-white shrink-0">
          <span>{formatTime(progress)}</span>
          <span className="mx-1">/</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <input
            type="range"
            className="w-16 h-1.5 bg-gray-600 rounded-full cursor-pointer"
            min={0}
            max={1}
            step={0.1}
            value={volume}
            onChange={handleVolumeChange}
            onClick={(e) => e.stopPropagation()}
          />
          <select
            className="bg-black text-white px-2 py-1 rounded-md focus:outline-none text-sm cursor-pointer"
            value={playbackRate}
            onChange={handlePlaybackRateChange}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>

        <div className="hidden sm:flex md:hidden">
          <select
            className="bg-black text-white px-1.5 py-1 rounded-md focus:outline-none text-xs cursor-pointer"
            value={playbackRate}
            onChange={handlePlaybackRateChange}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>

        <button
          className="text-white focus:outline-none cursor-pointer shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            toggleFullScreen();
          }}
        >
          <MdFullscreen size={20} className="sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
};
