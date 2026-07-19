// Placeholder data shaped like the real Stay22 /v2/accommodations response,
// used to build the UI before the /api/search + /api/valuate routes exist.
export type MockHotel = {
  id: string;
  name: string;
  thumbnail: string;
  address: string;
  rating: number | null;
  hotelStars: number | null;
  price: number;
};

export const mockHotels: MockHotel[] = [
  {
    id: "bc7dc13112a13f6c374e5d8562e2f1d8.0000",
    name: "High Rise Skyline Downtown Condo Pool & Free Parking",
    thumbnail:
      "https://q-xx.bstatic.com/xdata/images/hotel/max500/841773690.jpg?k=4a129bb1e7e7c5fd83f235b1a5c62d67453e9d15c98d3ccb4518b6d03f3aec63&o=&a=1607597",
    address: "1188 Rue Saint-Antoine Ouest, Montréal",
    rating: 10,
    hotelStars: 4,
    price: 189,
  },
  {
    id: "009f9775df91f9ba8d1329211f3dd4ef.0000",
    name: "FI Grand Prix Weekend — Condo Downtown",
    thumbnail:
      "https://media.vrbo.com/lodging/118000000/117130000/117120300/117120232/3256e253.jpg?impolicy=ccrop&w=1000&h=666&q=medium",
    address: "Montréal, H3G 2H1",
    rating: null,
    hotelStars: null,
    price: 241,
  },
  {
    id: "95db20ae45dc89a92c641ef0fe45b55a.0000",
    name: "Cozy Studio in the Heart of MTL",
    thumbnail:
      "https://media.vrbo.com/lodging/122000000/121430000/121424300/121424215/faad3e6e.jpg?impolicy=ccrop&w=1000&h=666&q=medium",
    address: "Montréal, H3G 1V3",
    rating: null,
    hotelStars: null,
    price: 96,
  },
  {
    id: "faf6a35f0fb9462b8c40e6d43ebba032.0000",
    name: "Charming 2BR Apt in DT MTL",
    thumbnail:
      "https://media.vrbo.com/lodging/133000000/132630000/132624500/132624469/12dbd263_edited_270a.jpg?impolicy=ccrop&w=1000&h=666&q=medium",
    address: "Montréal, H3C 0X6",
    rating: null,
    hotelStars: null,
    price: 158,
  },
];
