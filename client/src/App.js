import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function App() {
  const [file, setFile] = useState(null);
  const [filesList, setFilesList] = useState([]);
  const [error, setError] = useState("");
  const dropRef = useRef();

  const fetchFiles = async () => {
    const res = await axios.get("/files");
    setFilesList(res.data);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFile = (selected) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif"];
    if (selected && allowedTypes.includes(selected.type)) {
      setFile(selected);
      setError("");
    } else {
      setError("Only PDF or Image files are allowed");
      setFile(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
    dropRef.current.classList.remove("border-blue-500");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current.classList.add("border-blue-500");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current.classList.remove("border-blue-500");
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post("/upload", formData);
      setFile(null);
      fetchFiles();
    } catch (err) {
      setError(err.response.data || "Upload failed");
    }
  };

  const handleDelete = async (filename) => {
    await axios.delete(`/delete/${filename}`);
    fetchFiles();
  };

  const handleUpdate = async (oldFilename) => {
    if (!file) return alert("Select a file to update");
    const formData = new FormData();
    formData.append("file", file);
    await axios.put(`/update/${oldFilename}`, formData);
    setFile(null);
    fetchFiles();
  };

  const renderPDF = async (filePath, canvasId) => {
    const loadingTask = pdfjsLib.getDocument(filePath);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.getElementById(canvasId);
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    page.render({ canvasContext: context, viewport });
  };

  useEffect(() => {
    filesList.forEach((f, i) => {
      if (f.type === "pdf") renderPDF(`/uploads/${f.filename}`, `pdf-canvas-${i}`);
    });
  }, [filesList]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6 text-green-600">📂 File Manager</h1>

      {/* Drag-and-drop area */}
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="w-full max-w-md h-32 flex items-center justify-center border-2 border-dashed border-gray-400 rounded-lg mb-4 bg-white relative hover:border-green-500 transition"
      >
        {file ? <p className="font-medium">{file.name}</p> : <p className="text-gray-500">Drag & Drop file here or click to select</p>}
        <input
          type="file"
          className="absolute w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <button
        onClick={handleUpload}
        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg mb-6 font-semibold transition"
      >
        Upload
      </button>

      {/* Files grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl overflow-y-auto">
        {filesList.map((f, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition flex flex-col items-center"
          >
            {f.type === "image" ? (
              <img src={`/uploads/${f.filename}`} alt="" className="w-32 h-32 object-cover rounded mb-3" />
            ) : (
              <canvas id={`pdf-canvas-${i}`} className="w-32 h-32 mb-3 border rounded"></canvas>
            )}
            <p className="text-sm truncate w-32 text-center mb-3 font-medium">{f.filename}</p>
            <div className="flex gap-2">
              
              <button
                onClick={() => handleDelete(f.filename)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
