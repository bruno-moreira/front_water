import React, { useEffect, useState } from "react";
import axios from "axios";
import { Chart } from "react-google-charts";

interface LevelData {
  wlevel: number;
  pump1: boolean;
  pump2: boolean;
  protect_pump1: boolean;
  protect_pump2: boolean;
  a1_contact_pump1: boolean;
  a1_contact_pump2: boolean;
  pump_aux?: boolean | null;
  wvol?: number | null;
}

const Dashboard: React.FC = () => {
  const [wlevel, setWlevel] = useState<number | null>(null);
  const [history, setHistory] = useState<(string | number)[][]>([]);
  const [data, setData] = useState<LevelData | null>(null);
  const [consumptionRate, setConsumptionRate] = useState<number | null>(null); // L/h (positive means consumo)

  const fetchData = async () => {
    try {
      const [resAll, resBuckets] = await Promise.all([
        axios.get<LevelData[]>("http://localhost:3000/api/nivel/"),
        axios.get<any[]>("http://localhost:3000/api/nivel/last4h"),
      ]);
      const all = resAll.data;
      const buckets = resBuckets.data;
      if (!Array.isArray(all) || all.length === 0) return;
      // API retorna em ordem DESC por hour, então o mais recente é o primeiro
      const latest = all[0];
      setWlevel(latest.wlevel ?? 0);
      setData(latest);
      // Compute per-minute consumption rate using 1-hour delta divided by 60
      try {
        const latestTime = new Date((latest as any).hour ?? (latest as any).created_at ?? Date.now()).getTime();
        const targetTime = latestTime - 60 * 60 * 1000;
        // Escolhe o registro imediatamente anterior ou igual a 1h atrás; se não houver, usa o mais antigo disponível
        let prev = null as any;
        let prevTime = 0;
        for (const row of (all as any[])) {
          const t = new Date(row.hour ?? row.created_at).getTime();
          if (t <= targetTime) { prev = row; prevTime = t; break; }
        }
        if (!prev) {
          const last = (all as any[])[(all as any[]).length - 1];
          prev = last;
          prevTime = new Date(last.hour ?? last.created_at).getTime();
        }
        const minutes = Math.max(1, Math.round((latestTime - prevTime) / 60000));
        const latestVol = (latest as any).wvol;
        const prevVol = prev ? prev.wvol : null;
        if (typeof latestVol === 'number' && typeof prevVol === 'number') {
          const perMin = (prevVol - latestVol) / minutes;
          setConsumptionRate(Math.round(perMin * 10) / 10);
        } else {
          const latestPct = (latest as any).wlevel;
          const prevPct = prev ? prev.wlevel : null;
          if (typeof latestPct === 'number' && typeof prevPct === 'number') {
            const perMinPct = (prevPct - latestPct) / minutes;
            setConsumptionRate(Math.round(perMinPct * 100) / 100);
          } else {
            setConsumptionRate(null);
          }
        }
      } catch (_) {
        setConsumptionRate(null);
      }
      const h = Array.isArray(buckets)
        ? buckets.map((e) => [new Date(e.hour), e.wlevel])
        : [];
      setHistory([[{ type: 'datetime', label: 'Hora' }, { type: 'number', label: 'Nível de Água' }], ...h]);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 3000);
    return () => clearInterval(id);
  }, []);

  if (wlevel === null || !data) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Carregando dados...</p>
    </div>
  );

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

  // Compute a 2-hour view window with 30-minute ticks
  const now = new Date();
  const minTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const xTicks: Date[] = [];
  {
    const start = new Date(minTime);
    start.setMinutes(start.getMinutes() - (start.getMinutes() % 30), 0, 0);
    let cursor = start;
    while (cursor <= now) {
      xTicks.push(new Date(cursor));
      cursor = new Date(cursor.getTime() + 30 * 60 * 1000);
    }
  }

  const areaChartOptions = {
    title: "Histórico do Nível de Água (2h)",
    hAxis: {
      title: "Hora",
      titleTextStyle: { color: "#333" },
      format: "HH:mm",
      viewWindow: { min: minTime, max: now },
      ticks: xTicks,
    },
    vAxis: {
      minValue: 0,
      viewWindow: { min: 0, max: 100 },
      ticks: [0, 20, 40, 60, 80, 100],
    },
    chartArea: { width: "90%", height: "80%" },
    colors: ["#3b82f6"],
  };

  const renderIndicator = (label: string, value: boolean) => (
    <div
      className={`indicator ${value ? 'indicator-on' : 'indicator-off'}`}
    >
      <div className="indicator-dot"></div>
      <span className="indicator-label">{label}</span>
      <span className="indicator-status">{value ? "Ligado" : "Desligado"}</span>
    </div>
  );

  return (
    <>
      <style>{`
        :global(*) {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :global(html), :global(body), :global(#root) {
          height: 100%;
          width: 100%;
        }

        .dashboard {
          height: 100vh;
          width: 100vw;
          display: grid;
          grid-template-rows: auto 1fr auto;
          background: transparent;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .header {
          background: rgba(17, 24, 39, 0.6);
          backdrop-filter: blur(8px);
          padding: var(--space-3) var(--space-5);
          box-shadow: 0 1px 0 rgba(148, 163, 184, 0.08) inset;
          border-bottom: 1px solid rgba(148, 163, 184, 0.15);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          font-size: var(--text-2xl);
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-700) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-title {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--color-text);
        }

        .current-level {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-700) 100%);
          color: white;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: var(--text-2xl);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .header-badges {
          display: flex;
          gap: var(--space-2);
          align-items: center;
        }

        .consumption-rate {
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: var(--text-2xl);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .consumption-rate.positive {
          background: rgba(34,197,94,0.15);
          color: #86efac;
          border: 1px solid rgba(34,197,94,0.35);
        }

        .consumption-rate.negative {
          background: rgba(239,68,68,0.15);
          color: #fca5a5;
          border: 1px solid rgba(239,68,68,0.35);
        }

        .main-content {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: var(--space-4);
          padding: var(--space-4);
          height: 100%;
          overflow: hidden;
        }

        .chart-panel {
          background: linear-gradient(180deg, rgba(17,24,39,0.9), rgba(15,23,42,0.9));
          border-radius: var(--radius-lg);
          box-shadow: 0 10px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03);
          border: 1px solid rgba(148, 163, 184, 0.12);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .gauge-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .history-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .panel-title {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: var(--space-3);
          text-align: center;
        }

        .chart-container {
          flex: 1;
          min-height: 0;
          width: 100%;
        }

        .footer {
          background: rgba(17, 24, 39, 0.6);
          backdrop-filter: blur(8px);
          padding: var(--space-3) var(--space-5);
          box-shadow: 0 -1px 0 rgba(148, 163, 184, 0.08) inset;
          border-top: 1px solid rgba(148, 163, 184, 0.15);
        }

        .indicators-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-2);
          max-width: 1600px;
          margin: 0 auto;
        }

        .indicator {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .indicator-on {
          background: rgba(58, 238, 58, 0.12);
          border: 1px solid rgba(15, 230, 61, 0.35);
          color: #93c5fd;
          box-shadow: 0 0 0 0 rgba(59,130,246,0.35);
          animation: pulseGlow 1.6s ease-in-out infinite;
        }

        .indicator-off {
          background: rgba(239,68,68,0.10);
          border: 1px solid rgba(239,68,68,0.35);
          color: #fca5a5;
        }

        .indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .indicator-on .indicator-dot {
          background: var(--color-primary);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          animation: dotPulse 1.2s ease-in-out infinite;
        }

        .indicator-off .indicator-dot {
          background: #ef4444;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
        }

        .indicator-label {
          font-size: var(--text-sm);
          font-weight: 600;
        }

        .indicator-status {
          font-size: var(--text-xs);
          opacity: 0.85;
          margin-left: auto;
        }

        .loading-container {
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: transparent;
          gap: var(--space-2);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulseGlow {
          0% {
            box-shadow: 0 0 0 0 rgba(59,130,246,0.35);
            border-color: rgba(59,130,246,0.45);
          }
          50% {
            box-shadow: 0 0 12px 4px rgba(59,130,246,0.25);
            border-color: rgba(59,130,246,0.65);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59,130,246,0.35);
            border-color: rgba(59,130,246,0.45);
          }
        }

        @keyframes dotPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.25); }
          100% { transform: scale(1); }
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .main-content {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 1fr;
            gap: var(--space-3);
            padding: var(--space-3);
          }

          .chart-panel {
            min-height: 300px;
          }
        }

        @media (max-width: 768px) {
          .header {
            padding: var(--space-3);
            flex-direction: column;
            gap: var(--space-2);
          }

          .header-content {
            flex-direction: column;
            text-align: center;
            gap: var(--space-2);
          }

          .main-content {
            padding: var(--space-2);
            gap: var(--space-2);
          }

          .chart-panel {
            padding: var(--space-3);
            border-radius: var(--radius-md);
          }

          .footer {
            padding: var(--space-3);
          }

          .indicators-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: var(--space-2);
          }

          .indicator {
            padding: var(--space-2) var(--space-3);
          }
        }

        @media (max-width: 480px) {
          .indicators-grid {
            grid-template-columns: 1fr;
          }

          .main-content {
            grid-template-rows: auto auto;
          }

          .chart-panel {
            min-height: 250px;
          }
        }
      `}</style>

      <div className="dashboard">
        <header className="header">
          <div className="header-content">
            <div className="header-icon">💧</div>
            <h1 className="header-title">Sistema de Água Potável</h1>
          </div>
          <div className="header-badges">
            <div className={`consumption-rate ${consumptionRate === null ? '' : (consumptionRate >= 0 ? 'positive' : 'negative')}`}>
              Taxa 1 min: {consumptionRate === null ? '--' : `${consumptionRate}${typeof (data as any)?.wvol === 'number' ? ' L/min' : ' %/min'}`}
            </div>
            <div className="current-level">
              Volume Atual: {data.wvol ?? 0}L
            </div>

          </div>
        </header>

        <main className="main-content">
          <section className="chart-panel gauge-panel">
            <h2 className="panel-title">Nível em Tempo Real</h2>
            <div className="chart-container">
              <Chart
                chartType="Gauge"
                width="100%"
                height="100%"
                data={[["Label", "Value"], ["Nível %", wlevel]]}
                options={googleGaugeOptions}
              />
            </div>
          </section>

          <section className="chart-panel history-panel">
            <h2 className="panel-title">Histórico do Nível</h2>
            <div className="chart-container">
              <Chart
                chartType="AreaChart"
                width="100%"
                height="100%"
                data={history}
                options={areaChartOptions}
              />
            </div>
          </section>
        </main>

        <footer className="footer">
          <div className="indicators-grid">
            {renderIndicator("Bomba 1", !!data.pump1)}
            {renderIndicator("Bomba 2", !!data.pump2)}
            {renderIndicator("Proteção Bomba 1", !!data.protect_pump1)}
            {renderIndicator("Proteção Bomba 2", !!data.protect_pump2)}
            {renderIndicator("Bomba Auxiliar", !!data.pump_aux)}
          </div>
        </footer>
      </div>
    </>
  );
};

export default Dashboard;