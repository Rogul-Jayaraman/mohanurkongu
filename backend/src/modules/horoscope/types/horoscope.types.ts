export interface BirthInput {
  dateOfBirth: string;
  timeOfBirth: string;
  location: {
    displayName: string;
    latitude: number;
    longitude: number;
  };
}

export interface PlanetData {
  name: string;
  longitude: number;
  signIndex: number;
  degree: number;
  house: number;
  nakshatraIndex: number;
  pada: number;
  navamsaSignIndex: number;
  navamsaHouse: number;
}

export interface HouseData {
  number: number;
  signIndex: number;
  planets: string[];
}

export interface GenerateResponse {
  input: BirthInput;
  meta: {
    ayanamsa: number;
    julianDay: number;
    timezone: string;
  };
  lagna: {
    signIndex: number;
    longitude: number;
    pada: number;
    nakshatraIndex: number;
  };
  lagnaNavamsa: {
    signIndex: number;
    longitude: number;
  };
  planets: PlanetData[];
  houses: HouseData[];
  summary: {
    rasiSignIndex: number;
    lagnaSignIndex: number;
    nakshatraIndex: number;
    nakshatraPada: number;
    ayanamsa: string;
    locationName: string;
  };
}
