import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock axios to prevent actual API calls
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    create: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ data: [] })),
      post: vi.fn(() => Promise.resolve({ data: {} })),
    })),
  },
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main heading', () => {
    render(<App />);
    expect(screen.getByText(/FuelEU Maritime Compliance/i)).toBeInTheDocument();
  });

  it('renders all navigation tabs', () => {
    render(<App />);
    const buttons = screen.getAllByRole('button');
    const buttonTexts = buttons.map(btn => btn.textContent);
    
    expect(buttonTexts.some(text => text?.includes('Routes'))).toBe(true);
    expect(buttonTexts.some(text => text?.includes('Compare'))).toBe(true);
    expect(buttonTexts.some(text => text?.includes('Banking'))).toBe(true);
    expect(buttonTexts.some(text => text?.includes('Pooling'))).toBe(true);
  });

  it('has the correct theme color applied', () => {
    const { container } = render(<App />);
    const mainElement = container.querySelector('.bg-gradient-to-br');
    expect(mainElement).toBeInTheDocument();
  });
});
