# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.orm import sessionmaker, declarative_base
import time
import threading
import os

DATABASE_URL = "mysql+mysqlconnector://root:CBC.1234@localhost/almacen"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Objeto(Base):
    __tablename__ = "objetos"
    id = Column(String, primary_key=True, index=True)
    tipo = Column(String, nullable=False)
    prioridad = Column(String, nullable=False)
    proveedor = Column(String, nullable=False)
    observaciones = Column(String)
    largo = Column(Integer, nullable=False)
    ancho = Column(Integer, nullable=False)
    posicion_x = Column(Integer, nullable=False)
    posicion_y = Column(Integer, nullable=False)
    capa = Column(Integer, nullable=False, default=1)  # <--- Añade esto

class ObjetoSchema(BaseModel):
    id: str
    tipo: str
    prioridad: str
    proveedor: str
    observaciones: str
    largo: int
    ancho: int
    posicion_x: int
    posicion_y: int
    capa: int  # <--- Añade esto

    model_config = {"from_attributes": True}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db_stats = {
    "total_consultas": 0,
    "errores": 0,
    "tiempos": []
}

backend_logs = []

def registrar_consulta(tiempo, error=False):
    db_stats["total_consultas"] += 1
    db_stats["tiempos"].append(tiempo)
    if error:
        db_stats["errores"] += 1
    # Limita el tamaño del historial para no crecer sin límite
    if len(db_stats["tiempos"]) > 200:
        db_stats["tiempos"] = db_stats["tiempos"][-200:]

def tiempo_medio():
    if not db_stats["tiempos"]:
        return 0
    return sum(db_stats["tiempos"]) / len(db_stats["tiempos"])

@app.get("/db_stats")
def get_db_stats():
    return {
        "total_consultas": db_stats["total_consultas"],
        "errores": db_stats["errores"],
        "tiempo_medio_ms": round(tiempo_medio(), 2)
    }

def log_backend(msg):
    backend_logs.append(msg)
    if len(backend_logs) > 500:
        backend_logs.pop(0)

@app.get("/logs")
def get_logs():
    log_path = "backend.log"
    if not os.path.exists(log_path):
        return {"logs": ["No log file found."]}
    try:
        try:
            with open(log_path, encoding="utf-8") as f:
                lines = f.readlines()
        except UnicodeDecodeError:
            with open(log_path, encoding="latin-1") as f:
                lines = f.readlines()
        clean_lines = [line.strip().replace('\ufeff', '') for line in lines if line.strip()]
        return {"logs": clean_lines[-200:][::-1]}
    except Exception as e:
        return {"logs": [f"Error reading log: {e}"]}

@app.get("/objetos", response_model=list[ObjetoSchema])
def get_objetos():
    db = SessionLocal()
    start_time = time.monotonic()
    objetos = db.query(Objeto).all()
    end_time = time.monotonic()
    registrar_consulta(end_time - start_time)
    log_backend(f'GET /objetos')
    db.close()
    return objetos

@app.post("/objetos", response_model=ObjetoSchema)
def add_objeto(objeto: ObjetoSchema):
    db = SessionLocal()
    db_obj = Objeto(**objeto.dict())
    db.add(db_obj)
    try:
        db.commit()
    except Exception:
        db.rollback()
        db.close()
        raise HTTPException(status_code=400, detail="ID duplicado")
    db.refresh(db_obj)
    db.close()
    return db_obj

@app.put("/objetos/{objeto_id}")
def update_objeto(objeto_id: str, objeto: ObjetoSchema):
    print("Recibido para actualizar:", objeto.dict())
    db = SessionLocal()
    db_obj = db.query(Objeto).filter(Objeto.id == objeto_id).first()
    if not db_obj:
        db.close()
        raise HTTPException(status_code=404, detail="Objeto no encontrado")
    for key, value in objeto.dict().items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    db.close()
    log_backend(f'Recibido para actualizar: {objeto.dict()}')
    return db_obj

@app.delete("/objetos/{objeto_id}")
def delete_objeto(objeto_id: str):
    db = SessionLocal()
    db_obj = db.query(Objeto).filter(Objeto.id == objeto_id).first()
    if not db_obj:
        db.close()
        raise HTTPException(status_code=404, detail="Objeto no encontrado")
    db.delete(db_obj)
    db.commit()
    db.close()
    return {"ok": True}
