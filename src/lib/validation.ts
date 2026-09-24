// Shared validation for registration and for students editing their own details.

// Password rule: at least 6 characters, one uppercase letter, one number, one special character.
export const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,}$/;
// Email is required and used as the account's login identifier.
export const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Mobile number is optional — just enough of a check to reject obvious junk if provided.
export const MOBILE_RULE = /^\+?\d{10,15}$/;
export const DOB_RULE = /^\d{4}-\d{2}-\d{2}$/;
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/** Batch value used by people who are NOT alumni/students of this school. */
export const NON_STUDENT_BATCH = "other";
export const FIRST_BATCH_YEAR = 1960;

/** A batch is either a passing year (FIRST_BATCH_YEAR..this year) or "other". */
export function isValidBatch(batch: string): boolean {
  if (batch === NON_STUDENT_BATCH) return true;
  if (!/^\d{4}$/.test(batch)) return false;
  const year = Number(batch);
  return year >= FIRST_BATCH_YEAR && year <= new Date().getFullYear();
}

export function isValidDob(dob: string): boolean {
  return DOB_RULE.test(dob) && !Number.isNaN(new Date(dob).getTime());
}
