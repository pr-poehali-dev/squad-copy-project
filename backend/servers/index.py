"""
Управление серверами Сквад: список, создание, вступление, участники.
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

    # GET /list — мои серверы
    if method == 'GET' and '/list' in path:
        cur.execute(f"""
            SELECT s.id, s.name, s.description, s.abbreviation, s.color,
                   (SELECT COUNT(*) FROM "{schema}".squad_server_members WHERE server_id = s.id) as members,
                   (SELECT COUNT(*) FROM "{schema}".squad_server_members sm2 JOIN "{schema}".squad_users u2 ON u2.id = sm2.user_id WHERE sm2.server_id = s.id AND u2.status = 'online') as online_count,
                   sm.role
            FROM "{schema}".squad_servers s
            JOIN "{schema}".squad_server_members sm ON sm.server_id = s.id AND sm.user_id = %s
            ORDER BY s.created_at ASC
        """, (user['id'],))
        servers = []
        for row in cur.fetchall():
            servers.append({
                'id': row[0], 'name': row[1], 'description': row[2],
                'abbreviation': row[3], 'color': row[4],
                'members': int(row[5]), 'online': int(row[6]), 'role': row[7],
            })
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'servers': servers})}

    # GET /members?server_id=X — участники сервера
    if method == 'GET' and '/members' in path:
        server_id = params.get('server_id')
        cur.execute(f'SELECT 1 FROM "{schema}".squad_server_members WHERE server_id = %s AND user_id = %s', (server_id, user['id']))
        if not cur.fetchone():
            return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}

        cur.execute(f"""
            SELECT u.id, u.display_name, u.avatar_color, u.status, sm.role
            FROM "{schema}".squad_server_members sm
            JOIN "{schema}".squad_users u ON u.id = sm.user_id
            WHERE sm.server_id = %s
            ORDER BY u.display_name
        """, (server_id,))
        members = [{'id': r[0], 'display_name': r[1], 'avatar_color': r[2], 'status': r[3], 'role': r[4]} for r in cur.fetchall()]
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'members': members})}

    # POST /create — создать сервер
    if method == 'POST' and '/create' in path:
        name = body.get('name', '').strip()
        description = body.get('description', '').strip()
        color = body.get('color', '#4C8FE8')
        if not name:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Название обязательно'})}

        words = name.split()
        abbr = ''.join(w[0].upper() for w in words[:2]) if len(words) >= 2 else name[:2].upper()

        cur.execute(
            f'INSERT INTO "{schema}".squad_servers (name, description, abbreviation, color, owner_id) VALUES (%s, %s, %s, %s, %s) RETURNING id',
            (name, description, abbr, color, user['id'])
        )
        server_id = cur.fetchone()[0]
        cur.execute(f"INSERT INTO \"{schema}\".squad_server_members (server_id, user_id, role) VALUES (%s, %s, 'owner')", (server_id, user['id']))
        conn.commit()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'server_id': server_id, 'ok': True})}

    # POST /join — вступить на сервер
    if method == 'POST' and '/join' in path:
        server_id = body.get('server_id')
        cur.execute(f'SELECT id FROM "{schema}".squad_servers WHERE id = %s', (server_id,))
        if not cur.fetchone():
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Сервер не найден'})}

        cur.execute(f"INSERT INTO \"{schema}\".squad_server_members (server_id, user_id, role) VALUES (%s, %s, 'member') ON CONFLICT DO NOTHING", (server_id, user['id']))
        conn.commit()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}