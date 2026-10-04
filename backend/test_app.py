import asyncio
import os
from types import SimpleNamespace
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from backend import main, agent
from backend.schemas import Message

main.engine = create_engine('sqlite://', connect_args={'check_same_thread':False}, poolclass=StaticPool)
main.DB.configure(bind=main.engine)

@pytest.fixture(autouse=True)
def clean_database(monkeypatch):
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)
    main.Base.metadata.drop_all(main.engine)
    main.Base.metadata.create_all(main.engine)
    main.limits.clear()
    yield

@pytest.fixture
def client():
    with TestClient(main.app) as c:
        yield c

def account(c, email='crew@example.com'):
    result=c.post('/auth/register',json={'email':email,'password':'a-strong-test-password'})
    assert result.status_code==200
    profile={'name':'Test Crew','age':30,'mission':'Simulation','allergies':'Penicillin'}
    assert c.put('/profile',json=profile).status_code==200
    return result.json()

def test_login_profile_persistence_logout(client):
    assert client.get('/dashboard').status_code==401
    account(client)
    assert 'HttpOnly' in client.cookies.get('astra_session','') or client.cookies.get('astra_session')
    assert client.get('/me').json()['profile']['allergies']=='Penicillin'
    assert client.post('/auth/logout').status_code==200
    assert client.get('/me').status_code==401
    assert client.post('/auth/login',json={'email':'crew@example.com','password':'wrong-password'}).status_code==401
    assert client.post('/auth/login',json={'email':'crew@example.com','password':'a-strong-test-password'}).status_code==200

def test_auth_validation_cookie_flags_duplicate(client):
    assert client.post('/auth/register',json={'email':'bad','password':'short'}).status_code==422
    result=client.post('/auth/register',json={'email':'crew@example.com','password':'a-strong-test-password'})
    assert 'HttpOnly' in result.headers['set-cookie']
    assert 'SameSite=lax' in result.headers['set-cookie']
    assert client.post('/auth/register',json={'email':'crew@example.com','password':'a-strong-test-password'}).status_code==409
    assert client.post('/assistant',json={'text':'dizzy'}).status_code==409

def test_user_isolation_and_report_ownership(client):
    account(client)
    report=client.post('/assistant',json={'text':'I feel dizzy','body_system':'brain'}).json()
    assert client.post('/observations',json={'heart_rate':72}).status_code==200
    with TestClient(main.app) as other:
        account(other,'other@example.com')
        assert other.get('/dashboard').json()['observations']==[]
        assert other.get('/dashboard').json()['reports']==[]
        assert other.post('/reports/'+report['id']+'/acknowledge').status_code==404
        assert other.get('/export').json()['user']['email']=='other@example.com'

def test_checkin_validation_and_export(client):
    account(client)
    for body in [{'spo2':101},{'heart_rate':-2},{'systolic':118},{'systolic':80,'diastolic':90},{}]:
        assert client.post('/observations',json=body).status_code==422
    assert client.post('/observations',json={'heart_rate':0}).status_code==422
    assert client.post('/observations',json={'heart_rate':72,'spo2':98,'temperature':36.7,'sleep_hours':7.2}).status_code==200
    assert client.get('/dashboard').json()['latest']['heart_rate']==72
    assert len([r for r in client.get('/export').json()['records'] if r['kind']=='observation'])==1

@pytest.mark.parametrize('text,language,urgency',[
    ('I have chest pain and feel dizzy','en','emergency'),
    ("No chest pain but I can't breathe",'en','emergency'),
    ('বুকে ব্যথা এবং শ্বাসকষ্ট হচ্ছে','bn','emergency'),
    ('No puedo respirar','es','emergency'),
    ('No chest pain. I feel dizzy.','en','review'),
    ('I do not have chest pain or dizziness','en','unknown'),
    ('বুকে ব্যথা নেই','bn','unknown'),
    ('My father has chest pain','en','unknown'),
    ('My sleep has changed','en','unknown'),
])
def test_guided_escalation(text,language,urgency):
    result=asyncio.run(agent.assess(Message(text=text,language=language),{},[]))
    assert result['urgency']==urgency
    assert result['mode']=='guided'
    assert 'diagnosis' in result['notice'] or language in ('bn','es')
    if urgency=='emergency':
        assert result['questions']==[]

def test_empty_reports_rejected_and_acknowledgement(client):
    account(client)
    assert client.post('/assistant',json={'text':'   '}).status_code==422
    row=client.post('/assistant',json={'text':'I feel dizzy'}).json()
    assert len(client.get('/dashboard').json()['alerts'])==1
    assert client.post('/reports/'+row['id']+'/acknowledge').json()['acknowledged'] is True
    assert client.get('/dashboard').json()['alerts']==[]

def test_provider_failure_preserves_guidance(monkeypatch):
    monkeypatch.setenv('OPENAI_API_KEY','test-only')
    class Failed:
        def __init__(self,**kwargs):self.responses=self
        async def parse(self,**kwargs):raise RuntimeError('provider unavailable')
    monkeypatch.setattr(agent,'AsyncOpenAI',Failed)
    result=asyncio.run(agent.assess(Message(text='I feel dizzy'),{'ai_consent':True},[]))
    assert result['mode']=='guided'
    assert result['provider_status']=='unavailable'
    assert result['urgency']=='review'

def test_ai_cannot_downgrade_urgent_rule(monkeypatch):
    monkeypatch.setenv('OPENAI_API_KEY','test-only')
    def forbidden(**kwargs):raise AssertionError('urgent guidance must not wait for AI')
    monkeypatch.setattr(agent,'AsyncOpenAI',forbidden)
    result=asyncio.run(agent.assess(Message(text="I can't breathe"),{'ai_consent':True},[]))
    assert result['urgency']=='emergency'

def test_ai_extraction_quotes_and_fixed_guidance(monkeypatch):
    monkeypatch.setenv('OPENAI_API_KEY','test-only')
    class Fake:
        def __init__(self,**kwargs):self.responses=self
        async def parse(self,**kwargs):
            assert kwargs['store'] is False
            return SimpleNamespace(output_parsed=SimpleNamespace(
                summary='Take made-up medicine',questions=['When did this start?'],
                symptoms=[SimpleNamespace(code='severe_breathing',quote='invented quote',affirmed=True,current=True,subject='user')]))
    monkeypatch.setattr(agent,'AsyncOpenAI',Fake)
    result=asyncio.run(agent.assess(Message(text='My sleep changed'),{'ai_consent':True},[]))
    assert result['mode']=='ai'
    assert result['urgency']=='unknown'
    assert 'made-up' not in result['summary']

def test_demo_data_isolated_and_labelled(client):
    result=client.post('/auth/demo')
    assert result.status_code==200 and result.json()['demo'] is True
    dashboard=client.get('/dashboard').json()
    assert len(dashboard['observations'])==7
    assert all('Synthetic' in r['notes'] for r in dashboard['observations'])

def test_voice_unconfigured_does_not_pretend_transcription(client):
    account(client)
    assert client.post('/transcribe',files={'file':('test.webm',b'dummy','audio/webm')}).status_code==503

def test_unconsented_data_not_sent_to_ai(monkeypatch):
    monkeypatch.setenv('OPENAI_API_KEY','test-only')
    def forbidden(**kwargs):raise AssertionError('data must not be sent without consent')
    monkeypatch.setattr(agent,'AsyncOpenAI',forbidden)
    result=asyncio.run(agent.assess(Message(text='I feel dizzy'),{'ai_consent':False},[]))
    assert result['mode']=='guided'
