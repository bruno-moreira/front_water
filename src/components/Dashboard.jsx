import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { RadialBarChart, RadialBar, Legend } from 'recharts';
import { Chart } from 'react-google-charts';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [history, setHistory] = useState([]);

    const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/nivel/');
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

    const googleGaugeData = [
        ['Label', 'Value'],
        ['Nível', data.wlevel],
        ['Bomba', data.pump1 ? 1 : 0],
    ];

    const googleGaugeOptions = {
        width: 400,
        height: 200,
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
        chartArea: { width: '70%', height: '70%' },
    };

    const renderIndicator = (label, value) => (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div
                style={{
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    backgroundColor: value ? 'green' : 'red',
                    marginRight: '8px',
                }}
            ></div>
            <span>{label}: {value ? 'Ligado' : 'Desligado'}</span>
        </div>
    );

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h2>Dashboard de Monitorização</h2>

            {/* Secção extra com novo gauge e indicadores */}
            <div style={{ display: 'flex', marginTop: '40px', justifyContent: 'center', gap: '60px' }}>
                <div>
                    <h3>Nível de Água Potável</h3>
                    <Chart
                        chartType="Gauge"
                        width="300px"
                        height="160px"
                        data={[["Label", "Value"], ["Nível", data.wlevel]]}
                        options={googleGaugeOptions}
                    />
                </div>

                <div>
                    <h3>Indicadores</h3>
                {renderIndicator('Bomba 1', data.pump1)}
                {renderIndicator('Bomba 2', data.pump2)}
                {renderIndicator('Proteção Bomba 1', data.protect_pump1)}
                {renderIndicator('Proteção Bomba 2', data.protect_pump2)}
                {renderIndicator('Contato A1 Bomba 1', data.a1_contact_pump1)}
                {renderIndicator('Contato A1 Bomba 2', data.a1_contact_pump2)}
                </div>
            </div>

            {/* Gráfico de Área */}
            <div style={{ marginTop: '60px' }}>
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
    );
};

export default Dashboard;
