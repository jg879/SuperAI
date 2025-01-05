import React, { useState } from "react";
import Header from "./components/Header";
import UploadFile from "./components/UploadFile";
import QueryInput from "./components/QueryInput";
import ResultTable from "./components/ResultTable";

function App() {
  const [filePath, setFilePath] = useState("");
  const [results, setResults] = useState([]);
  const [fileUploaded, setFileUploaded] = useState(false); // Track upload status
  const [columns, setColumns] = useState([]);

  const handleFileUpload = (filePath) => {
    setFilePath(filePath);
    setFileUploaded(!!filePath); // Update flag based on successful file upload
  };

  console.log("filePath in App:", filePath); // Track filePath
  console.log("fileUploaded in App:", fileUploaded); // Track fileUploaded

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <Header />
      <div className="p-4 flex flex-col items-center gap-6">
        <UploadFile setFilePath={handleFileUpload} />
        <QueryInput setResults={setResults} fileUploaded={fileUploaded} setColumns={setColumns}/>
        <ResultTable results={results} columns={columns} />
      </div>
    </div>
  );
}

export default App;
