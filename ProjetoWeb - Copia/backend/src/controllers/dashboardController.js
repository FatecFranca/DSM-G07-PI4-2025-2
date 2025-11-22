import * as BillModel from '../models/Bill.js';

export const getDashboard = async (req, res) => {
  try {
    const bills = await BillModel.findAllForDashboard(req.userId);
    res.json({ bills });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

