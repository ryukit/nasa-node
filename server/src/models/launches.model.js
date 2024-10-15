const axios = require('axios');

const launches = require('./launches.mongo');
const planets = require('./planets.mongo');
const {response} = require("express");

const DEFAULT_FLIGHT_NUMBER = 100;
const SPACEX_API = 'https://api.spacexdata.com/v4';
async function getAllLaunches(skip, limit) {
  return await launches
    .find({}, {
      '_id': 0,
      '__v': 0,
    })
    .sort({
      flightNumber: 1
    })
    .skip(skip)
    .limit(limit);
}

async function saveLaunch(launch) {
  await launches.findOneAndUpdate({
    flightNumber: launch.flightNumber,
  }, launch, {
    upsert: true,
  })
  return {
    ok: true
  }
}

async function getLatestFlightNumber() {
  const latestLaunch = await launches
    .findOne()
    .sort('-flightNumber');

  if (!latestLaunch)
    return DEFAULT_FLIGHT_NUMBER;

  return latestLaunch.flightNumber;
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });
  if (!planet) {
    //throw new Error('No matching planet found')
    return {
      ok: false,
      error: 'No matching planet found'
    }
  }
  const newFlightNumber = await getLatestFlightNumber() + 1;
  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ['ZTM', 'NASA'],
    flightNumber: launch.test ? launch.test : newFlightNumber,
  })

  return await saveLaunch(newLaunch);
}

async function findLaunch(filter) {
  return await launches.findOne(filter);
}

async function hasLaunchById(launchId) {
  return await findLaunch({
    flightNumber: launchId
  })
}

async function abortLaunch(launchId) {
  const aborted = await launches.updateOne({
    flightNumber: launchId,
  }, {
    upcoming: false,
    success: false,
  })
  return aborted.modifiedCount === 1;
}

async function populateLaunches() {
  console.log('Downloading launches data from SPACEX API')
  const query = {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: 'rocket',
          select: {
            name: 1,
          },
        },
        {
          path: 'payloads',
          select: {
            customers: 1,
          },
        },
      ],
    },
  }
  const response = await axios.post(`${SPACEX_API}/launches/query`, query)
  if (response.status !== 200) {
    throw new Error('Launch data download failed');
  }

  const launchDocs = response.data.docs;
  for (const doc of launchDocs) {
    const payloads = doc['payloads'];
    const customers = payloads.flatMap((payload) => {
      return payload['customers'];
    });

    const launch = {
      flightNumber: doc['flight_number'],
      mission: doc['name'],
      rocket: doc['rocket']['name'],
      launchDate: doc['date_local'],
      upcoming: doc['upcoming'],
      success: doc['success'],
      customers
    }
    console.log(`${launch.flightNumber}: ${launch.mission}`)
    await saveLaunch(launch)
  }
  console.log(`Data for ${launchDocs.length} launches loaded`)
}

async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat"
  });
  if (firstLaunch) {
    console.log('Launch data is already loaded')
    return;
  } else {
    await populateLaunches();
  }
}

module.exports = {
  getAllLaunches,
  scheduleNewLaunch,
  abortLaunch,
  hasLaunchById,
  loadLaunchData
};