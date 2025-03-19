const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { Groq } = require("groq-sdk"); // Import Groq SDK

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Initialize Groq API
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Use Groq API key
});

app.post("/ask", async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: "Query is required!" });
    }

    try {
        // Generate SQL query using Groq API
        const aiResponse = await groq.chat.completions.create({
            model: "llama3-8b-8192",
            messages: [
                { role: "system", content: "You are a PostgreSQL SQL query generator. Return only valid SQL queries without markdown formatting." },
                { role: "user", content: `Convert this into an SQL query: ${query}` },
            ],
        });

        const sqlQuery = aiResponse.choices?.[0]?.message?.content?.trim();

        if (!sqlQuery) {
            return res.status(500).json({ error: "Failed to generate a valid SQL query." });
        }

        console.log("Generated SQL:", sqlQuery);

        // Execute the SQL query in Supabase
        const { data, error } = await supabase.rpc("execute_raw_sql", { query: sqlQuery });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ sqlQuery, result: data ?? "Query executed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

  

// Fetch all products
app.get("/products", async (req, res) => {
  const { data, error } = await supabase.from("products").select("*");

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

app.get('/execute-query', async (req, res) => {
    try {
        const { data, error } = await supabase.rpc('execute_raw_sql'); // Call your function
        if (error) throw error;

        res.json(data); // Ensure JSON response
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Add a new product
app.post("/products", async (req, res) => {
  const { name, description, price, stock, category_id } = req.body;

  if (!name || !price || !stock || !category_id) {
    return res.status(400).json({ error: "Name, price, stock, and category ID are required" });
  }

  const { data, error } = await supabase.from("products").insert([{ name, description, price, stock, category_id }]);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Product added successfully", data });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
