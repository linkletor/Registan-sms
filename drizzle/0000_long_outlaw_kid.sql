CREATE TABLE `attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`student_id` text NOT NULL,
	`status` text DEFAULT 'PRESENT' NOT NULL,
	`note` text,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attendance_lesson_idx` ON `attendance` (`lesson_id`);--> statement-breakpoint
CREATE INDEX `attendance_student_idx` ON `attendance` (`student_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_lesson_student_idx` ON `attendance` (`lesson_id`,`student_id`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`detail` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `exam_results` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_id` text NOT NULL,
	`student_id` text NOT NULL,
	`total_score` real DEFAULT 0 NOT NULL,
	`percentage` real DEFAULT 0 NOT NULL,
	`absent` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `exam_results_exam_idx` ON `exam_results` (`exam_id`);--> statement-breakpoint
CREATE INDEX `exam_results_student_idx` ON `exam_results` (`student_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `exam_results_exam_student_idx` ON `exam_results` (`exam_id`,`student_id`);--> statement-breakpoint
CREATE TABLE `exam_topics` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`max_points` real NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `exam_topics_exam_idx` ON `exam_topics` (`exam_id`);--> statement-breakpoint
CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subject_id` text NOT NULL,
	`group_id` text NOT NULL,
	`date` text NOT NULL,
	`max_score` real DEFAULT 0 NOT NULL,
	`created_by_id` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `exams_group_idx` ON `exams` (`group_id`);--> statement-breakpoint
CREATE INDEX `exams_date_idx` ON `exams` (`date`);--> statement-breakpoint
CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`grade` integer NOT NULL,
	`tutor_id` text NOT NULL,
	`academic_year` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`tutor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `groups_tutor_idx` ON `groups` (`tutor_id`);--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`date` text NOT NULL,
	`topic` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `lessons_group_idx` ON `lessons` (`group_id`);--> statement-breakpoint
CREATE INDEX `lessons_date_idx` ON `lessons` (`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `lessons_group_date_idx` ON `lessons` (`group_id`,`date`);--> statement-breakpoint
CREATE TABLE `parents` (
	`id` text PRIMARY KEY NOT NULL,
	`father_name` text,
	`father_phone` text,
	`mother_name` text,
	`mother_phone` text,
	`parent_email` text,
	`emergency_contact_name` text,
	`emergency_contact_phone` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`student_code` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`father_name` text,
	`dob` text,
	`gender` text,
	`group_id` text,
	`academic_level` text,
	`previous_level` text,
	`enrollment_date` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`parent_id` text,
	`region` text,
	`district` text,
	`address` text,
	`address_extra` text,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_student_code_unique` ON `students` (`student_code`);--> statement-breakpoint
CREATE INDEX `students_group_idx` ON `students` (`group_id`);--> statement-breakpoint
CREATE INDEX `students_status_idx` ON `students` (`status`);--> statement-breakpoint
CREATE INDEX `students_name_idx` ON `students` (`last_name`,`first_name`);--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subjects_name_unique` ON `subjects` (`name`);--> statement-breakpoint
CREATE TABLE `teacher_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`author_id` text,
	`note` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `teacher_notes_student_idx` ON `teacher_notes` (`student_id`);--> statement-breakpoint
CREATE TABLE `topic_results` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_result_id` text NOT NULL,
	`exam_topic_id` text NOT NULL,
	`score` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`exam_result_id`) REFERENCES `exam_results`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exam_topic_id`) REFERENCES `exam_topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `topic_results_result_idx` ON `topic_results` (`exam_result_id`);--> statement-breakpoint
CREATE INDEX `topic_results_exam_topic_idx` ON `topic_results` (`exam_topic_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `topic_results_result_topic_idx` ON `topic_results` (`exam_result_id`,`exam_topic_id`);--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `topics_subject_idx` ON `topics` (`subject_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `topics_subject_name_idx` ON `topics` (`subject_id`,`name`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'TUTOR' NOT NULL,
	`phone` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);