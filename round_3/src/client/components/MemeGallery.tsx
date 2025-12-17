import React, { useState } from 'react';
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

// Helper function to wrap text within a max width
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

// Helper function to get proxied image URL for CORS-blocked images
function getProxiedImageUrl(url: string): string {
  // Check if it's an external URL that needs proxying
  if (url.includes('oaidalleapiprodscus.blob.core.windows.net') || 
      url.includes('i.imgflip.com')) {
    return `/api/meme/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

// Helper function to download a meme with text overlay baked in
async function downloadMemeAsImage(meme: GeneratedMeme): Promise<void> {
  const zones = TEMPLATE_TEXT_ZONES[meme.templateId || ''] || [];
  const captions = meme.captions || {};

  // Create canvas and draw image + text manually to handle CORS
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Load image - use proxy for external images to avoid CORS
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  const imageUrl = getProxiedImageUrl(meme.imageUrl);
  
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });

  // Set canvas size (use 2x for high quality)
  const scale = 2;
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  ctx.scale(scale, scale);

  // Draw black background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, img.width, img.height);

  // Draw image
  ctx.drawImage(img, 0, 0, img.width, img.height);

  // Configure text style
  const fontSize = Math.max(20, img.width / 18);
  ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = fontSize / 10;
  ctx.lineJoin = 'round';

  // Draw top text (AI-generated memes) with wrapping
  if (!meme.templateId && meme.topText) {
    const maxWidth = img.width * 0.9;
    const lines = wrapText(ctx, meme.topText.toUpperCase(), maxWidth);
    const lineHeight = fontSize * 1.1;
    let y = fontSize + 10;
    
    for (const line of lines) {
      ctx.strokeText(line, img.width / 2, y);
      ctx.fillText(line, img.width / 2, y);
      y += lineHeight;
    }
  }

  // Draw bottom text (AI-generated memes) with wrapping
  if (!meme.templateId && meme.bottomText) {
    const maxWidth = img.width * 0.9;
    const lines = wrapText(ctx, meme.bottomText.toUpperCase(), maxWidth);
    const lineHeight = fontSize * 1.1;
    let y = img.height - 15 - (lines.length - 1) * lineHeight;
    
    for (const line of lines) {
      ctx.strokeText(line, img.width / 2, y);
      ctx.fillText(line, img.width / 2, y);
      y += lineHeight;
    }
  }

  // Draw template captions with wrapping
  if (meme.templateId && zones.length > 0) {
    const smallFontSize = Math.max(12, img.width / 30);
    ctx.font = `bold ${smallFontSize}px Impact, Arial Black, sans-serif`;
    ctx.lineWidth = smallFontSize / 10;

    zones.forEach(zone => {
      const text = captions[zone.key];
      if (!text) return;

      // Calculate zone dimensions
      const zoneWidth = parseFloat(zone.width) / 100 * img.width;
      const maxWidth = zoneWidth * 0.95;
      
      // Calculate center X position
      let x: number;
      if (zone.left !== undefined) {
        x = parseFloat(zone.left) / 100 * img.width + zoneWidth / 2;
      } else if (zone.right !== undefined) {
        x = img.width - parseFloat(zone.right) / 100 * img.width - zoneWidth / 2;
      } else {
        x = img.width / 2;
      }
      
      // Wrap text and calculate line height
      const lines = wrapText(ctx, text.toUpperCase(), maxWidth);
      const lineHeight = smallFontSize * 1.1;
      const totalTextHeight = lines.length * lineHeight;
      
      // Calculate Y position based on zone positioning
      let y: number;
      if (zone.top !== undefined && zone.height !== undefined) {
        // Zone has explicit top and height - center text in that zone
        const zoneTop = parseFloat(zone.top) / 100 * img.height;
        const zoneHeight = parseFloat(zone.height) / 100 * img.height;
        y = zoneTop + (zoneHeight - totalTextHeight) / 2 + smallFontSize;
      } else if (zone.top !== undefined) {
        // Just top position - place text near top
        y = parseFloat(zone.top) / 100 * img.height + smallFontSize;
      } else if (zone.bottom !== undefined) {
        // Bottom position - place text near bottom, accounting for text height
        const bottomOffset = parseFloat(zone.bottom) / 100 * img.height;
        y = img.height - bottomOffset - totalTextHeight + smallFontSize;
      } else {
        // Default to center
        y = (img.height - totalTextHeight) / 2 + smallFontSize;
      }

      // Use black text for changemymind template
      if (zone.style?.textShadow === 'none') {
        ctx.fillStyle = 'black';
        for (const line of lines) {
          ctx.fillText(line, x, y);
          y += lineHeight;
        }
        ctx.fillStyle = 'white';
      } else {
        for (const line of lines) {
          ctx.strokeText(line, x, y);
          ctx.fillText(line, x, y);
          y += lineHeight;
        }
      }
    });
  }

  // Download
  const link = document.createElement('a');
  link.download = `meme-${meme.id}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Meme card with proper text overlay positioning
function MemeCard({ meme, cardClass, isCyberpunk, isSelected, onToggleSelect }: { 
  meme: GeneratedMeme; 
  cardClass: string; 
  isCyberpunk: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const downloadMeme = async () => {
    try {
      await downloadMemeAsImage(meme);
    } catch (error) {
      console.error('Failed to download meme:', error);
    }
  };

  const captions = meme.captions || {};
  const zones = TEMPLATE_TEXT_ZONES[meme.templateId || ''] || [];

  return (
    <div 
      className={`rounded-xl overflow-hidden meme-card ${cardClass} transition-all duration-500 cursor-pointer ${isSelected ? 'ring-4 ring-cyan-400' : ''}`}
      onClick={onToggleSelect}
    >
      {/* Meme Image */}
      <div className="relative aspect-square bg-black">
        {/* Selection indicator */}
        <div
          className={`absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all pointer-events-none ${
            isSelected
              ? isCyberpunk 
                ? 'bg-cyan-500 text-black' 
                : 'bg-violet-500 text-white'
              : 'bg-black/50 text-white/70'
          }`}
        >
          {isSelected ? '✓' : ''}
        </div>
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
            onClick={(e) => { e.stopPropagation(); downloadMeme(); }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              isCyberpunk
                ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/50'
                : 'bg-violet-600 text-white hover:bg-violet-500'
            }`}
          >
            ⬇️ Download
          </button>
        </div>
        
        {(meme.template || meme.style) && (
          <div className={`mt-2 text-xs ${isCyberpunk ? 'text-fuchsia-400' : 'text-slate-400'}`}>
            {meme.template && <span>{meme.template}</span>}
            {meme.template && meme.style && <span> · </span>}
            {meme.style && <span className="capitalize">{meme.style}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MemeGallery({ memes }: MemeGalleryProps) {
  const { isCyberpunk } = useTheme();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(memes.map(m => m.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const downloadSelectedMemes = async () => {
    const selectedMemes = memes.filter(m => selectedIds.has(m.id));
    for (let i = 0; i < selectedMemes.length; i++) {
      const meme = selectedMemes[i];
      try {
        await downloadMemeAsImage(meme);
        
        // Small delay between downloads to prevent browser issues
        if (i < selectedMemes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.error(`Failed to download meme ${meme.id}:`, error);
      }
    }
  };

  const cardClass = isCyberpunk
    ? 'bg-black/60 backdrop-blur-md border-2 border-fuchsia-500/50 shadow-[0_0_30px_rgba(255,0,255,0.2)]'
    : 'bg-slate-800 border border-slate-700';

  const selectedCount = selectedIds.size;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 className={`text-xl font-bold ${isCyberpunk ? 'neon-text-magenta' : 'text-white'}`}>
          {isCyberpunk ? '🎮 G4LL3RY' : '🖼️ Generated Memes'}
        </h2>
        
        {memes.length > 0 && (
          <div className="flex gap-2 items-center">
            {/* Select All / Clear buttons */}
            <button
              onClick={selectedCount === memes.length ? clearSelection : selectAll}
              className={`py-1 px-3 rounded-lg text-sm font-medium transition-all ${
                isCyberpunk
                  ? 'bg-fuchsia-500/30 border border-fuchsia-400 text-fuchsia-300 hover:bg-fuchsia-500/50'
                  : 'bg-slate-600 text-white hover:bg-slate-500'
              }`}
            >
              {selectedCount === memes.length ? 'Clear All' : 'Select All'}
            </button>
            
            {/* Download Selected button */}
            <button
              onClick={downloadSelectedMemes}
              disabled={selectedCount === 0}
              className={`py-2 px-4 rounded-lg font-medium transition-all ${
                selectedCount === 0
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : isCyberpunk
                    ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/50'
                    : 'bg-violet-600 text-white hover:bg-violet-500'
              }`}
            >
              ⬇️ Download{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memes.map((meme) => (
          <MemeCard 
            key={meme.id} 
            meme={meme} 
            cardClass={cardClass} 
            isCyberpunk={isCyberpunk}
            isSelected={selectedIds.has(meme.id)}
            onToggleSelect={() => toggleSelect(meme.id)}
          />
        ))}
      </div>
    </div>
  );
}
