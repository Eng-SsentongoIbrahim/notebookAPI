// API Configuration
const API_URL = 'http://localhost:5000/api/notes';

// DOM Elements
const noteModal = document.getElementById('noteModal');
const viewModal = document.getElementById('viewModal');
const noteForm = document.getElementById('noteForm');
const searchBox = document.getElementById('searchBox');
const newNoteBtn = document.getElementById('newNoteBtn');
const notesContainer = document.getElementById('notesContainer');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const closeViewModal = document.getElementById('closeViewModal');
const closeViewBtn = document.getElementById('closeViewBtn');
const deleteBtn = document.getElementById('deleteBtn');
const editBtn = document.getElementById('editBtn');
const navBtns = document.querySelectorAll('.nav-btn');

// State
let currentNoteId = null;
let currentFilter = 'all';
let allNotes = [];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    setupEventListeners();
});

function setupEventListeners() {
    newNoteBtn.addEventListener('click', openNewNoteModal);
    closeModal.addEventListener('click', closeNoteModal);
    cancelBtn.addEventListener('click', closeNoteModal);
    closeViewModal.addEventListener('click', closeViewNoteModal);
    closeViewBtn.addEventListener('click', closeViewNoteModal);
    deleteBtn.addEventListener('click', handleDeleteNote);
    editBtn.addEventListener('click', handleEditNote);
    noteForm.addEventListener('submit', handleSaveNote);
    searchBox.addEventListener('input', handleSearch);
    navBtns.forEach(btn => {
        btn.addEventListener('click', handleNavigation);
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === noteModal) closeNoteModal();
        if (e.target === viewModal) closeViewNoteModal();
    });
}

// Fetch all notes
async function loadNotes() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (data.success) {
            allNotes = data.data;
            displayNotes(allNotes);
        }
    } catch (error) {
        console.error('Error loading notes:', error);
        showError('Failed to load notes');
    }
}

// Display notes
function displayNotes(notes) {
    if (notes.length === 0) {
        notesContainer.innerHTML = '<div class="empty-state"><p>No notes yet. Create your first note!</p></div>';
        return;
    }

    notesContainer.innerHTML = notes.map(note => `
        <div class="note-card ${note.isPinned ? 'pinned' : ''}" style="border-color: ${note.color}">
            <div class="note-header">
                <div>
                    <div class="note-title">${escapeHtml(note.title)}</div>
                    <span class="note-category">${note.category}</span>
                </div>
            </div>
            <div class="note-content">${escapeHtml(note.content)}</div>
            <div class="note-footer">
                <span class="note-date">${formatDate(note.createdAt)}</span>
                <div class="note-actions">
                    <button class="note-action-btn" onclick="viewNote('${note._id}')" title="View">👁️</button>
                    <button class="note-action-btn" onclick="togglePin('${note._id}')" title="Pin">${note.isPinned ? '📌' : '📍'}</button>
                </div>
            </div>
        </div>
    `).join('');
}

// View single note
async function viewNote(noteId) {
    try {
        const response = await fetch(`${API_URL}/${noteId}`);
        const data = await response.json();
        if (data.success) {
            const note = data.data;
            currentNoteId = note._id;
            document.getElementById('viewTitle').textContent = escapeHtml(note.title);
            document.getElementById('viewContent').innerHTML = `
                <div class="view-content">
                    <div class="view-category">${note.category}</div>
                    <p class="view-text">${escapeHtml(note.content)}</p>
                    ${note.tags && note.tags.length > 0 ? `
                        <div class="view-tags">
                            <h4>Tags</h4>
                            ${note.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="view-date">Created: ${new Date(note.createdAt).toLocaleString()}</div>
                </div>
            `;
            viewModal.classList.add('active');
        }
    } catch (error) {
        console.error('Error viewing note:', error);
        showError('Failed to load note');
    }
}

// Open new note modal
function openNewNoteModal() {
    currentNoteId = null;
    document.getElementById('modalTitle').textContent = 'New Note';
    noteForm.reset();
    document.getElementById('noteColor').value = '#ffd700';
    noteModal.classList.add('active');
    document.getElementById('noteTitle').focus();
}

// Close note modal
function closeNoteModal() {
    noteModal.classList.remove('active');
    noteForm.reset();
    currentNoteId = null;
}

// Close view modal
function closeViewNoteModal() {
    viewModal.classList.remove('active');
    currentNoteId = null;
}

// Save note (create or update)
async function handleSaveNote(e) {
    e.preventDefault();

    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const category = document.getElementById('noteCategory').value;
    const color = document.getElementById('noteColor').value;
    const tags = document.getElementById('noteTags').value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);

    if (!title || !content) {
        showError('Title and content are required');
        return;
    }

    const noteData = { title, content, category, color, tags };

    try {
        const method = currentNoteId ? 'PUT' : 'POST';
        const url = currentNoteId ? `${API_URL}/${currentNoteId}` : API_URL;

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(noteData),
        });

        const data = await response.json();

        if (data.success) {
            showSuccess(currentNoteId ? 'Note updated successfully!' : 'Note created successfully!');
            closeNoteModal();
            loadNotes();
        } else {
            showError(data.message || 'Error saving note');
        }
    } catch (error) {
        console.error('Error saving note:', error);
        showError('Failed to save note');
    }
}

// Edit note
async function handleEditNote() {
    if (!currentNoteId) return;

    try {
        const response = await fetch(`${API_URL}/${currentNoteId}`);
        const data = await response.json();

        if (data.success) {
            const note = data.data;
            document.getElementById('modalTitle').textContent = 'Edit Note';
            document.getElementById('noteTitle').value = note.title;
            document.getElementById('noteContent').value = note.content;
            document.getElementById('noteCategory').value = note.category;
            document.getElementById('noteColor').value = note.color;
            document.getElementById('noteTags').value = note.tags.join(', ');

            closeViewNoteModal();
            noteModal.classList.add('active');
            document.getElementById('noteTitle').focus();
        }
    } catch (error) {
        console.error('Error loading note for edit:', error);
        showError('Failed to load note for editing');
    }
}

// Delete note
async function handleDeleteNote() {
    if (!currentNoteId) return;

    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
        const response = await fetch(`${API_URL}/${currentNoteId}`, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Note deleted successfully!');
            closeViewNoteModal();
            loadNotes();
        } else {
            showError(data.message || 'Error deleting note');
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        showError('Failed to delete note');
    }
}

// Toggle pin status
async function togglePin(noteId) {
    try {
        const note = allNotes.find(n => n._id === noteId);
        if (!note) return;

        const response = await fetch(`${API_URL}/${noteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPinned: !note.isPinned }),
        });

        const data = await response.json();

        if (data.success) {
            loadNotes();
        }
    } catch (error) {
        console.error('Error toggling pin:', error);
    }
}

// Search notes
async function handleSearch(e) {
    const query = e.target.value.trim();

    if (!query) {
        applyFilter(currentFilter);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.success) {
            displayNotes(data.data);
        }
    } catch (error) {
        console.error('Error searching notes:', error);
        showError('Failed to search notes');
    }
}

// Handle navigation
function handleNavigation(e) {
    const btn = e.target;
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    const category = btn.dataset.category;

    if (category) {
        currentFilter = `category-${category}`;
        applyFilter(currentFilter);
    } else if (filter) {
        currentFilter = filter;
        applyFilter(filter);
    }

    searchBox.value = '';
}

// Apply filter
function applyFilter(filter) {
    let filtered = allNotes;

    if (filter === 'pinned') {
        filtered = allNotes.filter(note => note.isPinned);
    } else if (filter === 'archived') {
        filtered = allNotes.filter(note => note.isArchived);
    } else if (filter.startsWith('category-')) {
        const category = filter.replace('category-', '');
        filtered = allNotes.filter(note => note.category === category);
    }

    displayNotes(filtered);
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else if (date.getFullYear() === today.getFullYear()) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSuccess(message) {
    // You can implement a toast notification here
    console.log('Success:', message);
    alert(message);
}

function showError(message) {
    // You can implement a toast notification here
    console.error('Error:', message);
    alert('Error: ' + message);
}
