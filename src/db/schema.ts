import { pgTable, serial, text, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";

// ---------- Admins ----------
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // hashed
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- Students ----------
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  roll: text("roll").notNull().unique(),
  name: text("name").notNull(),
  className: text("class_name").notNull(), // e.g. "Class 9"
  section: text("section").notNull().default(""),
  fatherName: text("father_name").default(""),
  motherName: text("mother_name").default(""),
  phone: text("phone").default(""),
  address: text("address").default(""),
  password: text("password").notNull(), // hashed, for student login
  batch: text("batch").default(""), // pass-out year / alumni batch, for self-registered members
  approved: boolean("approved").notNull().default(true), // self-registered members start as false, pending admin approval
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- Results ----------
export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  examName: text("exam_name").notNull(), // e.g. "Half Yearly 2026"
  subject: text("subject").notNull(),
  marks: real("marks").notNull(),
  fullMarks: real("full_marks").notNull().default(100),
  grade: text("grade").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- Notices ----------
export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- Attendance ----------
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  status: text("status").notNull(), // "present" | "absent" | "late"
  createdAt: timestamp("created_at").defaultNow(),
});
