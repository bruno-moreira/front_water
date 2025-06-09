import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart } from 'react-google-charts';



const Dashboard = () => {
    const [data, setData] = useState(null);
    const [history, setHistory] = useState([]);

    const fetchData = async () => {
        try {
            const response = await axios.get('http://192.168.5.30:5000/api/nivel/');
            const allData = response.data;
            const latestData = allData[allData.length - 1];
            setData(latestData);
            const levelHistory = allData.map((entry, index) => [
                `Registo ${index + 1}`,
                entry.wlevel
            ]);
            setHistory([['Registo', 'Nível de Água'], ...levelHistory]);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            fetchData();
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    if (!data) return <p>Carregando dados...</p>;

    const googleGaugeOptions = {
        redFrom: 0,
        redTo: 30,
        yellowFrom: 30,
        yellowTo: 50,
        greenFrom: 50,
        greenTo: 100,
        minorTicks: 5,
        max: 100,
    };

    const areaChartOptions = {
        title: 'Histórico do Nível de Água',
        hAxis: { title: 'Registo', titleTextStyle: { color: '#333' } },
        vAxis: { minValue: 0 },
        chartArea: { width: '100%', height: '70%' },
    };

    const renderIndicator = (label, value) => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '4px',
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: value ? 'green' : 'red',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px',
            whiteSpace: 'nowrap'
        }}>
            <span>{label}: {value ? 'Ligado' : 'Desligado'}</span>
        </div>
    );

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '1920px', margin: '0 auto' }}>
            <h2>Dashboard de Monitorização</h2>

            {/* Gauge + Gráfico de Área */}
            <div style={{
                display: 'flex',
                flexWrap: 'nowrap',
                marginTop: '40px',
                gap: '40px',
                alignItems: 'flex-start',
                justifyContent: 'space-between'
            }}>
                <div style={{ flex: '1 1 500px', minWidth: '400px', maxWidth: '600px' }}>
                    <h3>Nível de Água Potável</h3>
                    <Chart
                        chartType="Gauge"
                        width="100%"
                        height="400px"
                        data={[["Label", "Value"], ["Nível", data.wlevel]]}
                        options={googleGaugeOptions}
                    />
                </div>
                <div style={{ flex: '2 1 1000px', minWidth: '600px' }}>
                    <h3>Histórico do Nível</h3>
                    <Chart
                        chartType="AreaChart"
                        width="100%"
                        height="400px"
                        data={history}
                        options={areaChartOptions}
                    />
                </div>
            </div>

            {/* Indicadores */}
            <div style={{
                marginTop: '40px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '#f9f9f9',
                flexWrap: 'wrap',
                gap: '6px'
            }}>
                {renderIndicator('Bomba 1', data.pump1)}
                {renderIndicator('Bomba 2', data.pump2)}
                {renderIndicator('Proteção Bomba 1', data.protect_pump1)}
                {renderIndicator('Proteção Bomba 2', data.protect_pump2)}
                {renderIndicator('Contato A1 Bomba 1', data.a1_contact_pump1)}
                {renderIndicator('Contato A1 Bomba 2', data.a1_contact_pump2)}
            </div>
        </div>
    );
};

export default Dashboard;