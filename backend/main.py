import hashlib
import hmac
import json
import os
import secrets
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, Depends, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.responses import JSONResponse
from openai import AsyncOpenAI
from sqlalchemy import JSON, Column, Float, Integer, String, create_engine, select, text
from sqlalchemy.orm import declarative_base, sessionmaker
from .agent import SOURCES, assess, ai_configured
from .schemas import Credentials, Language, Message, Observation, Profile

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./astra.db')
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
if os.getenv('APP_ENV') == 'production':
    if not DATABASE_URL.startswith(('postgresql://', 'postgresql+psycopg://')):
        raise RuntimeError('Production requires PostgreSQL DATABASE_URL')
    if not os.getenv('BACKEND_PROXY_SECRET'):
        raise RuntimeError('Production requires BACKEND_PROXY_SECRET')
if DATABASE_URL.startswith('postgresql://'):
    DATABASE_URL = DATABASE_URL.replace('postgresql://', 'postgresql+psycopg://', 1)
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300, connect_args={'check_same_thread': False} if DATABASE_URL.startswith('sqlite') else {})
DB = sessionmaker(bind=engine, expire_on_commit=False)
Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    profile = Column(JSON, nullable=False)
    demo = Column(Integer, default=0)

class Session(Base):
    __tablename__ = 'sessions'
    token_hash = Column(String, primary_key=True)
    user_id = Column(String, nullable=False, index=True)
    expires = Column(Float, nullable=False)

class Record(Base):
    __tablename__ = 'records'
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False, index=True)
    kind = Column(String, nullable=False)
    payload = Column(JSON, nullable=False)
    created_at = Column(String, nullable=False)

@asynccontextmanager
async def lifespan(app):
    if os.getenv('APP_ENV') != 'production':
        Base.metadata.create_all(engine)
    yield

app = FastAPI(title='Astra Health Monitoring API', version='1.0.0', lifespan=lifespan)
limits = defaultdict(deque)

@app.middleware('http')
async def protections(request: Request, call_next):
    secret = os.getenv('BACKEND_PROXY_SECRET')
    if secret and request.url.path not in ('/health', '/ready'):
        if not hmac.compare_digest(request.headers.get('x-astra-proxy', ''), secret):
            return JSONResponse({'detail': 'Use the Astra frontend'}, status_code=403)
    if request.method != 'GET':
        bucket = (request.client.host if request.client else 'unknown', request.url.path)
        now = time.monotonic()
        attempts = limits[bucket]
        while attempts and attempts[0] < now-60:
            attempts.popleft()
        maximum = 10 if '/auth/' in request.url.path else 40
        if len(attempts) >= maximum:
            return JSONResponse({'detail': 'Too many requests. Try again shortly.'}, status_code=429)
        attempts.append(now)
        length = request.headers.get('content-length')
        try:
            oversized = length and int(length) > 11*1024*1024
        except ValueError:
            return JSONResponse({'detail': 'Invalid content length'}, status_code=400)
        if oversized:
            return JSONResponse({'detail': 'Request too large'}, status_code=413)
    response = await call_next(request)
    response.headers['Cache-Control'] = 'no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response

def db():
    with DB() as connection:
        yield connection

def current_user(request: Request, connection=Depends(db)):
    token = request.cookies.get('astra_session', '')
    row = connection.get(Session, hashlib.sha256(token.encode()).hexdigest())
    if not row or row.expires < time.time():
        raise HTTPException(401, 'Sign in to continue')
    user = connection.get(User, row.user_id)
    if user is None:
        raise HTTPException(401, 'Sign in to continue')
    return user

def hash_password(password):
    salt = secrets.token_hex(16)
    value = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 600000).hex()
    return salt+':'+value

def check_password(password, value):
    salt, digest = value.split(':')
    actual = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 600000).hex()
    return hmac.compare_digest(actual, digest)

def sign_in(user, response, connection):
    token = secrets.token_urlsafe(48)
    connection.add(Session(token_hash=hashlib.sha256(token.encode()).hexdigest(), user_id=user.id, expires=time.time()+604800))
    connection.commit()
    response.set_cookie('astra_session', token, max_age=604800, httponly=True, secure=os.getenv('COOKIE_SECURE') == 'true', samesite='lax', path='/')

def public_user(user):
    return {'id': user.id, 'email': user.email if not user.demo else '', 'profile': user.profile, 'demo': bool(user.demo)}

def add_record(connection, user_id, kind, payload, created_at=None):
    row = Record(id=secrets.token_hex(12), user_id=user_id, kind=kind, payload=payload, created_at=created_at or datetime.now(timezone.utc).isoformat())
    connection.add(row)
    connection.commit()
    return row

def serialize(row):
    return {'id': row.id, 'kind': row.kind, 'created_at': row.created_at, **row.payload}

def records(connection, user_id, kind=None, limit=200):
    query = select(Record).where(Record.user_id == user_id)
    if kind:
        query = query.where(Record.kind == kind)
    return connection.scalars(query.order_by(Record.created_at.desc()).limit(limit)).all()

@app.get('/health')
def health():
    return {'status': 'ok', 'ai_configured': ai_configured(), 'voice_configured': bool(os.getenv('OPENAI_API_KEY')), 'clinical_status': 'prototype'}

@app.get('/ready')
def ready(connection=Depends(db)):
    try:
        connection.execute(text('SELECT 1'))
        connection.execute(select(User.id).limit(1))
        return {'status': 'ready'}
    except Exception:
        return JSONResponse({'status': 'unavailable'}, status_code=503)

@app.post('/auth/register')
def register(body: Credentials, response: Response, connection=Depends(db)):
    if connection.scalar(select(User).where(User.email == body.email)):
        raise HTTPException(409, 'This email is already registered')
    user = User(id=secrets.token_hex(12), email=body.email, password_hash=hash_password(body.password), profile={'name': '', 'language': 'en', 'ai_consent': False})
    connection.add(user)
    try:
        connection.commit()
    except Exception:
        connection.rollback()
        raise HTTPException(409, 'Unable to register this account')
    sign_in(user, response, connection)
    return public_user(user)

@app.post('/auth/login')
def login(body: Credentials, response: Response, connection=Depends(db)):
    user = connection.scalar(select(User).where(User.email == body.email))
    if not user or not check_password(body.password, user.password_hash):
        raise HTTPException(401, 'Incorrect email or password')
    sign_in(user, response, connection)
    return public_user(user)

@app.post('/auth/demo')
def demo(response: Response, connection=Depends(db)):
    user = User(id=secrets.token_hex(12), email=secrets.token_hex(12)+'@demo.invalid', password_hash=hash_password(secrets.token_urlsafe(32)), demo=1,
        profile=Profile(name='Alex Morgan', age=32, mission='Orbital research · simulated mission', equipment='Pulse oximeter, thermometer, blood pressure monitor').model_dump())
    connection.add(user)
    connection.commit()
    now = datetime.now(timezone.utc)
    for day, heart, sleep in [(6,73,7.8),(5,70,7.3),(4,74,7.1),(3,72,7.6),(2,76,6.9),(1,71,7.4),(0,72,7.2)]:
        add_record(connection, user.id, 'observation', Observation(heart_rate=heart, spo2=98, temperature=36.7, systolic=118, diastolic=76, sleep_hours=sleep, mood='good', notes='Synthetic demonstration data').model_dump(), (now-timedelta(days=day)).isoformat())
    sign_in(user, response, connection)
    return public_user(user)

@app.post('/auth/logout')
def logout(request: Request, response: Response, connection=Depends(db)):
    row = connection.get(Session, hashlib.sha256(request.cookies.get('astra_session','').encode()).hexdigest())
    if row:
        connection.delete(row)
        connection.commit()
    response.delete_cookie('astra_session', path='/')
    return {'ok': True}

@app.get('/me')
def me(user=Depends(current_user)):
    return public_user(user)

@app.put('/profile')
def profile(body: Profile, user=Depends(current_user), connection=Depends(db)):
    user.profile = body.model_dump()
    connection.add(user)
    connection.commit()
    add_record(connection, user.id, 'audit', {'action': 'Profile updated'})
    return public_user(user)

@app.get('/dashboard')
def dashboard(user=Depends(current_user), connection=Depends(db)):
    observations = [serialize(r) for r in records(connection, user.id, 'observation')]
    reports = [serialize(r) for r in records(connection, user.id, 'report')]
    return {'user': public_user(user), 'observations': observations, 'reports': reports, 'latest': observations[0] if observations else None,
        'alerts': [r for r in reports if r['assessment']['urgency'] in ('emergency','review') and not r.get('acknowledged')],
        'ai_configured': ai_configured(), 'voice_configured': bool(os.getenv('OPENAI_API_KEY'))}

@app.post('/observations')
def observation(body: Observation, user=Depends(current_user), connection=Depends(db)):
    values = body.model_dump()
    if not any(values[k] is not None for k in ['heart_rate','spo2','temperature','systolic','diastolic','sleep_hours']) and not body.notes.strip():
        raise HTTPException(422, 'Enter a measurement or a note')
    if (body.systolic is None) != (body.diastolic is None) or (body.systolic is not None and body.systolic <= body.diastolic):
        raise HTTPException(422, 'Enter both blood pressure values, with systolic above diastolic')
    return serialize(add_record(connection, user.id, 'observation', values))

@app.post('/assistant')
async def assistant(body: Message, user=Depends(current_user), connection=Depends(db)):
    if not user.profile.get('name'):
        raise HTTPException(409, 'Complete your health profile first')
    recent = [r.payload for r in records(connection, user.id, 'report', limit=3)]
    assessment = await assess(body, user.profile, recent)
    row = add_record(connection, user.id, 'report', {**body.model_dump(), 'assessment': assessment, 'acknowledged': False})
    return serialize(row)

@app.post('/reports/{report_id}/acknowledge')
def acknowledge(report_id: str, user=Depends(current_user), connection=Depends(db)):
    row = connection.get(Record, report_id)
    if not row or row.user_id != user.id or row.kind != 'report':
        raise HTTPException(404, 'Report not found')
    row.payload = {**row.payload, 'acknowledged': True}
    connection.commit()
    add_record(connection, user.id, 'audit', {'action': 'Report marked reviewed', 'report_id': row.id})
    return serialize(row)

@app.get('/protocols')
def protocols():
    return {'sources': list(SOURCES.values()), 'status': 'Public Earth-based information; not mission-approved protocols', 'version': 'prototype-1'}

@app.post('/transcribe')
async def transcribe(file: UploadFile = File(...), language: Language = Form('en'), user=Depends(current_user)):
    if not os.getenv('OPENAI_API_KEY'):
        raise HTTPException(503, 'Voice transcription is not configured. Use text input.')
    if not user.profile.get('ai_consent'):
        raise HTTPException(403, 'Enable AI provider consent in your profile before sending audio')
    if file.content_type not in ['audio/webm','audio/mp4','audio/mpeg','audio/wav','audio/ogg','video/webm']:
        raise HTTPException(415, 'Unsupported audio format')
    audio = await file.read(10*1024*1024+1)
    if not audio or len(audio) > 10*1024*1024:
        raise HTTPException(413, 'Audio must be between 1 byte and 10 MB')
    extension = {'audio/mp4':'m4a','audio/mpeg':'mp3','audio/wav':'wav','audio/ogg':'ogg'}.get(file.content_type,'webm')
    try:
        result = await AsyncOpenAI(timeout=30,max_retries=0).audio.transcriptions.create(model=os.getenv('TRANSCRIPTION_MODEL','gpt-transcribe'), file=('recording.'+extension,audio,file.content_type), language=language)
        return {'text': result.text, 'needs_confirmation': True}
    except Exception:
        raise HTTPException(503, 'Transcription is unavailable. Please type your report.')

@app.get('/export')
def export(user=Depends(current_user), connection=Depends(db)):
    return {'app': 'Astra', 'user': public_user(user), 'records': [serialize(r) for r in records(connection,user.id,limit=10000)], 'exported_at': datetime.now(timezone.utc).isoformat()}
