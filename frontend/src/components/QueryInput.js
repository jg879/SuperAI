import React, { useState } from "react";
import axios from "axios";
import { FaPlay } from "react-icons/fa";
import './Typewriter.css';

const QueryInput = ({ setResults, fileUploaded, setColumns}) => {
  const [query, setQuery] = useState("");
  const [tableName, setTableName] = useState("Data"); // Default table name
  const [errorMessage, setErrorMessage] = useState(""); // Separate error message state
  const [sqlQuery, setSqlQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false); 
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    if (!fileUploaded) {
      setErrorMessage("Please upload a file before running a query.");
      return;
    }
    setErrorMessage(""); // Clear any previous error message

    try {
      setLoading(true); // Set loading state to true
      setIsTyping(false); // Reset typing state
      setSqlQuery("");
      const response = await axios.post("http://localhost:5000/generate", {
        prompt: query,
        tableName, // Pass the table name
      });
      console.log(response.data.columns)
      // Introduce a delay before showing the SQL query
      setTimeout(() => {
        setSqlQuery(response.data.generatedSQL); // Set the generated SQL query
        setResults(response.data.data); // Set results for display
        setColumns(response.data.columns);
        setIsTyping(true); // Start typing effect
        setTimeout(() => {
          setIsTyping(false); // Stop the typing effect
        }, 2000); // Match the duration of the typing animation
        setLoading(false); // Stop loading
      }, 1000); // 1 second delay for smoother transition
    } catch (error) {
      console.error("Error processing query:", error);
      setErrorMessage("Invalid query. Please write an appropriate prompt."); // Show error message
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <textarea
        className="w-full bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows="4"
        placeholder="Ask a question about your data..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      ></textarea>
      <button
        onClick={handleQuery}
        disabled={!fileUploaded}
        className={`mt-3 px-4 py-2 rounded-lg flex items-center gap-2 ${
          !fileUploaded
            ? "bg-gray-500 text-gray-300 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        <FaPlay /> Run Query
      </button>

      {errorMessage && (
        <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
      )}

      {loading && <div className="loader mt-4"></div>}

      {sqlQuery && (
        <div className="mt-4 bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold text-white">Generated SQL Query:</h3>
          <pre className={`typewriter ${isTyping ? 'typing' : ''} whitespace-pre-wrap text-gray-200`}>
            {sqlQuery}
          </pre>
        </div>
      )}
    </div>
  );
};

export default QueryInput;
