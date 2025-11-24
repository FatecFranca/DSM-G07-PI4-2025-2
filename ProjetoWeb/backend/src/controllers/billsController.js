import * as BillModel from '../models/Bill.js';

function addOneMonth(yyyyMm) {
  let [year, month] = yyyyMm.split("-").map(Number);
  month++;
  if (month > 12) { month = 1; year++; }
  return `${year}-${String(month).padStart(2, "0")}`;
}



export const getBills = async (req, res) => {
  try {
    const bills = await BillModel.findAll(req.userId);
    res.json(bills);
  } catch (error) {
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Erro ao trazer faturas!';
    console.error('Error getting bills:', error);
    res.status(500).json({ error: message });
  }
};

export const getBill = async (req, res) => {
  try {
    const bill = await BillModel.findById(req.params.id, req.userId);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar faturas!' });
  }
};

export const createBill = async (req, res) => {
  try {
    const data = req.body;

    if (!data.device_id || !data.month_year || data.company_consumption_kwh === undefined ||
        !data.amount_paid || !data.price_per_kwh) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    data.month_year = addOneMonth(data.month_year.slice(0, 7));

    const bill = await BillModel.create(data, req.userId);
    res.status(201).json(bill);

  } catch (error) {
    res.status(500).json({ error: "Erro ao criar fatura!" });
  }
};


export const updateBill = async (req, res) => {
  try {
    const data = req.body;

    if (data.month_year) {
      data.month_year = addOneMonth(data.month_year.slice(0, 7));
    }

    const bill = await BillModel.update(req.params.id, data, req.userId);
    if (!bill) return res.status(404).json({ error: "Bill not found" });

    res.json(bill);

  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar fatura!" });
  }
};



export const deleteBill = async (req, res) => {
  try {
    const deleted = await BillModel.deleteBill(req.params.id, req.userId);
    if (!deleted) return res.status(404).json({ error: 'Bill not found' });
    res.status(200).json({message: "Fatura deletada com sucesso!"});
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar fatura!' });
  }
};