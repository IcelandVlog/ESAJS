import "dotenv/config";
import { db } from "./client";
import { admins, students, notices } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
  // Create default admin if not exists
  const existingAdmin = await db.select().from(admins).where(eq(admins.username, "admin"));
  if (existingAdmin.length === 0) {
    await db.insert(admins).values({
      username: "admin",
      password: await bcrypt.hash("admin123", 10),
      name: "School Admin",
    });
    console.log("✅ Default admin created -> username: admin | password: admin123");
  } else {
    console.log("ℹ️  Admin already exists, skipping.");
  }

  // Create a sample student if not exists
  const existingStudent = await db.select().from(students).where(eq(students.roll, "101"));
  if (existingStudent.length === 0) {
    await db.insert(students).values({
      roll: "101",
      name: "Rahim Uddin",
      className: "Class 9",
      section: "A",
      fatherName: "Karim Uddin",
      motherName: "Rahima Begum",
      phone: "01700000000",
      address: "Dhaka",
      password: await bcrypt.hash("student123", 10),
    });
    console.log("✅ Sample student created -> roll: 101 | password: student123");
  } else {
    console.log("ℹ️  Sample student already exists, skipping.");
  }

  // Sample notice
  const existingNotice = await db.select().from(notices);
  if (existingNotice.length === 0) {
    await db.insert(notices).values({
      title: "ESAS ওয়েবসাইটে স্বাগতম",
      content: "Ex-Students Association of Jalalpur Secondary School-এর নতুন ডাইনামিক ওয়েবসাইট চালু হয়েছে। এখানে নোটিশ, রেজাল্ট ও অ্যাটেনডেন্স দেখা যাবে।",
      date: new Date().toISOString().slice(0, 10),
    });
    console.log("✅ Sample notice created.");
  }

  console.log("🎉 Seeding complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
