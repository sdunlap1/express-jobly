const { sqlForPartialUpdate } = require("../helpers/sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {

  test("works: single field", function () {
    const result = sqlForPartialUpdate(
      { firstName: "Aliya" },
      { firstName: "first_name" }
    );
    expect(result).toEqual({
      setCols: '"first_name"=$1',
      values: ["Aliya"]
    });
  });

  test("works: multiple fields", function () {
    const result = sqlForPartialUpdate(
      { firstName: "Aliya", age: 32 },
      { firstName: "first_name" }
    );
    expect(result).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ["Aliya", 32]
    });
  });

  test("throws BadRequestError if no data", function () {
    expect(() => {
      sqlForPartialUpdate({}, {});
    }).toThrow(BadRequestError);
  });

  test("works with no jsToSql mapping needed", function () {
    const result = sqlForPartialUpdate(
      { age: 32 },
      {}
    );
    expect(result).toEqual({
      setCols: '"age"=$1',
      values: [32]
    });
  });

  test("works with SQL reserved keyword", function () {
    const result = sqlForPartialUpdate(
      { order: "asc" },
      { order: "order_col" }
    );
    expect(result).toEqual({
      setCols: '"order_col"=$1',
      values: ["asc"]
    });
  });

  // Add more tests as needed...
});
