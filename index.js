const express = require("express");
const app = express();
app.use(express.json());
const jwt = require("jsonwebtoken");

const bcrypt = require("bcrypt");

const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const path = require("path");
const { create } = require("domain");

const dbpath = path.join(__dirname, "data_base.db");

let sql_conn = null;

const intializeDBandServer = async () => {
  try {
    sql_conn = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(() => {
      console.log("server running at local host3000");
    });
  } catch (e) {
    console.log(`database error: ${e.message}`);
    process.exit(1);
  }
};
intializeDBandServer();

const db = new sqlite3.Database(
  "./data_base.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) return console.error(err.message);
    console.log("connection successfull");
  }
);

app.get("/", (req, res) => {
  res.send("Hello World nodejs");
});

// to get all the tasks
app.get("/tasks/", async (req, res) => {
  let jwtToken;
  const authHeader = req.header["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    res.status(401);
    res.send("Invalid Access token");
  } else {
    jwt.verify(jwtToken, drgygniouilmomkio, async (err, user) => {
      if (err) {
        res.status(401);
        res.send("Invalid access token");
      } else {
        const getAllUsers = `
        SELECT * FROM users_datA`;
        const Users = await sql_conn.all(getAllUsers);
        res.send(Users);
      }
    });
  }
});

// get single-task
app.get("/tasks/:taskId", async (req, res) => {
  const { taskId } = req.params;
  const getsingleTask = `
  SELECT * FROM users_Tasks WHERE assignee_id=${taskId}`;
  const singletask = await sql_conn.get(getsingleTask);
  res.send(singletask);
});

// to add_user to users_DatA
app.post("/users/", async (req, res) => {
  const users_DatA = req.body;
  const { id, username, password_hash } = users_DatA;
  const add_user = `
  INSERT INTO users_DatA (username, password_hash) VALUES (
    '${username}', '${password_hash}'
  )`;
  const dbResponse = await sql_conn.run(add_user);
  const user_id = dbResponse.lastID;
  res.send({ user_id: user_id });
});

// update particular-task
app.put("/tasks/:taskId", async (req, res) => {
  const { taskId } = req.params;
  const users_Tasks = req.body;
  const { title, description, status, assignee_id, created_at, updated_at } =
    users_Tasks;

  const update_task = `
  UPDATE users_Tasks SET title='${title}',
  description='${description}',
  assignee_id = ${assignee_id},
  created_at = '${created_at}',
  updated_at = '${updated_at}'
  WHERE id=${taskId}`;

  await sql_conn.run(update_task);
  res.send("task updated successfully");
});
app.listen(6000);

//create user-api
app.post("/usersadd/", async (req, res) => {
  const { username, password_hash } = req.body;
  const hashedPassword = await bcrypt.hash(password_hash, 10);
  const selectUser = `SELECT * FROM users_datA WHERE username= '${username}'`;
  const dbUser = await sql_conn.get(selectUser);

  if (dbUser === undefined) {
    // create user in users_DatA
    const createUser = `INSERT INTO users_DatA(username, password_hash) VALUES (
      '${username}',
      '${hashedPassword}'
    );`;
    await sql_conn.run(createUser);
    res.send("user created successfully");
  } else {
    // send invalid username
    res.status(400);
    res.send("user already exits");
  }
});

//create login-api
app.post("/login/", async (req, res) => {
  const { username, password_hash } = req.body;

  const selectUser = `SELECT * FROM users_datA WHERE username='${username}'`;
  const dbUser = await sql_conn.get(selectUser);

  if (dbUser === undefined) {
    // user doesn't exist
    res.status(400);
    res.send("Invalid user");
  } else {
    // compare passwords
    const ispasswordMatched = await bcrypt.compare(
      password_hash,
      dbUser.password_hash
    );
    if (ispasswordMatched === true) {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "drgygniouilmomkio");
      res.send({ jwtToken });
    } else {
      res.send("failed login");
    }
  }
});

const sql = `SELECT * FROM users_DatA`;

db.all(sql, (err, rows) => {
  if (err) return console.error(err.message);

  rows.forEach((row) => {
    console.log(row);
  });
});
