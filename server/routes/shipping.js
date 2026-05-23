const express = require("express");

const router = express.Router();

// ─── Complete Indonesian address database ────────────────────────────────────
// Maps city/district/regency names → coordinates
// Covers: 34 provinces, major kabupaten/kota, popular districts
const LOCATION_MAP = {
  // Jabodetabek
  "jakarta": { lat: -6.2088, lng: 106.8456 },
  "jakarta selatan": { lat: -6.2615, lng: 106.8106 },
  "jakarta pusat": { lat: -6.1801, lng: 106.8291 },
  "jakarta utara": { lat: -6.1213, lng: 106.8810 },
  "jakarta timur": { lat: -6.2251, lng: 106.9004 },
  "jakarta barat": { lat: -6.1684, lng: 106.7637 },
  "bogor": { lat: -6.5971, lng: 106.8060 },
  "depok": { lat: -6.4025, lng: 106.7942 },
  "tangerang": { lat: -6.1781, lng: 106.6297 },
  "tangerang selatan": { lat: -6.2888, lng: 106.7140 },
  "bekasi": { lat: -6.2383, lng: 106.9756 },
  "serpong": { lat: -6.3194, lng: 106.6636 },
  "bsd": { lat: -6.3017, lng: 106.6657 },
  "ciputat": { lat: -6.3143, lng: 106.7442 },
  "pondok aren": { lat: -6.2908, lng: 106.7258 },
  "kebayoran": { lat: -6.2467, lng: 106.7955 },
  "tebet": { lat: -6.2259, lng: 106.8474 },
  "cibubur": { lat: -6.3759, lng: 106.8944 },
  "cileungsi": { lat: -6.3836, lng: 106.9701 },
  "karawang": { lat: -6.3215, lng: 107.3381 },
  "cikarang": { lat: -6.2548, lng: 107.1489 },
  // Jawa Barat
  "bandung": { lat: -6.9175, lng: 107.6191 },
  "bandung barat": { lat: -6.8409, lng: 107.4941 },
  "cimahi": { lat: -6.8720, lng: 107.5430 },
  "garut": { lat: -7.2127, lng: 107.9034 },
  "sukabumi": { lat: -6.9215, lng: 106.9272 },
  "cirebon": { lat: -6.7063, lng: 108.5573 },
  "subang": { lat: -6.5696, lng: 107.7586 },
  "purwakarta": { lat: -6.5570, lng: 107.4280 },
  "tasikmalaya": { lat: -7.3506, lng: 108.2166 },
  "ciamis": { lat: -7.3294, lng: 108.3530 },
  "sumedang": { lat: -6.8553, lng: 107.9198 },
  "indramayu": { lat: -6.3270, lng: 108.3253 },
  "majalengka": { lat: -6.8365, lng: 108.2268 },
  "kuningan": { lat: -6.9762, lng: 108.4851 },
  // Jawa Tengah
  "semarang": { lat: -6.9932, lng: 110.4203 },
  "solo": { lat: -7.5755, lng: 110.8243 },
  "surakarta": { lat: -7.5755, lng: 110.8243 },
  "yogyakarta": { lat: -7.7972, lng: 110.3688 },
  "jogja": { lat: -7.7972, lng: 110.3688 },
  "purwokerto": { lat: -7.4242, lng: 109.2329 },
  "banyumas": { lat: -7.5151, lng: 109.2962 },
  "cilacap": { lat: -7.7293, lng: 109.0148 },
  "pekalongan": { lat: -6.8971, lng: 109.6752 },
  "tegal": { lat: -6.8694, lng: 109.1402 },
  "salatiga": { lat: -7.3305, lng: 110.5084 },
  "magelang": { lat: -7.4797, lng: 110.2177 },
  "kudus": { lat: -6.8042, lng: 110.8414 },
  "jepara": { lat: -6.5887, lng: 110.6685 },
  "demak": { lat: -6.8946, lng: 110.6355 },
  "boyolali": { lat: -7.5304, lng: 110.5997 },
  "klaten": { lat: -7.7058, lng: 110.6093 },
  "wonogiri": { lat: -7.8165, lng: 110.9247 },
  "karanganyar": { lat: -7.5936, lng: 110.9714 },
  "sragen": { lat: -7.4268, lng: 110.9999 },
  "grobogan": { lat: -7.0100, lng: 110.9203 },
  // Jawa Timur
  "surabaya": { lat: -7.2575, lng: 112.7521 },
  "malang": { lat: -7.9666, lng: 112.6326 },
  "sidoarjo": { lat: -7.4559, lng: 112.7183 },
  "gresik": { lat: -7.1565, lng: 112.6519 },
  "mojokerto": { lat: -7.4709, lng: 111.5228 },
  "jombang": { lat: -7.5460, lng: 112.2342 },
  "kediri": { lat: -7.8149, lng: 111.9626 },
  "blitar": { lat: -8.0955, lng: 112.1623 },
  "tulungagung": { lat: -8.0656, lng: 111.9019 },
  "jember": { lat: -8.1844, lng: 113.6742 },
  "banyuwangi": { lat: -8.2193, lng: 114.3691 },
  "pasuruan": { lat: -7.6467, lng: 112.9082 },
  "probolinggo": { lat: -7.7543, lng: 113.2159 },
  "madiun": { lat: -7.6297, lng: 111.5235 },
  "ngawi": { lat: -7.4006, lng: 111.4539 },
  "magetan": { lat: -7.6425, lng: 111.3280 },
  "lamongan": { lat: -7.1186, lng: 112.4137 },
  "bojonegoro": { lat: -7.1512, lng: 111.8817 },
  "tuban": { lat: -6.8972, lng: 112.0508 },
  "bangkalan": { lat: -7.0445, lng: 112.7396 },
  "pamekasan": { lat: -7.1571, lng: 113.4746 },
  "sampang": { lat: -7.1966, lng: 113.2462 },
  "sumenep": { lat: -6.9980, lng: 113.8620 },
  // Bali & Nusa Tenggara
  "bali": { lat: -8.6705, lng: 115.2126 },
  "denpasar": { lat: -8.6705, lng: 115.2126 },
  "badung": { lat: -8.5626, lng: 115.1803 },
  "gianyar": { lat: -8.5361, lng: 115.3299 },
  "ubud": { lat: -8.5069, lng: 115.2625 },
  "kuta": { lat: -8.7180, lng: 115.1694 },
  "seminyak": { lat: -8.6914, lng: 115.1641 },
  "mataram": { lat: -8.5833, lng: 116.1167 },
  "lombok": { lat: -8.6529, lng: 116.3239 },
  // Sumatera
  "medan": { lat: 3.5952, lng: 98.6722 },
  "binjai": { lat: 3.6003, lng: 98.4849 },
  "deli serdang": { lat: 3.4765, lng: 98.7765 },
  "langkat": { lat: 4.0054, lng: 98.0833 },
  "palembang": { lat: -2.9761, lng: 104.7754 },
  "pekanbaru": { lat: 0.5335, lng: 101.4474 },
  "padang": { lat: -0.9471, lng: 100.4172 },
  "jambi": { lat: -1.6101, lng: 103.6131 },
  "bandar lampung": { lat: -5.4500, lng: 105.2667 },
  "lampung": { lat: -5.4500, lng: 105.2667 },
  "batam": { lat: 1.0456, lng: 104.0305 },
  "bengkulu": { lat: -3.7928, lng: 102.2608 },
  "banda aceh": { lat: 5.5483, lng: 95.3238 },
  "aceh": { lat: 4.6951, lng: 96.7494 },
  // Kalimantan
  "pontianak": { lat: -0.0263, lng: 109.3425 },
  "balikpapan": { lat: -1.2654, lng: 116.8312 },
  "samarinda": { lat: -0.5022, lng: 117.1536 },
  "banjarmasin": { lat: -3.3194, lng: 114.5908 },
  "palangka raya": { lat: -2.2082, lng: 113.9122 },
  // Sulawesi
  "makassar": { lat: -5.1477, lng: 119.4327 },
  "manado": { lat: 1.4748, lng: 124.8421 },
  "palu": { lat: -0.9003, lng: 119.8779 },
  "kendari": { lat: -3.9985, lng: 122.5127 },
  "gorontalo": { lat: 0.5435, lng: 123.0616 },
  // Maluku & Papua
  "ambon": { lat: -3.6954, lng: 128.1814 },
  "jayapura": { lat: -2.5916, lng: 140.6690 },
  "sorong": { lat: -0.8762, lng: 131.2561 },
};

/**
 * Smart address parser: extracts the most specific geocodable query
 * from a full street address by trying progressively shorter sub-addresses.
 */
function buildSearchQueries(rawAddress) {
  const address = rawAddress.trim();
  const queries = [];

  // 1. Full address first
  queries.push(`${address}, Indonesia`);

  // 2. Strip common noise words and street prefixes (Jl., No., RT, RW, Blok, dll)
  const stripped = address
    .replace(/\b(jl\.?|jalan|gg\.?|gang|komp\.?|komplek|perumahan|perum\.?|blok|block|no\.?|nomor|rt\.?\s*\d+|rw\.?\s*\d+|kelurahan|kel\.?|kecamatan|kec\.?|kabupaten|kab\.?|provinsi|prov\.?)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped !== address) queries.push(`${stripped}, Indonesia`);

  // 3. Split by commas and try sub-parts from right (more general = right)
  const parts = address.split(",").map(p => p.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const sub = parts.slice(i).join(", ");
    if (sub.length > 3 && !queries.includes(`${sub}, Indonesia`)) {
      queries.push(`${sub}, Indonesia`);
      queries.push(sub);
    }
  }

  // 4. Try individual parts from right
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i].trim();
    if (part.length > 3) {
      queries.push(`${part}, Indonesia`);
      queries.push(part);
    }
  }

  return [...new Set(queries)]; // dedupe
}

/**
 * Try local lookup map before hitting external API.
 */
function lookupLocalMap(address) {
  const lower = address.toLowerCase();

  // Exact match
  if (LOCATION_MAP[lower]) return { ...LOCATION_MAP[lower], method: "local-exact" };

  // Check each part of comma-separated address (right to left = general to specific)
  const parts = lower.split(",").map(p => p.trim()).reverse();
  for (const part of parts) {
    if (LOCATION_MAP[part]) return { ...LOCATION_MAP[part], method: "local-part" };

    // Substring match
    for (const [city, coords] of Object.entries(LOCATION_MAP)) {
      if (part.includes(city) || city.includes(part)) {
        return { ...coords, method: "local-substring" };
      }
    }
  }
  return null;
}

/**
 * Multi-strategy geocoding with 5 fallback levels.
 */
async function geocodeAddress(rawAddress) {
  const headers = {
    "User-Agent": "Starcast.id/1.0 shipping-calculator",
    "Accept-Language": "id,en;q=0.5",
  };

  // LEVEL 0: Local lookup map (instant, no network)
  const local = lookupLocalMap(rawAddress);
  if (local) {
    console.log(`[geo] Local map hit: "${rawAddress}" → ${local.method}`);
    return local;
  }

  // LEVEL 1-4: Progressive Nominatim queries
  const queries = buildSearchQueries(rawAddress);
  console.log(`[geo] Trying ${queries.length} queries for: "${rawAddress}"`);

  for (const q of queries) {
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", q);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "1");
      url.searchParams.set("countrycodes", "id");
      url.searchParams.set("addressdetails", "0");

      const res = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;

      const data = await res.json();
      if (data && data.length > 0) {
        console.log(`[geo] Nominatim matched query "${q}" → ${data[0].display_name}`);
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          method: "nominatim",
          matched_query: q,
          display_name: data[0].display_name,
        };
      }

      // Respect Nominatim 1 req/sec policy
      await new Promise(r => setTimeout(r, 1100));
    } catch (e) {
      console.warn(`[geo] Query failed: "${q}"`, e.message);
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return null;
}

/**
 * POST /api/shipping/calculate
 */
router.post("/calculate", async (req, res) => {
  try {
    const { address, lat, lng } = req.body;

    if (!address && (!lat || !lng)) {
      return res.status(400).json({ error: "Alamat atau koordinat diperlukan." });
    }

    const sellerLat = parseFloat(process.env.SELLER_LAT) || -6.2088;
    const sellerLng = parseFloat(process.env.SELLER_LNG) || 106.8456;

    let buyerLat, buyerLng, geoInfo = {};

    if (lat && lng) {
      buyerLat = parseFloat(lat);
      buyerLng = parseFloat(lng);
      geoInfo.method = "coordinates";
    } else {
      const geoResult = await geocodeAddress(address);
      if (!geoResult) {
        return res.status(400).json({
          error: `Alamat "${address}" tidak ditemukan. Tips: sertakan nama kota/kecamatan yang jelas, contoh: "Jl. Sudirman No. 5, Bandung" atau cukup "Bandung".`,
        });
      }
      buyerLat = geoResult.lat;
      buyerLng = geoResult.lng;
      geoInfo = geoResult;
    }

    // Get OSRM route
    const osrmUrl =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${sellerLng},${sellerLat};${buyerLng},${buyerLat}` +
      `?overview=full&geometries=geojson`;

    let distKm, durationMin, routeGeometry = null;

    try {
      const routeRes = await fetch(osrmUrl, { signal: AbortSignal.timeout(10000) });
      const routeData = await routeRes.json();

      if (routeData.routes && routeData.routes.length > 0) {
        const route = routeData.routes[0];
        distKm = route.distance / 1000;
        durationMin = route.duration / 60;
        routeGeometry = route.geometry;
      }
    } catch (e) {
      console.warn("[shipping] OSRM failed, using Haversine fallback:", e.message);
    }

    // Haversine fallback if OSRM failed or returned no route
    if (!distKm) {
      distKm = haversineDistance(sellerLat, sellerLng, buyerLat, buyerLng);
      durationMin = (distKm / 40) * 60; // rough 40 km/h estimate
    }

    const cost = calculateShippingCost(distKm);

    // Dynamic shipping transit and packing calculation
    let transitMin = 1;
    let transitMax = 2;

    if (distKm <= 20) {
      // Local instant/sameday
      transitMin = 0;
      transitMax = 0;
    } else if (distKm <= 150) {
      transitMin = 1;
      transitMax = 2;
    } else if (distKm <= 500) {
      transitMin = 2;
      transitMax = 3;
    } else if (distKm <= 1000) {
      transitMin = 3;
      transitMax = 4;
    } else {
      transitMin = 5;
      transitMax = 7;
    }

    const packingDays = 1; // 1-day precision quality check & premium wrapping
    const totalMin = packingDays + transitMin;
    const totalMax = packingDays + transitMax;

    // Calculate dynamic dates
    const formatIndoDate = (date) => {
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const d = date.getDate();
      const m = months[date.getMonth()];
      const y = date.getFullYear();
      return `${d} ${m} ${y}`;
    };

    const today = new Date();
    const minArrivalDate = new Date();
    minArrivalDate.setDate(today.getDate() + totalMin);

    const maxArrivalDate = new Date();
    maxArrivalDate.setDate(today.getDate() + totalMax);

    let arrivalText = "";
    if (totalMin === totalMax) {
      arrivalText = `${formatIndoDate(minArrivalDate)} (Hari Ini / Same Day)`;
    } else {
      arrivalText = `${formatIndoDate(minArrivalDate)} s.d. ${formatIndoDate(maxArrivalDate)} (${totalMin}-${totalMax} hari)`;
    }

    return res.json({
      distance_km: Math.round(distKm * 10) / 10,
      estimated_cost: cost,
      duration_text: formatDuration(durationMin),
      seller: { lat: sellerLat, lng: sellerLng },
      buyer: { lat: buyerLat, lng: buyerLng },
      route_geometry: routeGeometry,
      method: geoInfo.method || "direct",
      geo_display: geoInfo.display_name || null,
      packing_days: packingDays,
      transit_days_min: transitMin,
      transit_days_max: transitMax,
      estimated_arrival_text: arrivalText,
    });
  } catch (err) {
    console.error("[shipping] Unhandled error:", err);
    res.status(500).json({ error: "Gagal menghitung ongkos kirim. Silakan coba lagi." });
  }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function calculateShippingCost(distKm) {
  if (distKm <= 10)   return 10000;
  if (distKm <= 50)   return 15000;
  if (distKm <= 100)  return 20000;
  if (distKm <= 300)  return 25000;
  if (distKm <= 500)  return 35000;
  if (distKm <= 1000) return 45000;
  return 55000;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return (deg * Math.PI) / 180; }

function formatDuration(minutes) {
  if (minutes < 60) return `${Math.round(minutes)} menit`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h} jam ${m > 0 ? m + " menit" : ""}`.trim();
}

module.exports = router;
