const express = require('express');
const cors = require('cors');
const path = require('path');
const Amadeus = require('amadeus');
const csv = require('csv-parser');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, '../frontend/build')));
app.use(cors());

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET,
});

async function getAirportIATACode(city) {
  try {
    const response = await amadeus.referenceData.locations.cities.get({
      keyword: city,
    });
    const cityData = response.data.find(location => location.subType === 'city' && location.iataCode);
    return cityData ? cityData.iataCode : null;
  } catch (error) {
    throw new Error('Error fetching IATA code');
  }
}

//#region Search for accommodations in a city
app.get('/accommodations', async (req, res) => {
  const city = req.query.city;

  if (!city) {
    return res.status(400).send({ error: 'City not provided' });
  }

  try {
    const cityCode = await getAirportIATACode(city);
    if (!cityCode) {
      return res.status(404).send({ error: 'City not found' });
    }

    console.log(cityCode);

    const response = await amadeus.referenceData.locations.hotels.byCity.get({
      cityCode: cityCode,
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});
//#endregion Search for accommodations in a city

//#region Search for city names
app.get('/api/cities', async (req, res) => {
  const searchTerms = req.query.CityName || ''; // Default to empty string if no search term
  const cities = [];

  if(searchTerms.length < 3) {
    return res.status(400).send({ error: 'Search term must be at least 3 characters long' });
  }

  let Cities = await amadeus.referenceData.locations.cities.get({
    keyword: searchTerms,
  });
  // Only return city names
  // Filter out cities if they don't have a IATA code
  Cities.data = Cities.data.filter(city => city.iataCode);
  Cities = Cities.data.map(city => city.name);
  res.json(Cities);
});
//#endregion Search for city names

//#region Search for hotelDetails
app.get('/hotelDetails', async (req, res) => {
  // Example: HSMCQAAX
  const hotelId = req.query.hotelID;
  console.log(hotelId);

  const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET,
  });

  if (!hotelId) {
    return res.status(400).send({ error: 'Hotel ID not provided' });
  }

  try {
    const response = await amadeus.shopping.hotelOffersByHotel.ge({
      hotelIds: hotelId
    });

    console.log(response.data);
    res.json(response.data);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});