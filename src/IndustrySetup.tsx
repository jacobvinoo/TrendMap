// @ts-nocheck
import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { getIndustryProfile, saveIndustryProfile } from './mockRepository';
import type { IndustryProfile } from './types';

// Helper component for dynamic list fields
const ListEditor: React.FC<{
  label: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
}> = ({ label, items, onAdd, onRemove }) => {
  const [newItem, setNewItem] = useState('');
  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label>{label}</label>
      <ul>
        {items.map((it, idx) => (
          <li key={idx}>
            {it}{' '}
            <button type="button" onClick={() => onRemove(idx)} aria-label={`remove-${label}-${idx}`}>✕</button>
          </li>
        ))}
      </ul>
      <input
        type="text"
        value={newItem}
        onChange={(e) => setNewItem(e.target.value)}
        placeholder={`Add ${label}`}
        aria-label={`add-${label}`}
      />
      <button type="button" onClick={handleAdd} aria-label={`add-${label}-button`}>Add</button>
    </div>
  );
};

const IndustrySetup: React.FC = () => {
  const seeded = getIndustryProfile();
  const [profile, setProfile] = useState<IndustryProfile>(
    seeded ?? {
      id: 'ind-1',
      name: '',
      geography: '',
      description: '',
      strategicPriorities: [],
      customerSegments: [],
      competitors: [],
      timeHorizons: [],
    }
  );
  const [error, setError] = useState<string>('');

  const handleChange = (field: keyof IndustryProfile) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [field]: e.target.value });
  };

  const handleListAdd = (field: keyof IndustryProfile) => (value: string) => {
    const arr = (profile[field] as string[]) ?? [];
    setProfile({ ...profile, [field]: [...arr, value] });
  };

  const handleListRemove = (field: keyof IndustryProfile) => (index: number) => {
    const arr = (profile[field] as string[]) ?? [];
    const newArr = arr.filter((_, i) => i !== index);
    setProfile({ ...profile, [field]: newArr });
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      setError('Industry name cannot be empty');
      return;
    }
    setError('');
    saveIndustryProfile(profile);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Industry Setup</h2>
      <form onSubmit={handleSave}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="name">Industry Name</label>
          <input
            id="name"
            type="text"
            value={profile.name}
            onChange={handleChange('name')}
            aria-label="industry-name"
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="geography">Geography</label>
          <input
            id="geography"
            type="text"
            value={profile.geography}
            onChange={handleChange('geography')}
            aria-label="industry-geography"
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={profile.description}
            onChange={handleChange('description')}
            aria-label="industry-description"
          />
        </div>
        <ListEditor
          label="Strategic Priorities"
          items={profile.strategicPriorities}
          onAdd={handleListAdd('strategicPriorities')}
          onRemove={handleListRemove('strategicPriorities')}
        />
        <ListEditor
          label="Customer Segments"
          items={profile.customerSegments}
          onAdd={handleListAdd('customerSegments')}
          onRemove={handleListRemove('customerSegments')}
        />
        <ListEditor
          label="Competitors"
          items={profile.competitors}
          onAdd={handleListAdd('competitors')}
          onRemove={handleListRemove('competitors')}
        />
        <ListEditor
          label="Time Horizons"
          items={profile.timeHorizons}
          onAdd={handleListAdd('timeHorizons')}
          onRemove={handleListRemove('timeHorizons')}
        />
        {error && <div style={{ color: 'red' }} role="alert">{error}</div>}
        <button type="submit" aria-label="save-button">Save</button>
      </form>
    </div>
  );
};

export default IndustrySetup;
