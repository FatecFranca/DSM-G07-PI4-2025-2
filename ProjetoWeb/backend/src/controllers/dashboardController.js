import * as BillModel from '../models/Bill.js';

export const getDashboard = async (req, res) => {
  try {
    const bills = await BillModel.findAllForDashboard(req.userId);
    res.json({ bills });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Funções auxiliares para cálculos estatísticos
function calculateMean(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateStandardDeviation(values, mean) {
  if (values.length === 0) return 0;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculateCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);
  
  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;
  
  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }
  
  const denominator = Math.sqrt(sumSqX * sumSqY);
  if (denominator === 0) return 0;
  
  return numerator / denominator;
}

function calculateLinearRegression(x, y) {
  if (x.length !== y.length || x.length === 0) {
    return { a: 0, b: 0, r2: 0 };
  }
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  // Coeficiente angular (a) e intercepto (b)
  const a = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const b = (sumY - a * sumX) / n;
  
  // R²
  const meanY = sumY / n;
  const ssRes = y.reduce((sum, yi, i) => {
    const predicted = a * x[i] + b;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
  const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
  
  return { a, b, r2 };
}

export const getAnalytics = async (req, res) => {
  try {
    const bills = await BillModel.findAllForDashboard(req.userId);
    
    // Filtrar apenas faturas com consumo_iot
    const billsWithIot = bills.filter(bill => 
      bill.consumo_iot !== null && bill.consumo_iot !== undefined
    );
    
    if (billsWithIot.length === 0) {
      return res.json({
        percentual: [],
        media: {
          geral: 0,
          por_dispositivo: []
        },
        desvio_padrao: 0,
        distribuicao_normal: {
          media: 0,
          desvio: 0
        },
        correlacao: {
          consumo_estimado_iot: 0,
          iot_valor: 0
        },
        regressao: {
          a: 0,
          b: 0,
          r2: 0
        }
      });
    }
    
    // 1. Percentuais baseados no consumo_iot (por dispositivo e temporal)
    const deviceTotals = {};
    let totalConsumoIot = 0;
    
    billsWithIot.forEach(bill => {
      const deviceId = bill.device_id || 'unknown';
      if (!deviceTotals[deviceId]) {
        deviceTotals[deviceId] = {
          device_id: deviceId,
          device_name: bill.device?.name || 'Desconhecido',
          total: 0,
          count: 0
        };
      }
      deviceTotals[deviceId].total += bill.consumo_iot;
      deviceTotals[deviceId].count++;
      totalConsumoIot += bill.consumo_iot;
    });
    
    const percentual = Object.values(deviceTotals).map(device => ({
      device_id: device.device_id,
      device_name: device.device_name,
      percentual: totalConsumoIot > 0 ? (device.total / totalConsumoIot) * 100 : 0,
      total_consumo: device.total
    }));
    
    // 2. Média do valor das faturas
    const valoresPagos = billsWithIot.map(bill => bill.amount_paid || 0);
    const mediaGeral = calculateMean(valoresPagos);
    
    const mediaPorDispositivo = Object.entries(deviceTotals).map(([deviceId, device]) => {
      const billsOfDevice = billsWithIot.filter(b => (b.device_id || 'unknown') === deviceId);
      const valores = billsOfDevice.map(b => b.amount_paid || 0);
      return {
        device_id: parseInt(deviceId) || deviceId,
        device_name: device.device_name,
        media: calculateMean(valores)
      };
    });
    
    // 3. Desvio padrão
    const desvioPadrao = calculateStandardDeviation(valoresPagos, mediaGeral);
    
    // 4. Distribuição normal (média e desvio padrão baseados em consumo_iot * valor_pago ou apenas valor_pago)
    const distribuicaoNormal = {
      media: mediaGeral,
      desvio: desvioPadrao
    };
    
    // 5. Correlação
    const consumoEstimado = billsWithIot
      .filter(b => b.company_consumption_kwh !== null && b.consumo_iot !== null)
      .map(b => b.company_consumption_kwh);
    const consumoIotFiltrado = billsWithIot
      .filter(b => b.company_consumption_kwh !== null && b.consumo_iot !== null)
      .map(b => b.consumo_iot);
    
    const correlacaoEstimadoIot = consumoEstimado.length > 0 
      ? calculateCorrelation(consumoEstimado, consumoIotFiltrado)
      : 0;
    
    const consumoIot = billsWithIot.map(b => b.consumo_iot || 0);
    const valorPago = billsWithIot.map(b => b.amount_paid || 0);
    const correlacaoIotValor = calculateCorrelation(consumoIot, valorPago);
    
    // 6. Regressão linear (consumo_iot vs valor_pago)
    const regressao = calculateLinearRegression(consumoIot, valorPago);
    
    res.json({
      percentual,
      media: {
        geral: mediaGeral,
        por_dispositivo: mediaPorDispositivo
      },
      desvio_padrao: desvioPadrao,
      distribuicao_normal: distribuicaoNormal,
      correlacao: {
        consumo_estimado_iot: correlacaoEstimadoIot,
        iot_valor: correlacaoIotValor
      },
      regressao
    });
  } catch (error) {
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
};

