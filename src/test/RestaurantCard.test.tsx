import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RestaurantCard } from "../components/RestaurantCard";
import type { Restaurant } from "../types";

const noop = () => {};

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
      render(<RestaurantCard restaurant={mockRestaurant} onDismiss={noop} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link).toBeInTheDocument();
    });

    it("sets href to restaurant.googleMapsUrl exactly (AC 4)", () => {
      render(<RestaurantCard restaurant={mockRestaurant} onDismiss={noop} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link).toHaveAttribute("href", mockRestaurant.googleMapsUrl);
    });

    it("opens in a new tab via target='_blank' (AC 2)", () => {
      render(<RestaurantCard restaurant={mockRestaurant} onDismiss={noop} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("has rel='noopener noreferrer' for security (AC 3)", () => {
      render(<RestaurantCard restaurant={mockRestaurant} onDismiss={noop} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("uses the correct googleMapsUrl for a different restaurant (AC 4)", () => {
      render(<RestaurantCard restaurant={mockRestaurantNoNotes} onDismiss={noop} />);
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
      render(<RestaurantCard restaurant={maliciousRestaurant} onDismiss={noop} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link).toHaveAttribute("href", "#");
    });
  });

  describe("card content", () => {
    it("renders the restaurant name", () => {
      render(<RestaurantCard restaurant={mockRestaurant} onDismiss={noop} />);
      expect(screen.getByText("Pho 43")).toBeInTheDocument();
    });

    it("renders the cuisine type", () => {
      render(<RestaurantCard restaurant={mockRestaurant} onDismiss={noop} />);
      expect(screen.getByText("Vietnamese")).toBeInTheDocument();
    });

    it("renders the tier badge", () => {
      render(<RestaurantCard restaurant={mockRestaurant} onDismiss={noop} />);
      expect(screen.getByText("Loved")).toBeInTheDocument();
    });

    it("renders notes when present", () => {
      render(<RestaurantCard restaurant={mockRestaurant} onDismiss={noop} />);
      expect(screen.getByText("Best pho in Phoenix")).toBeInTheDocument();
    });

    it("does not render notes section when notes is absent", () => {
      render(<RestaurantCard restaurant={mockRestaurantNoNotes} onDismiss={noop} />);
      expect(
        screen.queryByText("Best pho in Phoenix"),
      ).not.toBeInTheDocument();
    });
  });

  describe("link styling (AC 5)", () => {
    it("link has amber CTA class — not blue (blue is reserved for Recommended tier)", () => {
      render(<RestaurantCard restaurant={mockRestaurant} onDismiss={noop} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link.className).toContain("bg-amber-700");
      expect(link.className).not.toContain("bg-blue");
    });

    it("link has w-full for full-width tap target on mobile", () => {
      render(<RestaurantCard restaurant={mockRestaurant} onDismiss={noop} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link.className).toContain("w-full");
    });

    it("link has focus-visible ring classes for keyboard accessibility", () => {
      render(<RestaurantCard restaurant={mockRestaurant} onDismiss={noop} />);
      const link = screen.getByRole("link", { name: "Open in Google Maps" });
      expect(link.className).toContain("focus-visible:ring-2");
    });
  });

  describe("dismissal (AC 1, 4, 5)", () => {
    it("calls onDismiss when close button is clicked (AC 1)", () => {
      const onDismiss = vi.fn();
      render(<RestaurantCard restaurant={mockRestaurant} onDismiss={onDismiss} />);
      fireEvent.click(screen.getByRole("button", { name: "Close restaurant card" }));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("close button has aria-label for screen readers (AC 4)", () => {
      render(<RestaurantCard restaurant={mockRestaurant} onDismiss={noop} />);
      expect(
        screen.getByRole("button", { name: "Close restaurant card" }),
      ).toBeInTheDocument();
    });

    it("root div stops propagation to prevent map background click handler (AC 2, 3)", () => {
      const parentHandler = vi.fn();
      render(
        <div onClick={parentHandler}>
          <RestaurantCard restaurant={mockRestaurant} onDismiss={noop} />
        </div>,
      );
      const card = screen.getByRole("button", { name: "Close restaurant card" }).closest(".fixed");
      expect(card).not.toBeNull();
      fireEvent.click(card!);
      expect(parentHandler).not.toHaveBeenCalled();
    });

    it("clicking close button fires onDismiss once and does not bubble to parent", () => {
      const onDismiss = vi.fn();
      const parentHandler = vi.fn();
      render(
        <div onClick={parentHandler}>
          <RestaurantCard restaurant={mockRestaurant} onDismiss={onDismiss} />
        </div>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Close restaurant card" }));
      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(parentHandler).not.toHaveBeenCalled();
    });
  });
});
