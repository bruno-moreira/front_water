import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { RadialBarChart, RadialBar, Legend } from 'recharts';
import { Chart } from 'react-google-charts';

const Dashboard = () => {
    const [data, setData] = useState(null);

    const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/nivel/');
            const latestData = response.data[response.data.length - 1];
            setData(latestData);
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

    const gaugeData = [
        {
            name: 'Nível de Água',
            value: data.wlevel,
            fill: '#0088FE',
        },
    ];

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

    const renderIndicator = (label, value) => (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
            }}
        >
            <div
                style={{
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    backgroundColor: value ? 'green' : 'red',
                    marginRight: '8px',
                }}
            ></div>
            <span>
                {label}: {value ? 'Ligado' : 'Desligado'}
            </span>
        </div>
    );

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h2>Dashboard de Monitorização</h2>

            {/* Gauges */}
            <div style={{ display: 'flex', gap: '40px', justifyContent: 'center' }}>
                {/*
            <div>
          <h3>Nível de Água (Recharts)</h3>
          <RadialBarChart
            width={300}
            height={300}
            cx="50%"
            cy="50%"
            innerRadius="80%"
            outerRadius="100%"
            barSize={20}
            data={gaugeData}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar minAngle={15} background clockWise dataKey="value" />
            <Legend
              iconSize={10}
              layout="vertical"
              verticalAlign="middle"
              align="center"
            />
          </RadialBarChart>
          <div style={{ textAlign: 'center', fontSize: '20px' }}>
            {data.wlevel}%
          </div>
        </div>
        
        */}


                <div>
                    <h3>Gauge Google</h3>
                    <Chart
                        chartType="Gauge"
                        width="400px"
                        height="200px"
                        data={googleGaugeData}
                        options={googleGaugeOptions}
                    />
                </div>
            </div>

            {/* Indicators */}
            <div style={{ marginTop: '30px' }}>
                <h3>Estados</h3>
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
