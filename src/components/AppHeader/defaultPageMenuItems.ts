import { MenuItemWithOptionalChildren } from "@/types";

const pageMenuItems: MenuItemWithOptionalChildren[] = [
  {
    name: "Home",
    href: "https://dev.elevator.umn.edu",
  },
  {
    name: "About",
    href: "https://dev.elevator.umn.edu/dcl/page/view/1",
  },
  {
    name: "Collections",
    children: [
      "Recent Collections", //label
      {
        name: "Weisman Art Museum",
        href: "https://dcl.elevator.umn.edu/search/s/f6200137-aee5-4a78-bf88-4c6f3689e06a",
      },
      {
        name: "American Studies, Dept. of",
        href: "https://dcl.elevator.umn.edu/search/s/5a3c5350-0e02-466f-8efb-3cd0b03bdc67",
      },
      null, // separator
      {
        name: "All Collections",
        href: "https://dcl.elevator.umn.edu/search/listCollections",
      },
    ],
  },
];

export default pageMenuItems;
