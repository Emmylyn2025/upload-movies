import appError from "./customError.js";

export const buildQuery = ({table, queryParams, allowedFilters, allowedSortFields, allowedFields}) => {

   const controlFields = ["limit", "fields", "page", "sort", "order"];

  const filters = {...queryParams};

  controlFields.forEach((el) => {
    delete filters[el]
  });

  //Feild limiting
  let allFields = '*';
  if(queryParams.fields) {
    const fieldsArray = queryParams.fields.split(",");

    let empty = [];
    fieldsArray.forEach((field) => {
      if(allowedFields.includes(field)) empty.push(field);
    });
  
    if(empty.length > 0) {
      allFields = empty.join(",");
    }
  }

   let query = `SELECT ${allFields} FROM ${table} WHERE 1 = 1`;

  let value = [];
  //Filtering
  Object.entries(filters).forEach(([field, key]) => {
    if(!allowedFilters.includes(field)) return next(new appError("The Field does not exists in the api", 400));
    value.push(key);

    query += ` AND ${field} = $${value.length}`;
  });

  //Sorting
  //limiting and sorting
  const order = queryParams.order ? "ASC" : "DESC";
  const sort = queryParams.sort || "created_at";

  const safeSort = allowedSortFields.includes(sort) ? sort : "created_at";

  query += ` ORDER BY ${safeSort} ${order}`;

  const limit = parseInt(queryParams.limit) || 2;
  const page = parseInt(queryParams.page) || 1;
  const offset = (page -1) * limit;

  query += ` LIMIT $${value.length + 1} OFFSET $${value.length + 2}`;
  value.push(limit, offset);

  return {query, value};
}