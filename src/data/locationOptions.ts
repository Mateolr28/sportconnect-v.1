import { City, Country, State } from 'country-state-city';

export interface LocationOption {
  name: string;
  code: string;
}

export const countries: LocationOption[] = Country.getAllCountries().map((country) => ({
  name: country.name,
  code: country.isoCode,
}));

export const getCountryByName = (name: string) =>
  countries.find((country) => country.name === name);

export const getRegions = (countryCode: string): LocationOption[] =>
  State.getStatesOfCountry(countryCode).map((region) => ({
    name: region.name,
    code: region.isoCode,
  }));

export const getCities = (countryCode: string, regionCode: string): LocationOption[] =>
  City.getCitiesOfState(countryCode, regionCode).map((city) => ({
    name: city.name,
    code: city.name,
  }));
