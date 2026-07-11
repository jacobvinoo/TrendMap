// @ts-nocheck
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import IndustrySetup from './IndustrySetup';
import { resetMockData, getIndustryProfile, saveIndustryProfile } from './mockRepository';

describe('IndustrySetup component', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('renders all fields', async () => {
    render(<IndustrySetup />);
    // basic inputs
    expect(await screen.findByLabelText('industry-name')).toBeInTheDocument();
    expect(screen.getByLabelText('industry-geography')).toBeInTheDocument();
    expect(screen.getByLabelText('industry-description')).toBeInTheDocument();
    // list editors have add inputs
    expect(screen.getByLabelText('add-Strategic Priorities')).toBeInTheDocument();
    expect(screen.getByLabelText('add-Customer Segments')).toBeInTheDocument();
    expect(screen.getByLabelText('add-Competitors')).toBeInTheDocument();
    expect(screen.getByLabelText('add-Time Horizons')).toBeInTheDocument();
    // save button
    expect(screen.getByLabelText('save-button')).toBeInTheDocument();
  });

  it('starts with an empty profile', async () => {
    render(<IndustrySetup />);
    const nameInput = await screen.findByLabelText('industry-name') as HTMLInputElement;
    expect(nameInput.value).toBe('');
  });

  it('allows user to edit industry name', async () => {
    render(<IndustrySetup />);
    const nameInput = await screen.findByLabelText('industry-name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'New Industry' } });
    expect(nameInput.value).toBe('New Industry');
  });

  it('allows adding a strategic priority', async () => {
    render(<IndustrySetup />);
    const addInput = await screen.findByLabelText('add-Strategic Priorities') as HTMLInputElement;
    const addButton = screen.getByLabelText('add-Strategic Priorities-button');
    fireEvent.change(addInput, { target: { value: 'Priority 1' } });
    fireEvent.click(addButton);
    expect(screen.getByText('Priority 1')).toBeInTheDocument();
  });

  it('allows adding a competitor', async () => {
    render(<IndustrySetup />);
    const addInput = await screen.findByLabelText('add-Competitors') as HTMLInputElement;
    const addButton = screen.getByLabelText('add-Competitors-button');
    fireEvent.change(addInput, { target: { value: 'Competitor X' } });
    fireEvent.click(addButton);
    expect(screen.getByText('Competitor X')).toBeInTheDocument();
  });

  it('saves profile and persists changes', async () => {
    render(<IndustrySetup />);
    const nameInput = await screen.findByLabelText('industry-name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Saved Industry' } });
    const saveBtn = screen.getByLabelText('save-button');
    fireEvent.click(saveBtn);
    await waitFor(() => {
      const saved = getIndustryProfile();
      expect(saved?.name).toBe('Saved Industry');
    });
  });

  it('reloads saved Strategic Context and Market Dynamics after returning to the screen', async () => {
    const firstRender = render(<IndustrySetup />);

    fireEvent.change(await screen.findByLabelText('industry-name'), { target: { value: 'Online Grocery Supermarket' } });
    fireEvent.change(screen.getByLabelText('industry-geography'), { target: { value: 'New Zealand' } });
    fireEvent.change(screen.getByLabelText('industry-description'), {
      target: { value: 'Track broad online grocery trends across pricing, logistics, customer behaviour, and experience.' },
    });

    const addListItem = (label: string, value: string) => {
      fireEvent.change(screen.getByLabelText(`add-${label}`), { target: { value } });
      fireEvent.click(screen.getByLabelText(`add-${label}-button`));
    };

    addListItem('Strategic Priorities', 'Customer experience');
    addListItem('Time Horizons', '60 months');
    addListItem('Customer Segments', 'Single Young Professionals');
    addListItem('Competitors', 'Costco');

    fireEvent.click(screen.getByLabelText('save-button'));

    await waitFor(() => {
      const saved = getIndustryProfile();
      expect(saved?.strategicPriorities).toContain('Customer experience');
      expect(saved?.timeHorizons).toContain('60 months');
      expect(saved?.customerSegments).toContain('Single Young Professionals');
      expect(saved?.competitors).toContain('Costco');
    });

    firstRender.unmount();
    render(<IndustrySetup />);

    expect(await screen.findByDisplayValue('Online Grocery Supermarket')).toBeInTheDocument();
    expect(screen.getByDisplayValue('New Zealand')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Track broad online grocery trends/i)).toBeInTheDocument();
    expect(screen.getByText('Customer experience')).toBeInTheDocument();
    expect(screen.getByText('60 months')).toBeInTheDocument();
    expect(screen.getByText('Single Young Professionals')).toBeInTheDocument();
    expect(screen.getByText('Costco')).toBeInTheDocument();
  });

  it('shows validation error when industry name is empty', async () => {
    render(<IndustrySetup />);
    const nameInput = await screen.findByLabelText('industry-name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: '' } });
    const saveBtn = screen.getByLabelText('save-button');
    fireEvent.click(saveBtn);
    expect(screen.getByRole('alert')).toHaveTextContent('Industry Name is required');
  });

  it('saves and navigates to Themes before source discovery', async () => {
    render(<IndustrySetup />);

    // Must provide a name first
    const nameInput = await screen.findByLabelText('industry-name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Tech Industry' } });

    const button = await screen.findByRole('button', { name: /next: themes/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(window.location.hash).toBe('#themes');
    });
    expect(getIndustryProfile()?.name).toBe('Tech Industry');
  });

  it('loads older saved profiles with missing list fields', async () => {
    saveIndustryProfile({ id: 'legacy', name: 'Legacy Industry' } as any);

    render(<IndustrySetup />);

    const nameInput = await screen.findByLabelText('industry-name') as HTMLInputElement;
    expect(nameInput.value).toBe('Legacy Industry');
    expect(screen.getByLabelText('add-Strategic Priorities')).toBeInTheDocument();
  });
});
