const express = require('express');
const router = express.Router();
const {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
  getNotesByCategory,
} = require('../controllers/noteController');

// Main routes
router.get('/', getAllNotes);
router.post('/', createNote);
router.get('/search', searchNotes);
router.get('/category/:category', getNotesByCategory);
router.get('/:id', getNoteById);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
