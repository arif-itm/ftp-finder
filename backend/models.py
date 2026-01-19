from pydantic import BaseModel
from typing import Optional

class SourceBase(BaseModel):
    label: str
    url: str

class SourceCreate(SourceBase):
    pass

class Source(SourceBase):
    id: int
    created_at: str

    class Config:
        from_attributes = True
