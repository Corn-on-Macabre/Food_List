import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import React from "react";
import type { Restaurant } from "../types";

const mockRestaurants: Restaurant[] = [
  {
    id: "r1",
    name: "Tokyo Ramen",
    tier: "loved",
    cuisine: "Japanese",
    lat: 33.44,
    lng: -112.07,
    googleMapsUrl: "https://maps.google.com/?q=tokyo-ramen",
    dateAdded: "2024-01-01",
  },
  {
    id: "r2",
    name: "Tacos El Norte",
    tier: "recommended",
    cuisine: "Mexican",
    lat: 33.5,
    lng: -112.1,
    googleMapsUrl: "https://maps.google.com/?q=tacos",
    dateAdded: "2024-01-02",
  },
];

vi.mock("@vis.gl/react-google-maps", () => {
  const APIProvider = ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);
  const Map = ({
    children,
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => React.createElement("div", { "data-testid": "mock-map" }, children);
  const AdvancedMarker = ({ children }: { children?: React.ReactNode; [key: string]: unknown }) =>
    React.createElement("div", { "data-testid": "mock-pin" }, children);
  const Pin = () => null;
  const useMap = () => null;
  return { APIProvider, Map, AdvancedMarker, Pin, useMap };
});

vi.mock("../hooks", () => ({
  useRestaurants: vi.fn(() => ({ restaurants: [], loading: false, error: null })),
  useGeolocation: vi.fn(() => ({ coords: null, loading: false, denied: false })),
}));

vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key");

describe("App — FilterBar cuisine filtering (AC 2, 3, 4, 5, 6)", () => {
  beforeEach(async () => {
    const { useRestaurants, useGeolocation } = await import("../hooks");
    vi.mocked(useRestaurants).mockReturnValue({
      restaurants: mockRestaurants,
      loading: false,
      error: null,
    });
    vi.mocked(useGeolocation).mockReturnValue({
      coords: null,
      loading: false,
      denied: false,
    });
  });

  // Helper: get the cuisine row "All" chip (first "All" button in DOM)
  const getCuisineAllChip = () => screen.getAllByRole("button", { name: "All" })[0];

  it("renders cuisine chips derived from loaded restaurants — not hardcoded (AC 2)", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Japanese" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mexican" })).toBeInTheDocument();
    expect(getCuisineAllChip()).toBeInTheDocument();
  });

  it("All chip is active (aria-pressed=true) initially with no filter (AC 5)", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(getCuisineAllChip()).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Japanese" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Mexican" })).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking a cuisine chip activates it and deactivates All (AC 3)", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Japanese" }));
    expect(screen.getByRole("button", { name: "Japanese" })).toHaveAttribute("aria-pressed", "true");
    expect(getCuisineAllChip()).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking an already-active cuisine chip toggles it off — filter clears (AC 4)", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Japanese" }));
    fireEvent.click(screen.getByRole("button", { name: "Japanese" }));
    expect(screen.getByRole("button", { name: "Japanese" })).toHaveAttribute("aria-pressed", "false");
    expect(getCuisineAllChip()).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking All chip when a cuisine is active clears the filter (AC 5)", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Mexican" }));
    expect(screen.getByRole("button", { name: "Mexican" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(getCuisineAllChip());
    expect(getCuisineAllChip()).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Mexican" })).toHaveAttribute("aria-pressed", "false");
  });
});

// Restaurants at calculated distances from Phoenix center (33.4484, -112.0740):
// r-near:  lat 33.4919, lng -112.0740  → ~3.0 mi north  → within 5 mi ✓
// r-mid:   lat 33.4484, lng -111.9534  → ~6.9 mi east   → within 10 mi ✓, outside 5 mi ✓
// r-far:   lat 33.2148, lng -112.0740  → ~16.1 mi south → within 30 mi ✓, outside 10 mi ✓
const distanceRestaurants: import("../types").Restaurant[] = [
  {
    id: "r-near",
    name: "Near Place",
    tier: "loved",
    cuisine: "American",
    lat: 33.4919,
    lng: -112.074,
    googleMapsUrl: "https://maps.google.com/",
    dateAdded: "2024-01-01",
  },
  {
    id: "r-mid",
    name: "Mid Place",
    tier: "recommended",
    cuisine: "Japanese",
    lat: 33.4484,
    lng: -111.9534,
    googleMapsUrl: "https://maps.google.com/",
    dateAdded: "2024-01-01",
  },
  {
    id: "r-far",
    name: "Far Place",
    tier: "on_my_radar",
    cuisine: "Mexican",
    lat: 33.2148,
    lng: -112.074,
    googleMapsUrl: "https://maps.google.com/",
    dateAdded: "2024-01-01",
  },
];

const phoenixCoords = { lat: 33.4484, lng: -112.074 };

describe("App — Distance filter integration (AC 2, 5, 6, 8)", () => {
  beforeEach(async () => {
    const { useRestaurants, useGeolocation } = await import("../hooks");
    vi.mocked(useRestaurants).mockReturnValue({
      restaurants: distanceRestaurants,
      loading: false,
      error: null,
    });
    vi.mocked(useGeolocation).mockReturnValue({
      coords: phoenixCoords,
      loading: false,
      denied: false,
    });
  });

  it("distance chips render when coords are available (AC 1)", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Any" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5 mi" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10 mi" })).toBeInTheDocument();
  });

  it("distance row is absent when geoDenied is true (AC 5)", async () => {
    const { useGeolocation } = await import("../hooks");
    vi.mocked(useGeolocation).mockReturnValue({
      coords: null,
      loading: false,
      denied: true,
    });
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.queryByRole("button", { name: "Any" })).not.toBeInTheDocument();
  });

  it("distance row is absent when coords is null and not denied (AC 6)", async () => {
    const { useGeolocation } = await import("../hooks");
    vi.mocked(useGeolocation).mockReturnValue({
      coords: null,
      loading: false,
      denied: false,
    });
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.queryByRole("button", { name: "Any" })).not.toBeInTheDocument();
  });

  it("filtering by 5 mi shows only the near restaurant (AC 2)", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    // All 3 pins initially
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "5 mi" }));
    // Only r-near (~3 mi) should be within 5 mi
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(1);
  });

  it("filtering by 10 mi shows near and mid but not far (AC 2)", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "10 mi" }));
    // r-near (~3 mi) and r-mid (~8 mi) within 10 mi; r-far (~20 mi) excluded
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(2);
  });

  it("combined cuisine + distance filter — Japanese within 10 mi (AC 8)", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Japanese" }));
    fireEvent.click(screen.getByRole("button", { name: "10 mi" }));
    // Only r-mid matches (Japanese + ~8 mi)
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(1);
  });

  it("clicking Any after a distance chip restores all pins (AC 4)", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "5 mi" }));
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Any" }));
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(3);
  });

  it("when coords transitions to null mid-session, distance filter suppressed and all pins visible (AC 7)", async () => {
    const { useGeolocation } = await import("../hooks");
    const { rerender } = render(<MemoryRouter><App /></MemoryRouter>);
    // Distance filter active — only near pin visible
    fireEvent.click(screen.getByRole("button", { name: "5 mi" }));
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(1);

    // Coords lost mid-session (not denied, just unavailable)
    vi.mocked(useGeolocation).mockReturnValue({ coords: null, loading: false, denied: false });
    rerender(<MemoryRouter><App /></MemoryRouter>);

    // Distance row should be hidden and all 3 pins should be visible
    expect(screen.queryByRole("button", { name: "Any" })).not.toBeInTheDocument();
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(3);
  });
});

describe("App — Tier filter integration", () => {
  beforeEach(async () => {
    const { useRestaurants, useGeolocation } = await import("../hooks");
    vi.mocked(useRestaurants).mockReturnValue({
      restaurants: distanceRestaurants,
      loading: false,
      error: null,
    });
    vi.mocked(useGeolocation).mockReturnValue({
      coords: null,
      loading: false,
      denied: false,
    });
  });

  it("clicking 'Loved It' shows only loved restaurants (D2.1)", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    // All 3 pins initially
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Loved It" }));
    // Only r-near has tier "loved"
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(1);
  });

  it("clicking 'Loved It' then 'American' shows the one matching restaurant (D2.2)", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Loved It" }));
    fireEvent.click(screen.getByRole("button", { name: "American" }));
    // r-near is loved+American — exactly 1 match
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(1);
  });

  it("clicking 'Loved It' then 'Japanese' shows zero results (no loved+Japanese exists) (D2.2)", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Loved It" }));
    fireEvent.click(screen.getByRole("button", { name: "Japanese" }));
    // r-near is loved+American, r-mid is recommended+Japanese → no restaurant is loved+Japanese
    expect(screen.queryAllByTestId("mock-pin")).toHaveLength(0);
  });

  it("clicking 'Worth Recommending' shows only recommended restaurants", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Worth Recommending" }));
    // Only r-mid has tier "recommended"
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(1);
  });

  it("clicking 'Want to Go' shows only on_my_radar restaurants", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Want to Go" }));
    // Only r-far has tier "on_my_radar"
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(1);
  });

  it("clicking 'Clear Filters' after 'Loved It' resets tier — all pins visible (D2.4)", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Loved It" }));
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(3);
    // Tier "All" chip (second "All" button) should be active
    const tierAllChip = screen.getAllByRole("button", { name: "All" })[1];
    expect(tierAllChip).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Loved It" })).toHaveAttribute("aria-pressed", "false");
  });

  it("'Clear Filters' appears when tier is the only active filter (D2.5)", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.queryByRole("button", { name: "Clear all filters" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Loved It" }));
    expect(screen.getByRole("button", { name: "Clear all filters" })).toBeInTheDocument();
  });
});

describe("App — Clear Filters integration (AC 1, 2, 3, 4)", () => {
  beforeEach(async () => {
    const { useRestaurants, useGeolocation } = await import("../hooks");
    vi.mocked(useRestaurants).mockReturnValue({
      restaurants: mockRestaurants,
      loading: false,
      error: null,
    });
    vi.mocked(useGeolocation).mockReturnValue({
      coords: null,
      loading: false,
      denied: false,
    });
  });

  it("Clear Filters button absent when no filter active", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.queryByRole("button", { name: "Clear all filters" })).not.toBeInTheDocument();
  });

  it("Clear Filters appears after cuisine chip clicked", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Japanese" }));
    expect(screen.getByRole("button", { name: "Clear all filters" })).toBeInTheDocument();
  });

  it("clicking Clear Filters resets cuisine filter — All chip active, selected chip inactive", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Japanese" }));
    expect(screen.getByRole("button", { name: "Japanese" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(screen.getByRole("button", { name: "Japanese" })).toHaveAttribute("aria-pressed", "false");
    // First "All" is the cuisine row All chip
    expect(screen.getAllByRole("button", { name: "All" })[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("Clear Filters button disappears after clearing filters", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Japanese" }));
    expect(screen.getByRole("button", { name: "Clear all filters" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(screen.queryByRole("button", { name: "Clear all filters" })).not.toBeInTheDocument();
  });
});
