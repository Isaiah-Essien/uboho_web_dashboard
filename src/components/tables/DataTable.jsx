import React, { useState } from 'react';
import '../../Patients.css'; // Reuse styles from Patients.css

const DataTable = ({ data }) => {
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

  return (
    <>
      <div className="patients-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Gyro X</th>
              <th>Gyro Y</th>
              <th>Gyro Z</th>
              <th>Rotation Activity</th>
              <th>Classes</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, index) => (
              <tr key={index}>
                <td>{row.date}</td>
                <td>{row.time}</td>
                <td>{row.gyroX}</td>
                <td>{row.gyroY}</td>
                <td>{row.gyroZ}</td>
                <td>{row.rotationActivity}</td>
                <td>{row.classes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </>
  );
};

export default DataTable;
