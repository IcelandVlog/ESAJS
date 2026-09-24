import { pgTable, serial, text, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";

// ---------- Admins ----------
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // hashed
  name: text("name").notNull(),
  photoUrl: text("photo_url"), // small base64 data URL, set via profile page upload
  // null = main admin (full access). A batch year (e.g. "2005") = batch admin, who can
  // only manage that batch. Created by the main admin, max 2 per batch.
  batch: text("batch"),
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
  dateOfBirth: text("date_of_birth"), // "YYYY-MM-DD"; optional, powers the birthday-wish popup
  password: text("password").notNull(), // hashed, for student login
  resetCode: text("reset_code"), // one-time code for forgot-password flow
  resetCodeExpires: timestamp("reset_code_expires"),
  batch: text("batch").default(""), // pass-out year / alumni batch, for self-registered members
  bloodGroup: text("blood_group"), // e.g. "A+", "O-"
  approved: boolean("approved").notNull().default(true), // self-registered members start as false, pending admin approval
  photoUrl: text("photo_url"), // small base64 data URL, set via profile page upload
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

// ---------- Gallery ----------
export const galleryPhotos = pgTable("gallery_photos", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(), // resized/compressed base64 data URL
  // JSON string: { header: {text,color,fontSize,style}, lines: [{text,color,fontSize,style}] }
  // Kept as one JSON blob (rather than separate columns) since it's a flexible,
  // admin-authored list of independently styled lines of text.
  content: text("content").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- Reunion tokens ----------
// One admin-generated code per batch per calendar day, texted/emailed out to
// every approved member of that batch (see /api/reunion-token).
export const reunionTokens = pgTable("reunion_tokens", {
  id: serial("id").primaryKey(),
  batch: text("batch").notNull(),
  occasion: text("occasion").notNull().default(""), // header/title shown to recipients and on the homepage countdown
  messageBody: text("message_body").notNull().default(""), // optional extra text (emoji-friendly), shown below the header
  venue: text("venue").notNull().default(""), // where the reunion is happening, shown on the reunion card
  reunionDate: timestamp("reunion_date").notNull(), // when the actual reunion event happens; powers the homepage countdown
  cancelled: boolean("cancelled").notNull().default(false), // admin can cancel; hidden from students/homepage when true
  token: text("token").notNull(),
  recipientCount: integer("recipient_count").notNull().default(0),
  smsSent: integer("sms_sent").notNull().default(0),
  emailSent: integer("email_sent").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- Reunion registrations ----------
// Recorded when a student enters their batch's entry code on /reunion to
// confirm they're attending (see /api/reunion-register).
export const reunionRegistrations = pgTable("reunion_registrations", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  reunionTokenId: integer("reunion_token_id").notNull().references(() => reunionTokens.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});
