const ZONAS = {
  ensenada: 'Ensenada',
  berisso: 'Berisso',
  casco: 'La Plata (Casco)',
  norte: 'La Plata (Norte / Gonnet / City Bell)',
  sur: 'La Plata (Sur / Los Hornos)',
};

export interface DetectedAddress {
  zone: string;
  street: string;
  between: string;
  label: string;
}

function mapZone(address: Record<string, any>): string | null {
  const text = [
    address.city,
    address.town,
    address.municipality,
    address.suburb,
    address.county,
    address.state_district,
    address.neighbourhood,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/punta lara|ensenada/.test(text)) return ZONAS.ensenada;
  if (/berisso/.test(text)) return ZONAS.berisso;
  if (/gonnet|city bell|tolosa|ringuelet|manuel b\. gonnet/.test(text)) return ZONAS.norte;
  if (/los hornos/.test(text)) return ZONAS.sur;
  if (/la plata/.test(text)) return ZONAS.casco;
  return null;
}

/** Pide la ubicación al navegador y la convierte en dirección legible. Solo se llama tras una acción del usuario. */
export async function detectAddress(): Promise<DetectedAddress> {
  if (!navigator.geolocation) {
    throw new Error('Tu navegador no permite detectar la ubicación. Completá la dirección a mano.');
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    });
  });

  const { latitude, longitude } = position.coords;
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=es`,
    { headers: { Accept: 'application/json' } },
  );
  if (!response.ok) throw new Error('No pudimos consultar la dirección. Intentá de nuevo.');

  const data = await response.json();
  const address = data.address || {};
  const zone = mapZone(address);
  if (!zone) {
    throw new Error('Parece que estás fuera de nuestras zonas de entrega. Completá la dirección a mano.');
  }

  const street = [address.road || address.pedestrian || address.footway, address.house_number]
    .filter(Boolean)
    .join(' ');
  if (!street) throw new Error('No pudimos determinar la calle. Completá la dirección a mano.');

  return {
    zone,
    street,
    between: '',
    label: `${street} · ${zone}`,
  };
}
