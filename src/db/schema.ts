import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ---------- Admins ----------
export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // hashed
  name: text("name").notNull(),
  createdAt: text("created_at").default(new Date().toISOString()),
});

// ---------- Students ----------
export const students = sqliteTable("students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roll: text("roll").notNull().unique(),
  name: text("name").notNull(),
  className: text("class_name").notNull(), // e.g. "Class 9"
  section: text("section").notNull().default(""),
  fatherName: text("father_name").default(""),
  motherName: text("mother_name").default(""),
  phone: text("phone").default(""),
  address: text("address").default(""),
  password: text("password").notNull(), // hashed, for student login
  createdAt: text("created_at").default(new Date().toISOString()),
});

// ---------- Results ----------
export const results = sqliteTable("results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  examName: text("exam_name").notNull(), // e.g. "Half Yearly 2026"
  subject: text("subject").notNull(),
  marks: real("marks").notNull(),
  fullMarks: real("full_marks").notNull().default(100),
  grade: text("grade").default(""),
  createdAt: text("created_at").default(new Date().toISOString()),
});

// ---------- Notices ----------
export const notices = sqliteTable("notices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  date: text("date").notNull(),
  createdAt: text("created_at").default(new Date().toISOString()),
});

// ---------- Attendance ----------
export const attendance = sqliteTable("attendance", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  status: text("status").notNull(), // "present" | "absent" | "late"
  createdAt: text("created_at").default(new Date().toISOString()),
});
