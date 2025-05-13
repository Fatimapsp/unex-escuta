const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');

router.get('/', async (req, res) => {

});

router.get(':id', async (req, res) => {

});

router.get('/filter', async (req, res) => {
    try {
    const { type, target, startDate, endDate } = req.query;

    const filtros = {};

    if (type) filtros.type = type;
    if (target) filtros.target = target;

    if (startDate || endDate) {
      filtros.createdAt = {};
      if (startDate) filtros.createdAt.$gte = new Date(startDate);
      if (endDate) filtros.createdAt.$lte = new Date(endDate);
    }

    const resultados = await Feedback.find(filtros);
    res.status(200).json(resultados);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar feedbacks com filtros' });
  }

});

router.post('/', async (req, res) => {
    
});

router.delete('/:id', async (req, res) => {
    
});

module.exports = router;