import * as DeviceModel from '../models/Device.js';
// CORREÇÃO: Importando BillModel para resolver o ReferenceError
import * as BillModel from '../models/Bill.js'; 

export const getDevices = async (req, res) => {
  try {
    const devices = await DeviceModel.findAll(req.userId);
    res.json(devices);
  } catch (error) {
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Erro ao trazer dispositivos';
    res.status(500).json({ error: message });
  }
};

export const getDevice = async (req, res) => {
  try {
    const device = await DeviceModel.findById(req.params.id, req.userId);
    if (!device) return res.status(404).json({ error: 'Dispositivo não encontrado!' });
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao trazer dispositivos' });
  }
};

export const createDevice = async (req, res) => {
  try {
    const { name, property_address } = req.body;

    if (!name || !property_address) {
      return res.status(400).json({ error: "Dados incompletos!" });
    }

    // busca o último código
    const last = await DeviceModel.findLast(req.userId); // deve retornar o último device

    // gera o próximo número automaticamente
    const next = last
      ? parseInt(last.identification_code.slice(3)) + 1
      : 1;

    const newCode = `REL${String(next).padStart(3, "0")}`;

    const device = await DeviceModel.create(
      { name, property_address, identification_code: newCode },
      req.userId
    );

    return res.status(201).json(device);

  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ error: "Código de identificação já existe" });
    }

    return res.status(500).json({
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Erro ao executar post"
    });
  }
};


export const updateDevice = async (req, res) => {
  try {
    const device = await DeviceModel.update(req.params.id, req.body, req.userId);
    if (!device) return res.status(404).json({ error: 'Disposítivo não encontrado' });
    res.json(device);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Código de identificação já existe' });
    }
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Erro ao executar update';
    res.status(500).json({ error: message });
  }
};

export const deleteDevice = async (req, res) => {
  try {
    const deleted = await DeviceModel.deleteDevice(req.params.id, req.userId);
    if (!deleted) return res.status(404).json({ error: 'Disposítivo não encontrado' });
    res.status(200).json({message: "Dispositivo deletado com sucesso!"});
  } catch (error) {
    res.status(500).json({ error: 'Erro ao executar delete' });
  }
};

export const updateConsumptionPublic = async (req, res) => {
  try {
    const { disp_id, device_id, id_user, consumo_kwh, consumo_wh, id } = req.body || {};

    // Determine consumption in kWh
    let consumo = undefined;
    if (consumo_kwh !== undefined && consumo_kwh !== null) consumo = parseFloat(consumo_kwh);
    else if (consumo_wh !== undefined && consumo_wh !== null) consumo = parseFloat(consumo_wh) / 1000;

    if (!isFinite(consumo)) return res.status(400).json({ error: 'Invalid consumption value' });

    let updated = null;
    if (disp_id) {
      updated = await DeviceModel.updateConsumptionByCode(disp_id, consumo);
    } else if (device_id || id) {
      const idToUse = device_id || id;
      updated = await DeviceModel.updateConsumptionById(idToUse, id_user, consumo);
    } else {
      return res.status(400).json({ error: 'Missing disp_id or device_id/id' });
    }

    if (!updated) return res.status(404).json({ error: 'Device not found' });

    // Also update the latest bill for this device (if any) with the new consumo_iot
    try {
      const updatedBill = await BillModel.updateLatestForDevice(updated.id, consumo, id_user);
      return res.status(200).json({ message: 'Consumo atualizado', device: updated, bill: updatedBill || null });
    } catch (e) {
      // don't fail the request if bill update fails; log and return device update success
      console.error('Failed to update latest bill consumo_iot:', e);
      return res.status(200).json({ message: 'Consumo atualizado', device: updated, bill: null });
    }
  } catch (error) {
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
};