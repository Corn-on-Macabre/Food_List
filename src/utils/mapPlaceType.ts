const PLACE_TYPE_MAP: Record<string, string> = {
  restaurant: 'American',           // fallback if no specific type
  mexican_restaurant: 'Mexican',
  japanese_restaurant: 'Japanese',
  italian_restaurant: 'Italian',
  chinese_restaurant: 'Chinese',
  thai_restaurant: 'Thai',
  indian_restaurant: 'Indian',
  french_restaurant: 'French',
  vietnamese_restaurant: 'Vietnamese',
  korean_restaurant: 'Korean',
  mediterranean_restaurant: 'Mediterranean',
  american_restaurant: 'American',
  burger_restaurant: 'Burgers',
  pizza_restaurant: 'Pizza',
  seafood_restaurant: 'Seafood',
  steak_house: 'Steakhouse',
  sushi_restaurant: 'Sushi',
  ramen_restaurant: 'Japanese',
  breakfast_restaurant: 'Breakfast',
  cafe: 'Cafe',
  bar: 'Bar',
  bakery: 'Bakery',
};

export function mapPlaceTypeToCuisine(types: string[]): string {
  for (const type of types) {
    const cuisine = PLACE_TYPE_MAP[type];
    if (cuisine) return cuisine;
  }
  return 'Other';
}
