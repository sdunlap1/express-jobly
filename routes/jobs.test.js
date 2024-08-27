"use strict";

const request = require("supertest");
const db = require("../db");
const app = require("../app");
const testCommon = require("./_testCommon");

beforeAll(async () => {
  await testCommon.commonBeforeAll();
  console.log("commonBeforeAll has completed.");
});

beforeEach(async () => {
  await testCommon.commonBeforeEach();
  console.log("commonBeforeEach has completed.");
});

afterEach(async () => {
  await testCommon.commonAfterEach();
  console.log("commonAfterEach has completed.");
});

afterAll(async () => {
  await testCommon.commonAfterAll();
  console.log("commonAfterAll has completed.");
});

describe("POST /jobs", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "New Job",
        salary: 60000,
        equity: "0.05",
        companyHandle: "c1",
      })
      .set("authorization", `Bearer ${testCommon.adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "New Job",
        salary: 60000,
        equity: "0.05",
        companyHandle: "c1",
      },
    });
  });

  test("fails with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "New Job",
        salary: "not-a-number",
        equity: "0.05",
        companyHandle: "c1",
      })
      .set("authorization", `Bearer ${testCommon.adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

describe("GET /jobs", function () {
  test("works: no filter", async function () {
    console.log("GET /jobs - job1Id:", testCommon.job1Id);
    console.log("GET /jobs - job2Id:", testCommon.job2Id);

    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: testCommon.job1Id,
          title: "Job1",
          salary: 50000,
          equity: "0.1",
          companyHandle: "c1",
        },
        {
          id: testCommon.job2Id,
          title: "Job2",
          salary: 80000,
          equity: "0",
          companyHandle: "c2",
        },
      ],
    });
  });
});

  test("works with title filter", async function () {
    const resp = await request(app).get("/jobs?title=Job1");
    expect(resp.body.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: testCommon.job1Id,
          title: "Job1",
          salary: 50000,
          equity: "0.1",
          companyHandle: "c1",
        }),
      ])
    );
  });

  test("works with minSalary filter", async function () {
    const resp = await request(app).get("/jobs?minSalary=60000");
    expect(resp.body.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: testCommon.job2Id,
          title: "Job2",
          salary: 80000,
          equity: "0",
          companyHandle: "c2",
        }),
      ])
    );
  });

  test("works with hasEquity filter", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.body.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: testCommon.job1Id,
          title: "Job1",
          salary: 50000,
          equity: "0.1",
          companyHandle: "c1",
        }),
      ])
    );
  });

  test("works with multiple filters", async function () {
    const resp = await request(app).get("/jobs?minSalary=60000&hasEquity=false");
    expect(resp.body.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: testCommon.job2Id,
          title: "Job2",
          salary: 80000,
          equity: "0",
          companyHandle: "c2",
        }),
      ])
    );
  });
  

describe("GET /jobs/:id", function () {
  test("works", async function () {
    const resp = await request(app).get(`/jobs/${testCommon.job1Id}`);
    expect(resp.body).toEqual({
      job: {
        id: testCommon.job1Id,
        title: "Job1",
        salary: 50000,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("not found if no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

describe("PATCH /jobs/:id", function () {
  test("works", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testCommon.job1Id}`)
      .send({ title: "Updated Job1" })
      .set("authorization", `Bearer ${testCommon.adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: testCommon.job1Id,
        title: "Updated Job1",
        salary: 50000,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("not found if no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({ title: "Updated Job1" })
      .set("authorization", `Bearer ${testCommon.adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("fails with invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testCommon.job1Id}`)
      .send({ salary: "not-a-number" })
      .set("authorization", `Bearer ${testCommon.adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

describe("DELETE /jobs/:id", function () {
  test("works", async function () {
    const resp = await request(app)
      .delete(`/jobs/${testCommon.job1Id}`)
      .set("authorization", `Bearer ${testCommon.adminToken}`);
    expect(resp.body).toEqual({ deleted: `${testCommon.job1Id}` });
  });

  test("not found if no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${testCommon.adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});