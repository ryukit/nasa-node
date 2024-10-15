const {
  getAllLaunches,
  scheduleNewLaunch,
  abortLaunch,
  hasLaunchById
} = require('../../models/launches.model');

const {
  getPagination
} = require('../../services/query');

async function httpGetAllLaunches(req, res) {
  const { skip, limit } = getPagination(req.query);
  const launches = await getAllLaunches(skip, limit);
  return res.status(200).json(launches)
}

async function httpPostNewLaunch(req, res) {
  const launch = req.body;
  if (!launch.mission
      || !launch.rocket
      || !launch.launchDate
      || !launch.target
  ) {
    return res.status(400).json({
      error: 'Some parameters are missing'
    })
  }
  launch.launchDate = new Date(launch.launchDate);
  if (launch.launchDate.toString() === 'Invalid Date') {
    return res.status(400).json({
      error: 'Invalid launch date'
    })
  }

  const request = await scheduleNewLaunch(launch);
  if (request.ok)
    return res.status(201).json(launch)
  else
    return res.status(400).json({
      error: request.error
    })
}

async function httpAbortLaunch(req, res) {
  const launchId = req.params.id;
  const exists = await hasLaunchById(launchId)
  if (!exists) {
    return res.status(404).json({error: `No launches with id ${launchId} found.`})
  } else {
    const result = await abortLaunch(launchId);
    if (!result)
      return res.status(400).json({
        error: 'Launch not aborted'
      })

    return res.status(200).json({
      ok: true
    })
  }
}

module.exports = {
  httpGetAllLaunches,
  httpPostNewLaunch,
  httpAbortLaunch
}