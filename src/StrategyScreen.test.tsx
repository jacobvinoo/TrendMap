import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('./mockRepository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./mockRepository')>();
  let ctx: any = null;
  return {
    ...actual,
    getStrategicContext: vi.fn(() => ctx),
    saveStrategicContext: vi.fn((c: any) => { ctx = c; }),
  };
});

const { getStrategicContext, saveStrategicContext } = vi.mocked(await import('./mockRepository'));

import StrategyScreen from './StrategyScreen';

describe('StrategyScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getStrategicContext as any).mockReturnValue(null);
  });

  it('renders default mock context with company name', async () => {
    render(<StrategyScreen />);
    expect(screen.getByRole('heading', { name: /strategy/i })).toBeInTheDocument();
    
    // Switch to context tab
    fireEvent.click(screen.getByRole('button', { name: /context settings/i }));
    
    const companyInput = screen.getByLabelText(/company name/i);
    expect(companyInput).toBeInTheDocument();
  });

  it('user can edit company name', async () => {
    render(<StrategyScreen />);
    fireEvent.click(screen.getByRole('button', { name: /context settings/i }));
    
    const companyInput = screen.getByLabelText(/company name/i);
    fireEvent.change(companyInput, { target: { value: 'New Company Name' } });
    expect((companyInput as HTMLInputElement).value).toBe('New Company Name');
  });

  it('user can add a strategic goal', async () => {
    render(<StrategyScreen />);
    fireEvent.click(screen.getByRole('button', { name: /context settings/i }));
    
    const goalInput = screen.getByPlaceholderText(/add strategic goal/i);
    fireEvent.change(goalInput, { target: { value: 'Increase market share' } });
    const addButton = screen.getByRole('button', { name: /add goal/i });
    fireEvent.click(addButton);
    expect(screen.getByText('Increase market share')).toBeInTheDocument();
  });

  it('user can change risk appetite', async () => {
    render(<StrategyScreen />);
    fireEvent.click(screen.getByRole('button', { name: /context settings/i }));
    
    const select = screen.getByLabelText(/risk appetite/i);
    fireEvent.change(select, { target: { value: 'high' } });
    expect((select as HTMLSelectElement).value).toBe('high');
  });

  it('save button persists context', async () => {
    render(<StrategyScreen />);
    fireEvent.click(screen.getByRole('button', { name: /context settings/i }));
    
    const companyInput = screen.getByLabelText(/company name/i);
    fireEvent.change(companyInput, { target: { value: 'Woolworths NZ' } });
    const saveButton = screen.getByRole('button', { name: /save context/i });
    fireEvent.click(saveButton);
    expect(saveStrategicContext).toHaveBeenCalled();
    const saved = (saveStrategicContext as any).mock.calls[0][0];
    expect(saved.companyName).toBe('Woolworths NZ');
  });

  it('shows validation error when company name is empty', async () => {
    render(<StrategyScreen />);
    fireEvent.click(screen.getByRole('button', { name: /context settings/i }));
    
    const companyInput = screen.getByLabelText(/company name/i);
    fireEvent.change(companyInput, { target: { value: '' } });
    const saveButton = screen.getByRole('button', { name: /save context/i });
    fireEvent.click(saveButton);
    expect(screen.getByText(/company name is required/i)).toBeInTheDocument();
  });
});
