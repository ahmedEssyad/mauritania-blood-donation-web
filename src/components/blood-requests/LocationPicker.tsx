'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number; address: string };
  className?: string;
}

export default function LocationPicker({
  onLocationSelect,
  initialLocation,
  className = ''
}: LocationPickerProps) {
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current location
  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par ce navigateur');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocoding to get address
          const reverseGeocodedAddress = await reverseGeocode(latitude, longitude);

          const locationData = {
            lat: latitude,
            lng: longitude,
            address: reverseGeocodedAddress
          };

          setLocation({ lat: latitude, lng: longitude });
          setAddress(reverseGeocodedAddress);
          onLocationSelect(locationData);
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          // Use coordinates if reverse geocoding fails
          const locationData = {
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          };

          setLocation({ lat: latitude, lng: longitude });
          setAddress(locationData.address);
          onLocationSelect(locationData);
        }

        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Impossible d\'obtenir votre position. Veuillez saisir l\'adresse manuellement.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Simple reverse geocoding using a free service
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Using OpenStreetMap Nominatim (free service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'BloodDonationApp/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }

      throw new Error('Geocoding service unavailable');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Forward geocoding when user types an address
  const geocodeAddress = async (addressText: string) => {
    if (!addressText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressText)}&countrycodes=mr&limit=1`,
        {
          headers: {
            'User-Agent': 'BloodDonationApp/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data && data.length > 0) {
          const result = data[0];
          const locationData = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            address: result.display_name
          };

          setLocation({ lat: locationData.lat, lng: locationData.lng });
          onLocationSelect(locationData);
        } else {
          setError('Adresse non trouvée. Veuillez vérifier l\'adresse saisie.');
        }
      } else {
        throw new Error('Service de géocodage indisponible');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setError('Erreur lors de la recherche de l\'adresse. Veuillez réessayer.');
    }

    setLoading(false);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    geocodeAddress(address);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label htmlFor="address">Adresse ou localisation</Label>
        <form onSubmit={handleAddressSubmit} className="flex space-x-2 mt-2">
          <Input
            id="address"
            type="text"
            placeholder="Entrez l'adresse de l'hôpital ou du lieu"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="outline" disabled={loading || !address.trim()}>
            <MapPin className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="flex items-center space-x-4">
        <div className="h-px bg-gray-300 flex-1" />
        <span className="text-sm text-gray-500">ou</span>
        <div className="h-px bg-gray-300 flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={getCurrentLocation}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Navigation className="h-4 w-4 mr-2" />
        )}
        Utiliser ma position actuelle
      </Button>

      {location && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-green-700">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">Position sélectionnée</span>
          </div>
          <p className="text-sm text-green-600 mt-1 break-words">
            {address}
          </p>
          <p className="text-xs text-green-500 mt-1">
            Coordonnées: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}