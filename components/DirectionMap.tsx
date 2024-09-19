import { useState, useEffect } from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useLocationStore } from '@/store';
import polyline from '@mapbox/polyline';

const MapScreen = () => {
    const { routeCoordinates, setRootCordinates } = useLocationStore()


    const { userLatitude, userLongitude, destinationLatitude, destinationAddress, destinationLongitude } = useLocationStore()
    // Fetch directions and update the routeCoordinates state

    const fetchDirections = async () => {
        try {
            const API_KEY = process.env.EXPO_PUBLIC_OLA_MAP_API_KEY; // Replace with your actual Ola Maps API key
            const response = await fetch(
                `https://api.olamaps.io/routing/v1/directions?origin=${userLatitude},${userLongitude}&destination=${destinationLatitude},${destinationLongitude}&mode=driving&alternatives=true&steps=true&overview=full&language=en&traffic_metadata=true&api_key=${API_KEY}`, {
                headers: {
                    "Content-Type": "application/json"
                },
                method: "POST"
            }
            );
            const data = await response.json();

            // Assuming the API returns a polyline geometry in 'coordinates'
            if (data.status === 'SUCCESS') {
                // Decode the polyline using the 'overview_polyline' field
                const points = polyline.decode(data.routes[0].overview_polyline);
                const coordinates = points.map((point: any) => ({
                    latitude: point[0],
                    longitude: point[1],
                }));
                // Set the route coordinates
                setRootCordinates(coordinates as any);

            }




        } catch (error) {
            console.log("route fetching error", error)
        }
    };



    useEffect(() => {
        fetchDirections();
    }, [destinationAddress, destinationLatitude, destinationLongitude]);

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: userLatitude!,
                    longitude: userLongitude!,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                <Marker coordinate={{ latitude: userLatitude!, longitude: userLongitude! }} title="Start Location" />
                <Marker coordinate={{ latitude: destinationLatitude!, longitude: destinationLongitude! }} title="End Location" />
                {/* Add Polyline for the route */}
                {routeCoordinates && routeCoordinates.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates as any}
                        strokeWidth={5}
                        strokeColor="#0CC25F"
                    />
                )}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
});

export default MapScreen;
