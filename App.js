import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, Button } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";

const ZOOM_LEVEL = 15;
const ANIMATION_DURATION = 2000;

export default function App() {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [marker, setMarker] = useState(null);
  const [address, setAddress] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);

  const animateTo = (coords) => {
    mapRef.current?.animateCamera(
      {
        center: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
        zoom: ZOOM_LEVEL,
      },
      { duration: ANIMATION_DURATION }
    );
  };

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (isMounted) setErrorMsg("Permission to access location was denied");
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        if (!isMounted) return;

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(coords);
        animateTo(coords);
      } catch (e) {
        if (isMounted) setErrorMsg("Permission to access location was denied");
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddMarker = async () => {
    try {
      const result = await Location.geocodeAsync(address);

      if (!result || result.length === 0) {
        setErrorMsg("Address not found");
        return;
      }

      const { latitude, longitude } = result[0];
      const newMarker = { latitude, longitude };

      // старий маркер автоматично замінюється новим
      setMarker(newMarker);
      setErrorMsg(null);
      animateTo(newMarker);
    } catch (e) {
      setErrorMsg("Address not found");
    }
  };

  const handleCenterMarker = () => {
    if (marker) {
      animateTo(marker);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {marker && <Marker coordinate={marker} />}
        {marker && userLocation && (
          <Polyline
            coordinates={[userLocation, marker]}
            strokeColor="#0000ff"
            strokeWidth={3}
          />
        )}
      </MapView>

      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Enter the address"
        value={address}
        onChangeText={setAddress}
      />
      <View style={styles.buttonContainer}>
        <Button title="Add marker" onPress={handleAddMarker} />
        {marker && (
          <Button title="Center the marker" onPress={handleCenterMarker} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  map: {
    flex: 1,
    width: "100%",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    height: 40,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 20,
  },
});