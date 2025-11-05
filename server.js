const express = require('express');
const cors = require('cors');
const path = require('path');


const { runAutomation } = require('./index.js'); 

const app = express();
const PORT = process.env.PORT || 3000;
const activeTasks = new Map();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve your HTML file from 'public' folder

// API endpoint to run automation tasks
app.post('/run-task', async (req, res) => {
  const { task } = req.body;
  if (!task) {
    return res.status(400).json({ 
      success: false, 
      error: 'Task is required' 
    });
  }

  console.log(`Received task: ${task}`);

  try {
    const result = await runAutomation(task);

    res.json({ 
      success: true, 
      result: result || 'Task completed successfully',
      message: 'Automation completed'
    });

  } catch (error) {
    console.error('❌ Automation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error occurred'
    });
  }
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'frontend.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📂 Open your browser to http://localhost:${PORT}`);
});

module.exports = app;