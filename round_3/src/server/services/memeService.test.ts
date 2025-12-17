import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TEMPLATES, getTemplates } from './memeService.js';

describe('memeService', () => {
  describe('TEMPLATES', () => {
    it('should have all expected template keys', () => {
      const expectedTemplates = [
        'drake',
        'distracted',
        'thisisfine',
        'expandingbrain',
        'changemymind',
        'twobuttons'
      ];
      
      expect(Object.keys(TEMPLATES)).toEqual(expect.arrayContaining(expectedTemplates));
      expect(Object.keys(TEMPLATES)).toHaveLength(expectedTemplates.length);
    });

    it('each template should have required properties', () => {
      Object.entries(TEMPLATES).forEach(([id, template]) => {
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('url');
        expect(template).toHaveProperty('textAreas');
        expect(typeof template.name).toBe('string');
        expect(typeof template.description).toBe('string');
        expect(template.url).toMatch(/^https:\/\//);
        expect(Array.isArray(template.textAreas)).toBe(true);
        expect(template.textAreas.length).toBeGreaterThan(0);
      });
    });

    it('each textArea should have position and label', () => {
      Object.entries(TEMPLATES).forEach(([id, template]) => {
        template.textAreas.forEach((area) => {
          expect(area).toHaveProperty('position');
          expect(area).toHaveProperty('label');
          expect(typeof area.position).toBe('string');
          expect(typeof area.label).toBe('string');
        });
      });
    });

    it('drake template should have correct structure', () => {
      expect(TEMPLATES.drake).toEqual({
        name: 'Drake Approves',
        description: 'Drake disapproving then approving',
        url: 'https://i.imgflip.com/30b1gx.jpg',
        textAreas: [
          { position: 'top-right', label: 'Bad thing' },
          { position: 'bottom-right', label: 'Good thing' }
        ]
      });
    });
  });

  describe('getTemplates', () => {
    it('should return array of templates with id', () => {
      const templates = getTemplates();
      
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBe(Object.keys(TEMPLATES).length);
    });

    it('each template should have id, name, description, url, and textAreas', () => {
      const templates = getTemplates();
      
      templates.forEach((template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('url');
        expect(template).toHaveProperty('textAreas');
      });
    });

    it('should include drake template with correct id', () => {
      const templates = getTemplates();
      const drake = templates.find(t => t.id === 'drake');
      
      expect(drake).toBeDefined();
      expect(drake?.name).toBe('Drake Approves');
    });
  });
});
