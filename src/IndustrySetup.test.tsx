import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import IndustrySetup from './IndustrySetup';
import { resetMockData, getIndustryProfile } from './mockRepository';

describe('IndustrySetup component', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('renders all fields', () => {
    render(<IndustrySetup />);
    // basic inputs
    expect(screen.getByLabelText('industry-name')).toBeInTheDocument();
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

  it('shows default mock Online Grocery profile', () => {
    render(<IndustrySetup />);
    const nameInput = screen.getByLabelText('industry-name') as HTMLInputElement;
    expect(nameInput.value).toBe('Online Grocery');
  });

  it('allows user to edit industry name', () => {
    render(<IndustrySetup />);
    const nameInput = screen.getByLabelText('industry-name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'New Industry' } });
    expect(nameInput.value).toBe('New Industry');
  });

  it('allows adding a strategic priority', () => {
    render(<IndustrySetup />);
    const addInput = screen.getByLabelText('add-Strategic Priorities') as HTMLInputElement;
    const addButton = screen.getByLabelText('add-Strategic Priorities-button');
    fireEvent.change(addInput, { target: { value: 'Priority 1' } });
    fireEvent.click(addButton);
    expect(screen.getByText('Priority 1')).toBeInTheDocument();
  });

  it('allows adding a competitor', () => {
    render(<IndustrySetup />);
    const addInput = screen.getByLabelText('add-Competitors') as HTMLInputElement;
    const addButton = screen.getByLabelText('add-Competitors-button');
    fireEvent.change(addInput, { target: { value: 'Competitor X' } });
    fireEvent.click(addButton);
    expect(screen.getByText('Competitor X')).toBeInTheDocument();
  });

  it('saves profile and persists changes', () => {
    render(<IndustrySetup />);
    const nameInput = screen.getByLabelText('industry-name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Saved Industry' } });
    const saveBtn = screen.getByLabelText('save-button');
    fireEvent.click(saveBtn);
    const saved = getIndustryProfile();
    expect(saved?.name).toBe('Saved Industry');
  });

  it('shows validation error when industry name is empty', () => {
    render(<IndustrySetup />);
    const nameInput = screen.getByLabelText('industry-name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: '' } });
    const saveBtn = screen.getByLabelText('save-button');
    fireEvent.click(saveBtn);
    expect(screen.getByRole('alert')).toHaveTextContent('Industry name cannot be empty');
  });
});
