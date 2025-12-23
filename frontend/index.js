const API_URL = 'http://localhost:3000';
let updateInterval = null;
let isSimulationRunning = false;

async function loadMaps() {
    try {
        const response = await fetch(`${API_URL}/maps`);
        const maps = await response.json();
        const mapSelect = document.getElementById('mapSelect');
        
        mapSelect.innerHTML = '<option value="">Selecione um mapa...</option>';
        maps.forEach(map => {
            const option = document.createElement('option');
            option.value = map;
            option.textContent = map;
            mapSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar mapas:', error);
        alert('Erro ao carregar mapas. Verifique se o servidor está rodando.');
    }
}

async function loadEquips() {
    try {
        const response = await fetch(`${API_URL}/get/all`);
        const equips = await response.json();
        const equipSelect = document.getElementById('equipSelect');
        
        equipSelect.innerHTML = '<option value="">Todos os equipamentos</option>';
        equips.forEach(e => {
            const option = document.createElement('option');
            option.value = e.id || e.equipId;  // Usar id ou equipId
            option.textContent = `${e.name} (${e.plate})`;
            equipSelect.appendChild(option);
        });
        
        // Adicionar evento de mudança
        equipSelect.addEventListener('change', async (event) => {
            await setSelectedEquip(event.target.value);
        });
    } catch (error) {
        console.error('Erro ao carregar equipamentos:', error);
    }
}

async function updateTable() {
    try {
        const response = await fetch(`${API_URL}/gps/coordinates`);
        const equips = await response.json();
        const corpoTabela = document.getElementById('corpo-resposta');
        
        if (equips.error) {
            corpoTabela.innerHTML = `<tr><td colspan="3">${equips.error}</td></tr>`;
            return;
        }
        
        corpoTabela.innerHTML = '';
        
        equips.forEach(e => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${e.name || e.equipId}</td>
                <td>${e.latitude ? e.latitude.toFixed(6) : 'N/A'}</td>
                <td>${e.longitude ? e.longitude.toFixed(6) : 'N/A'}</td>
            `;
            corpoTabela.appendChild(row);
        });
    } catch (error) {
        console.error('Erro ao atualizar tabela:', error);
    }
}

async function defineMap() {
    const mapSelect = document.getElementById('mapSelect');
    const mapName = mapSelect.value;
    
    if (!mapName) {
        alert('Selecione um mapa primeiro!');
        return false;
    }
    
    try {
        const response = await fetch(`${API_URL}/define/map`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mapName })
        });
        const result = await response.json();
        
        if (result.success) {
            console.log('Mapa definido com sucesso!');
            return true;
        } else {
            alert('Erro ao definir mapa.');
            return false;
        }
    } catch (error) {
        console.error('Erro ao definir mapa:', error);
        alert('Erro ao definir mapa. Verifique o console.');
        return false;
    }
}

async function setTimer() {
    const timerInput = document.getElementById('timerInput');
    const timerValue = parseInt(timerInput.value);
    
    if (timerValue < 100) {
        alert('O intervalo mínimo é 100ms');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/define/timer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timerReq: timerValue })
        });
        const result = await response.json();
        
        if (result.success) {
            alert(`Intervalo definido para ${timerValue}ms`);
        }
    } catch (error) {
        console.error('Erro ao definir timer:', error);
    }
}

async function setSelectedEquip(equipId) {
    try {
        const response = await fetch(`${API_URL}/define/equip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ equipId: equipId || null })
        });
        const result = await response.json();
        
        if (result.success) {
            const msg = equipId ? `Equipamento ${equipId} selecionado` : 'Todos os equipamentos selecionados';
            console.log(msg);
        }
    } catch (error) {
        console.error('Erro ao selecionar equipamento:', error);
    }
}

async function startSimulation() {
    const mapDefined = await defineMap();
    if (!mapDefined) return;
    
    try {
        const response = await fetch(`${API_URL}/define/auto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auto: true })
        });
        const result = await response.json();
        
        if (result.success) {
            isSimulationRunning = true;
            document.getElementById('startSimBtn').disabled = true;
            document.getElementById('stopSimBtn').disabled = false;
            document.getElementById('mapSelect').disabled = true;
            
            updateTable();
            updateInterval = setInterval(updateTable, 2000);
            
            console.log('Simulação iniciada!');
        }
    } catch (error) {
        console.error('Erro ao iniciar simulação:', error);
        alert('Erro ao iniciar simulação.');
    }
}

async function stopSimulation() {
    try {
        const response = await fetch(`${API_URL}/define/auto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auto: false })
        });
        const result = await response.json();
        
        if (result.success) {
            isSimulationRunning = false;
            document.getElementById('startSimBtn').disabled = false;
            document.getElementById('stopSimBtn').disabled = true;
            document.getElementById('mapSelect').disabled = false;
            
            if (updateInterval) {
                clearInterval(updateInterval);
                updateInterval = null;
            }
            
            console.log('Simulação parada!');
        }
    } catch (error) {
        console.error('Erro ao parar simulação:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadMaps();
    loadEquips();
    
    document.getElementById('setTimerBtn').addEventListener('click', setTimer);
    document.getElementById('startSimBtn').addEventListener('click', startSimulation);
    document.getElementById('stopSimBtn').addEventListener('click', stopSimulation);
    
    document.getElementById('stopSimBtn').disabled = true;
});