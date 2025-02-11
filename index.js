import express from 'express';
import fs from 'fs';
import { PdfReader } from 'pdfreader';

const app = express();
const port = 3000;

app.use(express.json()); 
 
function extractPdfData(filePath, callback) {
  const data = [];

  new PdfReader().parseFileItems(filePath, (err, item) => {
    if (err) {
      console.error('Error reading PDF:', err);
      callback(err, null);
      return;
    }

    if (!item) {
      console.warn('End of file reached');
      callback(null, data);
      return;
    }

    if (item.text) {
      data.push(item.text);
    }
  });
}

app.post('/process-pdf', (req, res) => {
  const filePath = './PC-271000312419057199.pdf';

  if (!fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'File does not exist' });
  }

  extractPdfData(filePath, (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error processing PDF' });
    }

    console.log('Extracted Text from PDF:');
    data.forEach((line, index) => {
      console.log(`Line ${index + 1}:`, line);
    });

    const policyNumberKeyword = 'Policy Number';
    const issuedDateKeyword = 'Issued Date';

    let policyNumber = null;
    let issuedDate = null;

    data.forEach((line) => {
      if (line.toLowerCase().includes(policyNumberKeyword.toLowerCase())) {
        const policyNumberMatch = line.match(/(\d{1,10}[A-Za-z]{0,5}[-\s]?\d{0,5})/); 
        if (policyNumberMatch) {
          policyNumber = policyNumberMatch[0];
        }
      }

      if (line.toLowerCase().includes(issuedDateKeyword.toLowerCase())) {
        const issuedDateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4})/); 
        if (issuedDateMatch) {
          issuedDate = issuedDateMatch[0];
        }
      }
    });

    console.log('Policy Number:', policyNumber);
    console.log('Issued Date:', issuedDate);

    res.json({
      policyNumber,
      issuedDate
    });
  });
});

app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);

  const simulatedRequest = {};

  const response = await fetch(`http://localhost:${port}/process-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(simulatedRequest),
  });

  if (response.ok) {
    const result = await response.json();
    console.log('Simulated Response:', result); 
  } else {
    const errorResult = await response.json();
    console.error('Simulated Error Response:', errorResult); 
  }
});
