export interface StationFrequency {
  city: string;
  freq: string;
  lat: number;
  lng: number;
}

export interface StationContacts {
  address: string;
  website: string;
  phone: string;
  email: string;
  facebook: string;
  whatsapp: string;
}

export interface StoreLinks {
  googlePlay: string;
  appStore: string;
}

export interface StationMission {
  icon: string;
  title: string;
  desc: string;
}

export interface PaymentUrls {
  mtn: string;
  orange: string;
}

export interface BiblicalQuote {
  text: string;
  reference: string;
}

export interface StationConfig {
  id: string;
  name: string;
  shortName: string;
  frequency: string;
  diocese: string;
  country: string;
  streamUrl: string;
  shareUrl: string;
  copyright: string;
  slogan: string;
  description: string;
  frequencies: StationFrequency[];
  contacts: StationContacts;
  storeLinks: StoreLinks;
  missions: StationMission[];
  paymentUrls: PaymentUrls;
  donationText: string;
  biblicalQuote: BiblicalQuote;
  donationHeroImageUrl: string | null;
}
