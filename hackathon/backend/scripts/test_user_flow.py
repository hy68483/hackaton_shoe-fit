import urllib.request
import json
from pathlib import Path

def test_flow(image_path_str: str | None = None):
    base_url = 'http://127.0.0.1:8000/api/v1'

    # 1. Signup / Login
    signup_data = json.dumps({'login_id': 'test_user_flow_2', 'password': 'password123', 'name': 'Tester'}).encode()
    req = urllib.request.Request(f'{base_url}/auth/signup', data=signup_data, headers={'Content-Type': 'application/json'})
    try:
        urllib.request.urlopen(req)
    except Exception:
        pass

    login_data = json.dumps({'login_id': 'test_user_flow_2', 'password': 'password123'}).encode()
    req = urllib.request.Request(f'{base_url}/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
    res = json.loads(urllib.request.urlopen(req).read())
    token = res['data']['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # 2. Create Consent
    req = urllib.request.Request(
        f'{base_url}/consents',
        data=json.dumps({'measurement_data': True, 'image_storage': True, 'policy_version': '2026-08-18'}).encode(),
        headers={'Content-Type': 'application/json', **headers}
    )
    consent = json.loads(urllib.request.urlopen(req).read())['data']

    # 3. Create Session
    req = urllib.request.Request(
        f'{base_url}/measurements/sessions',
        data=json.dumps({'consent_id': consent['id']}).encode(),
        headers={'Content-Type': 'application/json', **headers}
    )
    session = json.loads(urllib.request.urlopen(req).read())['data']
    session_id = session['session_id']
    print('Session created:', session_id)

    # 4. Upload Image
    if image_path_str:
        image_path = Path(image_path_str)
    else:
        image_path = Path('output/measurements/7e741b96-f217-4907-a153-68bf5506da8d/993845d2-3f41-4ec6-bd8c-c755a21364ec.jpg')
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = bytearray()
    
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="client_width"\r\n\r\n3000\r\n'.encode())
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="client_height"\r\n\r\n4000\r\n'.encode())
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="device_orientation"\r\n\r\nportrait\r\n'.encode())
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="foot.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode())
    body.extend(image_path.read_bytes())
    body.extend(f'\r\n--{boundary}--\r\n'.encode())

    req = urllib.request.Request(
        f'{base_url}/measurements/sessions/{session_id}/image',
        data=bytes(body),
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}', **headers}
    )
    upload_res = json.loads(urllib.request.urlopen(req).read())
    print('Upload res:', upload_res)

    # 5. Validate Image
    req = urllib.request.Request(
        f'{base_url}/measurements/sessions/{session_id}/validate',
        data=b'{}',
        headers={'Content-Type': 'application/json', **headers}
    )
    val_res = json.loads(urllib.request.urlopen(req).read())
    print('Validate res:', val_res)

    # 6. Analyze Image
    req = urllib.request.Request(
        f'{base_url}/measurements/sessions/{session_id}/analyze',
        data=json.dumps({'point_x': 1500, 'point_y': 2000}).encode(),
        headers={'Content-Type': 'application/json', **headers}
    )
    analyze_res = json.loads(urllib.request.urlopen(req).read())
    print('Analyze res:', analyze_res)

if __name__ == '__main__':
    import sys
    img_arg = sys.argv[1] if len(sys.argv) > 1 else None
    test_flow(img_arg)
