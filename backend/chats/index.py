"""
Управление чатами Сквад: список чатов, создание, получение/отправка сообщений.
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

    # GET /list — список чатов пользователя
    if method == 'GET' and '/list' in path:
        cur.execute(f"""
            SELECT
                c.id, c.type, c.name,
                other_u.id, other_u.display_name, other_u.avatar_color, other_u.status,
                (SELECT content FROM "{schema}".squad_messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_msg,
                (SELECT created_at FROM "{schema}".squad_messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_time,
                (SELECT COUNT(*) FROM "{schema}".squad_messages WHERE chat_id = c.id AND sender_id != %s AND created_at > COALESCE((SELECT last_read FROM "{schema}".squad_chat_members WHERE chat_id = c.id AND user_id = %s), '1970-01-01'::timestamp)) as unread
            FROM "{schema}".squad_chats c
            JOIN "{schema}".squad_chat_members cm ON cm.chat_id = c.id AND cm.user_id = %s
            LEFT JOIN "{schema}".squad_chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id != %s AND c.type = 'direct'
            LEFT JOIN "{schema}".squad_users other_u ON other_u.id = cm2.user_id
            ORDER BY last_time DESC NULLS LAST
        """, (user['id'], user['id'], user['id'], user['id']))

        chats = []
        for row in cur.fetchall():
            chat_name = row[5] if row[2] is None else row[2]
            chats.append({
                'id': row[0],
                'type': row[1],
                'name': row[4] if row[4] else row[2],
                'avatar_color': row[5],
                'other_user_id': row[3],
                'other_user_status': row[6],
                'last_message': row[7],
                'last_time': row[8].isoformat() if row[8] else None,
                'unread': int(row[9]) if row[9] else 0,
            })
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'chats': chats})}

    # GET /messages?chat_id=X — сообщения чата
    if method == 'GET' and '/messages' in path:
        chat_id = params.get('chat_id')
        if not chat_id:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'chat_id required'})}

        cur.execute(f'SELECT 1 FROM "{schema}".squad_chat_members WHERE chat_id = %s AND user_id = %s', (chat_id, user['id']))
        if not cur.fetchone():
            return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}

        cur.execute(f"""
            SELECT m.id, m.sender_id, u.display_name, u.avatar_color, m.content, m.created_at, m.encrypted
            FROM "{schema}".squad_messages m
            JOIN "{schema}".squad_users u ON u.id = m.sender_id
            WHERE m.chat_id = %s
            ORDER BY m.created_at ASC
            LIMIT 100
        """, (chat_id,))

        messages = []
        for row in cur.fetchall():
            messages.append({
                'id': row[0],
                'sender_id': row[1],
                'sender_name': row[2],
                'sender_color': row[3],
                'content': row[4],
                'created_at': row[5].isoformat(),
                'encrypted': row[6],
                'is_own': row[1] == user['id'],
            })
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'messages': messages})}

    # POST /send — отправить сообщение
    if method == 'POST' and '/send' in path:
        chat_id = body.get('chat_id')
        content = body.get('content', '').strip()
        if not chat_id or not content:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'chat_id и content обязательны'})}

        cur.execute(f'SELECT 1 FROM "{schema}".squad_chat_members WHERE chat_id = %s AND user_id = %s', (chat_id, user['id']))
        if not cur.fetchone():
            return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}

        cur.execute(
            f'INSERT INTO "{schema}".squad_messages (chat_id, sender_id, content, encrypted) VALUES (%s, %s, %s, TRUE) RETURNING id, created_at',
            (chat_id, user['id'], content)
        )
        msg_id, created_at = cur.fetchone()
        conn.commit()

        return {
            'statusCode': 200, 'headers': CORS,
            'body': json.dumps({
                'message': {
                    'id': msg_id,
                    'sender_id': user['id'],
                    'sender_name': user['display_name'],
                    'sender_color': user['avatar_color'],
                    'content': content,
                    'created_at': created_at.isoformat(),
                    'encrypted': True,
                    'is_own': True,
                }
            })
        }

    # POST /create — создать чат (direct или group)
    if method == 'POST' and '/create' in path:
        chat_type = body.get('type', 'direct')
        other_user_id = body.get('user_id')
        name = body.get('name', '')

        if chat_type == 'direct' and other_user_id:
            cur.execute(f"""
                SELECT c.id FROM "{schema}".squad_chats c
                JOIN "{schema}".squad_chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = %s
                JOIN "{schema}".squad_chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = %s
                WHERE c.type = 'direct'
                LIMIT 1
            """, (user['id'], other_user_id))
            existing = cur.fetchone()
            if existing:
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'chat_id': existing[0]})}

            cur.execute(f"INSERT INTO \"{schema}\".squad_chats (type, created_by) VALUES ('direct', %s) RETURNING id", (user['id'],))
            chat_id = cur.fetchone()[0]
            cur.execute(f'INSERT INTO "{schema}".squad_chat_members (chat_id, user_id) VALUES (%s, %s)', (chat_id, user['id']))
            cur.execute(f'INSERT INTO "{schema}".squad_chat_members (chat_id, user_id) VALUES (%s, %s)', (chat_id, other_user_id))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'chat_id': chat_id})}

        if chat_type == 'group' and name:
            cur.execute(f"INSERT INTO \"{schema}\".squad_chats (type, name, created_by) VALUES ('group', %s, %s) RETURNING id", (name, user['id']))
            chat_id = cur.fetchone()[0]
            cur.execute(f'INSERT INTO "{schema}".squad_chat_members (chat_id, user_id) VALUES (%s, %s)', (chat_id, user['id']))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'chat_id': chat_id})}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неверные параметры'})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}