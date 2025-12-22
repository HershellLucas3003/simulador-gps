const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const simulatorService = require('./service/simulator');

router.get('/', (req, res) => {
  res.send('Hello World!');
});

router.get('/get/all', async (req, res) => {
  res.send(await simulatorService.getAllEquips());
});

router.get('/maps', (req, res) => {
  try {
    const files = simulatorService.getMaps();
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/define/map', async (req, res) => {
  const { mapName } = req.body;
  const success = await simulatorService.defineMap(mapName);
  res.json({ success });
});

router.post('/define/auto', (req, res) => {
  const { auto } = req.body;
  simulatorService.setAutoMode(auto);
  res.json({ success: true });
});

router.get('/gps/coordinates', async (req, res) => {
  const coords = await simulatorService.defineEquiAndLatLong();
  res.json(coords);
});

router.post('/define/timer', (req, res) => {
  const { timerReq } = req.body;
  simulatorService.setTimer(timerReq);
  res.json({ success: true });
});


module.exports = router;