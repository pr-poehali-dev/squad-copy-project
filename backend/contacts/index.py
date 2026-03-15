"""
Управление контактами Сквад: список, добавление, поиск пользователей.
"""
import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_user_by_token(cur, token: str, schema: str = 'public'):
    cur.execute(f"""
        SELECT u.id, u.username, u.display_name, u.avatar_color, u.status
        FROM "{schema}".squad_sessions s
        JOIN "{schema}".squad_users u ON u.id = s.user_id
        WHERE s.token = %s AND s.expires_at > NOW()
    """, (token,))
    row = cur.fetchone()
    if not row:
        return None
    return {'id': row[0], 'username': row[1], 'display_name': row[2], 'avatar_color': row[3], 'status': row[4]}


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token', '')

    conn = get_conn()
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    cur = conn.cursor()

    user = get_user_by_token(cur, token, schema)
    if not user:
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

    # GET /list — список контактов
    if method == 'GET' and '/list' in path:
        cur.execute(f"""
            SELECT u.id, u.username, u.display_name, u.avatar_color, u.status, u.status_text
            FROM "{schema}".squad_contacts c
            JOIN "{schema}".squad_users u ON u.id = c.contact_id
            WHERE c.user_id = %s
            ORDER BY u.display_name
        """, (user['id'],))
        contacts = []
        for row in cur.fetchall():
            contacts.append({
                'id': row[0], 'username': row[1], 'display_name': row[2],
                'avatar_color': row[3], 'status': row[4], 'status_text': row[5],
            })
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'contacts': contacts})}

    # GET /search?q=... — поиск пользователей
    if method == 'GET' and '/search' in path:
        q = params.get('q', '').strip()
        if len(q) < 2:
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': []})}

        cur.execute(f"""
            SELECT u.id, u.username, u.display_name, u.avatar_color, u.status,
                   EXISTS(SELECT 1 FROM "{schema}".squad_contacts WHERE user_id = %s AND contact_id = u.id) as is_contact
            FROM "{schema}".squad_users u
            WHERE u.id != %s AND (u.username ILIKE %s OR u.display_name ILIKE %s)
            LIMIT 20
        """, (user['id'], user['id'], f'%{q}%', f'%{q}%'))

        users = []
        for row in cur.fetchall():
            users.append({
                'id': row[0], 'username': row[1], 'display_name': row[2],
                'avatar_color': row[3], 'status': row[4], 'is_contact': row[5],
            })
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': users})}

    # POST /add — добавить контакт
    if method == 'POST' and '/add' in path:
        contact_id = body.get('user_id')
        if not contact_id or contact_id == user['id']:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неверный пользователь'})}

        cur.execute(f'SELECT id FROM "{schema}".squad_users WHERE id = %s', (contact_id,))
        if not cur.fetchone():
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Пользователь не найден'})}

        cur.execute(f'SELECT id FROM "{schema}".squad_contacts WHERE user_id = %s AND contact_id = %s', (user['id'], contact_id))
        if cur.fetchone():
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'already': True})}

        cur.execute(f'INSERT INTO "{schema}".squad_contacts (user_id, contact_id) VALUES (%s, %s)', (user['id'], contact_id))
        cur.execute(f'INSERT INTO "{schema}".squad_contacts (user_id, contact_id) VALUES (%s, %s) ON CONFLICT DO NOTHING', (contact_id, user['id']))
        conn.commit()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}