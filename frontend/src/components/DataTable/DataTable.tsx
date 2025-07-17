import React from "react";
import "./DataTable.css";

type DataTableProps = {
  columns: string[];
  data: Record<string, any>[];
};

const DataTable: React.FC<DataTableProps> = ({ columns, data }) => {
  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={col}>{row[col]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DataTable;
