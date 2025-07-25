export interface Size {
  height: number
  width: number
}

export interface PublicBinary {
  creativeCloudFileId?: string
  id?: string
  name?: string
  presignedUrl?: string
}

export type PublicBinaryInput = PublicBinary
export type PublicBinaryOutput = Required<Pick<PublicBinary, 'id' | 'presignedUrl'>> & Omit<PublicBinary, 'id' | 'presignedUrl'>

export interface PhotoSettings {
  aperture: number
  fieldOfView: number
  shutterSpeed: number
}

export interface Styles {
  presets?: string[]
  referenceImage?: PublicBinary
  strength?: number
}

export type ContentClass = 'photo' | 'art' | 'vector' | 'raw'
export type DetailLevel = 'full' | 'preview'
export type ModelVersion = 'image3' | 'image3_fast'

export interface FireflyOutput {
  seed: number
  image: PublicBinaryOutput
}

export interface FireflyGenerateResponse {
  diffusionMp4?: PublicBinaryOutput
  outputs: FireflyOutput[]
  predictedContentClass?: ContentClass
  predictedPhotoSettings?: PhotoSettings
  predictedVectorType?: string
  promptHasBlockedArtists?: boolean
  promptHasDeniedWords?: boolean
  size: Size
  version: string
}

export interface FireflyGenerateOptions {
  seeds?: number[]
  size?: Size
  negativePrompt?: string
  contentClass?: ContentClass
  visualIntensity?: number
  photoSettings?: PhotoSettings
  styles?: Styles
  locale?: string
  tileable?: boolean
  dreamValue?: number
  modelVersion?: ModelVersion
  detailLevel?: DetailLevel
}

export interface FireflyGenerateOptionsV3 extends FireflyGenerateOptions {
  controlData?: ControlData
  editData?: EditData
}

export interface FireflyGenerateOptionsV4 extends FireflyGenerateOptions {
  rawMode?: boolean
  layouts?: {
    depth: number
    majorRadius: number
    minorRadius: number
    orientation: number
    prompt: string
    x: number
    y: number
  }[]
}

export interface FireflyBatchGenerateImageRequest {
  contentClass?: ContentClass
  controlData?: ControlData
  dreamValue?: number
  editData?: EditData
  locale?: string
  negativePrompt?: string
  photoSettings?: PhotoSettings
  prompt: string
  promptDebiasing?: boolean
  styles?: Styles
  tileable?: boolean
  visualIntensity?: number
}

export interface FireflyBatchGenerateImagesBatchRequestOptions {
  customModelId?: string
  detailLevel?: DetailLevel
  modelVersion?: ModelVersion
  n?: 1
  output?: OutputSpec
  targetFolder?: ACPDirectory
  seeds?: number[]
  size?: Size
}

export interface FireflyGenerateSimilarOptions {
  seeds?: number[]
  size?: Size
  tileable?: boolean
}

export interface FireflyGenerateSimilarResponse {
  version: string
  size: Size
  outputs: FireflyOutput[]
}

export interface FireflyImageResponse {
  images: Pick<FireflyOutput['image'], 'id'>[]
}

export interface FireflyFillOptions {
  prompt?: string
  seeds?: number[]
  size?: Size
  inputImage?: {
    source: PublicBinary
    fillArea?: {
      fillMask?: PublicBinary
    }
    originalImage?: {
      source: PublicBinary
      mask: PublicBinary
      localCoordinate: Coordinate
      originalCoordinate: Coordinate
    }
  }
  negativePrompt?: string
  styleInsertion?: PublicBinary
  contentInsertion?: PublicBinary
  locale?: string
  similarity?: 0 | 1 | 2
  guidance?: number
  contentPreserveLevel?: number
}

export interface Coordinate {
  x: number
  y: number
  width: number
  height: number
}

export interface ControlData {
  adherenceThreshold?: number
  cannyData?: CannyControlData
  depthData?: DepthControlData
  entityData?: EntityControlData
  hedData?: HedControlData
}

export interface EditData {
  guideImage?: PublicBinary
  guideStrength?: number
  maskImage?: PublicBinary
  maskStrength?: number
}

export interface CannyControlData {
  adherenceThresholdOverride?: number
  mode?: 'cv_canny' | 'gray_thresholding'
  referenceImage: PublicBinary
}

export interface DepthControlData {
  adherenceThresholdOverride?: number
  mode?: 'estimator' | 'unpack_rgba'
  referenceImage: PublicBinary
}

export interface EntityControlData {
  referenceImage: PublicBinary
}

export interface HedControlData {
  referenceImage: PublicBinary
}

export interface ACPDirectory {
  creativeCloudPath?: string
  creativeCloudProjectId: string
}

export interface OutputSpec {
  cai: {
    directive: 'dont_sign' | 'sign_for_policy_mandate' | 'sign_for_canvas'
  }
}

export interface VideoSize extends Size {
  numFrames: number
}

export interface VideoSettings {
  cameraMotion: 'camera pan left' | 'camera pan right' | 'camera zoom in' | 'camera zoom out' | 'camera tilt up' | 'camera tilt down' | 'camera locked down' | 'camera handheld'
  shotAngle: 'aerial shot' | 'eye_level shot' | 'high angle shot' | 'low angle shot' | 'top-down shot'
  promptStyle: 'anime' | '3d' | 'fantasy' | 'cinematic' | 'claymation' | 'line art' | 'stop motion' | '2d' | 'vector art' | 'black and white'
  shotSize: 'close-up shot' | 'extreme close-up' | 'medium shot' | 'long shot' | 'extreme long shot'
}

export interface VideoImagePlacement {
  start: number, // the position of the image on the video timeline 0 being first frame to 1 being last frame
}

export interface VideoImageCondition {
  placement: VideoImagePlacement,
  source: PublicBinary,
}

export interface VideoImage {
  conditions: VideoImageCondition[]
}

export interface FireflyGenerateVideoOptions {
  prompt: string
  negativePrompt?: string
  seeds?: number[]
  sizes?: VideoSize[]
  videoSettings?: VideoSettings
  locale?: string,
  image?: VideoImage,
  output?: {
    storeInputs?: boolean
  }
}

export interface FireflyVideoOutput extends FireflyOutput {
  video: PublicBinaryOutput
}

export interface FireflyVideoGenerateResponse {
  links: {
    cancel: { href: string }
    result: { href: string }
  }
}

export interface FireflyVideoGenerateStatusResponse extends FireflyVideoGenerateResponse {
  progress: number
}

export interface FireflyVideoResult {
  debugData: {
    [key: string]: string | number | boolean | null | undefined
  }
  outputs: FireflyVideoOutput[]
  size: {
    width: number
    height: number
  }
  version: string
}

export interface FireflyGenerateVideoResponse {
  version: string
  outputs: FireflyVideoOutput[]
}