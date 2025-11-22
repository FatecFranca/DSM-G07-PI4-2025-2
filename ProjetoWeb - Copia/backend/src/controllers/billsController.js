import * as BillModel from '../models/Bill.js';

export const getBills = async (req, res) => {
  try {
    const bills = await BillModel.findAll(req.userId);
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBill = async (req, res) => {
  try {
    const bill = await BillModel.findById(req.params.id, req.userId);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createBill = async (req, res) => {
  try {
    const { device_id, month_year, company_consumption_kwh, real_consumption_kwh, amount_paid, price_per_kwh } = req.body;
    if (!device_id || !month_year || company_consumption_kwh === undefined || !amount_paid || !price_per_kwh) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const bill = await BillModel.create({ device_id, month_year, company_consumption_kwh, real_consumption_kwh, amount_paid, price_per_kwh }, req.userId);
    res.status(201).json(bill);
  } catch (error) {
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
};

export const updateBill = async (req, res) => {
  try {
    const bill = await BillModel.update(req.params.id, req.body, req.userId);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteBill = async (req, res) => {
  try {
    const deleted = await BillModel.deleteBill(req.params.id, req.userId);
    if (!deleted) return res.status(404).json({ error: 'Bill not found' });
    res.status(200).json({message: "Fatura deletada com sucesso!"});
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};