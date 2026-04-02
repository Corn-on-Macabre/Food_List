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
