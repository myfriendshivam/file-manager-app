const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Middleware to serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

// Multer storage & file filter
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF or Image files are allowed'));
  }
};

const upload = multer({ storage, fileFilter });

// Get all uploaded files
app.get('/files', (req, res) => {
  fs.readdir('uploads/', (err, files) => {
    if (err) return res.status(500).send(err);
    const fileData = files.map(f => {
      const ext = path.extname(f).toLowerCase();
      return { filename: f, type: ext === '.pdf' ? 'pdf' : 'image' };
    });
    res.json(fileData);
  });
});

// Upload a file
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  res.json({ message: 'File uploaded', file: req.file.filename });
});

// Delete a file
app.delete('/delete/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return res.json({ message: 'File deleted' });
  }
  res.status(404).json({ message: 'File not found' });
});

// Update (replace) a file
app.put('/update/:filename', upload.single('file'), (req, res) => {
  const oldFilePath = path.join(__dirname, 'uploads', req.params.filename);
  if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
  if (!req.file) return res.status(400).send('No file uploaded');
  res.json({ message: 'File updated', file: req.file.filename });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
