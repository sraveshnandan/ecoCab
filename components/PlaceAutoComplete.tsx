import { View, Image, TextInput, TouchableOpacity, FlatList, Text } from "react-native";

import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";
import { useLocationStore } from "@/store";
import { useEffect, useState } from "react";
import axios from "axios";

const OlaMapsApiKey = process.env.EXPO_PUBLIC_OLA_MAP_API_KEY;

const PlaceSearchInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
}: GoogleInputProps) => {


  const { userLatitude, userLongitude, userAddress } = useLocationStore();


  const [query, setQuery] = useState(initialLocation ? initialLocation : "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounce function to delay API call while typing
  const handleDebounce = async (input: string) => {
    if (input.length > 0) {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.olamaps.io/places/v1/autocomplete`,
          {
            params: {
              input,
              location: `${userLatitude},${userLongitude}`, // Example lat, lng
              api_key: OlaMapsApiKey,
            },
          }
        );

        if (response.data.status === 'ok') {
          setSuggestions(response.data.predictions);
        }
      } catch (error) {
        console.error('Error fetching autocomplete suggestions:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
    }
  };


  const handleplaceSelect = (item: any) => {
    const destinationPayload = {
      address: item.description,
      latitude: item.geometry.location.lat,
      longitude: item.geometry.location.lng
    }
    setSuggestions([])
    setQuery("")
    return handlePress(destinationPayload)
  }

  // Update the query state and debounce the API call
  useEffect(() => {
    const timeoutId = setTimeout(() => handleDebounce(query), 500); // Debounce time of 500ms
    return () => clearTimeout(timeoutId); // Cleanup the timeout
  }, [query]);




  return (
    <View
      className={`flex flex-col p-2 items-center justify-between relative z-50 rounded-xl ${containerStyle}`}
    >
      <View className="flex-row items-center overflow-hidden px-2">
        <Image source={icons.search} className="w-6 h-6" tintColor={"blue"} />
        <TextInput
          value={query}
          onChangeText={(text) => setQuery(text)}
          className="text-md font-JakartaSemiBold flex-grow p-2"
          placeholder={initialLocation ? initialLocation : "Where do want to go?"}
        />

      </View>


      {/* Autocomplete Suggestions */}
      {loading && <Text>Loading...</Text>}
      {!loading && suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item: any) => item.reference + Math.random()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleplaceSelect(item)}>
              <View className="p-3 border-b border-gray-300">
                <Text className="font-semibold">{item.structured_formatting.main_text}</Text>
                <Text className="text-gray-500">{item.structured_formatting.secondary_text}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default PlaceSearchInput;
