CREATE DATABASE IF NOT EXISTS music_collab_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE music_collab_db;

CREATE TABLE IF NOT EXISTS Users (
    user_id    INT          NOT NULL AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('SINGER','PRODUCER','LISTENER','ADMIN') NOT NULL DEFAULT 'LISTENER',
    bio        TEXT,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Project (
    project_id  INT          NOT NULL AUTO_INCREMENT,
    title       VARCHAR(200) NOT NULL,
    genre       VARCHAR(100),
    description TEXT,
    status      ENUM('ACTIVE','COMPLETED','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    created_by  INT          NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id),
    CONSTRAINT fk_project_user FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Track (
    track_id    INT          NOT NULL AUTO_INCREMENT,
    project_id  INT          NOT NULL,
    uploaded_by INT          NOT NULL,
    track_type  ENUM('VOCALS','INSTRUMENTAL','BEAT','MIXED','OTHER') NOT NULL DEFAULT 'OTHER',
    file_url    VARCHAR(500) NOT NULL,
    duration    INT          DEFAULT 0,
    uploaded_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (track_id),
    CONSTRAINT fk_track_project FOREIGN KEY (project_id)  REFERENCES Project(project_id) ON DELETE CASCADE,
    CONSTRAINT fk_track_user    FOREIGN KEY (uploaded_by) REFERENCES Users(user_id)      ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Collaboration (
    collaboration_id INT      NOT NULL AUTO_INCREMENT,
    user_id          INT      NOT NULL,
    project_id       INT      NOT NULL,
    role_in_project  VARCHAR(100),
    joined_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collaboration_id),
    UNIQUE KEY uq_collab (user_id, project_id),
    CONSTRAINT fk_collab_user    FOREIGN KEY (user_id)    REFERENCES Users(user_id)      ON DELETE CASCADE,
    CONSTRAINT fk_collab_project FOREIGN KEY (project_id) REFERENCES Project(project_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS File_Version (
    version_id          INT          NOT NULL AUTO_INCREMENT,
    track_id            INT          NOT NULL,
    version_number      INT          NOT NULL DEFAULT 1,
    name                VARCHAR(200),
    changes_description TEXT,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (version_id),
    CONSTRAINT fk_fv_track FOREIGN KEY (track_id) REFERENCES Track(track_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Review (
    review_id   INT     NOT NULL AUTO_INCREMENT,
    project_id  INT     NOT NULL,
    reviewer_id INT     NOT NULL,
    rating      TINYINT NOT NULL,
    feedback    TEXT,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id),
    CONSTRAINT fk_review_project  FOREIGN KEY (project_id)  REFERENCES Project(project_id) ON DELETE CASCADE,
    CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES Users(user_id)      ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Playlist (
    playlist_id INT          NOT NULL AUTO_INCREMENT,
    user_id     INT          NOT NULL,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id),
    CONSTRAINT fk_playlist_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Playlist_Track (
    playlist_id INT      NOT NULL,
    track_id    INT      NOT NULL,
    added_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, track_id),
    CONSTRAINT fk_pt_playlist FOREIGN KEY (playlist_id) REFERENCES Playlist(playlist_id) ON DELETE CASCADE,
    CONSTRAINT fk_pt_track    FOREIGN KEY (track_id)    REFERENCES Track(track_id)       ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO Users (name, email, password, role, bio) VALUES
('Admin User',  'admin@musiccollab.com', '$2b$12$demohashadmin',  'ADMIN',    'Platform administrator'),
('Alex Rivera', 'alex@example.com',      '$2b$12$demohashalex',   'PRODUCER', 'Electronic music producer based in LA'),
('Sam Jordan',  'sam@example.com',       '$2b$12$demohashsam',    'SINGER',   'R&B vocalist with 5 years experience'),
('Casey Bloom', 'casey@example.com',     '$2b$12$demohashcasey',  'LISTENER', 'Music enthusiast and playlist curator');

INSERT INTO Project (title, genre, description, status, created_by) VALUES
('Midnight Echoes',  'Electronic', 'A dark ambient electronic project exploring urban nightscapes.', 'ACTIVE',    2),
('Soul Revival',     'R&B',        'Bringing classic soul sounds into the modern era.',              'ACTIVE',    3),
('Frequency Dreams', 'Lo-fi',      'Chill lo-fi beats for studying and late night sessions.',        'COMPLETED', 2);

INSERT INTO Collaboration (user_id, project_id, role_in_project) VALUES
(3, 1, 'Lead Vocalist'),
(2, 2, 'Beat Producer'),
(4, 3, 'Listener/Feedback');


