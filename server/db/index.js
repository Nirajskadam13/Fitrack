import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

export const sql = neon(process.env.DATABASE_URL);

export async function createUser(email, passwordHash, name) {
  const [row] = await sql`
    INSERT INTO users (email, password_hash, name)
    VALUES (${email}, ${passwordHash}, ${name})
    RETURNING id, email, name, role, onboarding_done, target_date
  `;
  return row;
}

export async function findUserByEmail(email) {
  const rows = await sql`
    SELECT id, email, password_hash, name, age, gender, height_cm, weight_kg,
           goal, activity_level, workout_location, equipment, role, onboarding_done,
           target_date
    FROM users
    WHERE email = ${email}
  `;
  return rows[0];
}

export async function findUserById(id) {
  const rows = await sql`
    SELECT id, email, name, age, gender, height_cm, weight_kg, goal,
           activity_level, workout_location, equipment, role, onboarding_done,
           target_date
    FROM users
    WHERE id = ${id}
  `;
  return rows[0];
}

export async function updateUserProfile(id, profileFields) {
  const {
    name,
    age,
    gender,
    height_cm,
    weight_kg,
    goal,
    activity_level,
    workout_location,
    equipment,
    target_date
  } = profileFields;

  const [row] = await sql`
    UPDATE users
    SET name = ${name},
        age = ${age},
        gender = ${gender},
        height_cm = ${height_cm},
        weight_kg = ${weight_kg},
        goal = ${goal},
        activity_level = ${activity_level},
        workout_location = ${workout_location},
        equipment = ${equipment},
        target_date = ${target_date},
        onboarding_done = true
    WHERE id = ${id}
    RETURNING id, email, name, age, gender, height_cm, weight_kg, goal,
              activity_level, workout_location, equipment, role, onboarding_done,
              target_date
  `;
  return row;
}

export async function getAllUsers() {
  return sql`
    SELECT id, email, name, goal, role, onboarding_done, created_at
    FROM users
    ORDER BY created_at DESC
  `;
}

export async function upsertFitnessPlan(userId, planJson, weekNumber) {
  await sql`
    UPDATE fitness_plans
    SET is_active = false
    WHERE user_id = ${userId}
  `;
  const [row] = await sql`
    INSERT INTO fitness_plans (user_id, plan_json, week_number, is_active, created_at, modified_at)
    VALUES (${userId}, ${planJson}, ${weekNumber}, true, NOW(), NOW())
    RETURNING *
  `;
  return row;
}

export async function getActiveFitnessPlan(userId) {
  const rows = await sql`
    SELECT *
    FROM fitness_plans
    WHERE user_id = ${userId} AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return rows[0];
}

export async function updateFitnessPlanJson(planId, planJson) {
  const [row] = await sql`
    UPDATE fitness_plans
    SET plan_json = ${planJson}, modified_at = NOW()
    WHERE id = ${planId}
    RETURNING *
  `;
  return row;
}

export async function upsertDietPlan(userId, planJson, dailyCalorieTarget, weekNumber) {
  await sql`
    UPDATE diet_plans
    SET is_active = false
    WHERE user_id = ${userId}
  `;
  const [row] = await sql`
    INSERT INTO diet_plans (user_id, plan_json, daily_calorie_target, week_number, is_active, created_at, modified_at)
    VALUES (${userId}, ${planJson}, ${dailyCalorieTarget}, ${weekNumber}, true, NOW(), NOW())
    RETURNING *
  `;
  return row;
}

export async function getActiveDietPlan(userId) {
  const rows = await sql`
    SELECT *
    FROM diet_plans
    WHERE user_id = ${userId} AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return rows[0];
}

export async function updateDietPlanJson(planId, planJson) {
  const [row] = await sql`
    UPDATE diet_plans
    SET plan_json = ${planJson}, modified_at = NOW()
    WHERE id = ${planId}
    RETURNING *
  `;
  return row;
}

export async function insertWorkoutSession(
  userId,
  date,
  dayName,
  muscleGroup,
  exercisesLogged,
  durationMins,
  totalVolumeKg
) {
  const [row] = await sql`
    INSERT INTO workout_sessions (user_id, date, day_name, muscle_group, exercises_logged, duration_mins, total_volume_kg)
    VALUES (${userId}, ${date}, ${dayName}, ${muscleGroup}, ${exercisesLogged}, ${durationMins}, ${totalVolumeKg})
    RETURNING *
  `;
  return row;
}

export async function getWorkoutSessions(userId, fromDate) {
  return sql`
    SELECT *
    FROM workout_sessions
    WHERE user_id = ${userId} AND date >= ${fromDate}
    ORDER BY date ASC
  `;
}

export async function getTodaySession(userId, date) {
  const rows = await sql`
    SELECT *
    FROM workout_sessions
    WHERE user_id = ${userId} AND date = ${date}
    LIMIT 1
  `;
  return rows[0];
}

export async function insertMealLog(
  userId,
  date,
  mealType,
  foodName,
  quantityG,
  calories,
  proteinG,
  carbsG,
  fatG
) {
  const [row] = await sql`
    INSERT INTO meal_logs (user_id, date, meal_type, food_name, quantity_g, calories, protein_g, carbs_g, fat_g)
    VALUES (${userId}, ${date}, ${mealType}, ${foodName}, ${quantityG}, ${calories}, ${proteinG}, ${carbsG}, ${fatG})
    RETURNING *
  `;
  return row;
}

export async function getMealLogsByDate(userId, date) {
  return sql`
    SELECT *
    FROM meal_logs
    WHERE user_id = ${userId} AND date = ${date}
    ORDER BY id ASC
  `;
}

export async function getMealLogsByRange(userId, fromDate, toDate) {
  return sql`
    SELECT *
    FROM meal_logs
    WHERE user_id = ${userId} AND date >= ${fromDate} AND date <= ${toDate}
    ORDER BY date ASC, id ASC
  `;
}

export async function deleteMealLog(id, userId) {
  await sql`
    DELETE FROM meal_logs
    WHERE id = ${id} AND user_id = ${userId}
  `;
}

export async function updateWaterGlasses(userId, date, glasses) {
  await sql`
    INSERT INTO meal_logs (user_id, date, meal_type, food_name, water_glasses, calories)
    VALUES (${userId}, ${date}, 'water', 'Water', ${glasses}, 0)
  `;
}

export async function insertWeighIn(userId, date, weightKg, bodyFatPercent, notes) {
  const [row] = await sql`
    INSERT INTO weigh_ins (user_id, date, weight_kg, body_fat_percent, notes)
    VALUES (${userId}, ${date}, ${weightKg}, ${bodyFatPercent}, ${notes})
    RETURNING *
  `;
  return row;
}

export async function getWeighIns(userId) {
  return sql`
    SELECT *
    FROM weigh_ins
    WHERE user_id = ${userId}
    ORDER BY date ASC
  `;
}

export async function upsertPersonalRecord(
  userId,
  exerciseName,
  bestWeightKg,
  bestReps,
  totalVolumeKg,
  achievedOn
) {
  const [row] = await sql`
    INSERT INTO personal_records (user_id, exercise_name, best_weight_kg, best_reps, total_volume_kg, achieved_on)
    VALUES (${userId}, ${exerciseName}, ${bestWeightKg}, ${bestReps}, ${totalVolumeKg}, ${achievedOn})
    ON CONFLICT (user_id, exercise_name)
    DO UPDATE SET
      best_weight_kg = ${bestWeightKg},
      best_reps = ${bestReps},
      total_volume_kg = ${totalVolumeKg},
      achieved_on = ${achievedOn}
    WHERE personal_records.total_volume_kg < ${totalVolumeKg}
    RETURNING *
  `;
  return row;
}

export async function getPersonalRecords(userId) {
  return sql`
    SELECT *
    FROM personal_records
    WHERE user_id = ${userId}
    ORDER BY achieved_on DESC
  `;
}

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      age INT,
      gender TEXT,
      height_cm NUMERIC,
      weight_kg NUMERIC,
      goal TEXT,
      activity_level TEXT,
      workout_location TEXT,
      equipment TEXT[],
      role TEXT DEFAULT 'user',
      onboarding_done BOOL DEFAULT false,
      target_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS fitness_plans (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      plan_json JSONB,
      week_number INT DEFAULT 1,
      is_active BOOL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      modified_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS diet_plans (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      plan_json JSONB,
      daily_calorie_target INT,
      week_number INT DEFAULT 1,
      is_active BOOL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      modified_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      day_name TEXT,
      muscle_group TEXT,
      exercises_logged JSONB,
      duration_mins INT,
      total_volume_kg NUMERIC,
      completed BOOL DEFAULT false
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS meal_logs (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      meal_type TEXT,
      food_name TEXT,
      quantity_g NUMERIC,
      calories INT DEFAULT 0,
      protein_g NUMERIC DEFAULT 0,
      carbs_g NUMERIC DEFAULT 0,
      fat_g NUMERIC DEFAULT 0,
      water_glasses INT DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS weigh_ins (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      weight_kg NUMERIC,
      body_fat_percent NUMERIC,
      notes TEXT
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS personal_records (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      exercise_name TEXT NOT NULL,
      best_weight_kg NUMERIC,
      best_reps INT,
      total_volume_kg NUMERIC,
      achieved_on DATE,
      UNIQUE(user_id, exercise_name)
    )
  `;
}
