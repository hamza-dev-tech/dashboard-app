import React, { useState, useEffect, useRef } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import * as XLSX from 'xlsx';
import './Dashboard.css';
import { FaSun, FaMoon, FaSearch, FaDownload, FaChartPie } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css'; // Import the CSS for react-tooltip
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [theme, setTheme] = useState('light');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const chartsRef = useRef(null); // Reference for capturing charts

  // Function to load data from Excel file
  const loadExcelData = (file) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const binaryStr = event.target.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        setData(jsonData);
        setFilteredData(jsonData);
        setLoading(false);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        setLoading(false);
        alert('Failed to load Excel file. Please check the file format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Handle file upload and process data
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      loadExcelData(file);
    }
  };

  // Toggle theme between light and dark
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Handle search input
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term === '') {
      setFilteredData(data);
    } else {
      const filtered = data.filter((item) =>
        Object.values(item).some(
          (val) =>
            typeof val === 'string' &&
            val.toLowerCase().includes(term.toLowerCase())
        )
      );
      setFilteredData(filtered);
      setCurrentPage(1); // Reset to first page on search
    }
  };

  // Export data to Excel
  const exportToExcel = () => {
    if (filteredData.length === 0) {
      alert('No data available to export.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DashboardData');
    XLSX.writeFile(workbook, 'DashboardData.xlsx');
    alert('Excel exported successfully!');
  };

  // Export data and charts to PDF
  const exportToPDF = async () => {
    if (filteredData.length === 0) {
      alert('No data available to export.');
      return;
    }

    const doc = new jsPDF('p', 'pt', 'a4'); // Portrait, points, A4 size
    const margin = 20;
    let yPosition = margin;

    // 1. Add Title
    doc.setFontSize(18);
    doc.text('Dashboard Data', doc.internal.pageSize.getWidth() / 2, yPosition, {
      align: 'center',
    });
    yPosition += 30;

    // 2. Capture Charts as Image
    if (chartsRef.current) {
      try {
        const canvas = await html2canvas(chartsRef.current, {
          scale: 2, // Increase scale for better resolution
        });
        const imgData = canvas.toDataURL('image/png');

        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth() - 2 * margin;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        doc.addImage(imgData, 'PNG', margin, yPosition, pdfWidth, pdfHeight);
        yPosition += pdfHeight + 20; // Add some space after the image
      } catch (error) {
        console.error('Error capturing charts:', error);
        alert('Failed to capture charts for PDF.');
      }
    }

    // 3. Add Data Table
    if (filteredData.length > 0) {
      const tableColumn = Object.keys(filteredData[0] || {});
      const tableRows = filteredData.map((data) =>
        tableColumn.map((column) => String(data[column] || ''))
      );

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPosition,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8 }, // Optional: Customize table styles
        headStyles: { fillColor: [22, 160, 133] }, // Optional: Customize header styles
        theme: 'striped', // Optional: Table theme
      });

      yPosition = doc.lastAutoTable.finalY + 20;
    }

    // 4. Save the PDF
    doc.save('DashboardData.pdf');
    alert('PDF exported successfully!');
  };

  // Export only charts to PDF
  const exportChartsToPDF = async () => {
    if (filteredData.length === 0) {
      alert('No charts available to export.');
      return;
    }

    const doc = new jsPDF('p', 'pt', 'a4'); // Portrait, points, A4 size
    const margin = 20;
    let yPosition = margin;

    // 1. Add Title
    doc.setFontSize(18);
    doc.text('Dashboard Charts', doc.internal.pageSize.getWidth() / 2, yPosition, {
      align: 'center',
    });
    yPosition += 30;

    // 2. Capture Charts as Image
    if (chartsRef.current) {
      try {
        const canvas = await html2canvas(chartsRef.current, {
          scale: 2, // Increase scale for better resolution
        });
        const imgData = canvas.toDataURL('image/png');

        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth() - 2 * margin;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        doc.addImage(imgData, 'PNG', margin, yPosition, pdfWidth, pdfHeight);
        yPosition += pdfHeight + 20; // Add some space after the image
      } catch (error) {
        console.error('Error capturing charts:', error);
        alert('Failed to capture charts for PDF.');
      }
    }

    // 3. Save the PDF
    doc.save('DashboardCharts.pdf');
    alert('Charts PDF exported successfully!');
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Data refresh every 10 minutes');
      // Implement data fetching logic if needed
    }, 600000); // 600,000 milliseconds = 10 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`dashboard-container ${theme}`}>
      <div className="header">
        <h1 className="dashboard-title">Dashboard</h1>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? <FaMoon /> : <FaSun />}
        </button>
      </div>

      <div className="controls">
        <input
          type="file"
          className="file-input"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
        />
        <div className="search-export">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
          <div className="export-buttons">
            <button onClick={exportToExcel} className="export-button">
              <FaDownload /> Excel
            </button>
            <button onClick={exportToPDF} className="export-button">
              <FaDownload /> PDF
            </button>
            <button onClick={exportChartsToPDF} className="export-button">
              <FaChartPie /> Export Charts
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      ) : (
        <>
          {/* Charts Container with Ref */}
          <div className="progress-grid" ref={chartsRef}>
            {currentItems.map((item, index) => (
              <div
                key={index}
                className="progress-item"
                data-tooltip-id={`tooltip-${index}`}
                data-tooltip-content={`Route: ${item.route}\nCompletion: ${Math.round(
                  item['% Complete'] * 100
                )}%`}
              >
                <CircularProgressbar
                  value={item['% Complete'] * 100}
                  text={`${Math.round(item['% Complete'] * 100)}%`}
                  styles={buildStyles({
                    pathColor:
                      item['% Complete'] >= 0.8
                        ? '#28a745'
                        : item['% Complete'] <= 0.5
                        ? '#dc3545'
                        : '#ffc107',
                    textColor: theme === 'light' ? '#212529' : '#ffffff',
                  })}
                />
                <p className="route-text">{`Route ${item.route}`}</p>
                <Tooltip id={`tooltip-${index}`} place="top" />
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`page-button ${
                      currentPage === number ? 'active' : ''
                    }`}
                  >
                    {number}
                  </button>
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
