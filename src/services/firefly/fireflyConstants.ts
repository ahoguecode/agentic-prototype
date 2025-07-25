export const FIREFLY_API = {
  V2_BASE_URL: 'https://firefly-stage.adobe.io',
  V3_BASE_URL: 'https://firefly-clio-imaging-dev.adobe.io',
  V4_BASE_URL: 'https://clio-imaging-v4-colligov2-dev.corp.ethos851-stage-or2.ethos.adobe.net',
  BATCH_BASE_URL: 'https://inf-speed-debug-colligov2-dev.corp.ethos851-stage-or2.ethos.adobe.net',
  //VIDEO_BASE_URL: 'https://gen-video-stage.ff.adobe.io',
  //VIDEO_BASE_URL: 'https://clineto-persistence-colligov2-dev.corp.ethos851-stage-or2.ethos.adobe.net',
  VIDEO_BASE_URL: 'https://firefly-gen-video-stage.adobe.io',
  DEFAULT_TIMEOUT: 30000,
  DEFAULT_RETRIES: 3,
  COMMON_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
} as const

export const MAX_FIREFLY_SEED = 2147483647

export const DMD_MODE = {
  DMD1: 'dmd1',
  DMD2: 'dmd2',
  DMD4: 'dmd4',
  DMD1_fast: 'dmd1_fast',
  DMD2_fast: 'dmd2_fast',
  DMD4_fast: 'dmd4_fast',
  DMD_MOE1: 'dmdmoe1',
  DMD_MOE2: 'dmdmoe2',
  DMD_MOE5: 'dmdmoe5',
  DMD_MOE10: 'dmdmoe10',
  DMD_BEST: 'dmdbest',
  NONE: '',
} as const

export const FireflyDimensions = {
  square: { width: 2048, height: 2048 },
  landscape: { width: 2304, height: 1792 },
  portrait: { width: 1792, height: 2304 },
  widescreen: { width: 2688, height: 1536 },
} as const

export const FireflyAspects = {
  square: FireflyDimensions.square.width / FireflyDimensions.square.height,
  landscape: FireflyDimensions.landscape.width / FireflyDimensions.landscape.height,
  portrait: FireflyDimensions.portrait.width / FireflyDimensions.portrait.height,
  widescreen: FireflyDimensions.widescreen.width / FireflyDimensions.widescreen.height,
} as const 