"""
Music Collaboration System
"""
import os
import uuid
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_mysqldb import MySQL
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'music-collab-secret-2024')
app.config['MYSQL_HOST']        = os.environ.get('MYSQL_HOST',     'mysql.railway.internal')
app.config['MYSQL_USER']        = os.environ.get('MYSQL_USER',     'root')
app.config['MYSQL_PASSWORD']    = os.environ.get('MYSQL_PASSWORD', 'LiMwLHzBWiWzhJPDlYkAPJjHuwCelqEm')
app.config['MYSQL_DB']          = os.environ.get('MYSQL_DB',       'railway')
app.config['MYSQL_PORT']        = int(os.environ.get('MYSQL_PORT',  3306))
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTS  = {'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'}
app.config['UPLOAD_FOLDER']      = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

mysql = MySQL(app)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTS

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

def get_user(user_id):
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM Users WHERE user_id = %s", (user_id,))
    user = cur.fetchone()
    cur.close()
    return user

@app.context_processor
def inject_user():
    user = None
    if 'user_id' in session:
        user = get_user(session['user_id'])
    return {'current_user': user}

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name     = request.form.get('name', '').strip()
        email    = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        role     = request.form.get('role', 'LISTENER')
        bio      = request.form.get('bio', '').strip()
        if not all([name, email, password]):
            flash('Name, email, and password are required.', 'danger')
            return render_template('register.html')
        hashed = generate_password_hash(password)
        try:
            cur = mysql.connection.cursor()
            cur.execute("INSERT INTO Users (name, email, password, role, bio) VALUES (%s,%s,%s,%s,%s)",
                        (name, email, hashed, role, bio))
            mysql.connection.commit()
            cur.close()
            flash('Account created! Please log in.', 'success')
            return redirect(url_for('login'))
        except Exception:
            flash('Email already registered or database error.', 'danger')
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email    = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM Users WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()
        if user and check_password_hash(user['password'], password):
            session['user_id']   = user['user_id']
            session['user_name'] = user['name']
            session['user_role'] = user['role']
            flash(f"Welcome back, {user['name']}!", 'success')
            return redirect(url_for('dashboard'))
        flash('Invalid email or password.', 'danger')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    uid = session['user_id']
    cur = mysql.connection.cursor()
    cur.execute("""SELECT p.*, u.name AS creator_name,
               (SELECT COUNT(*) FROM Track WHERE project_id = p.project_id) AS track_count
        FROM Project p JOIN Users u ON u.user_id = p.created_by
        WHERE p.created_by = %s ORDER BY p.created_at DESC""", (uid,))
    my_projects = cur.fetchall()
    cur.execute("""SELECT p.*, u.name AS creator_name, c.role_in_project,
               (SELECT COUNT(*) FROM Track WHERE project_id = p.project_id) AS track_count
        FROM Collaboration c
        JOIN Project p ON p.project_id = c.project_id
        JOIN Users u ON u.user_id = p.created_by
        WHERE c.user_id = %s ORDER BY c.joined_at DESC""", (uid,))
    collab_projects = cur.fetchall()
    cur.execute("SELECT * FROM Playlist WHERE user_id = %s ORDER BY created_at DESC LIMIT 5", (uid,))
    playlists = cur.fetchall()
    cur.execute("""SELECT t.*, p.title AS project_title, u.name AS uploader_name
        FROM Track t
        JOIN Project p ON p.project_id = t.project_id
        JOIN Users u ON u.user_id = t.uploaded_by
        WHERE p.created_by = %s OR t.uploaded_by = %s
        ORDER BY t.uploaded_at DESC LIMIT 8""", (uid, uid))
    recent_tracks = cur.fetchall()
    cur.close()
    return render_template('dashboard.html', my_projects=my_projects,
                           collab_projects=collab_projects, playlists=playlists,
                           recent_tracks=recent_tracks)

@app.route('/projects/create', methods=['GET', 'POST'])
@login_required
def create_project():
    if request.method == 'POST':
        title       = request.form.get('title', '').strip()
        genre       = request.form.get('genre', '').strip()
        description = request.form.get('description', '').strip()
        status      = request.form.get('status', 'ACTIVE')
        if not title:
            flash('Project title is required.', 'danger')
            return render_template('create_project.html')
        cur = mysql.connection.cursor()
        cur.execute("INSERT INTO Project (title, genre, description, status, created_by) VALUES (%s,%s,%s,%s,%s)",
                    (title, genre, description, status, session['user_id']))
        mysql.connection.commit()
        project_id = cur.lastrowid
        cur.close()
        flash(f'Project "{title}" created successfully!', 'success')
        return redirect(url_for('project_detail', project_id=project_id))
    return render_template('create_project.html')

@app.route('/projects/<int:project_id>')
@login_required
def project_detail(project_id):
    cur = mysql.connection.cursor()
    cur.execute("""SELECT p.*, u.name AS creator_name, u.role AS creator_role
        FROM Project p JOIN Users u ON u.user_id = p.created_by
        WHERE p.project_id = %s""", (project_id,))
    project = cur.fetchone()
    if not project:
        flash('Project not found.', 'danger')
        return redirect(url_for('dashboard'))
    cur.execute("""SELECT t.*, u.name AS uploader_name
        FROM Track t JOIN Users u ON u.user_id = t.uploaded_by
        WHERE t.project_id = %s ORDER BY t.uploaded_at DESC""", (project_id,))
    tracks = cur.fetchall()
    cur.execute("""SELECT c.*, u.name, u.role
        FROM Collaboration c JOIN Users u ON u.user_id = c.user_id
        WHERE c.project_id = %s ORDER BY c.joined_at""", (project_id,))
    collaborators = cur.fetchall()
    cur.execute("""SELECT r.*, u.name AS reviewer_name
        FROM Review r JOIN Users u ON u.user_id = r.reviewer_id
        WHERE r.project_id = %s ORDER BY r.created_at DESC""", (project_id,))
    reviews = cur.fetchall()
    cur.execute("SELECT AVG(rating) AS avg_rating, COUNT(*) AS total FROM Review WHERE project_id = %s", (project_id,))
    rating_info = cur.fetchone()
    cur.execute("SELECT 1 FROM Collaboration WHERE user_id=%s AND project_id=%s", (session['user_id'], project_id))
    is_collaborator = cur.fetchone() is not None
    cur.close()
    return render_template('project_detail.html', project=project, tracks=tracks,
                           collaborators=collaborators, reviews=reviews,
                           rating_info=rating_info, is_collaborator=is_collaborator)

@app.route('/projects')
@login_required
def projects():
    search = request.args.get('q', '').strip()
    genre  = request.args.get('genre', '').strip()
    cur    = mysql.connection.cursor()
    query  = """SELECT p.*, u.name AS creator_name,
               (SELECT COUNT(*) FROM Track WHERE project_id = p.project_id) AS track_count,
               (SELECT AVG(rating) FROM Review WHERE project_id = p.project_id) AS avg_rating
        FROM Project p JOIN Users u ON u.user_id = p.created_by WHERE 1=1"""
    params = []
    if search:
        query += " AND (p.title LIKE %s OR p.description LIKE %s)"
        params += [f'%{search}%', f'%{search}%']
    if genre:
        query += " AND p.genre = %s"
        params.append(genre)
    query += " ORDER BY p.created_at DESC"
    cur.execute(query, params)
    all_projects = cur.fetchall()
    cur.execute("SELECT DISTINCT genre FROM Project WHERE genre IS NOT NULL AND genre != '' ORDER BY genre")
    genres = [r['genre'] for r in cur.fetchall()]
    cur.close()
    return render_template('projects.html', projects=all_projects, genres=genres,
                           search=search, selected_genre=genre)

@app.route('/tracks/upload', methods=['GET', 'POST'])
@login_required
def upload_track():
    cur = mysql.connection.cursor()
    uid = session['user_id']
    cur.execute("""SELECT p.* FROM Project p WHERE p.created_by = %s
        UNION
        SELECT p.* FROM Project p
        JOIN Collaboration c ON c.project_id = p.project_id
        WHERE c.user_id = %s ORDER BY title""", (uid, uid))
    accessible_projects = cur.fetchall()
    if request.method == 'POST':
        project_id = request.form.get('project_id')
        track_type = request.form.get('track_type', 'OTHER')
        duration   = request.form.get('duration', 0) or 0
        file       = request.files.get('track_file')
        if not project_id or not file or file.filename == '':
            flash('Project and track file are required.', 'danger')
            return render_template('upload_track.html', projects=accessible_projects)
        if not allowed_file(file.filename):
            flash('Unsupported file type.', 'danger')
            return render_template('upload_track.html', projects=accessible_projects)
        ext      = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        file_url = f"/uploads/{filename}"
        cur.execute("INSERT INTO Track (project_id, uploaded_by, track_type, file_url, duration) VALUES (%s,%s,%s,%s,%s)",
                    (project_id, uid, track_type, file_url, int(duration)))
        mysql.connection.commit()
        track_id = cur.lastrowid
        cur.execute("INSERT INTO File_Version (track_id, version_number, name, changes_description) VALUES (%s,1,%s,%s)",
                    (track_id, secure_filename(file.filename), 'Initial upload'))
        mysql.connection.commit()
        cur.close()
        flash('Track uploaded successfully!', 'success')
        return redirect(url_for('project_detail', project_id=project_id))
    cur.close()
    return render_template('upload_track.html', projects=accessible_projects)

@app.route('/collaborate', methods=['GET', 'POST'])
@login_required
def collaborate():
    uid = session['user_id']
    cur = mysql.connection.cursor()
    if request.method == 'POST':
        project_id      = request.form.get('project_id')
        role_in_project = request.form.get('role_in_project', '').strip()
        if not project_id:
            flash('Please select a project.', 'danger')
        else:
            try:
                cur.execute("INSERT INTO Collaboration (user_id, project_id, role_in_project) VALUES (%s,%s,%s)",
                            (uid, project_id, role_in_project))
                mysql.connection.commit()
                flash('You have joined the project!', 'success')
                return redirect(url_for('project_detail', project_id=project_id))
            except Exception:
                flash('You are already collaborating on this project.', 'warning')
    cur.execute("""SELECT p.*, u.name AS creator_name
        FROM Project p JOIN Users u ON u.user_id = p.created_by
        WHERE p.created_by != %s
        AND p.project_id NOT IN (SELECT project_id FROM Collaboration WHERE user_id = %s)
        AND p.status = 'ACTIVE' ORDER BY p.created_at DESC""", (uid, uid))
    available_projects = cur.fetchall()
    cur.close()
    return render_template('collaborate.html', projects=available_projects)

@app.route('/reviews', methods=['GET', 'POST'])
@login_required
def reviews():
    uid = session['user_id']
    cur = mysql.connection.cursor()
    if request.method == 'POST':
        project_id = request.form.get('project_id')
        rating     = request.form.get('rating')
        feedback   = request.form.get('feedback', '').strip()
        if not project_id or not rating:
            flash('Project and rating are required.', 'danger')
        else:
            try:
                cur.execute("INSERT INTO Review (project_id, reviewer_id, rating, feedback) VALUES (%s,%s,%s,%s)",
                            (project_id, uid, int(rating), feedback))
                mysql.connection.commit()
                flash('Review submitted!', 'success')
                return redirect(url_for('project_detail', project_id=project_id))
            except Exception:
                flash('Error submitting review.', 'danger')
    cur.execute("SELECT p.*, u.name AS creator_name FROM Project p JOIN Users u ON u.user_id = p.created_by ORDER BY p.title")
    all_projects = cur.fetchall()
    cur.execute("""SELECT r.*, p.title AS project_title, u.name AS reviewer_name
        FROM Review r
        JOIN Project p ON p.project_id = r.project_id
        JOIN Users u ON u.user_id = r.reviewer_id
        ORDER BY r.created_at DESC LIMIT 20""")
    recent_reviews = cur.fetchall()
    cur.close()
    return render_template('reviews.html', projects=all_projects, recent_reviews=recent_reviews)

@app.route('/playlists', methods=['GET', 'POST'])
@login_required
def playlists():
    uid = session['user_id']
    cur = mysql.connection.cursor()
    if request.method == 'POST':
        name        = request.form.get('name', '').strip()
        description = request.form.get('description', '').strip()
        if not name:
            flash('Playlist name is required.', 'danger')
        else:
            cur.execute("INSERT INTO Playlist (user_id, name, description) VALUES (%s,%s,%s)",
                        (uid, name, description))
            mysql.connection.commit()
            flash(f'Playlist "{name}" created!', 'success')
            return redirect(url_for('playlists'))
    cur.execute("""SELECT pl.*, u.name AS owner_name,
               (SELECT COUNT(*) FROM Playlist_Track WHERE playlist_id = pl.playlist_id) AS track_count
        FROM Playlist pl JOIN Users u ON u.user_id = pl.user_id
        WHERE pl.user_id = %s ORDER BY pl.created_at DESC""", (uid,))
    user_playlists = cur.fetchall()
    cur.close()
    return render_template('playlists.html', playlists=user_playlists)

@app.route('/api/search')
@login_required
def api_search():
    q = request.args.get('q', '').strip()
    if len(q) < 2:
        return jsonify({'projects': [], 'users': []})
    cur = mysql.connection.cursor()
    cur.execute("SELECT project_id, title, genre FROM Project WHERE title LIKE %s LIMIT 5", (f'%{q}%',))
    projects = cur.fetchall()
    cur.execute("SELECT user_id, name, role FROM Users WHERE name LIKE %s LIMIT 5", (f'%{q}%',))
    users = cur.fetchall()
    cur.close()
    return jsonify({'projects': projects, 'users': users})

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    from flask import send_from_directory
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)