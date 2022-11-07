import { Asset } from "@/types";

// 20220903204823
// https://dev.elevator.umn.edu/defaultinstance/asset/viewAsset/623dee393392272653676222/true

const mockAsset: Asset = {
  title_1: [
    {
      fieldContents: "Test Asset",
      isPrimary: true,
    },
    {
      fieldContents: "Alt Title",
      isPrimary: false,
    },
  ],
  coolstuff_1: [
    {
      fieldContents: true,
      isPrimary: false,
    },
  ],
  creation_1: [
    {
      label: "A birthday",
      start: {
        text: "10/23/1985",
        numeric: "498873600",
      },
      end: {
        text: "",
        numeric: "",
      },
      isPrimary: false,
    },
  ],
  location_1: [
    {
      locationLabel: "Rarig",
      address: "Rarig Center",
      loc: {
        type: "Point",
        coordinates: [-93.2424052, 44.9703314],
      },
      isPrimary: false,
    },
  ],
  cascadeselect_1: [
    {
      fieldContents: {
        city: "faketown",
        state: "alberta",
        basecountry: "canada",
        neighborhood: "",
      },
      isPrimary: false,
    },
  ],
  relatedstuff_1: [
    {
      targetAssetId: "623dee383392272653676221",
      label: "",
      isPrimary: true,
    },
    {
      targetAssetId: "62e058363014725cb2193843",
      label: "",
      isPrimary: false,
    },
  ],
  globalsearch_1: [
    {
      fieldContents: "option 1",
      isPrimary: false,
    },
  ],
  sometags_1: [
    {
      tags: ["tag", "list", "is", "fun"],
      isPrimary: false,
    },
  ],
  bigtext_1: [
    {
      fieldContents: `
A grain elevator is a facility designed to stockpile or store grain. In the grain trade, the term "grain elevator" also describes a tower containing a bucket elevator or a pneumatic conveyor, which scoops up grain from a lower level and deposits it in a silo or other storage facility.

In most cases, the term "grain elevator" also describes the entire elevator complex, including receiving and testing offices, weighbridges, and storage facilities. It may also mean organizations that operate or control several individual elevators, in different locations. In Australia, the term describes only the lifting mechanism.

Before the advent of the grain elevator, grain was usually handled in bags rather than in bulk (large quantities of loose grain). Dart's Elevator was a major innovation. It was invented by Joseph Dart, a merchant, and Robert Dunbar, an engineer, in 1842 and 1843, in Buffalo, New York. Using the steam-powered flour mills of Oliver Evans as their model, they invented the marine leg, which scooped loose grain out of the hulls of ships and elevated it to the top of a marine tower.[1]

Early grain elevators and bins were often built of framed or cribbed wood, and were prone to fire. Grain-elevator bins, tanks, and silos are now usually made of steel or reinforced concrete. Bucket elevators are used to lift grain to a distributor or consignor, from which it falls through spouts and/or conveyors and into one or more bins, silos, or tanks in a facility. When desired, silos, bins, and tanks are emptied by gravity flow, sweep augers, and conveyors. As grain is emptied from bins, tanks, and silos, it is conveyed, blended, and weighted into trucks, railroad cars, or barges for shipment
`,
      isPrimary: false,
    },
  ],
  image_1: [
    {
      fileId: "623dee6471cc11744319be01",
      fileDescription: "",
      fileType: "jpeg",
      searchData: null,
      loc: null,
      sidecars: {
        ppm: "",
      },
      isPrimary: true,
    },
    {
      fileId: "62e0581e3014725cb2193841",
      fileDescription: "",
      fileType: "heic",
      searchData: "[]",
      loc: null,
      sidecars: {
        ppm: "",
      },
      isPrimary: false,
    },
  ],
  collapsedjoinrecord_1: [
    {
      targetAssetId: "62ec091e8927c27c3017ac82",
      label: null,
      isPrimary: true,
    },
  ],
  templateId: 68,
  readyForDisplay: true,
  collectionId: 25,
  availableAfter: null,
  modified: {
    date: "2022-08-30 21:27:46.000000",
    timezone_type: 3,
    timezone: "UTC",
  },
  modifiedBy: 1,
  createdBy: "",
  collectionMigration: null,
  deleted: false,
  deletedBy: null,
  deletedAt: null,
  csvBatch: null,
  relatedAssetCache: {
    "623dee383392272653676221": {
      primaryHandler: null,
      readyForDisplay: true,
      relatedAssetTitle: ["Test"],
    },
    "62e058363014725cb2193843": {
      primaryHandler: "62e058313014725cb2193842",
      readyForDisplay: true,
      relatedAssetTitle: ["Asset with Photo"],
    },
    "62ec091e8927c27c3017ac82": {
      primaryHandler: null,
      readyForDisplay: true,
      relatedAssetTitle: ["Colin McFadden"],
    },
  },
  firstFileHandlerId: "623dee6471cc11744319be01",
  firstObjectId: null,
  title: ["Test Asset", "Alt Title"],
  titleObject: "title_1",
};

export default mockAsset;
