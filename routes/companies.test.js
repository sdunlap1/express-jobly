"use strict";

const request = require("supertest");
const db = require("../db");
const app = require("../app");
const Company = require("../models/company");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,  
} = require("./_testCommon");

const newCompany = {
  handle: "new",
  name: "New",
  numEmployees: 10,
  description: "New Desc",
  logoUrl: "http://new.img",
};

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("POST /companies", function () {
  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/companies")
        .send(newCompany)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ company: newCompany });
  });
  
  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .post("/companies")
        .send(newCompany)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          handle: "new",
          numEmployees: 10,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          ...newCompany,
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

describe("GET /companies", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/companies");
    expect(resp.body).toEqual({
      companies: [
        {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
        {
          handle: "c2",
          name: "C2",
          description: "Desc2",
          numEmployees: 2,
          logoUrl: "http://c2.img",
        },
        {
          handle: "c3",
          name: "C3",
          description: "Desc3",
          numEmployees: 3,
          logoUrl: "http://c3.img",
        },
      ],
    });
  });

  test("works: filtering by minEmployees", async function () {
    const resp = await request(app).get("/companies?minEmployees=2");
    expect(resp.body).toEqual({
      companies: [
        {
          handle: "c2",
          name: "C2",
          description: "Desc2",
          numEmployees: 2,
          logoUrl: "http://c2.img",
        },
        {
          handle: "c3",
          name: "C3",
          description: "Desc3",
          numEmployees: 3,
          logoUrl: "http://c3.img",
        },
      ],
    });
  });

  test("works: filtering by maxEmployees", async function () {
    const resp = await request(app).get("/companies?maxEmployees=2");
    expect(resp.body).toEqual({
      companies: [
        {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
        {
          handle: "c2",
          name: "C2",
          description: "Desc2",
          numEmployees: 2,
          logoUrl: "http://c2.img",
        },
      ],
    });
  });

  test("works: filtering by name", async function () {
    const resp = await request(app).get("/companies?name=c1");
    expect(resp.body).toEqual({
      companies: [
        {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
      ],
    });
  });

  test("fails: test next() handler", async function () {
    try {
      // Start a new transaction
      await db.query("BEGIN");
  
      // Drop the companies table to cause a failure in the route
      await db.query("DROP TABLE companies CASCADE");
  
      const resp = await request(app).get("/companies");
      expect(resp.statusCode).toEqual(500);
  
      // Rollback the transaction so we can clean up
      await db.query("ROLLBACK");
    } catch (err) {
      // This will catch errors from the drop table or create table
      throw new Error("Error during test next() handler: " + err.message);
    } finally {
      // Check if the companies table exists, if not create it
      await db.query(`
        CREATE TABLE IF NOT EXISTS companies (
          handle VARCHAR(25) PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          num_employees INTEGER,
          description TEXT,
          logo_url TEXT
        )
      `);
    }
  });
});  

describe("GET /companies/:handle", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/companies/c1`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/companies/c2`);
    expect(resp.body).toEqual({
      company: {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/companies/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

describe("PATCH /companies/:handle", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({ name: "C1-new" })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1-new",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({ name: "C1-new" })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
        .patch(`/companies/nope`)
        .send({ name: "new nope" })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({ handle: "c1-new" })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({ logoUrl: "not-a-url" })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

describe("DELETE /companies/:handle", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/companies/c1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "c1" });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .delete(`/companies/c1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/companies/nope`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
