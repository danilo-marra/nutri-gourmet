import database from "infra/database.js";
import { ValidationError, NotFoundError, ConflictError } from "infra/errors.js";
import type { Student } from "@/types/index";

interface StudentInputValues {
  name?: string;
  class?: string;
  is_full_time?: boolean;
}

async function create(values: StudentInputValues): Promise<Student> {
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

  async function runInsertQuery(values: StudentInputValues): Promise<Student> {
    const results = await database.query<Student>({
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

async function findAll(): Promise<Student[]> {
  const students = await runSelectQuery();
  return students;

  async function runSelectQuery(): Promise<Student[]> {
    const results = await database.query<Student>({
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

async function findOneById(id: string): Promise<Student> {
  const studentFound = await runSelectQuery(id);
  return studentFound;

  async function runSelectQuery(id: string): Promise<Student> {
    const results = await database.query<Student>({
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

async function update(
  id: string,
  values: StudentInputValues,
): Promise<Student> {
  const currentStudent = await findOneById(id);

  if ("name" in values && !values.name) {
    throw new ValidationError({
      message: "O campo 'name' não pode ser vazio.",
      action: "Informe um nome válido para o aluno.",
    });
  }

  const studentWithNewValues: Student = {
    ...currentStudent,
    name: values.name ?? currentStudent.name,
    class: values.class ?? currentStudent.class,
    is_full_time: values.is_full_time ?? currentStudent.is_full_time,
  };

  const updatedStudent = await runUpdateQuery(studentWithNewValues);
  return updatedStudent;

  async function runUpdateQuery(studentWithNewValues: Student) {
    const results = await database.query<Student>({
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

async function remove(id: string): Promise<Student> {
  await findOneById(id);

  try {
    const removedStudent = await runDeleteQuery(id);
    return removedStudent;
  } catch (err: unknown) {
    // database.query() wraps pg errors in ServiceError({ cause: pgErr });
    // check the underlying pg error code for FK violations (23503)
    const pgCode = (err as { cause?: { code?: string } }).cause?.code;
    if (pgCode === "23503") {
      throw new ConflictError({
        message:
          "Este aluno possui vendas ou créditos registrados e não pode ser excluído.",
        action:
          "Remova todas as vendas e transações de crédito associadas antes de excluir o aluno.",
      });
    }
    throw err;
  }

  async function runDeleteQuery(id: string): Promise<Student> {
    const results = await database.query<Student>({
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
