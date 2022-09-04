import { Asset } from "@/types";

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
  cascadeselect_1: [
    {
      fieldContents: {
        city: "faketown",
        state: "alberta",
        country: "canada",
        neighborhood: "",
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
      fieldContents:
        "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Posuere morbi leo urna molestie at. Euismod elementum nisi quis eleifend. Pellentesque nec nam aliquam sem et. Lacus suspendisse faucibus interdum posuere lorem ipsum dolor. Sed euismod nisi porta lorem mollis aliquam ut. Dolor magna eget est lorem ipsum dolor sit amet consectetur. Lacus sed viverra tellus in. Pulvinar etiam non quam lacus suspendisse. Mauris rhoncus aenean vel elit scelerisque mauris pellentesque pulvinar. Vehicula ipsum a arcu cursus vitae congue mauris.</p><p>Montes nascetur ridiculus mus mauris. At tellus at urna condimentum mattis pellentesque id nibh. Integer feugiat scelerisque varius morbi enim nunc. Commodo sed egestas egestas fringilla phasellus. Nam aliquam sem et tortor consequat id porta nibh. Blandit turpis cursus in hac habitasse platea dictumst. Id aliquet lectus proin nibh nisl condimentum id venenatis. Auctor elit sed vulputate mi sit amet mauris commodo quis. Fermentum et sollicitudin ac orci phasellus egestas tellus. Mauris cursus mattis molestie a iaculis. Odio ut enim blandit volutpat. Quam adipiscing vitae proin sagittis.</p><p>Lorem sed risus ultricies tristique nulla aliquet enim tortor at. Quis vel eros donec ac odio tempor orci dapibus ultrices. At urna condimentum mattis pellentesque id nibh. Enim sed faucibus turpis in eu mi. Aliquam nulla facilisi cras fermentum odio eu. Potenti nullam ac tortor vitae purus. Nisl condimentum id venenatis a condimentum vitae sapien. Eget est lorem ipsum dolor sit amet consectetur adipiscing. Etiam erat velit scelerisque in dictum. Tincidunt nunc pulvinar sapien et ligula ullamcorper malesuada. Adipiscing elit duis tristique sollicitudin. Nunc mattis enim ut tellus elementum sagittis vitae. Lobortis mattis aliquam faucibus purus. Morbi tincidunt ornare massa eget egestas purus viverra accumsan in. Gravida cum sociis natoque penatibus et. Volutpat commodo sed egestas egestas fringilla. Viverra nibh cras pulvinar mattis nunc sed blandit libero. Amet risus nullam eget felis. Enim sit amet venenatis urna cursus eget nunc scelerisque viverra. Ullamcorper malesuada proin libero nunc consequat interdum varius sit.</p>",
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
    date: "2022-08-04 18:22:03.000000",
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
  titleObject: "title_1",
};

export default mockAsset;
