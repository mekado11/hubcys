import React, { useState, useEffect, useRef } from 'react';
import { VideoProgress } from "@/entities/VideoProgress";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipForward, 
  SkipBack, 
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react";

export default function VideoPlayer({ 
  video, 
  onComplete, 
  onProgress,
  showTranscript = true,
  autoPlay = false 
}) {
  const videoRef = useRef(null);
  const [user, setUser] = useState(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Progress tracking
  const [watchedPercentage, setWatchedPercentage] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastSavedProgress, setLastSavedProgress] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);

  // Transcript state
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(false);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user && video) {
      loadVideoProgress();
    }
  }, [user, video]);

  const initializeUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadVideoProgress = async () => {
    try {
      const progressList = await VideoProgress.filter({
        company_id: user.company_id,
        user_email: user.email,
        video_id: video.id
      });
      
      if (progressList.length > 0) {
        const progress = progressList[0];
        setLastSavedProgress(progress.last_position_seconds);
        setIsCompleted(progress.completed);
        
        // Resume from last position if not completed
        if (!progress.completed && progress.last_position_seconds > 5) {
          if (videoRef.current) {
            videoRef.current.currentTime = progress.last_position_seconds;
          }
        }
      }
    } catch (error) {
      console.error("Error loading video progress:", error);
    }
  };

  const saveProgress = async (currentTimeSeconds, completed = false) => {
    if (!user || savingProgress) return;
    
    setSavingProgress(true);
    try {
      const progressData = {
        company_id: user.company_id,
        user_email: user.email,
        video_id: video.id,
        module_id: video.module_id,
        last_position_seconds: Math.floor(currentTimeSeconds),
        watch_time_seconds: Math.floor(currentTimeSeconds),
        completed,
        last_watched_date: new Date().toISOString(),
        ...(completed && { completion_date: new Date().toISOString() })
      };

      // Check if progress record exists
      const existingProgress = await VideoProgress.filter({
        company_id: user.company_id,
        user_email: user.email,
        video_id: video.id
      });

      if (existingProgress.length > 0) {
        await VideoProgress.update(existingProgress[0].id, progressData);
      } else {
        await VideoProgress.create(progressData);
      }

      if (onProgress) {
        onProgress(currentTimeSeconds, completed);
      }

      if (completed && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error saving video progress:", error);
    } finally {
      setSavingProgress(false);
    }
  };

  // Video event handlers
  const handleLoadedData = () => {
    setLoading(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      
      // Resume from last position
      if (lastSavedProgress > 5 && !isCompleted) {
        videoRef.current.currentTime = lastSavedProgress;
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      
      setCurrentTime(current);
      
      if (total > 0) {
        const percentage = (current / total) * 100;
        setWatchedPercentage(percentage);
        
        // Mark as completed if watched 90% or more
        if (percentage >= 90 && !isCompleted) {
          setIsCompleted(true);
          saveProgress(current, true);
        } else if (current - lastSavedProgress > 10) {
          // Save progress every 10 seconds
          setLastSavedProgress(current);
          saveProgress(current, false);
        }
      }
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleError = () => {
    setError("Failed to load video. Please try again.");
    setLoading(false);
  };

  // Control handlers
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (newTime) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skipForward = () => {
    handleSeek(Math.min(currentTime + 10, duration));
  };

  const skipBackward = () => {
    handleSeek(Math.max(currentTime - 10, 0));
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (newVolume) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  // Utility functions
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className="text-red-400 mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden">
      {/* Video Player */}
      <div className="relative bg-black">
        <video
          ref={videoRef}
          className="w-full aspect-video"
          onLoadedData={handleLoadedData}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onError={handleError}
          autoPlay={autoPlay}
          preload="metadata"
        >
          <source src={video.video_url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center text-white">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
              <p>Loading video...</p>
            </div>
          </div>
        )}

        {/* Custom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white text-sm font-mono">{formatTime(currentTime)}</span>
              <div className="flex-1">
                <Progress 
                  value={duration ? (currentTime / duration) * 100 : 0} 
                  className="h-2 cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const clickRatio = clickX / rect.width;
                    handleSeek(clickRatio * duration);
                  }}
                />
              </div>
              <span className="text-white text-sm font-mono">{formatTime(duration)}</span>
            </div>
            {/* Watched percentage */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Progress: {Math.round(watchedPercentage)}%</span>
              {isCompleted && (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
              {savingProgress && (
                <span className="flex items-center">
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Saving...
                </span>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayPause}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>

              {/* Skip Controls */}
              <Button
                variant="ghost"
                size="icon"
                onClick={skipBackward}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={skipForward}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted || volume === 0 ? 
                    <VolumeX className="w-4 h-4" /> : 
                    <Volume2 className="w-4 h-4" />
                  }
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Transcript Toggle */}
              {showTranscript && video.video_transcript && (
                <Button
                  variant="ghost"
                  onClick={() => setShowTranscriptPanel(!showTranscriptPanel)}
                  className="text-white hover:bg-white/20 text-sm"
                >
                  Transcript
                </Button>
              )}

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Panel */}
      {showTranscriptPanel && video.video_transcript && (
        <div className="bg-slate-800 p-4 max-h-64 overflow-y-auto">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Video Transcript
          </h3>
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {video.video_transcript}
          </div>
        </div>
      )}

      {/* Video Info */}
      <div className="p-4 bg-slate-800">
        <h3 className="text-white font-semibold mb-1">{video.video_title}</h3>
        {video.video_description && (
          <p className="text-gray-400 text-sm">{video.video_description}</p>
        )}
      </div>
    </div>
  );
}