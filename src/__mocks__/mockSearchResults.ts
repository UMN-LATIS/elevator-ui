import { Search } from "@/types";

const mockSearch: Search = {
  searchResults: [
    "623dee393392272653676222",
    "62ec091e8927c27c3017ac82",
    "62ec091d8927c27c3017ac81",
    "62e058363014725cb2193843",
    "62ce916f73e49b009f6eba61",
    "62b5d844d69ae9593f2ff493",
    "62b5d843d69ae9593f2ff491",
    "62b5d843d69ae9593f2ff492",
    "575ee4ceba98a87472f3e030",
    "62aa4a1f48559b1676518831",
    "62aa49cdc8a62025d5561fc2",
    "62aa49a952bcef092116ad11",
    "62aa48cea50d49741c45dcd1",
    "62aa48ab39557c5715380c71",
    "62aa486eb5bf7f411a26e4d1",
    "62aa484d0ac5ac79e522a912",
    "62aa481fc9011c6a3c789451",
    "62aa47daed410814872ac541",
    "62aa4728c8a62025d5561fc1",
    "62aa46a20ac5ac79e522a911",
    "58bb077aba98a87e062c075c",
    "623dee383392272653676221",
    "623cc48b24a3c21bd413e6e1",
    "6234e803fde381590d3948e1",
    "6206d3b82c016935a8202991",
    "61f448799be8290c9e1eefd1",
    "61e99853485216512409d081",
    "61e99800f247800e6c6f4f41",
    "61e997bba74a3f592746a9c1",
    "61d33d5b008fac0769195081",
  ],
  totalResults: 11311,
  searchId: "bb15c171-15dd-4f74-b5e4-d7ac9dffc4dc",
  matches: [
    {
      dates: [
        {
          label: "Image",
          dateAsset: [
            {
              end: {
                text: "",
                numeric: "",
              },
              loc: {
                type: "Point",
                coordinates: [-71.296775, 42.4731111111111],
              },
              label: "File Creation",
              start: {
                text: "2021:08:20 20:10:13",
                numeric: "1629490213",
              },
              fileId: "623dee6471cc11744319be01",
              fileType: "jpeg",
              sidecars: {
                ppm: "",
              },
              isPrimary: true,
              searchData: null,
              fileDescription: "",
            },
            {
              end: {
                text: "",
                numeric: "",
              },
              loc: {
                type: "Point",
                coordinates: [25.2816805555556, 54.6761472222222],
              },
              label: "File Creation",
              start: {
                text: "2022:05:27 09:59:17",
                numeric: "1653645557",
              },
              fileId: "62e0581e3014725cb2193841",
              fileType: "heic",
              sidecars: {
                ppm: "",
              },
              isPrimary: false,
              searchData: "[]",
              fileDescription: "",
            },
          ],
        },
      ],
      title: "Test Asset",
      entries: [
        {
          label: "Related Stuff",
          entries: ["Test", "Asset with Photo"],
          Related_asset: true,
        },
        {
          label: "Collapsed Join Record",
          entries: ["Colin McFadden"],
          Related_asset: true,
        },
      ],
      objectId: "623dee393392272653676222",
      locations: [
        {
          label: "Image",
          entries: [
            {
              loc: {
                type: "Point",
                coordinates: [-71.296775, 42.4731111111111],
              },
              fileId: "623dee6471cc11744319be01",
              fileType: "jpeg",
              sidecars: {
                ppm: "",
              },
              isPrimary: true,
              searchData: null,
              fileDescription: "",
            },
            {
              loc: {
                type: "Point",
                coordinates: [25.2816805555556, 54.6761472222222],
              },
              fileId: "62e0581e3014725cb2193841",
              fileType: "heic",
              sidecars: {
                ppm: "",
              },
              isPrimary: false,
              searchData: "[]",
              fileDescription: "",
            },
          ],
        },
      ],
      fileAssets: 3,
      lastModified: "2022-08-04 18:22:03",
      primaryHandlerId: "623dee6471cc11744319be01",
      primaryHandlerTiny:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/10eb91344711cc1746eed326-tiny",
      primaryHandlerType: "ImageHandler",
      primaryHandlerTiny2x:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/10eb91344711cc1746eed326-tiny2x",
      primaryHandlerThumbnail:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/10eb91344711cc1746eed326-thumbnail",
      primaryHandlerThumbnail2x:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/10eb91344711cc1746eed326-thumbnail2x",
      collectionHierarchy: [
        {
          id: 25,
          title: "Blank Generation",
        },
      ],
      template: {
        name: "All Fields Test",
        id: 68,
      },
    },
    {
      dates: [],
      title: "Colin McFadden",
      entries: [
        {
          Text: true,
          label: "Role",
          entries: ["Owner"],
        },
      ],
      objectId: "62ec091e8927c27c3017ac82",
      locations: [],
      lastModified: "2022-08-04 17:59:58",
      collectionHierarchy: [
        {
          id: 25,
          title: "Blank Generation",
        },
      ],
      template: {
        name: "Join Template",
        id: 72,
      },
    },
    {
      dates: [],
      title: "Colin McFadden",
      entries: [
        {
          Date: true,
          label: "Birthday",
          entries: ["11/25/1981"],
        },
      ],
      objectId: "62ec091d8927c27c3017ac81",
      locations: [],
      lastModified: "2022-08-04 17:59:57",
      collectionHierarchy: [
        {
          id: 25,
          title: "Blank Generation",
        },
      ],
      template: {
        name: "Person",
        id: 71,
      },
    },
    {
      dates: [
        {
          label: "Photo",
          dateAsset: [
            {
              end: {
                text: "",
                numeric: "",
              },
              loc: {
                type: "Point",
                coordinates: [-93.0835333333333, 44.9622388888889],
              },
              label: "File Creation",
              start: {
                text: "2022:07:16 12:47:44",
                numeric: "1657975664",
              },
              fileId: "62e058313014725cb2193842",
              fileType: "heic",
              sidecars: {
                ppm: "",
              },
              isPrimary: true,
              searchData: null,
              fileDescription: "",
            },
          ],
        },
      ],
      title: "Asset with Photo",
      objectId: "62e058363014725cb2193843",
      locations: [
        {
          label: "Photo",
          entries: [
            {
              loc: {
                type: "Point",
                coordinates: [-93.0835333333333, 44.9622388888889],
              },
              fileId: "62e058313014725cb2193842",
              fileType: "heic",
              sidecars: {
                ppm: "",
              },
              isPrimary: true,
              searchData: null,
              fileDescription: "",
            },
          ],
        },
      ],
      lastModified: "2022-07-26 21:10:14",
      primaryHandlerId: "62e058313014725cb2193842",
      primaryHandlerTiny:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/2483912bc527410313850e26-tiny",
      primaryHandlerType: "ImageHandler",
      primaryHandlerTiny2x:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/2483912bc527410313850e26-tiny2x",
      primaryHandlerThumbnail:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/2483912bc527410313850e26-thumbnail",
      primaryHandlerThumbnail2x:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/2483912bc527410313850e26-thumbnail2x",
      collectionHierarchy: [
        {
          id: 25,
          title: "Blank Generation",
        },
      ],
      template: {
        name: "Photos",
        id: 45,
      },
    },
    {
      dates: [],
      title: "test",
      objectId: "62ce916f73e49b009f6eba61",
      locations: [],
      lastModified: "2022-07-13 09:34:25",
      collectionHierarchy: [
        {
          id: 25,
          title: "Blank Generation",
        },
      ],
      template: {
        name: "Photos",
        id: 45,
      },
    },
    {
      dates: [],
      title: "Tamil",
      objectId: "62b5d844d69ae9593f2ff493",
      locations: [],
      lastModified: "2022-06-24 15:29:18",
      collectionHierarchy: [
        {
          id: 25,
          title: "Blank Generation",
        },
      ],
      template: {
        name: "Image Schema",
        id: 69,
      },
    },
    {
      dates: [],
      title: "Tamil",
      entries: [
        {
          label: "Inscription Type",
          Select: true,
          entries: ["Label"],
        },
      ],
      objectId: "62b5d843d69ae9593f2ff491",
      locations: [],
      lastModified: "2022-06-24 15:29:17",
      collectionHierarchy: [
        {
          id: 25,
          title: "Blank Generation",
        },
      ],
      template: {
        name: "Inscription Schema",
        id: 70,
      },
    },
    {
      dates: [],
      title: "Telugu",
      entries: [
        {
          label: "Inscription Type",
          Select: true,
          entries: ["Label"],
        },
      ],
      objectId: "62b5d843d69ae9593f2ff492",
      locations: [],
      lastModified: "2022-06-24 15:29:07",
      collectionHierarchy: [
        {
          id: 25,
          title: "Blank Generation",
        },
      ],
      template: {
        name: "Inscription Schema",
        id: 70,
      },
    },
    {
      dates: [
        {
          label: "Creation Date",
          dateAsset: [
            {
              end: {
                text: "",
                numeric: "",
              },
              label: "",
              start: {
                text: "2011",
                numeric: "1465848660",
              },
              isPrimary: false,
            },
          ],
        },
      ],
      title: " <i>Midnight in Paris < /i>",
      entries: [
        { label: "System", Select: true, entries: ["NTSC"] },
        { Text: true, label: "Language Program", entries: ["French"] },
      ],
      objectId: "575ee4ceba98a87472f3e030",
      locations: [],
      lastModified: "2022-06-24 15:16:22",
      primaryHandlerId: "59653511ae9a3d05dd266be1",
      primaryHandlerTiny:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/1eb662dd50d3a9ea11535695-tiny",
      primaryHandlerType: "ImageHandler",
      primaryHandlerTiny2x:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/1eb662dd50d3a9ea11535695-tiny2x",
      primaryHandlerThumbnail:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/1eb662dd50d3a9ea11535695-thumbnail",
      primaryHandlerThumbnail2x:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/1eb662dd50d3a9ea11535695-thumbnail2x",
      collectionHierarchy: [{ id: 26, title: "Lang Center New" }],
      template: { name: "Language Center", id: 39 },
    },
    {
      dates: [],
      title: "Test Movie",
      objectId: "62aa4a1f48559b1676518831",
      locations: [],
      lastModified: "2022-06-15 21:07:50",
      primaryHandlerId: "62aa4a207bb555095b193401",
      primaryHandlerType: "FileHandlerBase",
      primaryHandlerThumbnail:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      primaryHandlerThumbnail2x:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      collectionHierarchy: [{ id: 25, title: "Blank Generation" }],
      template: { name: "Photos", id: 45 },
    },
    {
      dates: [],
      title: "Test Movie",
      objectId: "62aa49cdc8a62025d5561fc2",
      locations: [],
      lastModified: "2022-06-15 21:06:28",
      primaryHandlerId: "62aa49cf06cae25854147f21",
      primaryHandlerType: "FileHandlerBase",
      primaryHandlerThumbnail:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      primaryHandlerThumbnail2x:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      collectionHierarchy: [{ id: 25, title: "Blank Generation" }],
      template: { name: "Photos", id: 45 },
    },
    {
      dates: [],
      title: "Test Movie",
      objectId: "62aa49a952bcef092116ad11",
      locations: [],
      lastModified: "2022-06-15 21:05:53",
      primaryHandlerId: "62aa49ab29f5b635fc233101",
      primaryHandlerType: "FileHandlerBase",
      primaryHandlerThumbnail:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      primaryHandlerThumbnail2x:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      collectionHierarchy: [{ id: 25, title: "Blank Generation" }],
      template: { name: "Photos", id: 45 },
    },
    {
      dates: [],
      title: "Test Movie",
      objectId: "62aa48cea50d49741c45dcd1",
      locations: [],
      lastModified: "2022-06-15 21:02:19",
      primaryHandlerId: "62aa48d5c660835c01334351",
      primaryHandlerType: "FileHandlerBase",
      primaryHandlerThumbnail:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      primaryHandlerThumbnail2x:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      collectionHierarchy: [{ id: 20, title: "Collection two" }],
      template: { name: "Photos", id: 45 },
    },
    {
      dates: [],
      title: "Test Movie",
      objectId: "62aa48ab39557c5715380c71",
      locations: [],
      lastModified: "2022-06-15 21:01:37",
      primaryHandlerId: "62aa48ac8a3ef560f1597fa1",
      primaryHandlerType: "FileHandlerBase",
      primaryHandlerThumbnail:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      primaryHandlerThumbnail2x:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      collectionHierarchy: [{ id: 25, title: "Blank Generation" }],
      template: { name: "Photos", id: 45 },
    },
    {
      dates: [],
      title: "Test Movie",
      objectId: "62aa486eb5bf7f411a26e4d1",
      locations: [],
      lastModified: "2022-06-15 21:00:37",
      primaryHandlerId: "62aa48700180df540411e011",
      primaryHandlerType: "FileHandlerBase",
      primaryHandlerThumbnail:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      primaryHandlerThumbnail2x:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      collectionHierarchy: [{ id: 25, title: "Blank Generation" }],
      template: { name: "Photos", id: 45 },
    },
    {
      dates: [],
      title: "Test Movie",
      objectId: "62aa484d0ac5ac79e522a912",
      locations: [],
      lastModified: "2022-06-15 21:00:04",
      primaryHandlerId: "62aa484f9d222e0ab528cf61",
      primaryHandlerType: "FileHandlerBase",
      primaryHandlerThumbnail:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      primaryHandlerThumbnail2x:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      collectionHierarchy: [{ id: 20, title: "Collection two" }],
      template: { name: "Photos", id: 45 },
    },
    {
      dates: [],
      title: "Test Movie",
      objectId: "62aa481fc9011c6a3c789451",
      locations: [],
      lastModified: "2022-06-15 20:59:18",
      primaryHandlerId: "62aa48214b52ce514a2d7261",
      primaryHandlerType: "FileHandlerBase",
      primaryHandlerThumbnail:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      primaryHandlerThumbnail2x:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      collectionHierarchy: [{ id: 25, title: "Blank Generation" }],
      template: { name: "Photos", id: 45 },
    },
    {
      dates: [],
      title: "Test Movie",
      objectId: "62aa47daed410814872ac541",
      locations: [],
      lastModified: "2022-06-15 20:58:08",
      primaryHandlerId: "62aa47dbe974ce07ad6de273",
      primaryHandlerType: "FileHandlerBase",
      primaryHandlerThumbnail:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      primaryHandlerThumbnail2x:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      collectionHierarchy: [{ id: 25, title: "Blank Generation" }],
      template: { name: "Photos", id: 45 },
    },
    {
      dates: [],
      title: "Test Movie",
      objectId: "62aa4728c8a62025d5561fc1",
      locations: [],
      lastModified: "2022-06-15 20:57:18",
      primaryHandlerId: "62aa47a9e974ce07ad6de272",
      primaryHandlerType: "FileHandlerBase",
      primaryHandlerThumbnail:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      primaryHandlerThumbnail2x:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      collectionHierarchy: [{ id: 25, title: "Blank Generation" }],
      template: { name: "Photos", id: 45 },
    },
    {
      dates: [],
      title: "Test Movie",
      objectId: "62aa46a20ac5ac79e522a911",
      locations: [],
      lastModified: "2022-06-15 20:57:13",
      primaryHandlerId: "62aa47a3e974ce07ad6de271",
      primaryHandlerType: "FileHandlerBase",
      primaryHandlerThumbnail:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      primaryHandlerThumbnail2x:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      collectionHierarchy: [{ id: 25, title: "Blank Generation" }],
      template: { name: "Photos", id: 45 },
    },
    {
      dates: [
        {
          label: "Date",
          dateAsset: [
            {
              end: { text: "", numeric: "" },
              label: "",
              start: { text: "1/8/2008", numeric: "1199750400" },
              isPrimary: true,
            },
          ],
        },
      ],
      title: "Yes We Can Speech",
      entries: [{ Date: true, label: "Date", entries: ["1/8/2008"] }],
      objectId: "58bb077aba98a87e062c075c",
      locations: [],
      lastModified: "2022-04-26 21:19:48",
      primaryHandlerId: "58bb0870ba98a8242c8b4590",
      primaryHandlerType: "AudioHandler",
      primaryHandlerThumbnail:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/0954b8c2428a89ab0780bb85-thumbnail",
      primaryHandlerThumbnail2x:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/0954b8c2428a89ab0780bb85-thumbnail2x",
      collectionHierarchy: [{ id: 35, title: "Obama Speeches" }],
      template: { name: "Speech", id: 49 },
    },
    {
      dates: [],
      title: "Test",
      objectId: "623dee383392272653676221",
      locations: [],
      lastModified: "2022-03-25 16:30:48",
      collectionHierarchy: [{ id: 25, title: "Blank Generation" }],
      template: { name: "Audio Test", id: 56 },
    },
    {
      dates: [],
      title: "US Constitution",
      entries: [
        {
          Text: true,
          label: "Signers",
          entries: ["Alexander Hamilton", "Thomas Jefferson"],
        },
        {
          label: "Signing Location",
          entries: ["Drawing Room, Independence Hall"],
          Location: true,
        },
      ],
      objectId: "623cc48b24a3c21bd413e6e1",
      locations: [],
      lastModified: "2022-03-24 19:32:30",
      collectionHierarchy: [{ id: 25, title: "Blank Generation" }],
      template: { name: "Important Documents", id: 67 },
    },
    {
      dates: [],
      title: null,
      objectId: "6234e803fde381590d3948e1",
      locations: [],
      lastModified: "2022-03-18 20:13:55",
      collectionHierarchy: [
        { id: 25, title: "Blank Generation" },
        { id: 28, title: "fades" },
      ],
      template: { name: "Photos", id: 45 },
    },
    {
      dates: [
        {
          label: "Annotation",
          dateAsset: [
            {
              end: { text: "", numeric: "" },
              loc: null,
              label: "File Creation",
              start: {
                text: "2000:01:01 00:02:33",
                numeric: "946684953",
              },
              fileId: "6206d3af9acbab7a2274f7c1",
              fileType: "JPG",
              sidecars: { ppm: "" },
              isPrimary: false,
              searchData: null,
              fileDescription: "",
            },
          ],
        },
      ],
      title: "test",
      objectId: "6206d3b82c016935a8202991",
      locations: [],
      lastModified: "2022-02-11 21:23:04",
      primaryHandlerId: "6206d3af9acbab7a2274f7c1",
      primaryHandlerTiny:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/1c7f4722a7babca9fa3d6026-tiny",
      primaryHandlerType: "ImageHandler",
      primaryHandlerTiny2x:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/1c7f4722a7babca9fa3d6026-tiny2x",
      primaryHandlerThumbnail:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/1c7f4722a7babca9fa3d6026-thumbnail",
      primaryHandlerThumbnail2x:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/1c7f4722a7babca9fa3d6026-thumbnail2x",
      collectionHierarchy: [{ id: 25, title: "Blank Generation" }],
      template: { name: "Photos", id: 45 },
    },
    {
      dates: [
        {
          label: "Photo",
          dateAsset: [
            {
              end: { text: "", numeric: "" },
              loc: null,
              label: "File Creation",
              start: {
                text: "2022-01-27T19:03:17.000000Z",
                numeric: "1643310197",
              },
              fileId: "61f4487387ddb32ddf1cd201",
              fileType: "mp4",
              sidecars: { captions: "", chapters: "" },
              isPrimary: true,
              searchData: null,
              fileDescription: "",
            },
          ],
        },
      ],
      title: "Biutiful Test",
      objectId: "61f448799be8290c9e1eefd1",
      locations: [],
      lastModified: "2022-01-28 19:48:09",
      primaryHandlerId: "61f4487387ddb32ddf1cd201",
      primaryHandlerTiny:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/102dc1fdd23bdd7837844f16-tiny",
      primaryHandlerType: "MovieHandler",
      primaryHandlerTiny2x:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/102dc1fdd23bdd7837844f16-tiny2x",
      primaryHandlerThumbnail:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/102dc1fdd23bdd7837844f16-thumbnail",
      primaryHandlerThumbnail2x:
        "//elevatorbetabucket.s3.amazonaws.com/thumbnail/102dc1fdd23bdd7837844f16-thumbnail2x",
      collectionHierarchy: [{ id: 20, title: "Collection two" }],
      template: { name: "Photos", id: 45 },
    },
    {
      dates: [],
      title: "hey",
      objectId: "61e99853485216512409d081",
      locations: [],
      lastModified: "2022-01-20 17:15:12",
      primaryHandlerId: "61e9989aa886cf2a134db1f1",
      primaryHandlerType: "FileHandlerBase",
      primaryHandlerThumbnail:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      primaryHandlerThumbnail2x:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      collectionHierarchy: [{ id: 20, title: "Collection two" }],
      template: { name: "Audio Test", id: 56 },
    },
    {
      dates: [],
      title: "hey",
      objectId: "61e99800f247800e6c6f4f41",
      locations: [],
      lastModified: "2022-01-20 17:12:39",
      primaryHandlerId: "61e998018d8d9329f11aa571",
      primaryHandlerType: "FileHandlerBase",
      primaryHandlerThumbnail:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      primaryHandlerThumbnail2x:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      collectionHierarchy: [{ id: 20, title: "Collection two" }],
      template: { name: "Audio Test", id: 56 },
    },
    {
      dates: [],
      title: "hey",
      objectId: "61e997bba74a3f592746a9c1",
      locations: [],
      lastModified: "2022-01-20 17:11:29",
      primaryHandlerId: "61e997bcef751273083bbf41",
      primaryHandlerType: "FileHandlerBase",
      primaryHandlerThumbnail:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      primaryHandlerThumbnail2x:
        "http://elevator.knowfear.net/assets/icons/512px/_blank.png",
      collectionHierarchy: [{ id: 20, title: "Collection two" }],
      template: { name: "Audio Test", id: 56 },
    },
    {
      dates: [],
      title: "Wow",
      objectId: "61d33d5b008fac0769195081",
      locations: [],
      lastModified: "2022-01-03 18:31:14",
      collectionHierarchy: [{ id: 20, title: "Collection two" }],
      template: { name: "Photos", id: 45 },
    },
  ],
  success: true,
  searchEntry: {
    showHidden: "0",
    fuzzySearch: "0",
    searchText: "",
    sort: "lastModified.desc",
    specificSearchField: [""],
    specificSearchText: [""],
    specificSearchFuzzy: [""],
    specificFieldSearch: [],
    searchDate: {
      date: "2022-08-15 18:38:35.316883",
      timezone_type: 3,
      timezone: "UTC",
    },
  },
};

export default mockSearch;
