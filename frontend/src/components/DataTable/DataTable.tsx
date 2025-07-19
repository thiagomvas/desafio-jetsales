type DataRow = Record<string, any> & { _rowId?: string };

type DataTableProps = {
  columns: string[];
  data: DataRow[];
  renderActions?: (row: DataRow) => React.ReactNode;
};

export default function DataTable({ columns, data, renderActions }: DataTableProps) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map(col => <th key={col}>{col}</th>)}
          {renderActions && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} id={row._rowId}>
            {columns.map(col => (
              <td key={col}>{row[col]}</td>
            ))}
            {renderActions && <td>{renderActions(row)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
