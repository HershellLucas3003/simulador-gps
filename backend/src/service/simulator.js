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
let selectedEquipId = null;
let apiUrl = null;
let sendToApi = false;

function getMaps() {
    const dir = path.join(__dirname, '../maps');
    return fs.readdirSync(dir).filter(file => file.endsWith('.geojson'));
}

async function getAllEquips() {
    if (listEquips.length === 0) {
        try {
            const response = await fetch('http://localhost:8010/gps/equipment/all');
            const data = await response.json();
            
            const equipamentos = data.map(e => new Equipamento(
                e.id,
                e.concessionaire,
                e.plate,
                e.name,
                e.longitude || null,
                e.latitude || null,
                e.lastCommunication || null,
                e.speedAverage || null
            ));
            
            listEquips.push(...equipamentos);
            console.log(`${listEquips.length} equipamentos carregados da API`);
            console.log('IDs dos equipamentos:', listEquips.map(e => `${e.equipId}-${e.plate}`).slice(0, 3));
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
        
        const equipsToUpdate = selectedEquipId 
            ? listEquips.filter(e => e.equipId === selectedEquipId)
            : listEquips;
        
        if (equipsToUpdate.length === 0) {
            console.error('Nenhum equipamento encontrado para atualizar.');
            console.log('Lista de equipamentos disponíveis:', listEquips.length);
            console.log('Selected equipId:', selectedEquipId);
            return;
        }
        
        console.log(`Atualizando ${equipsToUpdate.length} equipamento(s)...`);
        
        for (let equip of equipsToUpdate) {
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
                    0 
                );
                
                const index = listEquips.findIndex(e => e.equipId === equip.equipId);
                if (index !== -1) {
                    listEquips[index] = equipAtualizado;
                    console.log(`✓ Equipamento ${equip.equipId} (${equip.plate}) atualizado`);
                    
                    if (sendToApi && apiUrl) {
                        sendLocationToApi(equipAtualizado).catch(err => 
                            console.error(`Erro ao enviar ${equip.equipId}:`, err.message)
                        );
                    }
                } else {
                    console.error(`✗ Equipamento ${equip.equipId} não encontrado no array`);
                }
            } catch (error) {
                console.error(`Erro ao atualizar equipamento ${equip.equipId}:`, error.message);
            }
        }
        
        const msg = selectedEquipId 
            ? `Atualizando equipamento ${selectedEquipId}`
            : `Atualizando ${equipsToUpdate.length} equipamentos`;
        console.log(msg);
    }, timer);
    
    const simMsg = selectedEquipId 
        ? `Simulação iniciada para equipamento ${selectedEquipId} com intervalo de ${timer}ms`
        : `Simulação iniciada para todos os equipamentos (${listEquips.length}) com intervalo de ${timer}ms`;
    console.log(simMsg);
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

async function sendLocationToApi(equip) {
    if (!apiUrl || !sendToApi) return;
    
    const locationDTO = {
        equipId: equip.equipId,
        concessionaire: equip.concessionaire,
        plate: equip.plate,
        name: equip.name,
        longitude: equip.longitude,
        latitude: equip.latitude,
        date: equip.date ? equip.date.toISOString() : new Date().toISOString(),
        speedAverage: equip.speedAverage
    };
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(locationDTO)
        });
        
        if (response.ok) {
            console.log(`✓ Dados enviados para API: ${equip.equipId} (${equip.plate})`);
        } else {
            console.error(`✗ Erro ao enviar para API: ${response.status}`);
        }
    } catch (error) {
        console.error(`✗ Erro ao enviar para API:`, error.message);
    }
}

function setApiConfig(url, enabled = true) {
    apiUrl = url;
    sendToApi = enabled;
    console.log(`API configurada: ${url} | Envio: ${enabled ? 'ativado' : 'desativado'}`);
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

function setSelectedEquip(equipId) {
    selectedEquipId = equipId || null;
    
    if (selectedEquipId) {
        const found = listEquips.find(e => e.equipId === selectedEquipId);
        if (!found) {
            throw new Error(`Equipamento ${equipId} não encontrado.`);
        }
        console.log(`Equipamento ${selectedEquipId} selecionado para simulação.`);
    } else {
        console.log('Todos os equipamentos serão simulados.');
    }
    
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
    setSelectedEquip,
    setApiConfig,
    getMaps
};