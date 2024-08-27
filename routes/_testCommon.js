"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const Job = require("../models/job");
const { createToken } = require("../helpers/tokens");

let job1Id;
let job2Id;

async function commonBeforeAll() {
  // Delete all data from the tables
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM jobs");

  // Insert test companies
  await Company.create({
    handle: "c1",
    name: "C1",
    numEmployees: 1,
    description: "Desc1",
    logoUrl: "http://c1.img",
  });

  await Company.create({
    handle: "c2",
    name: "C2",
    numEmployees: 2,
    description: "Desc2",
    logoUrl: "http://c2.img",
  });

  // Insert test jobs
  const job1 = await Job.create({
    title: "Job1",
    salary: 50000,
    equity: "0.1",
    companyHandle: "c1",
  });
  job1Id = job1.id;

  const job2 = await Job.create({
    title: "Job2",
    salary: 80000,
    equity: "0",
    companyHandle: "c2",
  });
  job2Id = job2.id;

  // Insert test users
  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });

  await User.register({
    username: "admin",
    firstName: "Admin",
    lastName: "User",
    email: "admin@admin.com",
    password: "adminpassword",
    isAdmin: true,
  });
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

const u1Token = createToken({ username: "u1", isAdmin: false });
const adminToken = createToken({ username: "admin", isAdmin: true });

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  get job1Id() {
    return job1Id;
  },
  get job2Id() {
    return job2Id;
  },
};
