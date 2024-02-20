const express = require('express')
const port = 3000
const app = express()
const mysql = require('mysql')
const cors = require('cors')

app.use(cors())

/* creating a connection to the mysql database */
const connectionVariables = {
    host:'localhost',
    user:'root',
    password:'',
    database:'detsdb'  
}

const conn = mysql.createConnection(connectionVariables)

conn.connect((err)=>{
    if(err) throw err;
    console.log('Successfully connected to the database')
})

/* route */

app.get('/getReviews', (req,res)=>{
    const userId = req.query.userId

    console.log(`The userId sent from the frontend is ${userId}`)

    const weekStartDate = new Date();
    weekStartDate.setDate(weekStartDate.getDate() - 7);
    const weekEndDate = new Date();

    const weekQuery = `
    SELECT SUM(ExpenseCost) AS weeklyExpense FROM 
    tblexpense WHERE ExpenseDate 
    BETWEEN '${weekStartDate.toISOString().split('T')[0]}'
    AND '${weekEndDate.toISOString().split('T')[0]}' AND UserId='${userId}'`;
    
    conn.query(weekQuery, (err, weekResult) => {
        if (err) throw err;
    
        const weeklyExpense = weekResult[0].weeklyExpense || 0;
    
        // Get monthly overall budget
        const budgetQuery = `
        SELECT SUM(Budget) AS overallBudget FROM tblmonthlybudget 
        WHERE UserId='${userId}'`;
        
        conn.query(budgetQuery, (err, budgetResult) => {
          if (err) throw err;
    
          const overallBudget = budgetResult[0].overallBudget || 0;
    
          // Generate review
          const review = generateReview(weeklyExpense, overallBudget);
    
          // Send the review as JSON
          res.json({ review });
        });
      });
    });

    function generateReview(weeklyExpense, overallBudget) {
        const percent = ((weeklyExpense / overallBudget) * 100).toFixed(2);
        const review = {
          weeklyExpense,
          overallBudget,
          percent,

          message: `You have spent ${percent}% of your overall monthly  budget in the last week. Spend wisely`
        };
        return review;
      }

      app.get('/expensePrediction', async (req, res) => {
        const userId = req.query.userId;
      
        try {
          const weeklyAvgExpense = await avarageWeeklyExpense(userId);
      
          const select = `SELECT AVG(percentage_change) AS percentage
                          FROM percentage_changes
                          WHERE id = '${userId}'`;
      
          conn.query(select, (err, percentage_change) => {
            if (err) throw err;
      
            const avarage_percentage_change = percentage_change[0].percentage || 0;
      
            let predictedAmount;
            if (avarage_percentage_change >= 0) {
              predictedAmount = weeklyAvgExpense + ((avarage_percentage_change / 100) * weeklyAvgExpense);
            } else {
              predictedAmount = weeklyAvgExpense - (Math.abs((avarage_percentage_change / 100) * weeklyAvgExpense));
            }
      
            const amount = {
              userId,
              weeklyAvgExpense,
              predictedAmount,
            };
      
            res.json({ amount });
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      });
      
      function avarageWeeklyExpense(userId) {
        return new Promise((resolve, reject) => {
          let avarageWeeklyExpense;
          const weekStartDate = new Date();
          weekStartDate.setDate(weekStartDate.getDate() - 7);
          const weekEndDate = new Date();
      
          const weekQuery = `
            SELECT AVG(ExpenseCost) AS weeklyAvg FROM 
            tblexpense WHERE ExpenseDate 
            BETWEEN '${weekStartDate.toISOString().split('T')[0]}'
            AND '${weekEndDate.toISOString().split('T')[0]}' AND UserId='${userId}'`;
      
          conn.query(weekQuery, (err, result) => {
            if (err) {
              reject(err);
            } else {
              avarageWeeklyExpense = result[0].weeklyAvg || 0;
              console.log(result[0].weeklyAvg);
              resolve(avarageWeeklyExpense);
            }
          });
        });
      }
      function predictNextExpense(historicalExpenses) {
  
}


app.listen(port,()=>{
    console.log(`The server is running on http://localhost:${port}`)
    console.log("BUDDDY server is running perfectly")
})
