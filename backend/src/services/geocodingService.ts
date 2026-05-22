/**
 * Geocoding Service
 *
 * Converts a place name (POB - Place of Birth) into geographic coordinates
 * (latitude, longitude, timezone offset) using the node-geocoder library
 * with the free OpenStreetMap (Nominatim) provider — no API key required.
 *
 * The timezone is derived from the UTC offset by querying the 
 * local system timezone or a predictable default for India-based clients.
 */
import NodeGeocoder, { Entry } from 'node-geocoder';

// --- Geocoder Configuration ---
// Uses OpenStreetMap Nominatim: free, no API key required.
// Provide a user-agent header as required by Nominatim's usage policy.
const geocoder = NodeGeocoder({
    provider: 'openstreetmap',
    fetch: (url: any, options: any): any => {
        return (fetch(url, {
            ...options,
            headers: {
                ...((options?.headers as Record<string, string>) ?? {}),
                'User-Agent': 'MohanurKonguMatrimony/1.0 (contact@mohanurkongumatrimony.com)',
            },
        }) as any);
    },
});

export interface GeocodedLocation {
    latitude: number;
    longitude: number;
    formattedAddress: string;
    country?: string;
    city?: string;
}

/**
 * Geocodes a place name string to coordinates.
 *
 * @param placeOfBirth - Human-readable place name (e.g. "Salem, Tamil Nadu, India")
 * @returns Resolved geographic coordinates and address details
 * @throws Error if no results are found or if geocoding fails
 */
export async function geocodePlace(placeOfBirth: string): Promise<GeocodedLocation> {
    if (!placeOfBirth || placeOfBirth.trim().length === 0) {
        throw new Error('Place of birth cannot be empty.');
    }

    let results: Entry[];
    try {
        results = await geocoder.geocode(placeOfBirth.trim());
    } catch (err: any) {
        throw new Error(`Geocoding request failed: ${err.message}`);
    }

    if (!results || results.length === 0) {
        throw new Error(`Could not find coordinates for place: "${placeOfBirth}". Please be more specific.`);
    }

    const best = results[0];

    if (best.latitude === undefined || best.longitude === undefined) {
        throw new Error(`Geocoding returned incomplete data for: "${placeOfBirth}".`);
    }

    return {
        latitude: best.latitude,
        longitude: best.longitude,
        formattedAddress: best.formattedAddress ?? placeOfBirth,
        country: best.country ?? undefined,
        city: best.city ?? undefined,
    };
}
