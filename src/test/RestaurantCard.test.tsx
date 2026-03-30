import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RestaurantCard } from "../components/RestaurantCard";
import type { Restaurant } from "../types";

const mockRestaurant: Restaurant = {
  id: "pho-43",
  name: "Pho 43",
  tier: "loved",
  cuisine: "Vietnamese",
  lat: 33.4484,
  lng: -112.074,
  notes: "Best pho in Phoenix",
  googleMapsUrl: "https://www.google.com/maps/place/Pho+43/@33.4484,-112.074",
  dateAdded: "2024-01-15",
};

const mockRestaurantNoNotes: Restaurant = {
  id: "tacos-el-norte",
  name: "Tacos El Norte",
  tier: "recommended",
  cuisine: "Mexican",
  lat: 33.5,
  lng: -112.1,
  googleMapsUrl: "https://maps.google.com/?cid=9876543210",
  dateAdded: "2024-02-01",
};

describe("RestaurantCard", () => {
  describe("Google Maps link (AC 1, 2, 3, 4)", () => {
    it("renders the 'Open in Google Maps' link", () => {
      render(<RestaurantCard restaurant={mockRestaurant} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link).toBeInTheDocument();
    });

    it("sets href to restaurant.googleMapsUrl exactly (AC 4)", () => {
      render(<RestaurantCard restaurant={mockRestaurant} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link).toHaveAttribute("href", mockRestaurant.googleMapsUrl);
    });

    it("opens in a new tab via target='_blank' (AC 2)", () => {
      render(<RestaurantCard restaurant={mockRestaurant} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("has rel='noopener noreferrer' for security (AC 3)", () => {
      render(<RestaurantCard restaurant={mockRestaurant} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("uses the correct googleMapsUrl for a different restaurant (AC 4)", () => {
      render(<RestaurantCard restaurant={mockRestaurantNoNotes} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link).toHaveAttribute(
        "href",
        "https://maps.google.com/?cid=9876543210",
      );
    });

    it("falls back to '#' href for non-http(s) URLs to prevent XSS (security)", () => {
      const maliciousRestaurant: Restaurant = {
        ...mockRestaurant,
        googleMapsUrl: "javascript:alert(document.cookie)",
      };
      render(<RestaurantCard restaurant={maliciousRestaurant} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link).toHaveAttribute("href", "#");
    });
  });

  describe("card content", () => {
    it("renders the restaurant name", () => {
      render(<RestaurantCard restaurant={mockRestaurant} />);
      expect(screen.getByText("Pho 43")).toBeInTheDocument();
    });

    it("renders the cuisine type", () => {
      render(<RestaurantCard restaurant={mockRestaurant} />);
      expect(screen.getByText("Vietnamese")).toBeInTheDocument();
    });

    it("renders the tier badge", () => {
      render(<RestaurantCard restaurant={mockRestaurant} />);
      expect(screen.getByText("Loved")).toBeInTheDocument();
    });

    it("renders notes when present", () => {
      render(<RestaurantCard restaurant={mockRestaurant} />);
      expect(screen.getByText("Best pho in Phoenix")).toBeInTheDocument();
    });

    it("does not render notes section when notes is absent", () => {
      render(<RestaurantCard restaurant={mockRestaurantNoNotes} />);
      expect(
        screen.queryByText("Best pho in Phoenix"),
      ).not.toBeInTheDocument();
    });
  });

  describe("link styling (AC 5)", () => {
    it("link has CTA button classes including bg-blue-600", () => {
      render(<RestaurantCard restaurant={mockRestaurant} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link.className).toContain("bg-blue-600");
    });

    it("link has w-full for full-width tap target on mobile", () => {
      render(<RestaurantCard restaurant={mockRestaurant} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link.className).toContain("w-full");
    });

    it("link has focus ring classes for keyboard accessibility", () => {
      render(<RestaurantCard restaurant={mockRestaurant} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link.className).toContain("focus:ring-2");
    });
  });
});
