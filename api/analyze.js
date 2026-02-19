export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { sector, postcode, radius, businessUrl } = req.body;

  try {
    // 1️⃣ Geocode postcode
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${postcode}&key=${process.env.GOOGLE_KEY}`,
    );
    const geo = await geoRes.json();

    const location = geo.results[0].geometry.location;

    // 2️⃣ Nearby search
    const placesRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius * 1609}&keyword=${sector}&key=${process.env.GOOGLE_KEY}`,
    );

    const places = await placesRes.json();

    // 3️⃣ SERP ranking
    const serpRes = await fetch(
      `https://serpapi.com/search.json?q=${sector}+near+${postcode}&api_key=${process.env.SERP_KEY}`,
    );

    const serp = await serpRes.json();

    // Find ranking of business URL
    let rank = null;
    if (serp.organic_results) {
      serp.organic_results.forEach((result, index) => {
        if (businessUrl && result.link.includes(businessUrl)) {
          rank = index + 1;
        }
      });
    }

    return res.status(200).json({
      totalCompetitors: places.results.length,
      competitors: places.results.slice(0, 5),
      googleRank: rank || 50,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
