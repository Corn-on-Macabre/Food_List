import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollectionBanner } from './CollectionBanner';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockShareUrl = vi.fn<(title: string, url: string) => Promise<boolean>>();
vi.mock('../utils/share', () => ({
  shareUrl: (title: string, url: string) => mockShareUrl(title, url),
}));

const baseProps = {
  title: 'Visiting Phoenix? Start here',
  blurb: 'If you only have one dinner, make it count.',
  count: 10,
  onShareSuccess: vi.fn(),
};

describe('CollectionBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, blurb, and spot count', () => {
    render(<CollectionBanner {...baseProps} />);
    expect(screen.getByText(/Visiting Phoenix\? Start here/)).toBeInTheDocument();
    expect(screen.getByText('If you only have one dinner, make it count.')).toBeInTheDocument();
    expect(screen.getByText(/10 spots/)).toBeInTheDocument();
  });

  it('renders singular "spot" for a single-restaurant collection', () => {
    render(<CollectionBanner {...baseProps} count={1} />);
    expect(screen.getByText(/1 spot(?!s)/)).toBeInTheDocument();
  });

  it('omits the blurb line when blurb is null', () => {
    render(<CollectionBanner {...baseProps} blurb={null} />);
    expect(screen.queryByText('If you only have one dinner, make it count.')).not.toBeInTheDocument();
  });

  it('share button calls shareUrl with the title and fires onShareSuccess on success', async () => {
    mockShareUrl.mockResolvedValue(true);
    const onShareSuccess = vi.fn();
    render(<CollectionBanner {...baseProps} onShareSuccess={onShareSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share this collection' }));
    await waitFor(() => expect(onShareSuccess).toHaveBeenCalledTimes(1));
    expect(mockShareUrl).toHaveBeenCalledWith('Visiting Phoenix? Start here', window.location.href);
  });

  it('does not fire onShareSuccess when the share is cancelled', async () => {
    mockShareUrl.mockResolvedValue(false);
    const onShareSuccess = vi.fn();
    render(<CollectionBanner {...baseProps} onShareSuccess={onShareSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share this collection' }));
    await waitFor(() => expect(mockShareUrl).toHaveBeenCalled());
    expect(onShareSuccess).not.toHaveBeenCalled();
  });

  it('close button navigates back to the default map', () => {
    render(<CollectionBanner {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close collection' }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
