const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');

// Retorna todos os feedbacks

router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar feedbacks' });
  }
});

// Retorna um feedback específico pelo ID

router.get('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback não encontrado' });
    }
    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar feedback pelo ID' });
  }
});

// Retorna feedbacks filtrados

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

//Retorna as estatísticas - com queries MongoDB de agregação

router.get('/stats', async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: '$targetType',
          avgTeachingQuality: { $avg: '$ratings.teachingQuality' },
          avgClarity: { $avg: '$ratings.clarity' },
          avgInfra: { $avg: '$ratings.insfraestructureCondition' },
          totalFeedbacks: { $sum: 1 },
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar estatísticas.' });
  }
});


// Cria um novo feedback
router.post('/', [

  check('type').notEmpty().withMessage('Type é obrigatório'),
  check('target').notEmpty().withMessage('Target é obrigatório'),
  check('ratings.teachingQuality').isInt({ min: 1, max: 5 }).withMessage('Teaching Quality deve ser um valor entre 1 e 5'),
  check('ratings.clarity').isInt({ min: 1, max: 5 }).withMessage('Clarity deve ser um valor entre 1 e 5'),
  check('ratings.insfraestructureCondition').isInt({ min: 1, max: 5 }).withMessage('Infraestrutura deve ser um valor entre 1 e 5'),
  check('targetType').notEmpty().withMessage('TargetType é obrigatório'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const feedback = new Feedback(req.body);
    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar feedback' });
  }
});

// Exclui um feedback pelo ID
router.delete('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback não encontrado' });
    }
    res.status(200).json({ message: 'Feedback excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir feedback' });
  }
});

module.exports = router;