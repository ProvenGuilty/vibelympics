import { useTheme } from '../context/ThemeContext';
import { GeneratedMeme } from '../App';

interface MemeGalleryProps {
  memes: GeneratedMeme[];
}

// Text style for meme overlays
const memeTextStyle = {
  textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000'
};

// Template aspect ratios (width/height) for proper positioning
const TEMPLATE_ASPECTS: Record<string, number> = {
  drake: 1.0,           // Square
  expandingbrain: 0.57, // Tall (4 panels stacked)
  changemymind: 1.33,   // Landscape
  twobuttons: 0.75,     // Portrait
  thisisfine: 1.5,      // Wide landscape (2 panels)
  distracted: 1.5       // Wide landscape
};

// Template text positioning - percentages relative to the VISIBLE image area
const TEMPLATE_TEXT_ZONES: Record<string, {
  key: string;
  position: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  width: string;
  height?: string;
  textClassName: string;
  style?: React.CSSProperties;
}[]> = {
  drake: [
    { 
      key: 'Bad thing', 
      position: 'top-right',
      top: '5%', right: '2%', width: '48%', height: '40%',
      textClassName: 'text-white text-xs md:text-sm font-bold uppercase leading-tight text-center'
    },
    { 
      key: 'Good thing', 
      position: 'bottom-right',
      bottom: '5%', right: '2%', width: '48%', height: '40%',
      textClassName: 'text-white text-xs md:text-sm font-bold uppercase leading-tight text-center'
    }
  ],
  expandingbrain: [
    { 
      key: 'Basic', 
      position: 'panel-1',
      top: '1%', left: '1%', width: '48%', height: '23%',
      textClassName: 'text-white text-[9px] md:text-[10px] font-bold uppercase leading-tight text-center'
    },
    { 
      key: 'Better', 
      position: 'panel-2',
      top: '26%', left: '1%', width: '48%', height: '23%',
      textClassName: 'text-white text-[9px] md:text-[10px] font-bold uppercase leading-tight text-center'
    },
    { 
      key: 'Advanced', 
      position: 'panel-3',
      top: '51%', left: '1%', width: '48%', height: '23%',
      textClassName: 'text-white text-[9px] md:text-[10px] font-bold uppercase leading-tight text-center'
    },
    { 
      key: 'Galaxy brain', 
      position: 'panel-4',
      top: '76%', left: '1%', width: '48%', height: '23%',
      textClassName: 'text-white text-[9px] md:text-[10px] font-bold uppercase leading-tight text-center'
    }
  ],
  changemymind: [
    { 
      key: 'Hot take', 
      position: 'sign',
      bottom: '28%', right: '5%', width: '42%', height: '8%',
      textClassName: 'text-black text-[10px] md:text-xs font-bold leading-tight text-center',
      style: { textShadow: 'none' }
    }
  ],
  twobuttons: [
    { 
      key: 'Option A', 
      position: 'left-button',
      top: '3%', left: '10%', width: '35%', height: '15%',
      textClassName: 'text-white text-[9px] md:text-[10px] font-bold uppercase leading-tight text-center'
    },
    { 
      key: 'Option B', 
      position: 'right-button',
      top: '3%', right: '15%', width: '35%', height: '15%',
      textClassName: 'text-white text-[9px] md:text-[10px] font-bold uppercase leading-tight text-center'
    }
  ],
  thisisfine: [
    { 
      key: 'Situation', 
      position: 'top',
      top: '2%', left: '0', width: '100%',
      textClassName: 'text-white text-xs md:text-sm font-bold uppercase leading-tight text-center'
    },
    { 
      key: 'Response', 
      position: 'bottom',
      bottom: '2%', left: '0', width: '100%',
      textClassName: 'text-white text-xs md:text-sm font-bold uppercase leading-tight text-center'
    }
  ],
  distracted: [
    { 
      key: 'New shiny thing', 
      position: 'other-girl',
      top: '5%', left: '2%', width: '28%',
      textClassName: 'text-white text-[9px] md:text-[10px] font-bold uppercase leading-tight text-center'
    },
    { 
      key: 'You', 
      position: 'boyfriend',
      top: '5%', left: '38%', width: '24%',
      textClassName: 'text-white text-[9px] md:text-[10px] font-bold uppercase leading-tight text-center'
    },
    { 
      key: 'Current thing', 
      position: 'girlfriend',
      top: '5%', right: '2%', width: '28%',
      textClassName: 'text-white text-[9px] md:text-[10px] font-bold uppercase leading-tight text-center'
    }
  ]
};

// Meme card with proper text overlay positioning
function MemeCard({ meme, cardClass, isCyberpunk }: { 
  meme: GeneratedMeme; 
  cardClass: string; 
  isCyberpunk: boolean;
}) {
  const downloadMeme = () => {
    window.open(meme.imageUrl, '_blank');
  };

  const captions = meme.captions || {};
  const zones = TEMPLATE_TEXT_ZONES[meme.templateId || ''] || [];

  return (
    <div className={`rounded-xl overflow-hidden meme-card ${cardClass} transition-all duration-500`}>
      {/* Meme Image */}
      <div className="relative aspect-square bg-black">
        <img
          src={meme.imageUrl}
          alt="Generated meme"
          className="w-full h-full object-contain"
        />
        
        {/* Template-specific text overlay - uses absolute positioning within the container */}
        {meme.templateId && zones.map(zone => {
          const text = captions[zone.key];
          if (!text) return null;
          
          return (
            <div 
              key={zone.key}
              data-position={zone.position}
              className="absolute flex items-center justify-center p-1 pointer-events-none"
              style={{
                top: zone.top || 'auto',
                bottom: zone.bottom || 'auto', 
                left: zone.left || 'auto',
                right: zone.right || 'auto',
                width: zone.width,
                height: zone.height || 'auto',
              }}
            >
              <span 
                className={zone.textClassName}
                style={zone.style || memeTextStyle}
              >
                {text}
              </span>
            </div>
          );
        })}
        
        {/* AI-generated meme text overlay (top/bottom) */}
        {!meme.templateId && meme.topText && (
          <div className="absolute top-2 left-0 right-0 text-center">
            <span className="text-white text-xl font-bold uppercase px-2" style={memeTextStyle}>
              {meme.topText}
            </span>
          </div>
        )}
        {!meme.templateId && meme.bottomText && (
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span className="text-white text-xl font-bold uppercase px-2" style={memeTextStyle}>
              {meme.bottomText}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex gap-2">
          <button
            onClick={downloadMeme}
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
  );
}

export default function MemeGallery({ memes }: MemeGalleryProps) {
  const { isCyberpunk } = useTheme();

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
          <MemeCard 
            key={meme.id} 
            meme={meme} 
            cardClass={cardClass} 
            isCyberpunk={isCyberpunk} 
          />
        ))}
      </div>
    </div>
  );
}
