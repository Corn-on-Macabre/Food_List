import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

  it("renders cuisine chips derived from loaded restaurants — not hardcoded (AC 2)", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Japanese" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mexican" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
  });

  it("All chip is active (aria-pressed=true) initially with no filter (AC 5)", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Japanese" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Mexican" })).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking a cuisine chip activates it and deactivates All (AC 3)", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Japanese" }));
    expect(screen.getByRole("button", { name: "Japanese" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking an already-active cuisine chip toggles it off — filter clears (AC 4)", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Japanese" }));
    fireEvent.click(screen.getByRole("button", { name: "Japanese" }));
    expect(screen.getByRole("button", { name: "Japanese" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking All chip when a cuisine is active clears the filter (AC 5)", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Mexican" }));
    expect(screen.getByRole("button", { name: "Mexican" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
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
    render(<App />);
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
    render(<App />);
    expect(screen.queryByRole("button", { name: "Any" })).not.toBeInTheDocument();
  });

  it("distance row is absent when coords is null and not denied (AC 6)", async () => {
    const { useGeolocation } = await import("../hooks");
    vi.mocked(useGeolocation).mockReturnValue({
      coords: null,
      loading: false,
      denied: false,
    });
    render(<App />);
    expect(screen.queryByRole("button", { name: "Any" })).not.toBeInTheDocument();
  });

  it("filtering by 5 mi shows only the near restaurant (AC 2)", () => {
    render(<App />);
    // All 3 pins initially
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "5 mi" }));
    // Only r-near (~3 mi) should be within 5 mi
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(1);
  });

  it("filtering by 10 mi shows near and mid but not far (AC 2)", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "10 mi" }));
    // r-near (~3 mi) and r-mid (~8 mi) within 10 mi; r-far (~20 mi) excluded
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(2);
  });

  it("combined cuisine + distance filter — Japanese within 10 mi (AC 8)", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Japanese" }));
    fireEvent.click(screen.getByRole("button", { name: "10 mi" }));
    // Only r-mid matches (Japanese + ~8 mi)
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(1);
  });

  it("clicking Any after a distance chip restores all pins (AC 4)", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "5 mi" }));
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Any" }));
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(3);
  });

  it("when coords transitions to null mid-session, distance filter suppressed and all pins visible (AC 7)", async () => {
    const { useGeolocation } = await import("../hooks");
    const { rerender } = render(<App />);
    // Distance filter active — only near pin visible
    fireEvent.click(screen.getByRole("button", { name: "5 mi" }));
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(1);

    // Coords lost mid-session (not denied, just unavailable)
    vi.mocked(useGeolocation).mockReturnValue({ coords: null, loading: false, denied: false });
    rerender(<App />);

    // Distance row should be hidden and all 3 pins should be visible
    expect(screen.queryByRole("button", { name: "Any" })).not.toBeInTheDocument();
    expect(screen.getAllByTestId("mock-pin")).toHaveLength(3);
  });
});
