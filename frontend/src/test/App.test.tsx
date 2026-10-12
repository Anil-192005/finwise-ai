import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('FinWise AI Frontend Application', () => {
  it('renders landing page with headline and key fintech features', () => {
    render(<App />);
    const brandingElements = screen.getAllByText(/FinWise AI/i);
    expect(brandingElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Master Your Money with/i)).toBeInTheDocument();
    expect(screen.getByText(/Automated Categorization/i)).toBeInTheDocument();
    expect(screen.getByText(/Linear Trend Forecasting/i)).toBeInTheDocument();
  });

  it('displays call-to-action buttons for registration and demo mode', () => {
    render(<App />);
    expect(screen.getByText(/Create Free Account/i)).toBeInTheDocument();
    expect(screen.getByText(/Launch Live Demo/i)).toBeInTheDocument();
  });
});
