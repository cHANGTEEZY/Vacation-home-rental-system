import { Heart } from "lucide-react";
import {
  IdCard,
  ShieldHalf,
  House,
  TicketPlus,
  MessageCircle,
  HandHeart,
} from "../assets/Index";

const accountGrid = [
  {
    id: 1,
    title: "Personal info",
    description: "Provide personal details and how we can reach you",
    icon: IdCard,
    iconSize: 38,
    iconStrokeWidth: 1.3,
    link: "personal-info",
  },
  {
    id: 2,
    title: "Login & Security",
    description: "Update your password & secure your account",
    icon: ShieldHalf,
    iconSize: 38,
    iconStrokeWidth: 1.3,
    link: "login-and-security",
  },
  {
    id: 3,
    title: "Preferences",
    description: "Add your preferences for customized recommendations",
    icon: HandHeart,
    iconSize: 38,
    iconStrokeWidth: 1.3,
    link: "preferences",
  },
  {
    id: 4,
    title: "Messages",
    description: "Check messages from your host or client",
    icon: MessageCircle,
    iconSize: 38,
    iconStrokeWidth: 1.3,
    link: "messages",
  },
  {
    id: 5,
    title: "Bookings",
    description:
      "Manage your upcoming and past bookings, and view details of your reservations.",
    icon: TicketPlus,
    iconSize: 38,
    iconStrokeWidth: 1.3,
    link: "booking",
  },
  {
    id: 6,
    title: "Hosting",
    description:
      "Manage your listings, check your bookings, and connect with guests.",
    icon: House,
    iconSize: 38,
    iconStrokeWidth: 1.3,
    link: "nestify",
  },
  {
    id: 7,
    title: "Wishlists & Favourites",
    description: "Add properties you want to stay or was your favourite.",
    icon: Heart,
    iconSize: 38,
    iconStrokeWidth: 1.3,
    link: "wishlists",
  },
  {
    id: 8,
    title: "Visited Properties & Reviews",
    description: "View your visited properties and Review it",
    icon: Heart,
    iconSize: 38,
    iconStrokeWidth: 1.3,
    link: "Visited-properties",
  },
];

const nestifySetupDescription = [
  {
    title: "One-to-one guidance from a Superhost",
    description:
      "We’ll match you with a Superhost in your area, who’ll guide you from your first question to your first guest—by phone, video call, or chat.",
  },
  {
    title: "An experienced guest for your first booking",
    description:
      "For your first booking, you can choose to welcome an experienced guest who has at least three stays and a good track record on Staynest.",
  },
  {
    title: "Specialized support from Staynest",
    description:
      "New Hosts get one-tap access to specially trained Community Support agents who can help with everything from account issues to billing support.",
  },
];

const faqData = {
  rows: [
    {
      title: "Is my place right for Nestify",
      content:
        "Nestify guests are interested in all kinds of places. We have listings for tiny homes, cabins, treehouses, and more.",
    },
    {
      title: "Do I have to host all the time?",
      content:
        "Not at all—you control your calendar. You can host once a year, a few nights a month, or more often.",
    },
    {
      title: "How much should I interact with guests?",
      content:
        "It's up to you but interacting with the guest is a good idea lol",
    },
    {
      title: "Any tips on being a great Staynest Host?",
      content:
        "Getting the basics down goes a long way. Keep your place clean, respond to guests promptly, and provide necessary amenities, like fresh towels. ",
    },
  ],
  styles: {
    bgColor: "rgb(247, 247, 247)",
    rowTitleTextSize: "17px",
    // rowContentPaddingTop: "20px",
    // rowContentPaddingBottom: "20px",
    // rowContentPaddingLeft: "50px",
    rowContentTextSize: "13px",
    rowContentColor: "grey",
  },
  config: {
    animate: true,
    arrowIcon: "V",
    openOnload: 0,
    expandIcon: "+",
    collapseIcon: "-",
  },
};

export { accountGrid, faqData, nestifySetupDescription };
