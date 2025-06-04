import React from 'react';
import '../components/styles/BioDataTable.css';

const BioDataTable = ({ title, data }) => {
  return (
    <div className="bio-data-table">
      <table>
        <thead>
          <tr>
            <th colSpan="2" className="table-header">{title}</th>
          </tr>
        </thead>
        <tbody>
          {data && data.map((item, index) => (
            <tr key={index}>
              <td className="bio-label">{item.label}</td>
              <td className="bio-value">{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BioDataTable;