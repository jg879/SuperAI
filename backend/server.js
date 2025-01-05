const express = require("express");
const cors = require("cors");
const fileUploadRoutes = require("./routes/fileUpload");
const { DuckDBInstance } = require("@duckdb/node-api");
require("dotenv").config(); // Load environment variables from .env

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize DuckDB
async function initializeDatabase() {
    try {
        const instance = await DuckDBInstance.create(":memory:"); // Use in-memory DB for testing
        const connection = await instance.connect();

        console.log("DuckDB connected successfully.");

        return connection; // Return the connection for use elsewhere
    } catch (error) {
        console.error("Error connecting to DuckDB:", error);
        process.exit(1); // Exit on error
    }
}

// Initialize Google Generative AI (Gemini API)
async function initializeGeminiAPI() {
    try {
        const apiKey = process.env.GEMINI_API_KEY; // Get API key from .env
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not defined in the .env file.");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log("Gemini API initialized successfully.");
        return model; // Return the model for use elsewhere
    } catch (error) {
        console.error("Error initializing Gemini API:", error);
        process.exit(1); // Exit on error
    }
}

// Start the Express server
async function startServer() {
    try {
        const dbConnection = await initializeDatabase(); // Initialize DuckDB
        const geminiModel = await initializeGeminiAPI(); // Initialize Gemini API

        app.locals.db = dbConnection; // Store DB connection in app locals
        app.locals.geminiModel = geminiModel; // Store Gemini model in app locals

        // Example route to generate content using Gemini API
        app.post("/generate", async (req, res) => {
            try {
                const { prompt, tableName } = req.body; // Accept tableName in the request
                if (!prompt) {
                    return res.status(400).json({ error: "No prompt provided." });
                }
                if (!tableName) {
                    return res.status(400).json({ error: "No table name provided." });
                }
        
                // Adjust the prompt to include the table name
                const modifiedPrompt = `${prompt} from the table named ${tableName}`;
        
                // Use the Gemini API to generate the SQL query
                const geminiModel = req.app.locals.geminiModel;
                const result = await geminiModel.generateContent(modifiedPrompt);
        
                // Get the generated response text
                const responseText = result.response.text();
        
                // Extract the SQL query using regex
                const sqlMatch = responseText.match(/```sql\n([\s\S]*?)```/);
                if (!sqlMatch || !sqlMatch[1]) {
                    return res.status(500).json({ error: "Failed to extract SQL query from response." });
                }
        
                const generatedSQL = sqlMatch[1].trim(); // Extract and trim the SQL query
                console.log("Generated SQL:", generatedSQL);
        
                // Execute the generated SQL query
                const db = req.app.locals.db; // DuckDB connection
                const queryResult = await db.run(generatedSQL);
        
                // Fetch and sanitize the rows
                const rows = await queryResult.getRows();
                console.log(rows)
                const schemaResult = await db.run(`PRAGMA table_info(${tableName})`);
                const schema = await schemaResult.getRows();
                const columns = schema.map((col) => col[1]);
                const columnNames = columns.flatMap(col => col.split(",").map(name => name.trim()));
                console.log(columnNames)
                const duckDBDateValueToDate = (duckDBDateValue) => {
                    const epoch = new Date(1970, 0, 1); // January 1, 1970
                    const date = new Date(epoch.getTime() + duckDBDateValue.days * 24 * 60 * 60 * 1000); // Add days in milliseconds
                    return date.toISOString().split('T')[0]; // Return in YYYY-MM-DD format
                };
                const formattedRows = rows.map((row) =>
                    Object.fromEntries(
                        Object.entries(row).map(([key, value]) => [
                            key,
                            typeof value === "bigint" ? value.toString() : 
                            (value && typeof value === "object" && 'days' in value) ? duckDBDateValueToDate(value) : 
                            value,
                        ])
                    )
                );
                console.log(formattedRows)
        
                // Return the results
                res.status(200).json({
                    message: "Query executed successfully.",
                    generatedSQL,
                    data: formattedRows,
                    columns: columnNames,
                });
            } catch (error) {
                console.error("Error in /generate route:", error);
                res.status(500).json({ error: error.message });
            }
        });
        

        // Routes
        app.use("/upload", fileUploadRoutes);

        const PORT = 5000;
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Error starting server:", error);
    }
}

// Start the server
startServer();
