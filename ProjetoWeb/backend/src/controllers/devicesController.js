import * as DeviceModel from '../models/Device.js';

export const getDevices = async (req, res) => {
  try {
    const devices = await DeviceModel.findAll(req.userId);
    res.json(devices);
  } catch (error) {
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
};

export const getDevice = async (req, res) => {
  try {
    const device = await DeviceModel.findById(req.params.id, req.userId);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createDevice = async (req, res) => {
  try {
    const { name, identification_code, property_address } = req.body;
    if (!name || !identification_code || !property_address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const device = await DeviceModel.create({ name, identification_code, property_address }, req.userId);
    res.status(201).json(device);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Código de identificação já existe' });
    }
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
};

export const updateDevice = async (req, res) => {
  try {
    const device = await DeviceModel.update(req.params.id, req.body, req.userId);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json(device);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Código de identificação já existe' });
    }
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
};

export const deleteDevice = async (req, res) => {
  try {
    const deleted = await DeviceModel.deleteDevice(req.params.id, req.userId);
    if (!deleted) return res.status(404).json({ error: 'Device not found' });
    res.status(200).json({message: "Dispositivo deletado com sucesso!"});
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};