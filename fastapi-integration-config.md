
# FastAPI Integration Configuration for ICCT RFID System

## Updated Database Structure
The Firebase Realtime Database now uses this structure with timestamped RFID scans:

```
icct-rfid-system/
├── ScannedIDs/
│   ├── 9B:54:8E:02/
│   │   ├── timestamp: 1671234567890
│   │   └── processed: false
│   ├── 32:65:C1:4C/
│   │   ├── timestamp: 1671234567800
│   │   └── processed: true
│   └── ...
├── students/
│   ├── TA202200470/
│   │   ├── name: "Juan Dela Cruz"
│   │   ├── rfid: "BD:31:1B:2A"
│   │   ├── email: "juan.delacruz@icct.edu.ph"
│   │   ├── course: "Computer Science"
│   │   ├── year: "3rd Year"
│   │   └── section: "A"
│   └── ...
├── schedules/
│   ├── TA202200470/
│   │   ├── monday: ["09:00-10:30", "13:00-14:30"]
│   │   ├── tuesday: ["08:00-09:30", "11:00-12:30"]
│   │   └── ...
│   └── ...
├── adminUsers/
├── attendanceRecords/
└── absenteeAlerts/
```

## FastAPI Endpoint Requirements

### 1. RFID Scan Endpoint
**POST** `/api/rfid/scan`

**Request Body:**
```json
{
  "rfid": "9B:54:8E:02",
  "timestamp": 1671234567890
}
```

**Response:**
```json
{
  "status": "success",
  "message": "RFID scanned successfully",
  "data": {
    "rfid": "9B:54:8E:02",
    "timestamp": 1671234567890,
    "registered": false,
    "student": null,
    "processed": false
  }
}
```

### 2. Updated Firebase Integration
```python
import firebase_admin
from firebase_admin import credentials, db
from datetime import datetime

# Initialize Firebase
cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://icct-rfid-system-default-rtdb.asia-southeast1.firebasedatabase.app/'
})

# Updated FastAPI endpoint
@app.post("/api/rfid/scan")
async def scan_rfid(rfid_data: RFIDScanRequest):
    # Add scanned RFID with timestamp and processed status
    scanned_ids_ref = db.reference('ScannedIDs')
    scanned_ids_ref.child(rfid_data.rfid).set({
        'timestamp': rfid_data.timestamp,
        'processed': False
    })
    
    # Check if RFID is registered
    students_ref = db.reference('students')
    students = students_ref.get()
    
    registered_student = None
    if students:
        for student_id, student_data in students.items():
            if student_data.get('rfid') == rfid_data.rfid:
                registered_student = {
                    'id': student_id,
                    'name': student_data.get('name'),
                    'course': student_data.get('course'),
                    'year': student_data.get('year'),
                    'section': student_data.get('section')
                }
                break
    
    return {
        "status": "success",
        "message": "RFID scanned successfully",
        "data": {
            "rfid": rfid_data.rfid,
            "timestamp": rfid_data.timestamp,
            "registered": registered_student is not None,
            "student": registered_student,
            "processed": False
        }
    }
```

### 3. Mark RFID as Processed Endpoint
**PATCH** `/api/rfid/{rfid}/process`

```python
@app.patch("/api/rfid/{rfid}/process")
async def mark_rfid_processed(rfid: str):
    scanned_ids_ref = db.reference(f'ScannedIDs/{rfid}')
    scanned_ids_ref.update({'processed': True})
    
    return {
        "status": "success",
        "message": f"RFID {rfid} marked as processed"
    }
```

### 4. Get Unprocessed RFIDs Endpoint
**GET** `/api/rfid/unprocessed`

```python
@app.get("/api/rfid/unprocessed")
async def get_unprocessed_rfids():
    scanned_ids_ref = db.reference('ScannedIDs')
    scanned_ids = scanned_ids_ref.get()
    
    unprocessed = []
    if scanned_ids:
        for rfid, data in scanned_ids.items():
            if not data.get('processed', True):
                unprocessed.append({
                    'rfid': rfid,
                    'timestamp': data.get('timestamp'),
                    'processed': data.get('processed', False)
                })
    
    # Sort by timestamp (earliest first)
    unprocessed.sort(key=lambda x: x['timestamp'])
    
    return {
        "status": "success",
        "data": unprocessed
    }
```

### 5. Add Student with Schedule Endpoint
**POST** `/api/students`

```python
@app.post("/api/students")
async def add_student(student_data: StudentCreateRequest):
    # Generate student ID
    year = datetime.now().year
    students_ref = db.reference('students')
    existing_students = students_ref.get() or {}
    
    # Generate new ID
    counter = 1
    while True:
        student_id = f"TA{year}{counter:05d}"
        if student_id not in existing_students:
            break
        counter += 1
    
    # Add student
    students_ref.child(student_id).set({
        'name': student_data.name,
        'rfid': student_data.rfid,
        'email': student_data.email,
        'course': student_data.course,
        'year': student_data.year,
        'section': student_data.section
    })
    
    # Add schedule if provided
    if student_data.schedule:
        schedules_ref = db.reference('schedules')
        schedules_ref.child(student_id).set(student_data.schedule)
    
    # Mark the RFID as processed
    scanned_ids_ref = db.reference('ScannedIDs')
    scanned_ids_ref.child(student_data.rfid).update({'processed': True})
    
    return {
        "status": "success",
        "message": "Student created successfully",
        "data": {
            "student_id": student_id,
            "student": student_data.dict()
        }
    }
```

# Data models for validation
```python
from pydantic import BaseModel, validator
from typing import Dict, List, Optional

class RFIDScanRequest(BaseModel):
    rfid: str
    timestamp: int
    
    @validator('rfid')
    def validate_rfid_format(cls, v):
        import re
        if not re.match(r'^[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}$', v):
            raise ValueError('RFID must be in format XX:XX:XX:XX (11 characters including colons)')
        return v.upper()

class StudentCreateRequest(BaseModel):
    name: str
    rfid: str
    email: str
    course: str
    year: str
    section: str
    schedule: Optional[Dict[str, List[str]]] = None
    
    @validator('rfid')
    def validate_rfid_format(cls, v):
        import re
        if not re.match(r'^[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}$', v):
            raise ValueError('RFID must be in format XX:XX:XX:XX (11 characters including colons)')
        return v.upper()
```

## Automatic Registration Flow
1. FastAPI receives RFID scan and adds to `ScannedIDs/{rfid}` with timestamp and processed=false
2. Frontend continuously monitors `ScannedIDs` every 1 second
3. Frontend processes unprocessed RFIDs by timestamp (earliest first)
4. If scanned RFID not found in students database:
   - Automatically triggers admin login dialog
   - After successful admin login, navigates to student management
   - Opens registration dialog with pre-filled RFID
   - After registration, opens schedule input dialog
5. After successful registration and schedule setup, marks RFID as processed
6. The scanned RFID is automatically filled in the registration form

## Security Considerations
1. Use Firebase service account authentication
2. Implement rate limiting on RFID scan endpoints
3. Validate RFID format (XX:XX:XX:XX with 11 characters) before database operations
4. Log all scan attempts for audit purposes
5. Automatically mark old unprocessed RFIDs as processed after 24 hours

## Testing
Use the RFIDSimulator component to test the automatic registration flow with test RFIDs like `9B:54:8E:02`.

## RFID Format
All RFIDs must follow the format: `XX:XX:XX:XX` (11 characters including colons)
Examples: `9B:54:8E:02`, `BD:31:1B:2A`, `A7:F2:C8:41`
