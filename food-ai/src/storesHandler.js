// Stores handler for finding nearby grocery stores using Google Places API
import { OPENAI_CONFIG } from './config.js';

// Mock store data structure for development
const createMockStores = () => [
  {
    id: 'store-1',
    name: 'Whole Foods Market',
    distance: '0.3 miles',
    phone: '+14155551234',
    phoneDisplay: '(415) 555-1234',
    location: 'https://maps.google.com/?q=Whole+Foods+Market+San+Francisco'
  },
  {
    id: 'store-2', 
    name: 'Safeway',
    distance: '0.7 miles',
    phone: '+14155555678',
    phoneDisplay: '(415) 555-5678',
    location: 'https://maps.google.com/?q=Safeway+San+Francisco'
  },
  {
    id: 'store-3',
    name: 'Trader Joe\'s',
    distance: '1.2 miles',
    phone: '+14155559876',
    phoneDisplay: '(415) 555-9876',
    location: 'https://maps.google.com/?q=Trader+Joes+San+Francisco'
  }
];

// Get detailed place information including phone number
async function getPlaceDetails(placeId, apiKey) {
  try {
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,international_phone_number&key=${apiKey}`;
    const response = await fetch(detailsUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.result) {
      return {
        phone: data.result.international_phone_number || data.result.formatted_phone_number,
        phoneDisplay: data.result.formatted_phone_number || 'Call for info'
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}

// Find nearby stores using Google Places API
async function findNearbyStores(latitude, longitude, ingredients) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    console.log('🔍 Google Places API key not found, using mock data');
    return createMockStores();
  }

  try {
    // Use Google Places Nearby Search API
    const radius = 5000; // 5km radius
    const type = 'grocery_or_supermarket'; // Google Places type
    
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      return createMockStores();
    }

    // Transform Google Places results to our format
    const stores = await Promise.all(data.results.slice(0, 5).map(async (place, index) => {
      // Calculate approximate distance (this is rough - for better accuracy, use Distance Matrix API)
      const distance = calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng);
      
      // Get detailed place information including phone number
      const placeDetails = await getPlaceDetails(place.place_id, apiKey);
      
      return {
        id: `store-${place.place_id}`,
        name: place.name,
        distance: `${distance.toFixed(1)} miles`,
        phone: placeDetails?.phone || place.formatted_phone_number || '+1-000-000-0000',
        phoneDisplay: placeDetails?.phoneDisplay || place.formatted_phone_number || 'Call for info',
        location: `https://maps.google.com/?q=${encodeURIComponent(place.name)}&place_id=${place.place_id}`,
        rating: place.rating,
        vicinity: place.vicinity
      };
    }));

    return stores;

  } catch (error) {
    console.error('Error fetching stores:', error);
    return createMockStores();
  }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI/180);
}

// Main handler function
export const storesHandler = async (requestBody) => {
  try {
    const { selectedIngredients, userLocation } = requestBody;
    
    // Validate inputs
    if (!userLocation || typeof userLocation.latitude !== 'number' || typeof userLocation.longitude !== 'number') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Invalid location coordinates provided'
        })
      };
    }

    console.log(`🛍️ Finding stores near ${userLocation.latitude}, ${userLocation.longitude}`);
    console.log(`📋 Selected ingredients: ${selectedIngredients?.length || 0} items`);
    
    // Find nearby grocery stores
    const stores = await findNearbyStores(
      userLocation.latitude, 
      userLocation.longitude, 
      selectedIngredients || []
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: {
          stores,
          location: userLocation,
          searchRadius: '5 miles',
          ingredientCount: selectedIngredients?.length || 0
        }
      })
    };

  } catch (error) {
    console.error('Error in storesHandler:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Unable to find stores at the moment',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
