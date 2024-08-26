const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/**
 * Generates a partial SQL UPDATE statement.
 *
 * This function helps to dynamically generate the SQL code for updating
 * only specific fields in a database record. It takes an object of data
 * to update and another object that maps JavaScript-style variable names 
 * to the corresponding SQL column names.
 *
 * @param {Object} dataToUpdate - An object where the keys are the fields to update 
 *                                and the values are the new values for those fields.
 * @param {Object} jsToSql - An object mapping JavaScript-style field names to 
 *                           the corresponding SQL column names (e.g., { firstName: "first_name" }).
 *
 * @returns {Object} An object containing two properties:
 *                   - `setCols` (String): The part of the SQL query with the columns to update.
 *                   - `values` (Array): An array of the new values for the columns.
 *
 * @throws {BadRequestError} If no data is provided to update.
 *
 * Example:
 *   const dataToUpdate = { firstName: 'Aliya', age: 32 };
 *   const jsToSql = { firstName: 'first_name' };
 *   const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
 *   // result = {
 *   //   setCols: '"first_name"=$1, "age"=$2',
 *   //   values: ['Aliya', 32]
 *   // }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
