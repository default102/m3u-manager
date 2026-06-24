'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, AlertCircle } from 'lucide-react';
import { Channel } from '@/types';
import Hls from 'hls.js';

interface ChannelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
}

export function ChannelPreviewModal({ isOpen, onClose, channel }: ChannelPreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !channel) return;

    setIsLoading(true);
    setErrorMsg(null);
    setIsPlaying(false);

    // 检查是否为组播地址
    const url = channel.url || '';
    if (url.startsWith('rtp://') || url.startsWith('udp://')) {
      setErrorMsg(
        '检测到该地址使用组播协议 (RTP/UDP)。浏览器底层网络限制无法直接接收组播包。请通过 udpxy 或内网代理将其转化为单播 HTTP 地址后再行播放。'
      );
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    // 超时自检逻辑（12秒未开始播放显示超时警告）
    const playTimeout = setTimeout(() => {
      if (isLoading && !errorMsg) {
        setErrorMsg(
          '连接加载超时。该直播源可能已下线，或由于 CORS（跨域资源共享）安全策略被浏览器拦截。请检查直播源状态或安装 CORS 允许插件后重试。'
        );
        setIsLoading(false);
      }
    }, 12000);

    const handleError = (type: string, details: string) => {
      console.error(`Playback Error Type: ${type}, Details: ${details}`);
      if (details === 'manifestLoadTimeOut' || details === 'levelLoadTimeOut') {
        setErrorMsg('直播源请求超时，请检查您的网络连接或源是否有效。');
      } else if (details === 'bufferStalledError') {
        // 缓冲停滞，通常只是网络卡顿，先不打断
      } else {
        setErrorMsg(
          '播放失败。可能该直播源已离线，或视频编码 (如 H.265/HEVC)、音频编码 (如 Dolby AC3/MP2) 浏览器无法解码。'
        );
      }
      setIsLoading(false);
    };

    if (Hls.isSupported()) {
      hls = new Hls({
        maxBufferSize: 0, // 降低缓冲延迟
        maxBufferLength: 5,
        manifestLoadingTimeOut: 10000,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        clearTimeout(playTimeout);
        video.play()
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch(() => {
            // 自动播放可能受浏览器策略限制
            setIsLoading(false);
          });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          clearTimeout(playTimeout);
          handleError(data.type, data.details);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              hls?.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // 兼容 Safari 原生播放
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        clearTimeout(playTimeout);
        video.play()
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch(() => {
            setIsLoading(false);
          });
      });

      video.addEventListener('error', () => {
        clearTimeout(playTimeout);
        setErrorMsg('Safari 原生解码失败，请确认直播源是否有效。');
        setIsLoading(false);
      });
    } else {
      clearTimeout(playTimeout);
      setErrorMsg('您的浏览器不支持 HLS 直播源解码。');
      setIsLoading(false);
    }

    return () => {
      clearTimeout(playTimeout);
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
      if (video) {
        video.src = '';
        video.load();
      }
    };
  }, [isOpen, channel]);

  if (!isOpen || !channel) return null;

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error(err));
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const requestFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) video.requestFullscreen();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="min-w-0">
            <h3 className="font-extrabold text-base text-slate-100 truncate flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>直播预览：{channel.name}</span>
            </h3>
            <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5 max-w-md">{channel.url}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Player Container */}
        <div className="flex-1 bg-black relative flex items-center justify-center min-h-[300px] aspect-video">
          <video 
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            onClick={togglePlay}
          />

          {/* Loading Mask */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6">
              <div className="w-10 h-10 border-4 border-emerald-600/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-semibold text-emerald-400">正在建立缓冲流...</p>
            </div>
          )}

          {/* Error Mask */}
          {errorMsg && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="text-red-500 mb-4" size={40} />
              <h4 className="text-sm font-bold text-slate-200 mb-2">无法播放该直播源</h4>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">{errorMsg}</p>
              
              {/* CORS bypass tip */}
              {!channel.url?.startsWith('rtp://') && !channel.url?.startsWith('udp://') && (
                <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] text-slate-400 text-left max-w-md leading-normal">
                  <span className="font-bold text-amber-500">💡 跨域排查小建议：</span>
                  <br />
                  由于浏览器 CORS 策略限制，通常需要为浏览器安装如 <b>Allow CORS: Access-Control-Allow-Origin</b> 插件并启用，即可在网页直接预览大部分被拦截的直播源。
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls Bar (Only show when play is active and no error) */}
        {!errorMsg && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={togglePlay} 
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                disabled={isLoading}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              
              <button 
                onClick={toggleMute} 
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>

            <button 
              onClick={requestFullscreen} 
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <Maximize size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
