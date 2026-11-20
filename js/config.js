// All fixed settings live here so nothing is hard-coded in the logic.
export const CITY = { name: 'Mbombela (Nelspruit)', lat: -25.4753, lon: 30.9694, tz: 'Africa/Johannesburg' };
export const ESP_BASE = 'https://developer.sepush.co.za/business/2.0';
export const SUBURBS = ['Mbombela', 'Nelspruit CBD', 'West Acres', 'Riverside Park', 'Sonheuwel', 'Rocky Drift', 'Valencia Park', 'White River', 'Kanyamazane', 'Matsulu'];

export const RADIO = {
  name: 'Ligwalagwala FM',
  frequency: '92.5 FM in Mbombela',
  language: 'siSwati',
  // Stream address taken from a public radio directory. SABC can change it, so it is editable in the app.
  defaultStream: 'https://27793.live.streamtheworld.com/LIGWALAGWALAAAC.aac',
  sabcPlus: 'https://www.sabc-plus.com',
  website: 'https://www.ligwalagwalafm.co.za'
};

export const KEYS = { token: 'mb_token', area: 'mb_area', radioUrl: 'mb_radio_url', radioVol: 'mb_radio_vol' };
