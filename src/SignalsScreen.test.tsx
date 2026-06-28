// @ts-nocheck
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import SignalsScreen from './SignalsScreen';
import { resetMockData, saveSignals, getTrends } from './mockRepository';

describe('SignalsScreen', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('renders Signals Screen and Generate Trends button', async () => {
    render(<SignalsScreen />);
    expect(await screen.findByRole('heading', { name: 'Signals' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate candidate trends/i })).toBeInTheDocument();
  });

  it('shows error feedback if no trends can be generated', async () => {
    render(<SignalsScreen />);
    const generateBtn = screen.getByRole('button', { name: /generate candidate trends/i });
    fireEvent.click(generateBtn);
    expect(await screen.findByText(/No candidate trends could be generated/i)).toBeInTheDocument();
  });

  it('generates trends successfully when valid signals are present', async () => {
    // Seed a valid signal that matches a cluster
    saveSignals([
      {
        id: 'sig-1',
        documentId: 'doc-1',
        sourceId: 'src-1',
        title: 'AI-assisted shopping',
        summary: 'Detected AI assistance.',
        signalType: 'AI-assisted shopping',
        pestleCategory: 'Technology',
        noveltyScore: 0.9,
        strengthScore: 0.9,
        confidenceScore: 0.9,
        evidenceDate: '2026-01-01',
        tags: [],
      }
    ]);

    render(<SignalsScreen />);
    
    // Check signal is rendered
    expect(await screen.findByText(/AI-assisted shopping/i)).toBeInTheDocument();

    const generateBtn = screen.getByRole('button', { name: /generate candidate trends/i });
    fireEvent.click(generateBtn);

    // Wait for success message
    expect(await screen.findByText(/Successfully generated 1 candidate trend/i)).toBeInTheDocument();

    // Verify repository actually got the trend
    const trends = getTrends();
    expect(trends.length).toBe(1);
    expect(trends[0].name).toBe('AI-assisted grocery discovery');
  });
});
