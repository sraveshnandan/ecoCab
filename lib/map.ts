import { Driver, MarkerData } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY;

const API_KEY = process.env.EXPO_PUBLIC_OLA_MAP_API_KEY;

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Driver[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((driver) => {
    const latOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005
    const lngOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005

    return {
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      title: `${driver.first_name} ${driver.last_name}`,
      ...driver,
    };
  });
};

export const calculateRegion = ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) => {
  if (!userLatitude || !userLongitude) {
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (!destinationLatitude || !destinationLongitude) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);

  const latitudeDelta = (maxLat - minLat) * 1.3; // Adding some padding
  const longitudeDelta = (maxLng - minLng) * 1.3; // Adding some padding

  const latitude = (userLatitude + destinationLatitude) / 2;
  const longitude = (userLongitude + destinationLongitude) / 2;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

export const calculateDriverTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}) => {
  if (
    !userLatitude ||
    !userLongitude ||
    !destinationLatitude ||
    !destinationLongitude
  )
    return;

  try {
    const timesPromises = markers.map(async (marker) => {
      // Request directions from driver to user
      const responseToUser = await fetch(
        `https://api.olamaps.io/routing/v1/directions?origin=${marker.latitude},${marker.longitude}&destination=${userLatitude},${userLongitude}&mode=driving&alternatives=true&steps=true&overview=full&language=en&traffic_metadata=true&api_key=${API_KEY}`, {
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      }
      );
      const dataToUser = await responseToUser.json();

      if (dataToUser.status !== "SUCCESS") {
        throw new Error("Failed to get directions from driver to user");
      }

      // Extract the time to reach the user (in seconds)
      const timeToUser = dataToUser.routes[0].legs[0].duration; // Assuming `duration` is in seconds

      // Request directions from user to destination
      const responseToDestination = await fetch(
        `https://api.olamaps.io/routing/v1/directions?origin=${userLatitude},${userLongitude}&destination=${destinationLatitude},${destinationLongitude}&mode=driving&alternatives=true&steps=true&overview=full&language=en&traffic_metadata=true&api_key=${API_KEY}`, {
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      }
      );
      const dataToDestination = await responseToDestination.json();

      if (dataToDestination.status !== "SUCCESS") {
        throw new Error("Failed to get directions from user to destination");
      }

      // Extract the time to reach the destination (in seconds)
      const timeToDestination = dataToDestination.routes[0].legs[0].duration;

      // Calculate total time in minutes
      const totalTime = (timeToUser + timeToDestination) / 60; // Convert to minutes

      // Calculate price based on total time
      const price = (totalTime * 0.5).toFixed(2);

      return { ...marker, time: totalTime, price };
    });

    return await Promise.all(timesPromises);
  } catch (error) {
    console.error("Error calculating driver times:", error);
  }
};
