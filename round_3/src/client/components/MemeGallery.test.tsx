import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MemeGallery from './MemeGallery';
import { ThemeProvider } from '../context/ThemeContext';
import { GeneratedMeme } from '../App';

const renderWithTheme = (component: React.ReactNode) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('MemeGallery', () => {
  describe('Template Text Overlays', () => {
    it('should render Drake template with top-right and bottom-right text', () => {
      const drakeMeme: GeneratedMeme = {
        id: 'drake-1',
        imageUrl: 'https://i.imgflip.com/30b1gx.jpg',
        template: 'Drake Approves',
        templateId: 'drake',
        captions: {
          'Bad thing': 'Deploying on Friday',
          'Good thing': 'Waiting until Monday'
        },
        createdAt: new Date()
      };

      renderWithTheme(<MemeGallery memes={[drakeMeme]} />);

      // Verify text is rendered
      expect(screen.getByText('Deploying on Friday')).toBeInTheDocument();
      expect(screen.getByText('Waiting until Monday')).toBeInTheDocument();
      
      // Verify positioning via data-position attribute
      const badTextContainer = screen.getByText('Deploying on Friday').closest('[data-position]');
      const goodTextContainer = screen.getByText('Waiting until Monday').closest('[data-position]');
      expect(badTextContainer).toHaveAttribute('data-position', 'top-right');
      expect(goodTextContainer).toHaveAttribute('data-position', 'bottom-right');
      
      // Verify CSS positioning styles are applied
      expect(badTextContainer).toHaveStyle({ top: '5%', right: '2%', width: '48%' });
      expect(goodTextContainer).toHaveStyle({ bottom: '5%', right: '2%', width: '48%' });
    });

    it('should render Expanding Brain template with 4 text zones', () => {
      const brainMeme: GeneratedMeme = {
        id: 'brain-1',
        imageUrl: 'https://i.imgflip.com/1jwhww.jpg',
        template: 'Expanding Brain',
        templateId: 'expandingbrain',
        captions: {
          'Basic': 'Using console.log',
          'Better': 'Using debugger',
          'Advanced': 'Using proper logging',
          'Galaxy brain': 'Reading the error message'
        },
        createdAt: new Date()
      };

      renderWithTheme(<MemeGallery memes={[brainMeme]} />);

      // Verify all 4 panels render text
      expect(screen.getByText('Using console.log')).toBeInTheDocument();
      expect(screen.getByText('Using debugger')).toBeInTheDocument();
      expect(screen.getByText('Using proper logging')).toBeInTheDocument();
      expect(screen.getByText('Reading the error message')).toBeInTheDocument();
      
      // Verify positioning
      const panel1 = screen.getByText('Using console.log').closest('[data-position]');
      const panel2 = screen.getByText('Using debugger').closest('[data-position]');
      const panel3 = screen.getByText('Using proper logging').closest('[data-position]');
      const panel4 = screen.getByText('Reading the error message').closest('[data-position]');
      
      expect(panel1).toHaveAttribute('data-position', 'panel-1');
      expect(panel2).toHaveAttribute('data-position', 'panel-2');
      expect(panel3).toHaveAttribute('data-position', 'panel-3');
      expect(panel4).toHaveAttribute('data-position', 'panel-4');
      
      // Verify vertical stacking (each panel at different top %)
      expect(panel1).toHaveStyle({ top: '1%', left: '1%', width: '48%' });
      expect(panel2).toHaveStyle({ top: '26%', left: '1%', width: '48%' });
      expect(panel3).toHaveStyle({ top: '51%', left: '1%', width: '48%' });
      expect(panel4).toHaveStyle({ top: '76%', left: '1%', width: '48%' });
    });

    it('should render Change My Mind template with sign text', () => {
      const changeMindMeme: GeneratedMeme = {
        id: 'cmm-1',
        imageUrl: 'https://i.imgflip.com/24y43o.jpg',
        template: 'Change My Mind',
        templateId: 'changemymind',
        captions: {
          'Hot take': 'Tabs are better than spaces'
        },
        createdAt: new Date()
      };

      renderWithTheme(<MemeGallery memes={[changeMindMeme]} />);

      expect(screen.getByText('Tabs are better than spaces')).toBeInTheDocument();
      
      // Verify text is positioned on the sign area (above 'CHANGE MY MIND' text)
      const signText = screen.getByText('Tabs are better than spaces').closest('[data-position]');
      expect(signText).toHaveAttribute('data-position', 'sign');
      expect(signText).toHaveStyle({ bottom: '28%', right: '5%', width: '42%' });
    });

    it('should render Two Buttons template with both button labels', () => {
      const buttonsMeme: GeneratedMeme = {
        id: 'buttons-1',
        imageUrl: 'https://i.imgflip.com/1g8my4.jpg',
        template: 'Two Buttons',
        templateId: 'twobuttons',
        captions: {
          'Option A': 'Ship it now',
          'Option B': 'Write tests first'
        },
        createdAt: new Date()
      };

      renderWithTheme(<MemeGallery memes={[buttonsMeme]} />);

      expect(screen.getByText('Ship it now')).toBeInTheDocument();
      expect(screen.getByText('Write tests first')).toBeInTheDocument();
      
      // Verify button label positioning (both at top, left and right)
      const leftButton = screen.getByText('Ship it now').closest('[data-position]');
      const rightButton = screen.getByText('Write tests first').closest('[data-position]');
      expect(leftButton).toHaveAttribute('data-position', 'left-button');
      expect(rightButton).toHaveAttribute('data-position', 'right-button');
      expect(leftButton).toHaveStyle({ top: '3%', left: '10%', width: '35%' });
      expect(rightButton).toHaveStyle({ top: '3%', right: '15%', width: '35%' });
    });

    it('should render This Is Fine template with situation text', () => {
      const fineMeme: GeneratedMeme = {
        id: 'fine-1',
        imageUrl: 'https://i.imgflip.com/wxica.jpg',
        template: 'This Is Fine',
        templateId: 'thisisfine',
        captions: {
          'Situation': 'Production is on fire',
          'Response': 'This is fine'
        },
        createdAt: new Date()
      };

      renderWithTheme(<MemeGallery memes={[fineMeme]} />);

      expect(screen.getByText('Production is on fire')).toBeInTheDocument();
      expect(screen.getByText('This is fine')).toBeInTheDocument();
      
      // Verify top/bottom positioning
      const topText = screen.getByText('Production is on fire').closest('[data-position]');
      const bottomText = screen.getByText('This is fine').closest('[data-position]');
      expect(topText).toHaveAttribute('data-position', 'top');
      expect(bottomText).toHaveAttribute('data-position', 'bottom');
      expect(topText).toHaveStyle({ top: '2%', left: '0', width: '100%' });
      expect(bottomText).toHaveStyle({ bottom: '2%', left: '0', width: '100%' });
    });

    it('should render Distracted Boyfriend template with 3 labels', () => {
      const distractedMeme: GeneratedMeme = {
        id: 'distracted-1',
        imageUrl: 'https://i.imgflip.com/1ur9b0.jpg',
        template: 'Distracted Boyfriend',
        templateId: 'distracted',
        captions: {
          'Current thing': 'Stable codebase',
          'You': 'Me',
          'New shiny thing': 'New JavaScript framework'
        },
        createdAt: new Date()
      };

      renderWithTheme(<MemeGallery memes={[distractedMeme]} />);

      expect(screen.getByText('Stable codebase')).toBeInTheDocument();
      expect(screen.getByText('Me')).toBeInTheDocument();
      expect(screen.getByText('New JavaScript framework')).toBeInTheDocument();
      
      // Verify positioning for each person (left to right: other-girl, boyfriend, girlfriend)
      const otherGirl = screen.getByText('New JavaScript framework').closest('[data-position]');
      const boyfriend = screen.getByText('Me').closest('[data-position]');
      const girlfriend = screen.getByText('Stable codebase').closest('[data-position]');
      
      expect(otherGirl).toHaveAttribute('data-position', 'other-girl');
      expect(boyfriend).toHaveAttribute('data-position', 'boyfriend');
      expect(girlfriend).toHaveAttribute('data-position', 'girlfriend');
      
      // Verify horizontal positioning (left, center, right)
      expect(otherGirl).toHaveStyle({ top: '5%', left: '2%', width: '28%' });
      expect(boyfriend).toHaveStyle({ top: '5%', left: '38%', width: '24%' });
      expect(girlfriend).toHaveStyle({ top: '5%', right: '2%', width: '28%' });
    });
  });

  describe('AI Generated Memes', () => {
    it('should render AI meme with top and bottom text', () => {
      const aiMeme: GeneratedMeme = {
        id: 'ai-1',
        imageUrl: 'https://example.com/ai-meme.jpg',
        topText: 'When the build passes',
        bottomText: 'But you forgot to push',
        createdAt: new Date()
      };

      renderWithTheme(<MemeGallery memes={[aiMeme]} />);

      expect(screen.getByText('When the build passes')).toBeInTheDocument();
      expect(screen.getByText('But you forgot to push')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render gallery header even with memes', () => {
      const meme: GeneratedMeme = {
        id: 'test-1',
        imageUrl: 'https://example.com/test.jpg',
        topText: 'Test',
        bottomText: 'Meme',
        createdAt: new Date()
      };

      renderWithTheme(<MemeGallery memes={[meme]} />);

      expect(screen.getByText(/Generated Memes|G4LL3RY/)).toBeInTheDocument();
    });
  });

  describe('Selection Functionality', () => {
    const createTestMemes = (): GeneratedMeme[] => [
      {
        id: 'meme-1',
        imageUrl: 'https://example.com/meme1.jpg',
        topText: 'Meme 1 Top',
        bottomText: 'Meme 1 Bottom',
        createdAt: new Date()
      },
      {
        id: 'meme-2',
        imageUrl: 'https://example.com/meme2.jpg',
        topText: 'Meme 2 Top',
        bottomText: 'Meme 2 Bottom',
        createdAt: new Date()
      },
      {
        id: 'meme-3',
        imageUrl: 'https://example.com/meme3.jpg',
        topText: 'Meme 3 Top',
        bottomText: 'Meme 3 Bottom',
        createdAt: new Date()
      }
    ];

    it('should show Download button disabled when no memes selected', () => {
      renderWithTheme(<MemeGallery memes={createTestMemes()} />);

      // The header download button is the first one with exact text "⬇️ Download"
      const downloadButtons = screen.getAllByRole('button', { name: /⬇️ Download/i });
      // Header button is the first one that's disabled
      const headerButton = downloadButtons.find(btn => btn.hasAttribute('disabled'));
      expect(headerButton).toBeDefined();
    });

    it('should toggle selection when clicking on a meme card', async () => {
      const user = userEvent.setup();
      renderWithTheme(<MemeGallery memes={createTestMemes()} />);

      // Find the first meme card (contains the meme text)
      const memeCard = screen.getByText('Meme 1 Top').closest('.meme-card');
      expect(memeCard).not.toBeNull();

      // Click to select
      await user.click(memeCard!);

      // Download button should now show count
      expect(screen.getByRole('button', { name: /Download \(1\)/i })).toBeInTheDocument();

      // Click again to deselect
      await user.click(memeCard!);

      // Download button should be back to disabled state (check for disabled attribute)
      const downloadButtons = screen.getAllByRole('button', { name: /⬇️ Download/i });
      const headerButton = downloadButtons.find(btn => btn.hasAttribute('disabled'));
      expect(headerButton).toBeDefined();
    });

    it('should select multiple memes', async () => {
      const user = userEvent.setup();
      renderWithTheme(<MemeGallery memes={createTestMemes()} />);

      const memeCard1 = screen.getByText('Meme 1 Top').closest('.meme-card');
      const memeCard2 = screen.getByText('Meme 2 Top').closest('.meme-card');

      await user.click(memeCard1!);
      await user.click(memeCard2!);

      expect(screen.getByRole('button', { name: /Download \(2\)/i })).toBeInTheDocument();
    });

    it('should have Select All button that selects all memes', async () => {
      const user = userEvent.setup();
      renderWithTheme(<MemeGallery memes={createTestMemes()} />);

      const selectAllButton = screen.getByRole('button', { name: /Select All/i });
      await user.click(selectAllButton);

      // Should show all 3 selected
      expect(screen.getByRole('button', { name: /Download \(3\)/i })).toBeInTheDocument();

      // Button should now say "Clear All"
      expect(screen.getByRole('button', { name: /Clear All/i })).toBeInTheDocument();
    });

    it('should have Clear All button that deselects all memes', async () => {
      const user = userEvent.setup();
      renderWithTheme(<MemeGallery memes={createTestMemes()} />);

      // First select all
      await user.click(screen.getByRole('button', { name: /Select All/i }));

      // Then clear all
      await user.click(screen.getByRole('button', { name: /Clear All/i }));

      // Download button should be disabled again
      const downloadButtons = screen.getAllByRole('button', { name: /⬇️ Download/i });
      const headerButton = downloadButtons.find(btn => btn.hasAttribute('disabled'));
      expect(headerButton).toBeDefined();
    });

    it('should show selection indicator (checkmark) on selected cards', async () => {
      const user = userEvent.setup();
      renderWithTheme(<MemeGallery memes={createTestMemes()} />);

      const memeCard = screen.getByText('Meme 1 Top').closest('.meme-card');
      await user.click(memeCard!);

      // Should have a checkmark visible
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should apply ring highlight to selected cards', async () => {
      const user = userEvent.setup();
      renderWithTheme(<MemeGallery memes={createTestMemes()} />);

      const memeCard = screen.getByText('Meme 1 Top').closest('.meme-card');
      await user.click(memeCard!);

      // Card should have ring-4 class for selection highlight
      expect(memeCard?.className).toContain('ring-4');
    });

    it('should not toggle selection when clicking Download button on card', async () => {
      const user = userEvent.setup();
      renderWithTheme(<MemeGallery memes={createTestMemes()} />);

      // First select a meme
      const memeCard = screen.getByText('Meme 1 Top').closest('.meme-card');
      await user.click(memeCard!);

      expect(screen.getByRole('button', { name: /Download \(1\)/i })).toBeInTheDocument();

      // Click the individual download button on the card (not the header one with count)
      const cardDownloadButtons = screen.getAllByRole('button', { name: /^⬇️ Download$/i });
      await user.click(cardDownloadButtons[0]);

      // Selection should still be 1 (not toggled)
      expect(screen.getByRole('button', { name: /Download \(1\)/i })).toBeInTheDocument();
    });
  });
});
