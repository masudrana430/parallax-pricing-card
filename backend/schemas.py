from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator

Language = Literal['en', 'bn', 'es', 'fr', 'hi', 'ru']

class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid')

class Credentials(StrictModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=10, max_length=128)

    @field_validator('email')
    @classmethod
    def check_email(cls, value):
        value = value.strip().lower()
        if '@' not in value or '.' not in value.split('@')[-1]:
            raise ValueError('Enter a valid email address')
        return value

class Profile(StrictModel):
    name: str = Field(min_length=1, max_length=80)
    age: int | None = Field(default=None, ge=18, le=100)
    mission: str = Field(default='', max_length=120)
    language: Language = 'en'
    conditions: str = Field(default='', max_length=2000)
    medications: str = Field(default='', max_length=2000)
    allergies: str = Field(default='', max_length=2000)
    history: str = Field(default='', max_length=4000)
    emergency_contact: str = Field(default='', max_length=200)
    equipment: str = Field(default='', max_length=1000)
    ai_consent: bool = False

class Observation(StrictModel):
    heart_rate: float | None = Field(default=None, ge=1, le=350, allow_inf_nan=False)
    spo2: float | None = Field(default=None, ge=0, le=100, allow_inf_nan=False)
    temperature: float | None = Field(default=None, ge=25, le=45, allow_inf_nan=False)
    systolic: float | None = Field(default=None, ge=30, le=300, allow_inf_nan=False)
    diastolic: float | None = Field(default=None, ge=10, le=200, allow_inf_nan=False)
    sleep_hours: float | None = Field(default=None, ge=0, le=24, allow_inf_nan=False)
    mood: Literal['good', 'neutral', 'low'] = 'neutral'
    notes: str = Field(default='', max_length=2000)

class Message(StrictModel):
    text: str = Field(min_length=1, max_length=4000)
    language: Language = 'en'
    body_system: Literal['general', 'heart', 'lungs', 'brain', 'muscle', 'digestive', 'vision', 'skin', 'mental'] = 'general'
    severity: int = Field(default=0, ge=0, le=10)
    duration: str = Field(default='', max_length=100)

    @field_validator('text')
    @classmethod
    def not_blank(cls, value):
        if not value.strip():
            raise ValueError('Describe your symptoms')
        return value.strip()

class ExtractedSymptom(BaseModel):
    code: Literal['chest', 'breathing', 'severe_breathing', 'dizziness', 'other']
    quote: str
    affirmed: bool
    current: bool
    subject: Literal['user', 'other', 'unclear']

class Extraction(BaseModel):
    symptoms: list[ExtractedSymptom]
    summary: str
    questions: list[str]
