import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('./repository', () => {
  let ctx: any = null;
  return {
    repository: {
      getStrategicContext: vi.fn(async () => ctx),
      saveStrategicContext: vi.fn(async (c: any) => { ctx = c; }),
      getStrategicImplications: vi.fn(async () => []),
      getStrategicOptions: vi.fn(async () => []),
      getAssumptions: vi.fn(async () => []),
      getLeadingIndicators: vi.fn(async () => []),
    }
  };
});

const { repository } = await import('./repository');

import StrategyScreen from './StrategyScreen';

describe('StrategyScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (repository.getStrategicContext as any).mockResolvedValue(null);
  });

  it('renders default mock context with company name', async () => {
    render(<StrategyScreen />);
    expect(await screen.findByRole('heading', { name: /strategy/i })).toBeInTheDocument();
    
    // Switch to context tab
    fireEvent.click(screen.getByRole('button', { name: /context settings/i }));
    
    const companyInput = screen.getByLabelText(/company name/i);
    expect(companyInput).toBeInTheDocument();
  });

  it('user can edit company name', async () => {
    render(<StrategyScreen />);
    await screen.findByRole('heading', { name: /strategy/i });
    fireEvent.click(screen.getByRole('button', { name: /context settings/i }));
    
    const companyInput = screen.getByLabelText(/company name/i);
    fireEvent.change(companyInput, { target: { value: 'New Company Name' } });
    expect((companyInput as HTMLInputElement).value).toBe('New Company Name');
  });

  it('user can add a strategic goal', async () => {
    render(<StrategyScreen />);
    await screen.findByRole('heading', { name: /strategy/i });
    fireEvent.click(screen.getByRole('button', { name: /context settings/i }));
    
    const goalInput = screen.getByPlaceholderText(/add strategic goal/i);
    fireEvent.change(goalInput, { target: { value: 'Increase market share' } });
    const addButton = screen.getByRole('button', { name: /add goal/i });
    fireEvent.click(addButton);
    expect(screen.getByText('Increase market share')).toBeInTheDocument();
  });

  it('user can change risk appetite', async () => {
    render(<StrategyScreen />);
    await screen.findByRole('heading', { name: /strategy/i });
    fireEvent.click(screen.getByRole('button', { name: /context settings/i }));
    
    const select = screen.getByLabelText(/risk appetite/i);
    fireEvent.change(select, { target: { value: 'high' } });
    expect((select as HTMLSelectElement).value).toBe('high');
  });

  it('save button persists context', async () => {
    render(<StrategyScreen />);
    await screen.findByRole('heading', { name: /strategy/i });
    fireEvent.click(screen.getByRole('button', { name: /context settings/i }));
    
    const companyInput = screen.getByLabelText(/company name/i);
    fireEvent.change(companyInput, { target: { value: 'Woolworths NZ' } });
    const saveButton = screen.getByRole('button', { name: /save context/i });
    fireEvent.click(saveButton);
    expect(repository.saveStrategicContext).toHaveBeenCalled();
    const saved = (repository.saveStrategicContext as any).mock.calls[0][0];
    expect(saved.companyName).toBe('Woolworths NZ');
  });

  it('loads backend-shaped strategic context list fields', async () => {
    (repository.getStrategicContext as any).mockResolvedValue({
      id: 'ctx-api',
      industry_profile_id: 'ind-api',
      company_name: 'API Company',
      business_model: 'Marketplace',
      target_customers: '["Families","Professionals"]',
      strategic_goals: '["Grow share"]',
      current_capabilities: '["Search"]',
      constraints: '["Capacity"]',
      risk_appetite: 'high',
      planning_horizons: '["6 months","18 months"]',
    });

    render(<StrategyScreen />);
    await screen.findByText('API Company');
    expect(screen.getByText('6 months, 18 months')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /context settings/i }));
    expect(screen.getByDisplayValue('API Company')).toBeInTheDocument();
    expect(screen.getByText('Families')).toBeInTheDocument();
    expect(screen.getByText('18 months')).toBeInTheDocument();
  });

  it('shows validation error when company name is empty', async () => {
    render(<StrategyScreen />);
    await screen.findByRole('heading', { name: /strategy/i });
    fireEvent.click(screen.getByRole('button', { name: /context settings/i }));
    
    const companyInput = screen.getByLabelText(/company name/i);
    fireEvent.change(companyInput, { target: { value: '' } });
    const saveButton = screen.getByRole('button', { name: /save context/i });
    fireEvent.click(saveButton);
    expect(screen.getByText(/company name is required/i)).toBeInTheDocument();
  });
});
