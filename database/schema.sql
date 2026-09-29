CREATE DATABASE IF NOT EXISTS due_na_diay
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE due_na_diay;

CREATE TABLE IF NOT EXISTS subjects (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(30) NOT NULL,
  instructor VARCHAR(120) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subjects_code (code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tasks (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  subject_id INT UNSIGNED NULL,
  deadline DATE NULL,
  priority ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
  status ENUM('not-started', 'in-progress', 'completed') NOT NULL DEFAULT 'not-started',
  progress TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_tasks_subject_id (subject_id),
  KEY ix_tasks_deadline (deadline),
  CONSTRAINT fk_tasks_subject
    FOREIGN KEY (subject_id) REFERENCES subjects (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_tasks_progress CHECK (progress BETWEEN 0 AND 100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS study_sessions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  subject_id INT UNSIGNED NULL,
  topic VARCHAR(200) NOT NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  PRIMARY KEY (id),
  KEY ix_study_sessions_date_time (session_date, start_time),
  KEY ix_study_sessions_subject_id (subject_id),
  CONSTRAINT fk_study_sessions_subject
    FOREIGN KEY (subject_id) REFERENCES subjects (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_study_sessions_duration CHECK (duration >= 15)
) ENGINE=InnoDB;
