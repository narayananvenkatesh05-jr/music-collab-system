# 🎵 Music Collaboration System

A full-stack web platform where musicians, singers, producers, and listeners can collaborate on music projects, upload tracks, review projects, and manage playlists.

---

## 🗂 Folder Structure

```
music-collab-system/
│
├── app.py                  ← Flask application (all routes & logic)
├── database.sql            ← MySQL schema + seed data
├── requirements.txt        ← Python dependencies
├── README.md               ← This file
│
├── templates/
│   ├── base.html           ← Layout with sidebar + topbar
│   ├── index.html          ← Landing page
│   ├── login.html          ← Login page
│   ├── register.html       ← Registration page
│   ├── dashboard.html      ← User dashboard
│   ├── projects.html       ← Browse all projects
│   ├── project_detail.html ← Single project view
│   ├── create_project.html ← Create project form
│   ├── upload_track.html   ← Upload track form
│   ├── collaborate.html    ← Join projects page
│   ├── reviews.html        ← Write & view reviews
│   └── playlists.html      ← Create & view playlists
│
├── static/
│   ├── css/
│   │   └── style.css       ← Full dark-theme stylesheet
│   └── js/
│       └── script.js       ← Frontend interactivity
│
└── uploads/                ← Uploaded audio files (auto-created)
```

---

## ⚙️ Prerequisites

- **Python 3.9+**
- **MySQL 8.0+** (or MariaDB 10.5+)
- **pip** (Python package manager)

---

## 🚀 Setup Instructions

### Step 1 — Clone / Download the project

```bash
cd music-collab-system
```

### Step 2 — Create a Python virtual environment

```bash
# Create venv
python -m venv venv

# Activate it
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### Step 3 — Install Python dependencies

```bash
pip install -r requirements.txt
```

> **Note for macOS users:** If `mysqlclient` fails to install, try:
> ```bash
> brew install mysql-client pkg-config
> export PKG_CONFIG_PATH="/opt/homebrew/opt/mysql-client/lib/pkgconfig"
> pip install mysqlclient
> ```
>
> **Note for Linux users:** Install the MySQL dev headers first:
> ```bash
> sudo apt-get install libmysqlclient-dev python3-dev
> ```

### Step 4 — Set up the MySQL database

Open your MySQL client and run:

```bash
mysql -u root -p < database.sql
```

Or manually in MySQL shell:

```sql
source /full/path/to/music-collab-system/database.sql;
```

This creates:
- Database: `music_collab_db`
- All 7 tables with foreign keys
- 4 demo users and 3 demo projects

### Step 5 — Configure database connection

Option A — Edit `app.py` directly (lines 18-22):

```python
app.config['MYSQL_HOST']     = 'localhost'
app.config['MYSQL_USER']     = 'root'
app.config['MYSQL_PASSWORD'] = 'your_password_here'
app.config['MYSQL_DB']       = 'music_collab_db'
```

Option B — Use environment variables (recommended):

```bash
export MYSQL_HOST=localhost
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export MYSQL_DB=music_collab_db
export SECRET_KEY=your-secret-key-here
```

### Step 6 — Run the application

```bash
python app.py
```

The app will start at: **http://localhost:5000**

---

## 🌐 Application Pages

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/register` | Create account |
| `/login` | Sign in |
| `/dashboard` | User dashboard |
| `/projects` | Browse all projects |
| `/projects/<id>` | Project detail (tracks, collabs, reviews) |
| `/projects/create` | Create new project |
| `/tracks/upload` | Upload audio track |
| `/collaborate` | Browse & join projects |
| `/reviews` | Write & view reviews |
| `/playlists` | Manage playlists |
| `/api/search?q=` | JSON search API |

---

## 👤 User Roles

| Role | Description |
|------|-------------|
| **SINGER** | Vocalists who upload vocal tracks |
| **PRODUCER** | Beat makers and track producers |
| **LISTENER** | Music enthusiasts and curators |
| **ADMIN** | Platform administrators |

---

## 🎵 Key Features

1. **Authentication** — Register/login with hashed passwords (Werkzeug)
2. **Projects** — Create, browse, and manage music projects with genre tags
3. **Track Upload** — Upload MP3/WAV/FLAC/AAC/OGG/M4A up to 50MB
4. **Version Control** — Automatic File_Version entry created on upload
5. **Collaboration** — Join projects with a declared role
6. **Reviews** — 1–5 star ratings with written feedback
7. **Playlists** — Create named playlists with descriptions
8. **Live Search** — Real-time AJAX search for projects and users
9. **Mini Player** — Click any track row to play audio in-browser
10. **Dark UI** — Spotify-inspired dark theme with smooth animations

---

## 🗄 Database Schema

```
Users           → user_id, name, email, password, role, bio
Project         → project_id, title, genre, description, status, created_by
Track           → track_id, project_id, uploaded_by, track_type, file_url, duration
Collaboration   → collaboration_id, user_id, project_id, role_in_project, joined_at
File_Version    → version_id, track_id, version_number, name, changes_description
Review          → review_id, project_id, reviewer_id, rating, feedback
Playlist        → playlist_id, user_id, name, description
Playlist_Track  → playlist_id, track_id (junction table)
```

---

## 🔧 Troubleshooting

**`ModuleNotFoundError: No module named 'MySQLdb'`**
→ Run: `pip install mysqlclient`

**`flask.cli.NoAppException`**
→ Make sure you're in the `music-collab-system` directory when running `python app.py`

**MySQL connection refused**
→ Check that MySQL is running: `sudo service mysql start` (Linux) or start MySQL from System Preferences (macOS)

**File uploads not working**
→ The `uploads/` folder is created automatically. Check write permissions if issues persist.

---

## 📦 Dependencies

```
Flask==3.0.3           — Web framework
Flask-MySQLdb==2.0.0   — MySQL integration for Flask
Werkzeug==3.0.3        — Password hashing, file utilities
mysqlclient==2.2.4     — MySQL C driver for Python
python-dotenv==1.0.1   — Environment variable loading
```

---

## 🎨 Tech Choices

- **Dark theme** inspired by Spotify and modern music platforms
- **Syne + DM Sans** fonts for a distinctive editorial feel
- **CSS custom properties** for consistent theming throughout
- **Vanilla JS** — no framework dependency for frontend interactivity
- **Jinja2** templates with a shared `base.html` layout
- **Flask sessions** for lightweight authentication

---

*Built with ❤️ for musicians everywhere.*
