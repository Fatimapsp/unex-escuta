const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Infraestructure = require('../models/infraestructure');

router.get('/', async (req, res) => {
    try {
        const infraestruturas = await Infraestructure.find();
        res.json(infraestruturas);

    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar infraestrutura'});
    }
});

router.get('/:id', async (req, res) => {
    try {
        const infraestrutura = await Infraestructure.findById();
        if(!infraestrutura) return res.status(404).json({ message: 'Infraestrutura não encontrada' });
        res.json(infraestrutura);

    } catch (error) {
        res.status(500).json({message: 'Erro ao buscar pelo ID '});
    }
});

router.get('/name/:name', async (req, res) => {
    try {
        const infraestrutura = await Infraestructure.findOne({ name: { $regex: req.params.name, $option: 'i'} });
        res.json(infraestrutura);

    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar pelo nome'});
    }
});

router.post('/', [
    check('name')
    .notEmpty().withMessage('O nome é obrigatório')
    .isString().withMessage('O nome deve ser uma String')
    .isLength({ min: 3 }).withMessage('O nome deve ter no mínimo 3 caracteres'),

    check('type')
    .notEmpty().withMessage('O tipo é obrigatório')
    .isIn(["laboratory", "classroom", "library", "auditorium"]).withMessage('Tipo inválido'),

    check('location')
    .notEmpty().withMessage('Localização é obrigatória')
    .isString().withMessage('A localização deve ser uma String')

], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const newInfra = new Infraestructure(req.body);
        const saved = await newInfra.save();
        res.status(201).json(saved);

    } catch (error) {
        res.status(400).json({ message: 'Erro ao criar infraestrutura'})
    }
});

router.put('/:id', async (req, res) => {
    try {
      const updated = await Infraestructure.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) return res.status(404).json({ message: 'Infraestrutura não encontrada' });
      res.json(updated);
      
    } catch (err) {
      res.status(400).json({ message: 'Erro ao atualizar infraestrutura' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
    const deleted = await Infraestructure.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Infraestrutura não encontrada' });
    res.json({ message: 'Infraestrutura deletada com sucesso' });

  } catch (err) {
    res.status(500).json({ message: 'Erro ao deletar infraestrutura' });
  }
});

module.exports = router;