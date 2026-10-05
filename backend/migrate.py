"""Versioned schema migration. Run once before starting the application."""
from sqlalchemy import Column, Float, Integer, JSON, MetaData, String, Table, select
from .main import engine

LATEST = 1

def upgrade(bind=engine):
    schema = MetaData()
    versions = Table('schema_version', schema, Column('version', Integer, primary_key=True))
    # Freeze revision 1 independently of the application's future models.
    Table('users', schema, Column('id', String, primary_key=True), Column('email', String, unique=True, nullable=False), Column('password_hash', String, nullable=False), Column('profile', JSON, nullable=False), Column('demo', Integer, default=0))
    Table('sessions', schema, Column('token_hash', String, primary_key=True), Column('user_id', String, nullable=False, index=True), Column('expires', Float, nullable=False))
    Table('records', schema, Column('id', String, primary_key=True), Column('user_id', String, nullable=False, index=True), Column('kind', String, nullable=False), Column('payload', JSON, nullable=False), Column('created_at', String, nullable=False))
    with bind.begin() as connection:
        versions.create(connection, checkfirst=True)
        current = connection.scalar(select(versions.c.version).order_by(versions.c.version.desc()).limit(1)) or 0
        if current > LATEST:
            raise RuntimeError('Database schema is newer than this application')
        if current < 1:
            schema.create_all(connection)
            connection.execute(versions.insert().values(version=1))
    return LATEST

if __name__ == '__main__':
    print(f'Astra schema revision {upgrade()} ready')
