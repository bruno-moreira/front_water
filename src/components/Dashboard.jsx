import React, { useEffect, useState } from "react";
import axios from "axios";
import { Chart } from "react-google-charts";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "../styles/Dashboard.css";

function Dashboard() {
  const [stateData, setStateData] = useState([]);
  const [pump1Data, setPump1Data] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [statusText, setStatusText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getBitState = (registro, bitIndex) => {
    return bitIndex < 16 ? (registro & (1 << bitIndex)) !== 0 : false;
  };

  const updateStateText = (registro) => {
    if (typeof registro !== "number") return;

    const bit1 = getBitState(registro, 1);
    const bit2 = getBitState(registro, 2);
    const bit6 = getBitState(registro, 6);
    const bit7 = getBitState(registro, 7);

    const texto0 = "ESTADO:";
    const texto1 = bit1 ? "LIGADO" : "PARADO";
    const texto2 = bit2 ? "COM CARGA" : "SEM CARGA";
    const texto6 = bit6 ? "COM ALARME" : "SEM ALARME";
    const texto7 = bit7 ? "COM AVISO" : "SEM AVISO";

    setStatusText(`${texto0} ${texto1} ${texto2} ${texto6} ${texto7}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get("http://localhost:3000/api/nivel/");

        console.log(response)

        setStateData(response.data.state_data);
        setPump1Data(response.data.pump1_data);
        setTimeData(response.data.time_data);

        const lastState = response.data.state_data.at(-1);
        updateStateText(lastState);
      } catch (err) {
        console.error("Erro ao buscar dados:", err.message);
        setError("Erro ao buscar dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 10000); // Atualiza a cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  const gaugeOptions1 = {
    width: 380,
    height: 380,
    redFrom: 0,
    redTo: 6,
    yellowFrom: 6,
    yellowTo: 7.5,
    greenFrom: 7.5,
    greenTo: 9,
    minorTicks: 10,
    max: 9,
  };

  const gaugeOptions2 = {
    width: 380,
    height: 380,
    redFrom: 0,
    redTo: 10,
    yellowFrom: 10,
    yellowTo: 50,
    greenFrom: 50,
    greenTo: 100,
    minorTicks: 10,
    max: 100,
  };

  const stateChartOptions = {
    chart: { type: "line" },
    title: { text: "Pressão de Saída (Bar)" },
    xAxis: { categories: timeData },
    yAxis: { min: 0, max: 9, title: { text: "Pressão (Bar)" } },
    series: [{ name: "Pressão", data: stateData }],
    credits: { enabled: false },
  };

  const wlevelChartOptions = {
    chart: { type: "line" },
    title: { text: "Nível de Água (%)" },
    xAxis: { categories: timeData },
    yAxis: { min: 0, max: 100, title: { text: "Nível (%)" } },
    series: [{ name: "Nível", data: pump1Data }],
    credits: { enabled: false },
  };

  return (
    <div className="dashboard">
      <h2>MONITOR DE ÁGUA POTÁVEL</h2>

      {loading && <p>Carregando...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <>
          <div className="status-container">
            <h1>{statusText}</h1>
          </div>

          <div className="container">
            <Chart
              chartType="Gauge"
              data={[["Label", "Value"], ["Bar", stateData.at(-1) ?? 0]]}
              options={gaugeOptions1}
            />

            <Chart
              chartType="Gauge"
              data={[["Label", "Value"], ["%", pump1Data.at(-1) ?? 0]]}
              options={gaugeOptions2}
            />
          </div>

          <div className="container">
            <div className="chart-box">
              <HighchartsReact highcharts={Highcharts} options={stateChartOptions} />
            </div>
            <div className="chart-box">
              <HighchartsReact highcharts={Highcharts} options={wlevelChartOptions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
