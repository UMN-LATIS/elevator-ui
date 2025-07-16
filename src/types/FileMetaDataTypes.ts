export interface FileMetaData {
  exif?: Exif;
  width?: number;
  height?: number;
  filesize?: number;
  rotation?: number;
  coordinates?: number[];
  creationDate?: string;
  sourcefile?: string;
  bulkMetadata?: unknown;
  handlerType?: "MovieHandler" | "AudioHandler" | string;
}

export interface Exif {
  MPF?: Partial<Mpf>;
  EXIF?: Partial<EXIFClass>;
  File?: Partial<File>;
  JFIF?: Partial<Jfif>;
  ExifTool?: Partial<ExifTool>;
  Composite?: Partial<Composite>;
  MakerNotes?: Partial<MakerNotes>;
  ICC_Profile?: Partial<ICCProfile>;
}

export interface Composite {
  FOV: string;
  Aperture: number;
  ImageSize: string;
  LightValue: number;
  Megapixels: number;
  GPSAltitude: string;
  GPSLatitude: string;
  GPSPosition: string;
  GPSLongitude: string;
  ShutterSpeed: string;
  FocalLength35efl: string;
  ScaleFactor35efl: number;
  SubSecCreateDate: string;
  SubSecModifyDate: string;
  CircleOfConfusion: string;
  HyperfocalDistance: string;
  RunTimeSincePowerUp: string;
  SubSecDateTimeOriginal: string;
}

export interface EXIFClass {
  ISO: number;
  Make: string;
  Flash: string;
  Model: string;
  FNumber: number;
  GPSSpeed: number;
  LensInfo: string;
  LensMake: string;
  Software: string;
  LensModel: string;
  SceneType: string;
  TileWidth: number;
  ColorSpace: string;
  CreateDate: string;
  ModifyDate: string;
  OffsetTime: string;
  TileLength: number;
  ExifVersion: string;
  FocalLength: string;
  GPSAltitude: string;
  GPSLatitude: string;
  GPSSpeedRef: string;
  Orientation: string;
  SubjectArea: string;
  XResolution: number;
  YResolution: number;
  ExposureMode: string;
  ExposureTime: string;
  GPSLongitude: string;
  HostComputer: string;
  MeteringMode: string;
  WhiteBalance: string;
  ApertureValue: number;
  SensingMethod: string;
  ExifImageWidth: number;
  GPSAltitudeRef: string;
  GPSDestBearing: number;
  GPSLatitudeRef: string;
  ResolutionUnit: string;
  BrightnessValue: number;
  ExifImageHeight: number;
  ExposureProgram: string;
  FlashpixVersion: string;
  GPSImgDirection: number;
  GPSLongitudeRef: string;
  DateTimeOriginal: string;
  SceneCaptureType: string;
  YCbCrPositioning: string;
  GPSDestBearingRef: string;
  ShutterSpeedValue: string;
  GPSImgDirectionRef: string;
  OffsetTimeOriginal: string;
  SubSecTimeOriginal: number;
  OffsetTimeDigitized: string;
  SubSecTimeDigitized: number;
  ExposureCompensation: number;
  GPSHPositioningError: string;
  ComponentsConfiguration: string;
  FocalLengthIn35mmFormat: string;
}

export interface ExifTool {
  ExifToolVersion: number;
}

export interface File {
  FileSize: string;
  FileType: string;
  MIMEType: string;
  ImageWidth: number;
  ImageHeight: number;
  BitsPerSample: number;
  ExifByteOrder: string;
  FileAccessDate: string;
  FileModifyDate: string;
  ColorComponents: number;
  EncodingProcess: string;
  FilePermissions: string;
  YCbCrSubSampling: string;
  FileTypeExtension: string;
  FileInodeChangeDate: string;
}

export interface ICCProfile {
  RedTRC: string;
  BlueTRC: string;
  CMMFlags: string;
  GreenTRC: string;
  ProfileID: string;
  DeviceModel: string;
  ProfileClass: string;
  ColorSpaceData: string;
  ProfileCMMType: string;
  ProfileCreator: string;
  ProfileVersion: string;
  MediaWhitePoint: string;
  PrimaryPlatform: string;
  ProfileDateTime: string;
  RedMatrixColumn: string;
  RenderingIntent: string;
  BlueMatrixColumn: string;
  DeviceAttributes: string;
  ProfileCopyright: string;
  GreenMatrixColumn: string;
  DeviceManufacturer: string;
  ProfileDescription: string;
  ChromaticAdaptation: string;
  ProfileFileSignature: string;
  ProfileConnectionSpace: string;
  ConnectionSpaceIlluminant: string;
}

export interface Jfif {
  JFIFVersion: number;
  XResolution: number;
  YResolution: number;
  ResolutionUnit: string;
}

export interface Mpf {
  MPImage2: string;
  MPFVersion: string;
  MPImageType: string;
  MPImageFlags: string;
  MPImageStart: number;
  MPImageFormat: string;
  MPImageLength: number;
  NumberOfImages: number;
  DependentImage1EntryNumber: number;
  DependentImage2EntryNumber: number;
}

export interface MakerNotes {
  RunTimeEpoch: number;
  RunTimeFlags: string;
  RunTimeScale: number;
  RunTimeValue: number;
  AccelerationVector: string;
}
