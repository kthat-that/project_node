const mysql = require('mysql');
require('dotenv').config();

var con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password:  process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

con.connect(function(error){
    if(error) throw error;
    console.log("connected to sql");
});

exports.query = (sql,value)=>{
    return new Promise((resolv,reject)=>{
        con.query(sql,value,(err,result)=>{
            if(err) reject(err);
            resolv(result)
        })
    })
}
