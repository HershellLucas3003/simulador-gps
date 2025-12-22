const fs = require('fs');
const path = require('path');

class Equipamento {
    constructor(
        equipId,
        concessionaire,
        plate,
        name,
        longitude,
        latitude,
        date,
        speedAverage
    ) {
        this.equipId = equipId;
        this.concessionaire = concessionaire;
        this.plate = plate;
        this.name = name;
        this.longitude = longitude;
        this.latitude = latitude;
        this.date = date;
        this.speedAverage = speedAverage;
    }
}

const listEquips = [];
let mapa = null;
let cordenates = [];
let auto = false;
let timer = 5000;
let intervalId = null;

function getMaps() {
    const dir = path.join(__dirname, '../maps');
    return fs.readdirSync(dir).filter(file => file.endsWith('.geojson'));
}

async function getAllEquips() {
    if (listEquips.length === 0) {
        try {
            const response = await fetch('http://localhost:8010/gps/equipment/all');
            const data = await response.json();
            listEquips.push(...data);
            console.log(`${listEquips.length} equipamentos carregados da API`);
        } catch (error) {
            console.error('Erro ao buscar equipamentos da API:', error);
            throw error;
        }
    }
    return listEquips;
};

async function defineMap(data) {
    if (!data) throw new Error('No data provided to define the map.');
    
    try {
        const mapsArray = getMaps();
        const found = mapsArray.find(map => map === data);
        
        if (found) {
            const geojsonPath = path.join(__dirname, '../maps/', found);
            mapa = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
            console.log(`Mapa ${data} carregado com sucesso!`);
            return true;
        } else {
            console.error('Mapa não encontrado.');
            return false;
        }
    } catch (error) {
        console.error('Erro ao processar mapas:', error);
        return false;
    }
}

function getAllCordenates(name) {
    const geojsonPath = path.join(__dirname, '../maps/', name);
    const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
    cordenates = geojson.features.map(feature => feature.geometry.coordinates);
    console.log(cordenates);
}


function setAutoMode(value) {
    if (typeof value !== 'boolean') throw new Error('Auto mode value must be a boolean.');
    auto = value;
    
    if (auto) {
        startSimulation();
    } else {
        stopSimulation();
    }
}

function startSimulation() {
    if (intervalId) return;
    
    intervalId = setInterval(() => {
        if (!mapa) {
            console.error('Mapa não carregado. Defina um mapa primeiro.');
            return;
        }
        
        for (let equip of listEquips) {
            try {
                const { lat: newLat, lon: newLon } = pegarLatLonAleatorio();
                const equipAtualizado = new Equipamento(
                    equip.equipId,
                    equip.concessionaire,
                    equip.plate,
                    equip.name,
                    newLon,
                    newLat,
                    new Date(),
                    Math.floor(Math.random() * 40) + 60 
                );
                
                const index = listEquips.findIndex(e => e.equipId === equip.equipId);
                if (index !== -1) {
                    listEquips[index] = equipAtualizado;
                }
            } catch (error) {
                console.error(`Erro ao atualizar equipamento ${equip.equipId}:`, error.message);
            }
        }
    }, timer);
    
    console.log(`Simulação iniciada com intervalo de ${timer}ms`);
}

function stopSimulation() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('Simulação parada');
    }
}

function updateCoordinates(newLat, newLon) {
    if (typeof newLat !== 'number' || typeof newLon !== 'number') {
        throw new Error('Latitude and Longitude must be numbers.');
    }
}

function setTimer(value) {
    if (typeof value !== 'number' || value <= 0) {
        throw new Error('Timer value must be a positive number.');
    }
    timer = value;
    
    if (intervalId && auto) {
        stopSimulation();
        startSimulation();
    }
}

async function defineEquiAndLatLong() {
    if (!mapa) {
        return { error: 'Mapa não carregado. Use /define/map primeiro.' };
    }
    
    if (listEquips.length === 0) {
        await getAllEquips();
    }
    
    return listEquips.map(equip => ({
        equipId: equip.equipId,
        name: equip.name,
        plate: equip.plate,
        concessionaire: equip.concessionaire,
        latitude: equip.latitude || null,
        longitude: equip.longitude || null,
        date: equip.date || null,
        speedAverage: equip.speedAverage || null
    }));
}


function pegarLatLonAleatorio() {
    if (!mapa || !mapa.features || mapa.features.length === 0) {
        throw new Error('Mapa não carregado ou sem features.');
    }
    
    const featuresComCoordenadas = mapa.features.filter(
        feature => feature.geometry && 
                   feature.geometry.coordinates && 
                   feature.geometry.coordinates.length > 0
    );
    
    if (featuresComCoordenadas.length === 0) {
        throw new Error('Nenhuma feature com coordenadas encontrada.');
    }
    
    const featureIndex = Math.floor(Math.random() * featuresComCoordenadas.length);
    const feature = featuresComCoordenadas[featureIndex];
    const coords = feature.geometry.coordinates;
    
    const pointIndex = Math.floor(Math.random() * coords.length);
    const [lonAleatoria, latAleatoria] = coords[pointIndex];
    
    return { lat: parseFloat(latAleatoria), lon: parseFloat(lonAleatoria) };
}

module.exports = {
    getAllEquips,
    defineMap,
    setAutoMode,
    updateCoordinates,
    getAllCordenates,
    pegarLatLonAleatorio,
    defineEquiAndLatLong,
    setTimer,
    getMaps
};