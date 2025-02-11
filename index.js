import express from 'express';
import fs from 'fs';
import { PdfReader } from 'pdfreader';
import ExcelJS from 'exceljs'; // Import ExcelJS

const app = express();
const port = 3000;

app.use(express.json());

// Function to extract text from the first page of the PDF
function extractPdfData(filePath, callback) {
  const data = [];
  let currentPage = 0;

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

    // Check for page change (PDFReader provides page number on page start)
    if (item.page) {
      currentPage = item.page;
    }

    // Stop after the first page
    if (currentPage > 1) {
      return;
    }

    if (item.text) {
      data.push(item.text);
    }
  });
}

// Function to generate an Excel file with the extracted data (Policy Number and Issued Date)
async function generateExcel(policyNumber, issuedDate) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('PDF Data');

  // Add header row
  worksheet.columns = [
    { header: 'Policy Number', key: 'policyNumber', width: 30 },
    { header: 'Issued Date', key: 'issuedDate', width: 20 },
  ];

  // Add the data row (only Policy Number and Issued Date)
  worksheet.addRow({
    policyNumber: policyNumber,
    issuedDate: issuedDate,
  });

  // Write to a file
  const filePath = './extracted_data.xlsx';
  await workbook.xlsx.writeFile(filePath);
  console.log(`Excel file has been written to ${filePath}`);
}

// POST endpoint to process the PDF
app.post('/process-pdf', (req, res) => {
  const filePath = './PC-271000312419057199.pdf';

  if (!fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'File does not exist' });
  }

  extractPdfData(filePath, async (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error processing PDF' });
    }

    // Combine the text and clean up any extra spaces or line breaks
    const paragraph = data.join(' ').replace(/\s+/g, ' ').trim();

    // Extract policy number and issued date using regex
    let policyNumber = null;
    let issuedDate = null;

    const policyNumberMatch = paragraph.match(/Policy Number[:\s]*\d{15,}/);
    if (policyNumberMatch) {
      policyNumber = policyNumberMatch[0].split(':')[1].trim();
    }

    const issuedDateMatch = paragraph.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
    if (issuedDateMatch) {
      issuedDate = issuedDateMatch[0];
    }

    // Generate the Excel file with only the extracted data
    await generateExcel(policyNumber, issuedDate);

    // Send the extracted data in the response
    res.json({
      policyNumber,
      issuedDate,
      paragraph,
    });
  });
});

// Server listening on port 3000
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
