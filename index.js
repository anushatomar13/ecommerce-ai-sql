const express = require("express");
const cors = require("cors");
require("dotenv").config();
const {createClient} = require('@supabase/supabase-js');
const axious = require("axios");

const app = express();
app.use(express.json());
app.use(cors());


const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.post("/ask", async(req,res)=>{
    const {query} = req.body;
    if(!query){
        return res.status(400).json({error:"query is required!"});
    }
    try{
        const aiResponse = await axios.post("https://api.github.com/ai/generate-sql",{
            prompt: `Convert this into a SQL query for Supabase ${query}`,
            model: "gpt-4"
        },
    {
        headers:{Authorization: `Bearer ${GITHUB_AI_API_KEY}`}
    }
        const sqlQuery = aiResponse.data.sql;
        console.log("Generated SQL:", sqlQuery);

        const{data, error} = await supabase.rpc("execute_sql", {query: sqlQuery});
        if(error) return res.status(500).json({error:error.message});

        res.json({message:`Query result: ${JSON.stringify(data)}`});
    }
    catch(error){
        res.status(500).json({error:error.message});

    }
})

app.get("/products", async (req,res) => {
    const {data, error} = await supabase.from('products').select('*');

    if(error) return res.status(500).json({error:error.message});
    res.json(data);
});

app.post('/products', async (req,res)=>{
    const {name, description, price, stock, category_id} = req.body;
    
    if(!name || !price || !stock || !category_id){
        return  res.status(400).json({error:"Name, price, stock. and category id are required"});
    }

    const {data, error} = await supabase
    .from('products')
    .insert([{name,description,price,stock, category_id}]);

    if(error) return res.status(500).json({error:error.message});

    res.json({message:"product added successfully", data});
})

const PORT = 5000;
app.listen(PORT, () => console.log(`Sever is running on port ${PORT}`));

