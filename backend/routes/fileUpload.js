const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const router = express.Router();
const upload = multer({ dest: "data/" }); // Temporary storage for files

router.post("/", upload.single("file"), async (req, res) => {
    const db = req.app.locals.db; // Access the DuckDB connection

    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
    }

    const filePath = path.join(__dirname, "../data", req.file.originalname); // Save the file with original name

    try {
        // Drop the table if it already exists
        await db.run("DROP TABLE IF EXISTS Data");

        // Move the uploaded file to the desired location
        fs.renameSync(req.file.path, filePath);

        // Create a table from the CSV file
        const createTableQuery = `
        CREATE TABLE Data AS 
        SELECT * FROM read_csv_auto('${filePath}',
        delim=',', 
        HEADER=TRUE, 
        quote='"', 
        escape='"', 
        ignore_errors=true
        );`;
        await db.run(createTableQuery);

        // Fetch the data to confirm
        const result = await db.run("SELECT * FROM Data");
        const rows = await result.getRows();
        console.log(rows);
        const schemaResult = await db.run("PRAGMA table_info(Data)");
        const schema = await schemaResult.getRows();
        const columns = schema.map((col) => col[1]);
        const columnNames = columns.flatMap(col => col.split(",").map(name => name.trim()));
        console.log(columnNames);

        // Function to convert DuckDBDateValue to a standard date format
        const duckDBDateValueToDate = (duckDBDateValue) => {
            const epoch = new Date(1970, 0, 1); // January 1, 1970
            const date = new Date(epoch.getTime() + duckDBDateValue.days * 24 * 60 * 60 * 1000); // Add days in milliseconds
            return date.toISOString().split('T')[0]; // Return in YYYY-MM-DD format
        };

        // Sanitize BigInt and DuckDBDateValue
        const sanitizedRows = rows.map(row => {
            return Object.fromEntries(
                Object.entries(row).map(([key, value]) => [
                    key,
                    typeof value === "bigint" ? value.toString() : 
                    (value && typeof value === "object" && 'days' in value) ? duckDBDateValueToDate(value) : 
                    value,
                ])
            );
        });
        console.log(sanitizedRows)  
        // Include filePath in the response
        res.status(200).json({
            message: "File uploaded, table created, and data inserted successfully.",
            tableName: "Data", // Include table name in the response
            filePath: filePath,
            schema: columnNames,
            data: sanitizedRows,
        });
    } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
