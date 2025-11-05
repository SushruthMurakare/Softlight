//const fs = require("fs");


const  generateHTMLGuide = (steps, taskDescription) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SoftLight Guide - ${taskDescription}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        .task-description {
            background: #e8f4f8;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
            border-left: 4px solid #3498db;
        }
        .step {
            margin-bottom: 50px;
            padding-bottom: 30px;
            border-bottom: 2px solid #ecf0f1;
        }
        .step:last-child {
            border-bottom: none;
        }
        .step-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }
        .step-number {
            background: #3498db;
            color: white;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5em;
            font-weight: bold;
            margin-right: 15px;
        }
        .step-info {
            flex: 1;
        }

      .screenshot {
    width: 100%;
    height: auto;
    object-fit: contain;
    max-width: 100%; 
    border: 1px solid #ddd;
    border-radius: 5px;
    margin: 20px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    display: block;
}
        .guidance {
            background: #d4edda;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 15px;
            border-left: 4px solid #28a745;
        }
        .guidance h3 {
            color: #155724;
            margin-bottom: 10px;
        }
        .guidance p {
            color: #155724;
            font-size: 1.1em;
        }
    
        @media print {
            body {
                background: white;
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Automation Guide</h1>
        <div class="task-description">
            <strong>Task:</strong> ${taskDescription}
        </div>
        
${steps.map(step => `
            <div class="step">
                <div class="step-header">
                    <div class="step-number">${step.stepNumber}</div>
                    <div class="step-info">
                        <h2>Step ${step.stepNumber}</h2>
                    </div>
                </div>
                
                <img src="data:image/png;base64,${step.screenshot}" alt="Step ${step.stepNumber} Screenshot" class="screenshot">
                
                <div class="guidance">
                    <h3>📋 Guidance</h3>
                    <p>${step.guidance}</p>
                </div>
                
            </div>
        `).join('')}
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ecf0f1; color: #7f8c8d;">
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
  `;

  //Write the HTML file
//   const filename = `automation-guide-${Date.now()}.html`;
//   fs.writeFileSync(filename, html);
  return html;
};

module.exports = { generateHTMLGuide };
