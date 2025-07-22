export interface InterstitialResponse {
  haveInterstitial: boolean;
  interstitialText?: string;
}

export const interstitial: InterstitialResponse = {
  haveInterstitial: false,
};

export default interstitial;
