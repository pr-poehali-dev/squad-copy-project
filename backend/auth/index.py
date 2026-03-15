"""
Аутентификация пользователей Сквад: регистрация, вход, выход, проверка сессии.
"""
import json
import os
import hashlib
import secrets
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def get_user_by_token(conn, token: str):
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    cur = conn.cursor()
    cur.execute(f"""
        SELECT u.id, u.username, u.display_name, u.email, u.avatar_color, u.status, u.bio, u.status_text
        FROM "{schema}".squad_sessions s
        JOIN "{schema}".squad_users u ON u.id = s.user_id
        WHERE s.token = %s AND s.expires_at > NOW()
    """, (token,))
    row = cur.fetchone()
    if not row:
        return None
    return {
        'id': row[0], 'username': row[1], 'display_name': row[2],
        'email': row[3], 'avatar_color': row[4], 'status': row[5],
        'bio': row[6], 'status_text': row[7]
    }


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token', '')

    conn = get_conn()
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    cur = conn.cursor()

    # POST /register
    if method == 'POST' and '/register' in path:
        username = body.get('username', '').strip().lower()
        display_name = body.get('display_name', '').strip()
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')

        if not all([username, display_name, email, password]):
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
        if len(password) < 6:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Пароль минимум 6 символов'})}
        if len(username) < 3:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Имя пользователя минимум 3 символа'})}

        colors = ['#4C8FE8', '#6D5BD0', '#E85C8A', '#E8A83C', '#3CB87A', '#E85C4A', '#8F4CE8']
        color = colors[ord(username[0]) % len(colors)]
        pw_hash = hash_password(password)

        cur.execute(f'SELECT id FROM "{schema}".squad_users WHERE username = %s OR email = %s', (username, email))
        if cur.fetchone():
            return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Пользователь уже существует'})}

        cur.execute(
            f'INSERT INTO "{schema}".squad_users (username, display_name, email, password_hash, avatar_color) VALUES (%s, %s, %s, %s, %s) RETURNING id',
            (username, display_name, email, pw_hash, color)
        )
        user_id = cur.fetchone()[0]
        new_token = secrets.token_hex(32)
        cur.execute(f'INSERT INTO "{schema}".squad_sessions (user_id, token) VALUES (%s, %s)', (user_id, new_token))
        cur.execute(f"UPDATE \"{schema}\".squad_users SET status = 'online' WHERE id = %s", (user_id,))
        conn.commit()

        return {
            'statusCode': 200, 'headers': CORS,
            'body': json.dumps({
                'token': new_token,
                'user': {'id': user_id, 'username': username, 'display_name': display_name,
                         'email': email, 'avatar_color': color, 'status': 'online', 'bio': '', 'status_text': ''}
            })
        }

    # POST /login
    if method == 'POST' and '/login' in path:
        login = body.get('login', '').strip().lower()
        password = body.get('password', '')
        pw_hash = hash_password(password)

        cur.execute(
            f'SELECT id, username, display_name, email, avatar_color, status, bio, status_text FROM "{schema}".squad_users WHERE (username = %s OR email = %s) AND password_hash = %s',
            (login, login, pw_hash)
        )
        row = cur.fetchone()
        if not row:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный логин или пароль'})}

        user_id = row[0]
        new_token = secrets.token_hex(32)
        cur.execute(f'INSERT INTO "{schema}".squad_sessions (user_id, token) VALUES (%s, %s)', (user_id, new_token))
        cur.execute(f"UPDATE \"{schema}\".squad_users SET status = 'online', last_seen_at = NOW() WHERE id = %s", (user_id,))
        conn.commit()

        return {
            'statusCode': 200, 'headers': CORS,
            'body': json.dumps({
                'token': new_token,
                'user': {'id': row[0], 'username': row[1], 'display_name': row[2],
                         'email': row[3], 'avatar_color': row[4], 'status': 'online',
                         'bio': row[6], 'status_text': row[7]}
            })
        }

    # POST /logout
    if method == 'POST' and '/logout' in path:
        if token:
            cur.execute(f'UPDATE "{schema}".squad_users SET status = \'offline\' WHERE id = (SELECT user_id FROM "{schema}".squad_sessions WHERE token = %s)', (token,))
            cur.execute(f'UPDATE "{schema}".squad_sessions SET expires_at = NOW() WHERE token = %s', (token,))
            conn.commit()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    # GET /me
    if method == 'GET' and '/me' in path:
        user = get_user_by_token(conn, token)
        if not user:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

    # PUT /status
    if method == 'PUT' and '/status' in path:
        user = get_user_by_token(conn, token)
        if not user:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
        new_status = body.get('status', 'online')
        cur.execute(f'UPDATE "{schema}".squad_users SET status = %s WHERE id = %s', (new_status, user['id']))
        conn.commit()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    # PUT /profile
    if method == 'PUT' and '/profile' in path:
        user = get_user_by_token(conn, token)
        if not user:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
        display_name = body.get('display_name', user['display_name'])
        bio = body.get('bio', user['bio'])
        status_text = body.get('status_text', user['status_text'])
        cur.execute(
            f'UPDATE "{schema}".squad_users SET display_name = %s, bio = %s, status_text = %s WHERE id = %s',
            (display_name, bio, status_text, user['id'])
        )
        conn.commit()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}