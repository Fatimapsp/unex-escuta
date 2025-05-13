const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const User = require('../models/user');

// Listar usuários
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users); 

  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Criar um novo usuário

router.post('/',  [

  check('name').notEmpty().withMessage('Nome é obrigatório'),
  check('email').isEmail().withMessage('Email deve ser válido'),
  check('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  check('registration').notEmpty().withMessage('Matrícula é obrigatória'),
  check('role').isIn(['estudante', 'professor', 'admin']).withMessage('Role deve ser um dos seguintes: estudante, professor, admin'),
  check('courses').isArray().withMessage('Cursos deve ser um array'),

], async (req, res) => {
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { name, email, password, registration, role, courses } = req.body;

  try {
    const user = new User({
      name,
      email,
      password,
      registration,
      role,
      courses,
    });

    await user.save();
    res.status(201).json({ message: 'Usuário criado com sucesso.', user });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar o usuário' });
  }
});

// Atualizar um usuário

router.put('/:id', async (req, res) => {
     try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.status(200).json({ message: 'Usuário atualizado com sucesso', user });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar o usuário' });
  }
    
});

// Remover um usuário

router.delete('/:id', async (req, res) => {
    try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.status(200).json({ message: 'Usuário removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover o usuário' });
  }
});

module.exports = router;