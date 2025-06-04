import React from 'react';
import './styles/PatientDataTable.css';

const PatientDataTableNew = ({ title, data }) => {
  return (
    <div className="patient-data-table">
      <table>
        <thead>
          <tr>
            <th colSpan="2" className="table-header">{title}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.label}</td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PatientDataTableNew;
