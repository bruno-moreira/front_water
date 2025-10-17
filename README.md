## front_water — Interface do Monitor de Nível de Água

Aplicação React (Vite) para monitorar o nível de água com layout moderno responsivo (TV, desktop e mobile), gráficos Google Charts, indicadores de status e taxa de consumo em tempo real.

### Requisitos
- Node.js 18+ e npm

### Instalação
```bash
npm ci
```

### Desenvolvimento
Inicie o servidor de desenvolvimento (Vite):
```bash
npm run dev
```
A aplicação abrirá em `http://localhost:5173`.

### Build de Produção
```bash
npm run build
```
Pré-visualize o build localmente:
```bash
npm run preview
```

### Estrutura Principal
- `src/App.jsx`: ponto de entrada da interface.
- `src/components/Dashboard.tsx`: dashboard com gráficos, indicadores e taxa de consumo.
- `src/index.css` e `src/App.css`: estilos globais, variáveis CSS (cores, espaçamentos, tipografia com `clamp`) e layout full-viewport.

### Funcionalidades do Dashboard
- **Gráfico de Gauge**: nível atual de água (0-100%) com cores indicativas
- **Gráfico de Histórico**: área temporal das últimas 2 horas com buckets de 30 minutos
- **Indicadores de Status**: bombas, proteções e bomba auxiliar com animações pulsantes
- **Taxa de Consumo**: variação por minuto (L/min ou %/min) com cores dinâmicas:
  - Verde: consumo positivo (redução de volume)
  - Vermelho: consumo negativo (aumento de volume)
- **Volume Atual**: exibe `wvol` em litros quando disponível

### API / Backend
O Dashboard consome dois endpoints da API:

1. **`GET /api/nivel/`** — dados atuais e indicadores (atualização a cada 3s)
2. **`GET /api/nivel/last4h`** — buckets de 30min das últimas 2h para o gráfico

URLs configuradas em `src/components/Dashboard.tsx`:
```ts
// Dados atuais e indicadores
const resAll = await axios.get("http://localhost:3000/api/nivel/");
// Dados para gráfico histórico
const resBuckets = await axios.get("http://localhost:3000/api/nivel/last4h");
```

Para usar outro backend, ajuste as URLs ou crie variáveis de ambiente:

1) Crie um arquivo `.env.local` na raiz do `front_water`:
```env
VITE_API_URL=http://localhost:3000
```
2) Use no código:
```ts
const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const resAll = await axios.get(`${baseURL}/api/nivel/`);
const resBuckets = await axios.get(`${baseURL}/api/nivel/last4h`);
```

### Porta do Vite
Para mudar a porta do dev server, edite `vite.config.js`:
```js
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true }
})
```

### Convenções de Estilo
- CSS utiliza variáveis (`:root`) para cores, espaçamentos, raios e escalas tipográficas.
- Layout responsivo com grid, ajustado para telas grandes (TV) e dispositivos móveis.

### Problemas Comuns
- Erro de TypeScript com `<style jsx>`: não use o atributo `jsx` em projetos Vite/React padrão. O arquivo já está corrigido para `<style>` simples.
- Se os gráficos não renderizarem, verifique a conectividade com a API e o formato dos dados.
- Taxa de consumo zerada: verifique se há dados históricos suficientes (mínimo 2 registros com diferença temporal).
- Indicadores não animam: verifique se `pump_aux` está sendo enviado corretamente pela API.

### Scripts Disponíveis
- `npm run dev`: servidor de desenvolvimento
- `npm run build`: build de produção
- `npm run preview`: pré-visualização do build

### Licença
Uso interno/educacional. Ajuste conforme necessário.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# front_water
