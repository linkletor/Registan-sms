// ---------------------------------------------------------------------------
// Seeds a realistic demo dataset for Registan Private School:
//   - 1 admin + 2 tutor accounts
//   - 4 groups across grades 5, 7 and 10
//   - ~65 students with full profiles, parents, and location info
//   - 5 exams per group (Sept-Dec) with per-topic scoring and a general
//     upward trend, a few deliberately declining/weak students
//   - twice-weekly attendance records for the same period
//   - a couple of teacher notes
//
// Run with: npm run db:seed
// ---------------------------------------------------------------------------

import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, sqlite } from "./index";
import {
  users,
  parents,
  groups,
  students,
  subjects,
  topics,
  exams,
  examTopics,
  examResults,
  topicResults,
  lessons,
  attendance,
  teacherNotes,
} from "./schema";
import { makeId } from "@/lib/id";
import { pct } from "@/lib/calc";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const MALE_FIRST = [
  "Alisher", "Sardor", "Jasur", "Bekzod", "Sherzod", "Otabek", "Diyor", "Farrukh",
  "Shokhrukh", "Aziz", "Bobur", "Davron", "Elyor", "Ibrohim", "Jahongir", "Kamron",
  "Laziz", "Muhammad", "Nodir", "Rustam", "Sanjar", "Temur", "Ulug'bek", "Zafar",
  "Akmal", "Dilshod", "Eldor", "Farhod", "Sirojiddin", "Xurshid",
];
const FEMALE_FIRST = [
  "Malika", "Nilufar", "Sevara", "Zarina", "Gulnora", "Dilnoza", "Madina", "Shahnoza",
  "Kamila", "Feruza", "Lola", "Nigora", "Sabina", "Umida", "Yulduz", "Aziza",
  "Dilfuza", "Gulbahor", "Iroda", "Mavluda", "Nasiba", "Rayhona", "Sarvinoz", "Zulfiya",
  "Barno", "Sitora",
];
const SURNAMES = [
  "Karimov", "Yusupov", "Rashidov", "Abdullayev", "Ibragimov", "Nabijonov",
  "Rakhimov", "Sodiqov", "Tursunov", "Xolmatov", "Mirzayev", "Qodirov",
  "Ergashev", "Jo'rayev", "Saidov", "Nazarov", "Xoshimov", "Yoqubov",
  "Ahmedov", "Ismoilov", "Yuldashev", "Ochilov",
];
const DISTRICTS = [
  "Fergana city", "Marg'ilon", "Qo'qon", "Rishton", "Oltiariq", "Beshariq",
  "Furqat", "Uchko'prik", "Quva", "So'x",
];

function fullName(gender: "MALE" | "FEMALE") {
  const first = gender === "MALE" ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
  const surnameBase = pick(SURNAMES);
  const last = gender === "FEMALE" ? surnameBase.replace(/(ov|yev|iev)$/, "$1a") : surnameBase;
  return { first, last };
}

function phone() {
  return `+998 ${randInt(90, 99)} ${randInt(100, 999)} ${randInt(10, 99)} ${randInt(10, 99)}`;
}

const TOPIC_SETS: Record<number, string[]> = {
  5: ["Fractions", "Decimals", "Basic geometry", "Word problems"],
  7: ["Linear equations", "Ratios & proportions", "Percentages", "Word problems"],
  10: ["Quadratic equations", "Systems of equations", "Trigonometry basics", "Word problems"],
};

const EXAM_DATES = ["2025-09-20", "2025-10-15", "2025-11-10", "2025-12-05", "2025-12-20"];

function dateRangeLessons(startISO: string, endISO: string) {
  const dates: string[] = [];
  const start = new Date(startISO);
  const end = new Date(endISO);
  const cur = new Date(start);
  // Twice a week: Monday and Thursday
  while (cur <= end) {
    const day = cur.getDay();
    if (day === 1 || day === 4) dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

async function main() {
  console.log("Seeding database...");

  // Wipe existing data (idempotent re-seed)
  sqlite.exec(`
    DELETE FROM audit_logs;
    DELETE FROM teacher_notes;
    DELETE FROM attendance;
    DELETE FROM lessons;
    DELETE FROM topic_results;
    DELETE FROM exam_results;
    DELETE FROM exam_topics;
    DELETE FROM exams;
    DELETE FROM topics;
    DELETE FROM subjects;
    DELETE FROM students;
    DELETE FROM parents;
    DELETE FROM groups;
    DELETE FROM users;
  `);

  // --- Users ---------------------------------------------------------------
  const adminId = makeId("usr");
  const tutor2Id = makeId("usr");

  await db.insert(users).values([
    {
      id: adminId,
      name: "Shahzod Nabijonov",
      email: "admin@registan.uz",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
      phone: phone(),
    },
    {
      id: tutor2Id,
      name: "Malika Yusupova",
      email: "tutor@registan.uz",
      passwordHash: await bcrypt.hash("tutor123", 10),
      role: "TUTOR",
      phone: phone(),
    },
  ]);

  // --- Subject ---------------------------------------------------------------
  const subjectId = makeId("sub");
  await db.insert(subjects).values({ id: subjectId, name: "Mathematics" });

  // --- Groups ---------------------------------------------------------------
  const groupDefs = [
    { name: "Group A", grade: 5, tutorId: tutor2Id, size: 16 },
    { name: "Group A", grade: 7, tutorId: adminId, size: 18 },
    { name: "Group B", grade: 7, tutorId: tutor2Id, size: 16 },
    { name: "Group A", grade: 10, tutorId: adminId, size: 18 },
  ];

  const groupRows = groupDefs.map((g) => ({ id: makeId("grp"), ...g }));
  await db.insert(groups).values(
    groupRows.map((g) => ({
      id: g.id,
      name: g.name,
      grade: g.grade,
      tutorId: g.tutorId,
      academicYear: "2025-2026",
    })),
  );

  // --- Topics per grade (a topic name like "Word problems" is shared across
  // grades, so it's only inserted once and then reused) --------------------
  const topicByName = new Map<string, { id: string; name: string }>();
  const topicIdsByGrade = new Map<number, { id: string; name: string }[]>();
  for (const grade of [5, 7, 10]) {
    const rows: { id: string; name: string }[] = [];
    for (const name of TOPIC_SETS[grade]) {
      let topic = topicByName.get(name);
      if (!topic) {
        topic = { id: makeId("top"), name };
        await db.insert(topics).values({ id: topic.id, subjectId, name });
        topicByName.set(name, topic);
      }
      rows.push(topic);
    }
    topicIdsByGrade.set(grade, rows);
  }

  let studentCounter = 1;
  const attentionCandidates: string[] = [];

  for (const g of groupRows) {
    const groupTopics = topicIdsByGrade.get(g.grade)!;

    // --- Students & parents ---------------------------------------------
    const studentRows: (typeof students.$inferInsert & {
      _skill: { base: number; slope: number; weakTopic: number; strongTopic: number };
      _attendanceRate: number;
    })[] = [];

    for (let i = 0; i < g.size; i++) {
      const gender: "MALE" | "FEMALE" = Math.random() < 0.5 ? "MALE" : "FEMALE";
      const { first, last } = fullName(gender);
      const fatherFirst = pick(MALE_FIRST);
      const parentId = makeId("parent");

      const isDeclining = Math.random() < 0.08;
      const isLowAttendance = Math.random() < 0.1;

      await db.insert(parents).values({
        id: parentId,
        fatherName: `${fatherFirst} ${last}`,
        fatherPhone: phone(),
        motherName: `${pick(FEMALE_FIRST)} ${last.replace(/(ov|yev|iev)$/, "$1a")}`,
        motherPhone: phone(),
        parentEmail: Math.random() < 0.5 ? `${first.toLowerCase()}.${last.toLowerCase()}@gmail.com` : null,
        emergencyContactName: Math.random() < 0.3 ? `${pick(MALE_FIRST)} ${last}` : null,
        emergencyContactPhone: Math.random() < 0.3 ? phone() : null,
      });

      const studentId = makeId("stu");
      const dobYear = 2026 - g.grade - 6; // rough age for grade
      const dob = `${dobYear}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`;

      studentRows.push({
        id: studentId,
        studentCode: `RG-${String(studentCounter).padStart(4, "0")}`,
        firstName: first,
        lastName: last,
        fatherName: `${fatherFirst} ${last}`,
        dob,
        gender,
        groupId: g.id,
        academicLevel: pick(["Beginner", "Intermediate", "Advanced"]),
        previousLevel: pick(["Beginner", "Intermediate"]),
        enrollmentDate: "2025-09-01",
        status: "ACTIVE",
        parentId,
        region: "Fergana",
        district: pick(DISTRICTS),
        address: `${pick(["Mustaqillik", "Amir Temur", "Navoi", "Bobur", "Istiqlol"])} street, house ${randInt(1, 90)}`,
        addressExtra: null,
        notes: null,
        _skill: {
          base: randInt(45, 78),
          slope: isDeclining ? randInt(-7, -2) : randInt(1, 8),
          weakTopic: randInt(0, groupTopics.length - 1),
          strongTopic: randInt(0, groupTopics.length - 1),
        },
        _attendanceRate: isLowAttendance ? randInt(60, 78) : randInt(85, 99),
      });
      studentCounter++;
      if (isDeclining || isLowAttendance) attentionCandidates.push(studentId);
    }

    await db.insert(students).values(
      studentRows.map(({ _skill, _attendanceRate, ...s }) => s),
    );

    // --- Exams for this group --------------------------------------------
    const maxPointsPerTopic = 10;
    const examIds: string[] = [];
    for (let ei = 0; ei < EXAM_DATES.length; ei++) {
      const examId = makeId("exam");
      examIds.push(examId);
      await db.insert(exams).values({
        id: examId,
        name: `Math Test #${ei + 1}`,
        subjectId,
        groupId: g.id,
        date: EXAM_DATES[ei],
        maxScore: groupTopics.length * maxPointsPerTopic,
        createdById: g.tutorId,
      });

      const examTopicRows = groupTopics.map((t, ti) => ({
        id: makeId("etop"),
        examId,
        topicId: t.id,
        maxPoints: maxPointsPerTopic,
        orderIndex: ti,
      }));
      await db.insert(examTopics).values(examTopicRows);

      for (const s of studentRows) {
        // occasional absence
        const absent = Math.random() < 0.04;
        const examResultId = makeId("res");

        const topicScores = examTopicRows.map((et, ti) => {
          let scorePct =
            s._skill.base +
            s._skill.slope * ei +
            (ti === s._skill.weakTopic ? -13 : 0) +
            (ti === s._skill.strongTopic ? 12 : 0) +
            randInt(-6, 6);
          scorePct = clamp(scorePct, 5, 100);
          const raw = Math.round((scorePct / 100) * maxPointsPerTopic * 2) / 2; // half-point precision
          return { examTopicId: et.id, score: absent ? 0 : raw };
        });

        const total = topicScores.reduce((a, t) => a + t.score, 0);
        const maxScore = examTopicRows.length * maxPointsPerTopic;

        await db.insert(examResults).values({
          id: examResultId,
          examId,
          studentId: s.id!,
          totalScore: total,
          percentage: pct(total, maxScore),
          absent,
        });

        await db.insert(topicResults).values(
          topicScores.map((t) => ({
            id: makeId("tres"),
            examResultId,
            examTopicId: t.examTopicId,
            score: t.score,
          })),
        );
      }
    }

    // --- Attendance ---------------------------------------------------------
    const lessonDates = dateRangeLessons("2025-09-01", "2025-12-20");
    const lessonIds: string[] = [];
    for (const date of lessonDates) {
      const lessonId = makeId("lsn");
      lessonIds.push(lessonId);
      await db.insert(lessons).values({ id: lessonId, groupId: g.id, date, topic: null });
    }

    for (const s of studentRows) {
      const targetRate = s._attendanceRate / 100;
      for (const lessonId of lessonIds) {
        const r = Math.random();
        let status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
        if (r < targetRate * 0.92) status = "PRESENT";
        else if (r < targetRate * 0.92 + 0.05) status = "LATE";
        else if (r < targetRate) status = "EXCUSED";
        else status = "ABSENT";

        await db.insert(attendance).values({
          id: makeId("att"),
          lessonId,
          studentId: s.id!,
          status,
        });
      }
    }

    // --- A couple of teacher notes ------------------------------------------
    for (const s of studentRows.slice(0, 2)) {
      await db.insert(teacherNotes).values({
        id: makeId("note"),
        studentId: s.id!,
        authorId: g.tutorId,
        note: pick([
          "Very engaged in class discussions, asks good follow-up questions.",
          "Needs more practice with word problems — recommend extra homework set.",
          "Parents requested a short progress call after the next test.",
          "Strong improvement this term, consider moving up a level next year.",
        ]),
      });
    }

    console.log(`Seeded ${g.grade === 5 ? "Grade 5" : g.grade === 7 ? "Grade 7" : "Grade 10"} ${g.name}: ${g.size} students, ${EXAM_DATES.length} exams, ${lessonIds.length} lessons.`);
  }

  console.log("\nDone.");
  console.log("Login as admin:  admin@registan.uz / admin123");
  console.log("Login as tutor:  tutor@registan.uz / tutor123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    sqlite.close();
  });
