import { useTheme } from '../context/ThemeContext';
import { GeneratedMeme } from '../App';

interface MemeGalleryProps {
  memes: GeneratedMeme[];
}

export default function MemeGallery({ memes }: MemeGalleryProps) {
  const { isCyberpunk } = useTheme();

  const downloadMeme = (meme: GeneratedMeme) => {
    // Open in new tab - CORS prevents direct fetch from OpenAI blob storage
    window.open(meme.imageUrl, '_blank');
  };

  const cardClass = isCyberpunk
    ? 'bg-black/60 backdrop-blur-md border-2 border-fuchsia-500/50 shadow-[0_0_30px_rgba(255,0,255,0.2)]'
    : 'bg-slate-800 border border-slate-700';

  return (
    <div className="mt-8">
      <h2 className={`text-xl font-bold mb-6 ${isCyberpunk ? 'neon-text-magenta' : 'text-white'}`}>
        {isCyberpunk ? '🎮 G4LL3RY' : '🖼️ Generated Memes'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memes.map((meme) => (
          <div
            key={meme.id}
            className={`rounded-xl overflow-hidden meme-card ${cardClass} transition-all duration-500`}
          >
            {/* Meme Image */}
            <div className="relative aspect-square bg-black">
              <img
                src={meme.imageUrl}
                alt="Generated meme"
                className="w-full h-full object-contain"
              />
              
              {/* Text Overlay (if template) */}
              {meme.topText && (
                <div className="absolute top-2 left-0 right-0 text-center">
                  <span className="text-white text-xl font-bold uppercase px-2"
                    style={{ 
                      textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' 
                    }}>
                    {meme.topText}
                  </span>
                </div>
              )}
              {meme.bottomText && (
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="text-white text-xl font-bold uppercase px-2"
                    style={{ 
                      textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' 
                    }}>
                    {meme.bottomText}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4">
              <div className="flex gap-2">
                <button
                  onClick={() => downloadMeme(meme)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    isCyberpunk
                      ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/50'
                      : 'bg-violet-600 text-white hover:bg-violet-500'
                  }`}
                >
                  ⬇️ Download
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(meme.imageUrl)}
                  className={`py-2 px-4 rounded-lg font-medium transition-all ${
                    isCyberpunk
                      ? 'bg-fuchsia-500/30 border border-fuchsia-400 text-fuchsia-300 hover:bg-fuchsia-500/50'
                      : 'bg-slate-600 text-white hover:bg-slate-500'
                  }`}
                  title="Copy URL"
                >
                  📋
                </button>
              </div>
              
              {meme.template && (
                <div className={`mt-2 text-xs ${isCyberpunk ? 'text-fuchsia-400' : 'text-slate-400'}`}>
                  Template: {meme.template}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
