require("dotenv").config();
const pg = require("pg");
const client = new pg.Client(process.env.DATABASE_URL);
const express = require("express");
const app = express();

app.use(require("morgan")("dev"));
app.use(express.json());

//post
app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
        INSERT INTO employee(name, ranking, department_id, created_at, updated_at)
        VALUES($1, $2, $3, now(), now())
        RETURNING *
      `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.ranking,
      req.body.department_id,
    ]);
    res.status(201).send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//get depts
app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM department`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

//get employees
app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM employee;`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

//update employees
app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
        UPDATE employee
        SET name=$1, ranking=$2, department_id=$3, updated_at= now()
        WHERE id=$4 RETURNING *
      `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.ranking,
      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//delete
app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
        DELETE FROM employee
        WHERE id = $1
      `;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

//errors
app.use((error, req, res, next) => {
  res.status(error.status || 500).send({ error: error.message });
});

const init = async () => {
  await client.connect();
  let SQL = /*sql*/ `
      DROP TABLE IF EXISTS employee;
      DROP TABLE IF EXISTS department;
  
      CREATE TABLE department(
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE
      );
      CREATE TABLE employee(
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT now(),
          updated_at TIMESTAMP DEFAULT now(),
          ranking INTEGER DEFAULT 3 NOT NULL,
          department_id INTEGER REFERENCES department(id) NOT NULL
      );
      `;
  await client.query(SQL);
  console.log("tables created");

  SQL = /*sql*/ `
      INSERT INTO department(name) VALUES('Teacher');
      INSErt INTO department(name) VALUES('Student');
  
      INSERT INTO employee(name, ranking, department_id) VALUES('Mark', 5, 
          (SELECT id FROM department WHERE name='Teacher'));
      INSERT INTO employee(name, ranking, department_id) VALUES('Woody', 5, 
          (SELECT id FROM department WHERE name='Teacher'));
      INSERT INTO employee(name, ranking, department_id) VALUES('Julian', 4, 
          (SELECT id FROM department WHERE name='Student'));
      `;

  await client.query(SQL);

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
