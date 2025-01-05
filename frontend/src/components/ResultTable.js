import React from "react";

const ResultTable = ({ results, columns}) => {
  if (!results || results.length === 0) {
    return <p className="text-center text-gray-400">No results to display.</p>;
  }
  console.log(results)
  const headers = Object.keys(results[0]);
  console.log(headers)

  return (
    <div className="w-full max-w-5xl overflow-x-auto">
      <table className="w-full bg-gray-800 border-collapse text-left text-gray-300">
        {/* Render headers only if there are more than 3 */}
        {headers.length > 3 && (
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-2 border-b border-gray-700">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {results.map((row, index) => (
            <tr
              key={index}
              className="hover:bg-gray-700 transition-all duration-200"
            >
              {headers.map((header) => (
                <td key={header} className="px-4 py-2">
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultTable;
