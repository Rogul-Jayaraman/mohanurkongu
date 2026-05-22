import axios from 'axios';

export async function searchLocations(query: string): Promise<{ displayName: string; latitude: number; longitude: number }[]> {
  const response = await axios.get(
    'https://nominatim.openstreetmap.org/search',
    {
      params: {
        q: query.trim(),
        format: 'json',
        addressdetails: 1,
        limit: 5,
        countrycodes: 'in',
      },
      headers: {
        'User-Agent': 'MohanurKongu/1.0 (matrimony@mohanurkongu.app)',
        'Accept-Language': 'en',
      },
      timeout: 8000,
    },
  );

  if (!Array.isArray(response.data)) {
    throw new Error('Unexpected response from Nominatim');
  }

  return response.data.map((item: any) => ({
    displayName: item.display_name,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
  }));
}
