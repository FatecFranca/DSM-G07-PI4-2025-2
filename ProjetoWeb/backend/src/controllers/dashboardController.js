import * as BillModel from '../models/Bill.js';

export const getDashboard = async (req, res) => {
  try {
    const bills = await BillModel.findAllForDashboard(req.userId);
    res.json({ bills });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar os dados!' });
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
        distribuicao_dispositivos: [],
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
    
    // 1. Distribuição por dispositivo (percentuais baseados no consumo_iot)
    const deviceTotals = {};
    let totalConsumoIot = 0;
    
    billsWithIot.forEach(bill => {
      const deviceId = bill.device_id ? String(bill.device_id) : 'unknown';
      if (!deviceTotals[deviceId]) {
        deviceTotals[deviceId] = {
          device_id: bill.device_id,
          device_name: bill.device?.name || 'Desconhecido',
          total: 0,
          count: 0
        };
      }
      deviceTotals[deviceId].total += bill.consumo_iot || 0;
      deviceTotals[deviceId].count++;
      totalConsumoIot += bill.consumo_iot || 0;
    });
    
    const distribuicaoDispositivos = Object.values(deviceTotals).map(device => ({
      device: device.device_name,
      percentual: totalConsumoIot > 0 ? (device.total / totalConsumoIot) * 100 : 0
    }));
    
    // 2. Média do valor das faturas
    const valoresPagos = billsWithIot.map(bill => Number(bill.amount_paid) || 0).filter(v => v > 0 && !isNaN(v));
    const mediaGeral = valoresPagos.length > 0 ? calculateMean(valoresPagos) : 0;
    
    // Média por dispositivo - calcular corretamente usando device_id numérico
    const mediaPorDispositivo = Object.values(deviceTotals).map(device => {
      const deviceId = device.device_id;
      // Filtrar faturas do dispositivo, comparando device_id corretamente
      const billsOfDevice = billsWithIot.filter(b => {
        const bDeviceId = b.device_id;
        if (deviceId === null || deviceId === undefined) return false;
        if (bDeviceId === null || bDeviceId === undefined) return false;
        return Number(bDeviceId) === Number(deviceId);
      });
      
      // Pegar valores pagos das faturas deste dispositivo
      const valores = billsOfDevice
        .map(b => Number(b.amount_paid) || 0)
        .filter(v => v > 0 && !isNaN(v));
      
      const media = valores.length > 0 ? calculateMean(valores) : 0;
      
      return {
        device_id: deviceId,
        device_name: device.device_name,
        media: isNaN(media) ? 0 : Number(media.toFixed(2))
      };
    }).filter(item => item.device_id !== null && item.device_id !== undefined);
    
    // 3. Desvio padrão
    const desvioPadrao = valoresPagos.length > 0 ? calculateStandardDeviation(valoresPagos, mediaGeral) : 0;
    
    // 4. Distribuição normal (média e desvio padrão baseados em valor_pago)
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
      distribuicao_dispositivos: distribuicaoDispositivos,
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
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Erro ao buscar os dados!';
    res.status(500).json({ error: message });
  }
};

/**
 * Função auxiliar para calcular a função de distribuição acumulada (CDF) da normal padrão
 * Usa aproximação de Abramowitz e Stegun
 */
function normalCDF(z) {
  if (isNaN(z) || !isFinite(z)) return 0;
  
  // Aproximação para CDF da normal padrão
  const sign = z >= 0 ? 1 : -1;
  z = Math.abs(z);
  
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  
  return 0.5 * (1.0 + sign * y);
}

/**
 * Retorna a média geral de todas as faturas do usuário
 */
export const getMediaGeral = async (req, res) => {
  try {
    const bills = await BillModel.findAllForDashboard(req.userId);
    const valoresPagos = bills
      .map(bill => bill.amount_paid || 0)
      .filter(v => v > 0 && !isNaN(v));
    
    const mediaGeral = valoresPagos.length > 0 ? calculateMean(valoresPagos) : 0;
    
    res.json({ 
      mediaGeral: isNaN(mediaGeral) ? 0 : Number(mediaGeral.toFixed(2))
    });
  } catch (error) {
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Erro ao buscar os dados!';
    res.status(500).json({ error: message });
  }
};

/**
 * Retorna o desvio padrão de todas as faturas do usuário
 */
export const getDesvioPadrao = async (req, res) => {
  try {
    const bills = await BillModel.findAllForDashboard(req.userId);
    const valoresPagos = bills
      .map(bill => bill.amount_paid || 0)
      .filter(v => v > 0 && !isNaN(v));
    
    const mediaGeral = valoresPagos.length > 0 ? calculateMean(valoresPagos) : 0;
    const desvioPadrao = valoresPagos.length > 0 ? calculateStandardDeviation(valoresPagos, mediaGeral) : 0;
    
    res.json({ 
      desvioPadrao: isNaN(desvioPadrao) ? 0 : Number(desvioPadrao.toFixed(2))
    });
  } catch (error) {
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Erro ao buscar os dados!';
    res.status(500).json({ error: message });
  }
};

/**
 * Calcula a probabilidade da próxima fatura estar entre min e max usando distribuição normal
 * Fórmula: z = (valor - media_geral) / desvio_padrao
 * Probabilidade = P(min <= X <= max) = CDF(z_max) - CDF(z_min)
 */
export const getProbabilidadeProximoMes = async (req, res) => {
  try {
    const { min, max } = req.query;
    
    if (!min || !max) {
      return res.status(400).json({ error: 'Parâmetros min e max são obrigatórios' });
    }
    
    const minVal = parseFloat(min);
    const maxVal = parseFloat(max);
    
    if (isNaN(minVal) || isNaN(maxVal)) {
      return res.status(400).json({ error: 'min e max devem ser números válidos' });
    }
    
    if (minVal >= maxVal) {
      return res.status(400).json({ error: 'min deve ser menor que max' });
    }
    
    const bills = await BillModel.findAllForDashboard(req.userId);
    const valoresPagos = bills
      .map(bill => bill.amount_paid || 0)
      .filter(v => v > 0 && !isNaN(v));
    
    if (valoresPagos.length === 0) {
      return res.json({ probabilidadeProximoMes: 0 });
    }
    
    const mediaGeral = calculateMean(valoresPagos);
    const desvioPadrao = calculateStandardDeviation(valoresPagos, mediaGeral);
    
    if (desvioPadrao === 0 || isNaN(desvioPadrao)) {
      return res.json({ probabilidadeProximoMes: 0 });
    }
    
    // Calcular z-scores
    const zMin = (minVal - mediaGeral) / desvioPadrao;
    const zMax = (maxVal - mediaGeral) / desvioPadrao;
    
    // Calcular probabilidade usando CDF
    const probMin = normalCDF(zMin);
    const probMax = normalCDF(zMax);
    
    // Probabilidade entre min e max
    let probabilidade = probMax - probMin;
    
    // Garantir que está entre 0 e 1
    probabilidade = Math.max(0, Math.min(1, probabilidade));
    
    // Converter para porcentagem
    const probabilidadePorcentagem = probabilidade * 100;
    
    res.json({ 
      probabilidadeProximoMes: isNaN(probabilidadePorcentagem) ? 0 : Number(probabilidadePorcentagem.toFixed(2))
    });
  } catch (error) {
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Erro ao buscar os dados!';
    res.status(500).json({ error: message });
  }
};

