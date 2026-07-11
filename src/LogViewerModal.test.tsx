import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LogViewerModal from './LogViewerModal';

describe('LogViewerModal', () => {
  let mockEventSource: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEventSource = {
      close: vi.fn(),
      onmessage: null,
      onerror: null,
    };
    class MockEventSource {
      close = mockEventSource.close;
      constructor(...args: any[]) {
        mockEventSource.constructorSpy(...args);
      }
      set onmessage(fn: any) { mockEventSource.onmessage = fn; }
      set onerror(fn: any) { mockEventSource.onerror = fn; }
    }
    global.EventSource = MockEventSource as any;
    mockEventSource.constructorSpy = vi.fn();
    global.EventSource = MockEventSource as any;
  });

  it('renders modal and connects to EventSource', () => {
    render(<LogViewerModal onClose={vi.fn()} />);

    expect(mockEventSource.constructorSpy).toHaveBeenCalledWith('/api/logs/extraction/stream');
    expect(screen.getByText('Extraction Logs')).toBeInTheDocument();
  });

  it('appends logs when receiving messages', async () => {
    render(<LogViewerModal onClose={vi.fn()} />);

    await act(async () => {
      if (mockEventSource.onmessage) {
        mockEventSource.onmessage({ data: 'Log message 1' });
        mockEventSource.onmessage({ data: 'Log message 2' });
      }
    });

    expect(screen.getByText(/Log message 1/)).toBeInTheDocument();
    expect(screen.getByText(/Log message 2/)).toBeInTheDocument();
  });

  it('closes EventSource on unmount', () => {
    const { unmount } = render(<LogViewerModal onClose={vi.fn()} />);
    unmount();
    expect(mockEventSource.close).toHaveBeenCalled();
  });
});
