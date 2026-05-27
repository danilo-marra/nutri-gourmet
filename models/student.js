import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function create(values) {
  if (!values?.name) {
    throw new ValidationError({
      message: "O campo 'name' é obrigatório.",
      action: "Informe o nome do aluno e tente novamente.",
    });
  }

  if (!values?.class) {
    throw new ValidationError({
      message: "O campo 'class' é obrigatório.",
      action: "Informe a turma do aluno e tente novamente.",
    });
  }

  const newStudent = await runInsertQuery(values);
  return newStudent;

  async function runInsertQuery(values) {
    const results = await database.query({
      text: `
      INSERT INTO
        students (name, class, is_full_time)
      VALUES
        ($1, $2, $3)
      RETURNING
        *
      ;`,
      values: [values.name, values.class, values.is_full_time ?? false],
    });

    return results.rows[0];
  }
}

async function findAll() {
  const students = await runSelectQuery();
  return students;

  async function runSelectQuery() {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        students
      ORDER BY
        name ASC
      ;`,
    });

    return results.rows;
  }
}

async function findOneById(id) {
  const studentFound = await runSelectQuery(id);
  return studentFound;

  async function runSelectQuery(id) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        students
      WHERE
        id = $1
      LIMIT
        1
      ;`,
      values: [id],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O aluno informado não foi encontrado no sistema.",
        action: "Verifique se o ID informado está correto.",
      });
    }

    return results.rows[0];
  }
}

async function update(id, values) {
  const currentStudent = await findOneById(id);

  const studentWithNewValues = {
    ...currentStudent,
    name: values.name ?? currentStudent.name,
    class: values.class ?? currentStudent.class,
    is_full_time: values.is_full_time ?? currentStudent.is_full_time,
  };

  const updatedStudent = await runUpdateQuery(studentWithNewValues);
  return updatedStudent;

  async function runUpdateQuery(studentWithNewValues) {
    const results = await database.query({
      text: `
      UPDATE
        students
      SET
        name = $2,
        class = $3,
        is_full_time = $4,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
      values: [
        studentWithNewValues.id,
        studentWithNewValues.name,
        studentWithNewValues.class,
        studentWithNewValues.is_full_time,
      ],
    });

    return results.rows[0];
  }
}

async function remove(id) {
  await findOneById(id);

  const removedStudent = await runDeleteQuery(id);
  return removedStudent;

  async function runDeleteQuery(id) {
    const results = await database.query({
      text: `
      DELETE FROM
        students
      WHERE
        id = $1
      RETURNING
        *
      ;`,
      values: [id],
    });

    return results.rows[0];
  }
}

const student = { create, findAll, findOneById, update, remove };

export default student;
