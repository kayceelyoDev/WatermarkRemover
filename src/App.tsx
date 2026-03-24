import React, { useState } from 'react';
import { Download, Link as LinkIcon, Loader2, AlertCircle, CheckCircle2, Video, Music, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TikTokData {
  id: string;
  title: string;
  cover: string;
  videoUrl: string;
  music: string;
  author: {
    nickname: string;
    uniqueId: string;
    avatar: string;
  };
}

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<TikTokData | null>(null);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setVideoData(null);

    try {
      // Ensure we use the full origin for the fetch call to avoid "pattern mismatch" errors
      const apiUrl = new URL('/api/download', window.location.origin).href;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        // Extract the title or first bit of text from the HTML to show the user
        const errorSnippet = text.match(/<title>(.*?)<\/title>/)?.[1] || text.substring(0, 150).replace(/<[^>]*>/g, '').trim();
        throw new Error(`Server Error (${response.status}): ${errorSnippet || 'Empty response'}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setVideoData(data);
    } catch (err: any) {
      console.error("Download error:", err);
      setError(err.name === 'TypeError' ? 'Network error or invalid URL pattern. Please check your connection.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = (videoUrl: string, filename: string) => {
    try {
      const origin = window.location.origin;
      const proxyUrl = `${origin}/api/proxy-download?url=${encodeURIComponent(videoUrl)}&filename=${encodeURIComponent(filename)}`;
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = filename;
      link.target = "_blank"; // Fallback for some browsers
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Trigger download error:", err);
      window.open(videoUrl, '_blank'); // Ultimate fallback
    }
  };

  return (
    <div className="min-h-screen bg-[#010101] text-white font-sans selection:bg-[#FE2C55] selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FE2C55] opacity-10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#25F4EE] opacity-10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-24">
        {/* Header */}
        <header className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl border border-white/10 mb-6">
              <Video className="w-8 h-8 text-[#FE2C55]" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
              TIKTOK <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FE2C55] to-[#25F4EE]">SAVER</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl font-medium max-w-xl mx-auto">
              Download any TikTok video without watermark in high quality. Just paste the link and save.
            </p>
          </motion.div>
        </header>

        {/* Input Section */}
        <section className="mb-12">
          <motion.form
            onSubmit={handleDownload}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FE2C55] to-[#25F4EE] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex flex-col md:flex-row gap-3 bg-[#121212] p-2 rounded-2xl border border-white/10">
              <div className="flex-1 flex items-center px-4 gap-3">
                <LinkIcon className="w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Paste TikTok video link here..."
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-600 py-4 text-lg"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Get Video
                  </>
                )}
              </button>
            </div>
          </motion.form>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 flex items-center gap-2 text-[#FE2C55] bg-[#FE2C55]/10 p-4 rounded-xl border border-[#FE2C55]/20"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Result Section */}
        <AnimatePresence>
          {videoData && (
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="grid md:grid-cols-2 gap-8 bg-[#121212] p-6 md:p-8 rounded-3xl border border-white/10"
            >
              <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-white/5 shadow-2xl">
                <img
                  src={videoData.cover}
                  alt={videoData.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={videoData.author.avatar}
                      alt={videoData.author.nickname}
                      className="w-10 h-10 rounded-full border-2 border-[#FE2C55]"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="font-bold text-sm">@{videoData.author.uniqueId}</p>
                      <p className="text-xs text-gray-300">{videoData.author.nickname}</p>
                    </div>
                  </div>
                  <p className="text-sm line-clamp-2 text-gray-200">{videoData.title}</p>
                </div>
              </div>

              <div className="flex flex-col justify-center space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-[#25F4EE]" />
                    Video Ready!
                  </h2>
                  <p className="text-gray-400">Your video has been processed and is ready for download without watermark.</p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => triggerDownload(videoData.videoUrl, `tiktok_${videoData.id}.mp4`)}
                    className="w-full bg-[#FE2C55] hover:bg-[#E0244D] text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#FE2C55]/20"
                  >
                    <Download className="w-6 h-6" />
                    Download Video (No WM)
                  </button>

                  <a
                    href={videoData.music}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 border border-white/10"
                  >
                    <Music className="w-5 h-5" />
                    Download Audio
                  </a>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{videoData.author.nickname}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      <span>HD Quality</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-24 text-center text-gray-600 text-sm">
          <p>© 2026 TikTok Saver. Built for personal use only.</p>
          <p className="mt-2">Please respect creators' rights and copyright laws.</p>
        </footer>
      </main>
    </div>
  );
}
