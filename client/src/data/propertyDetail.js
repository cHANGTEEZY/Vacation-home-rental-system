import { Bed } from "lucide-react";
import {
  Wifi,
  Tv,
  Snowflake,
  ParkingSquare,
  Beef,
  Flame,
  Bath,
  FireExtinguisher,
  BriefcaseMedical,
  WashingMachine,
  apartment,
  cottage,
  tent,
  home,
  hotel,
} from "../assets/Index";

export const propertyDetail = [
  {
    id: 1,
    title: "Title",
    placeHolder: "Enter Title for your nest",
    type: "text",
  },
  {
    id: 2,
    title: "Location",
    placeHolder: "Where is this based",
    type: "text",
  },
  {
    id: 3,
    title: "Price",
    placeHolder: "Enter the price per night",
    type: "number",
  },
  {
    id: 4,
    title: "Guests",
    placeHolder: "Enter number of guests",
    type: "number",
  },
  {
    id: 5,
    title: "Bedrooms",
    placeHolder: "Enter number of Bedrooms",
    type: "number",
  },
  {
    id: 6,
    title: "Beds",
    placeHolder: "Enter number of Beds",
    type: "number",
  },
  {
    id: 7,
    title: "Bathrooms",
    placeHolder: "Enter number of Bathroom",
    type: "number",
  },
  {
    id: 8,
    title: "Kitchens",
    placeHolder: "Enter number of Kitchens",
    type: "number",
  },
  {
    id: 9,
    title: "Swimming Pool",
    placeHolder: "Enter number of Guests",
    type: "number",
  },
];

export const propertyAmenities = [
  {
    id: 1,
    title: "Wifi",
    icons: Wifi,
  },
  {
    id: 2,
    title: "TV",
    icons: Tv,
  },
  {
    id: 3,
    title: "Air conditioning",
    icons: Snowflake,
  },
  {
    id: 4,
    title: "Washing Machine",
    icons: WashingMachine,
  },
  {
    id: 5,
    title: "BBQ grill",
    icons: Beef,
  },

  {
    id: 6,
    title: "Fire pit",
    icons: Flame,
  },
  {
    id: 7,
    title: "Bath tub",
    icons: Bath,
  },
  {
    id: 8,
    title: "Fire Extinguisher",
    icons: FireExtinguisher,
  },
  { id: 9, title: "First aid kit", icons: BriefcaseMedical },
  {
    id: 10,
    title: "Free parking on premises",
    icons: ParkingSquare,
  },
];

export const realEstateModels = [
  {
    id: 1,
    icon: home,
    title: "House",
  },
  {
    id: 2,
    icon: hotel,
    title: "Hotel",
  },
  {
    id: 3,
    icon: cottage,
    title: "Cottage",
  },
  {
    id: 4,
    icon: apartment,
    title: "Apartment",
  },
  {
    id: 5,
    icon: tent,
    title: "Tent",
  },
];
