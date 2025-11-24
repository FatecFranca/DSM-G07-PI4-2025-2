import jwt from 'jsonwebtoken';
import * as UserModel from '../models/User.js';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d'
  });
};

export const register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    const existingUser = await UserModel.findByEmail(email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await UserModel.create(fullName.trim(), email.toLowerCase(), password);
    const token = generateToken(user.id.toString());

    res.status(201).json({
      user: { id: user.id, email: user.email, nome: user.nome },
      token
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: 'Erro ao fazer cadastro!' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await UserModel.findByEmail(email.toLowerCase());
    if (!user || !(await UserModel.verifyPassword(user, password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id.toString());
    res.status(200).json({
      user: { id: user.id, email: user.email, nome: user.nome },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer login!' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(parseInt(req.userId));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: { id: user.id, email: user.email, nome: user.nome } });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao trazer dados!' });
  }
};

