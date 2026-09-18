import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const exams = sqliteTable('exams', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  adminKey: text('admin_key').notNull().unique(),
  title: text('title').notNull(),
  questionsJson: text('questions_json').notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(30),
  expectedCandidates: integer('expected_candidates').notNull().default(1),
  startsAt: integer('starts_at'),
  endsAt: integer('ends_at'),
  ownerId: integer('owner_id'),
  sourceFileKey: text('source_file_key'),
  createdAt: integer('created_at').notNull(),
});

export const users = sqliteTable('users', { id: integer('id').primaryKey({ autoIncrement:true }), email:text('email').notNull().unique(), passwordHash:text('password_hash').notNull(), role:text('role').notNull().default('member'), createdAt:integer('created_at').notNull() });
export const sessions = sqliteTable('sessions', { token:text('token').primaryKey(), userId:integer('user_id').notNull(), expiresAt:integer('expires_at').notNull() });
export const invites = sqliteTable('invites', { token:text('token').primaryKey(), createdBy:integer('created_by').notNull(), expiresAt:integer('expires_at').notNull(), usedAt:integer('used_at') });

export const attempts = sqliteTable('attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  examId: integer('exam_id').notNull().references(() => exams.id),
  candidateName: text('candidate_name').notNull(),
  organization: text('organization').notNull().default(''),
  answersJson: text('answers_json').notNull(),
  score: integer('score').notNull(),
  totalScore: integer('total_score').notNull(),
  correctCount: integer('correct_count').notNull(),
  autoScore: integer('auto_score').notNull().default(0),
  manualScore: integer('manual_score').notNull().default(0),
  gradingStatus: text('grading_status').notNull().default('graded'),
  resultToken: text('result_token').notNull().default(''),
  submittedAt: integer('submitted_at').notNull(),
}, (table) => [index('idx_attempts_exam_submitted').on(table.examId, table.submittedAt)]);
