import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import MemeGenerator from './components/MemeGenerator';
import MemeGallery from './components/MemeGallery';

export interface GeneratedMeme {
  id: string;
  imageUrl: string;
  topText: string;
  bottomText: string;
  template?: string;
  createdAt: Date;
}

function AppContent() {
  const [memes, setMemes] = useState<GeneratedMeme[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleMemeGenerated = (meme: GeneratedMeme) => {
    setMemes(prev => [meme, ...prev]);
  };

  return (
    <div className="min-h-screen cyber-grid">
      <div className="scanline" />
      
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <MemeGenerator 
          onMemeGenerated={handleMemeGenerated}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
        />
        
        {memes.length > 0 && (
          <MemeGallery memes={memes} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
