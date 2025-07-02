import React, { useState } from 'react';
import '../../Patients.css'; // Reuse styles from Patients.css

const DataTable = ({ data, columns }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // If no data, show placeholder
  if (!data || data.length === 0) {
    return (
      <div className="patients-table">
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666',
          fontSize: '16px' 
        }}>
          No data yet
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="patients-table">
        <table>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index}>{column.Header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, index) => (
              <tr key={index}>
                {columns.map((column, colIndex) => {
                  const cellValue = column.Cell 
                    ? column.Cell({ value: row[column.accessor] })
                    : row[column.accessor];
                  return (
                    <td key={colIndex}>
                      {cellValue !== undefined && cellValue !== null ? cellValue : 'N/A'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            className="pagination-btn chevron"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <img src="chevleft-icon.svg" alt="Previous Page" />
          </button>

          <div className="pagination-pages">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`pagination-page ${i + 1 === currentPage ? 'active' : ''}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            className="pagination-btn chevron"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <img src="chevright-icon.svg" alt="Next Page" />
          </button>
        </div>
      )}
    </>
  );
};

export default DataTable;
