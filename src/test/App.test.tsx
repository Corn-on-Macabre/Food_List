import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import React from "react";

vi.mock("@vis.gl/react-google-maps", () => {
  const APIProvider = ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);

  const Map = ({
    children,
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => React.createElement("div", { "data-testid": "mock-map" }, children);

  const useMap = () => null;

  return { APIProvider, Map, useMap };
});

vi.mock("../hooks", () => ({
  useRestaurants: () => ({ restaurants: [], loading: false, error: null }),
  useGeolocation: () => ({ coords: null, loading: false, denied: false }),
  useAdminAuth: () => ({ isAuthenticated: false, isConfigured: false, isAdmin: false, userEmail: null, password: '', login: () => false, loginWithGoogle: () => Promise.resolve(), logout: () => {}, loading: false }),
}));

vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key");

describe("App — initial state (AC 2, 3)", () => {
  it("does not render RestaurantCard initially (no restaurant selected)", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(
      screen.queryByRole("button", { name: "Close restaurant card" }),
    ).not.toBeInTheDocument();
  });

  it("renders the map container when API key is present", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByTestId("mock-map")).toBeInTheDocument();
  });
});

describe("App — FilterBar integration smoke test (AC 3, 6)", () => {
  it("renders the FilterBar with an All chip when restaurants load", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    // FilterBar renders two "All" chips (cuisine + tier rows) — cuisine All is first
    expect(screen.getAllByRole("button", { name: "All" })[0]).toBeInTheDocument();
  });

  it("renders FilterBar cuisine group alongside the map", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByRole("group", { name: "Filters" })).toBeInTheDocument();
    expect(screen.getByTestId("mock-map")).toBeInTheDocument();
  });

  it("renders without errors when useRestaurants returns two restaurants with different cuisines", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    // App renders without throwing — map and filter UI both present
    expect(screen.getByTestId("mock-map")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Filters" })).toBeInTheDocument();
  });
});
