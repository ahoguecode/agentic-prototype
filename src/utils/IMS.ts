import { AdobeIMS } from "@identity/imslib";
import { IAdobeIdData } from "@identity/imslib/adobe-id/IAdobeIdData";
import { IEnvironment } from "@identity/imslib/adobe-id/IEnvironment";
import { ITokenInformation } from "@identity/imslib/adobe-id/custom-types/CustomTypes";
import { IErrorType } from "@identity/imslib/adobe-id/IErrorType";
import { v4 } from "uuid";

declare global {
  interface Window {
    adobeIMSAuthToken: string;
  }
}

export interface AdobeIMSProfile {
  account_type: string;
  authId: string;
  countryCode: string;
  displayName: string;
  email: string;
  emailVerified: string;
  first_name: string;
  last_name: string;
  mktPerm: string;
  mrktPermEmail?: string;
  name: string;
  phoneNumber?: string;
  preferred_languages?: string;
  userId: string;
  utcOffset?: string;
}

// I copied this from the PS Prototype
export class Ims {
  testClientId = "AdobeSenseiPredictServiceStageKey";

  // old debug settings, leaving them just in case i need them later
  useTokenOverride = false;
  tokenOverrideValue = "";

  // new session ID for each time the app is used
  sessionId = v4();

  // the actual IMS settings
  adobeIMS: AdobeIMS;
  adobeid: IAdobeIdData = {
    client_id: import.meta.env.VITE_IMS_CLIENT_ID,
    scope: import.meta.env.VITE_IMS_SCOPE,
    environment: import.meta.env.VITE_IMS_ENV as IEnvironment,
    locale: "en_US",
    useLocalStorage: true,
    autoValidateToken: true,
    onAccessToken: this.onAccessToken.bind(this),
    onReauthAccessToken: this.onReauthAccessToken.bind(this),
    onError: this.onImsError.bind(this),
    onAccessTokenHasExpired: this.onAccessTokenHasExpired.bind(this),
    onReady: this.onReady.bind(this),
  };

  tokenData?: ITokenInformation = undefined;
  profileData?: AdobeIMSProfile = undefined;

  constructor(settings: Partial<Ims> = {}) {
    Object.assign(this, settings);

    this.adobeIMS = new AdobeIMS(this.adobeid);
    this.adobeIMS.initialize();
  }

  setTokenData(data?: ITokenInformation) {
    this.tokenData = data;
    window.adobeIMSAuthToken = data?.token ?? "";
  }

  onAccessToken(data: ITokenInformation) {
    this.setTokenData(data);
    this.adobeIMS.getProfile().then((data) => this.setProfileData(data));
  }

  onReauthAccessToken(data: ITokenInformation) {
    this.setTokenData(data);
    console.log("reauth", data);
  }

  onImsError(type: IErrorType, message: unknown) {
    console.error(type, message);
  }

  onAccessTokenHasExpired() {
    console.log("token expired");
    this.setTokenData(undefined);
    this.adobeIMS.signIn();
  }

  onReady() {
    console.log("ready");
  }

  setProfileData(profileData: unknown) {
    this.profileData = profileData as AdobeIMSProfile;
    console.log(profileData);
  }

  logout() {
    this.adobeIMS.signOut();
  }
}

// create the global singleton for IMS stuff
export const IMS = new Ims();
export default IMS;
