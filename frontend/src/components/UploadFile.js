import React, { useState } from "react";
import axios from "axios";
import { FaUpload } from "react-icons/fa";

const UploadFile = ({ setFilePath }) => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async () => {
    if (!file) {
      setUploadStatus("Please select a file before uploading.");
      return;
    }
    if (file.type !== "text/csv") {
        setUploadStatus("Error: Please upload a file in .csv format.");
        setFile(null); // Reset the file state
        return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    console.log("Uploading file:", file); // Track file being uploaded

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Backend response:", response.data); // Log response from backend
      setFilePath(response.data.filePath); // Update filePath in parent
      setUploadStatus("File uploaded successfully!");
      setFile(null);
    } catch (error) {
      console.error("Upload error:", error); // Log error
      setFilePath(""); // Reset filePath on failure
      setUploadStatus("Error uploading file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl flex flex-col items-start gap-4">
      <div className="flex items-center gap-4">
        <input
          type="file"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setUploadStatus("");
            console.log("File selected:", e.target.files[0]); // Track selected file
          }}
          className="text-gray-400 file:bg-gray-800 file:border-0 file:rounded-lg file:px-4 file:py-2 file:text-blue-500 file:hover:bg-gray-700"
        />
        <button
          onClick={handleFileUpload}
          disabled={!file || isUploading}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            !file || isUploading
              ? "bg-gray-500 text-gray-300 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          <FaUpload /> {isUploading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {uploadStatus && (
        <p
          className={`text-sm mt-2 ${
            uploadStatus.includes("successfully") ? "text-green-500" : "text-red-500"
          }`}
        >
          {uploadStatus}
        </p>
      )}
    </div>
  );
};

export default UploadFile;
